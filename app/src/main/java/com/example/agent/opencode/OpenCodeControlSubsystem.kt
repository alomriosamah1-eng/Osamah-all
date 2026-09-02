package com.example.agent.opencode

import android.content.Context
import com.example.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okio.BufferedSource
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/** Metadata and runtime identity taken from the OpenCode/Models.dev provider model contract. */
data class ProviderModel(
    val providerId: String,
    val modelId: String,
    val displayName: String,
    val contextWindow: Long,
    val inputModalities: Set<String> = setOf("text"),
    val outputModalities: Set<String> = setOf("text"),
    val vision: Boolean = false,
    val reasoning: Boolean = false,
    val toolCalling: Boolean = true,
    val streaming: Boolean = true,
    val structuredOutput: Boolean = false
)

data class ProviderDefinition(
    val id: String,
    val displayName: String,
    val endpoint: String,
    val protocol: Protocol,
    val credentialBuildConfig: String,
    val models: List<ProviderModel>
)

enum class Protocol { GEMINI_GENERATIVE_LANGUAGE, OPENAI_CHAT_COMPLETIONS }

/** Registry is explicit and auditable; credentials are never stored in this registry. */
object ProviderRegistry {
    val providers: List<ProviderDefinition> = listOf(
        ProviderDefinition(
            id = "google",
            displayName = "Google",
            endpoint = "https://generativelanguage.googleapis.com/v1beta",
            protocol = Protocol.GEMINI_GENERATIVE_LANGUAGE,
            credentialBuildConfig = "GEMINI_API_KEY",
            models = listOf(
                ProviderModel("google", "gemini-2.5-flash", "Gemini 2.5 Flash", 1_048_576, vision = true, reasoning = true, structuredOutput = true)
            )
        ),
        ProviderDefinition(
            id = "openai",
            displayName = "OpenAI",
            endpoint = "https://api.openai.com/v1",
            protocol = Protocol.OPENAI_CHAT_COMPLETIONS,
            credentialBuildConfig = "OPENAI_API_KEY",
            models = listOf(
                ProviderModel("openai", "gpt-4o", "GPT-4o", 128_000, vision = true, reasoning = false, structuredOutput = true)
            )
        ),
        ProviderDefinition(
            id = "deepseek",
            displayName = "DeepSeek",
            endpoint = "https://api.deepseek.com/v1",
            protocol = Protocol.OPENAI_CHAT_COMPLETIONS,
            credentialBuildConfig = "DEEPSEEK_API_KEY",
            models = listOf(
                ProviderModel("deepseek", "deepseek-chat", "DeepSeek Chat", 128_000, reasoning = false)
            )
        )
    )

    fun model(providerId: String, modelId: String): ProviderModel = providers
        .firstOrNull { it.id == providerId }?.models?.firstOrNull { it.modelId == modelId }
        ?: throw ProviderException.InvalidModel(providerId, modelId)
}

/** Kept as a compatibility facade for the current Settings screen. */
enum class OpenCodeModel(val providerModel: ProviderModel, val contextWindow: String, val costEfficiency: String, val specialtyAr: String) {
    GEMINI_2_5_FLASH(ProviderRegistry.model("google", "gemini-2.5-flash"), "1M Tokens", "عالية", "الاستجابة الفورية والتحليل متعدد الوسائط"),
    GPT_4O(ProviderRegistry.model("openai", "gpt-4o"), "128K Tokens", "قياسية", "حل المشكلات والمنطق متعدد الوسائط"),
    DEEPSEEK_CHAT(ProviderRegistry.model("deepseek", "deepseek-chat"), "128K Tokens", "اقتصادية", "البرمجة والمنطق");

    val modelId: String get() = providerModel.modelId
    val displayName: String get() = providerModel.displayName
    val provider: String get() = providerModel.providerId
}

enum class RoutingStrategy(val displayNameAr: String, val descriptionAr: String) {
    INTELLIGENT_AUTO("التوجيه الذكي التلقائي (موصى به)", "اختيار النموذج المتاح الأنسب للمهمة"),
    MAX_PERFORMANCE("أقصى أداء واستدلال", "استخدام النموذج النشط عالي القدرة"),
    TOKEN_SAVER("التوفير الذكي للتوكن", "استخدام النموذج السريع وتقليل السياق")
}

data class OpenCodeEngineConfig(
    val activeModel: OpenCodeModel = OpenCodeModel.GEMINI_2_5_FLASH,
    val routingStrategy: RoutingStrategy = RoutingStrategy.INTELLIGENT_AUTO,
    val tokenCompressionEnabled: Boolean = true,
    val antiHallucinationEnabled: Boolean = true,
    val totalTokensSavedEstimate: Long = 0,
    val totalTasksRouted: Int = 0
)

data class OpenCodeTaskRoutingDecision(
    val selectedModel: OpenCodeModel,
    val reasonAr: String,
    val compressedTokensCount: Int,
    val originalTokensEstimate: Int,
    val tokenSavingsPercent: Int
)

data class ToolDefinition(val name: String, val description: String, val parameters: JSONObject)
data class ToolCallRequest(val id: String, val name: String, val arguments: String)

sealed class ProviderException(message: String, cause: Throwable? = null) : IOException(message, cause) {
    class MissingCredential(val provider: String) : ProviderException("Missing runtime credential for provider: $provider")
    class InvalidModel(val provider: String, val model: String) : ProviderException("Invalid model $provider/$model")
    class Http(val status: Int, body: String) : ProviderException("Provider HTTP $status: ${body.take(500)}")
    class Protocol(message: String) : ProviderException(message)
}

class OpenCodeControlSubsystem private constructor(private val context: Context) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    var config: OpenCodeEngineConfig = OpenCodeEngineConfig(); private set
    fun updateModel(model: OpenCodeModel) { config = config.copy(activeModel = model) }
    fun updateRoutingStrategy(strategy: RoutingStrategy) { config = config.copy(routingStrategy = strategy) }
    fun toggleTokenCompression(enabled: Boolean) { config = config.copy(tokenCompressionEnabled = enabled) }
    fun toggleAntiHallucination(enabled: Boolean) { config = config.copy(antiHallucinationEnabled = enabled) }

    fun routeTaskIntelligently(userInput: String): OpenCodeTaskRoutingDecision {
        val original = (userInput.length / 3).coerceAtLeast(1)
        val compressed = if (config.tokenCompressionEnabled) (original * .75).toInt() else original
        val selected = when {
            config.routingStrategy == RoutingStrategy.TOKEN_SAVER -> OpenCodeModel.GEMINI_2_5_FLASH
            config.routingStrategy == RoutingStrategy.MAX_PERFORMANCE -> config.activeModel
            userInput.length < 80 -> OpenCodeModel.GEMINI_2_5_FLASH
            else -> config.activeModel
        }
        val savings = if (original == 0) 0 else ((original - compressed) * 100 / original)
        config = config.copy(totalTokensSavedEstimate = config.totalTokensSavedEstimate + original - compressed, totalTasksRouted = config.totalTasksRouted + 1)
        return OpenCodeTaskRoutingDecision(selected, "اختيار نموذج مسجل في ProviderRegistry وقابل للتشغيل فعليًا", compressed, original, savings)
    }

    suspend fun executeTaskWithGrounding(
        prompt: String,
        systemInstruction: String,
        userContext: String,
        targetModel: OpenCodeModel,
        tools: List<ToolDefinition> = emptyList(),
        onChunk: (String) -> Unit = {},
        onToolCall: (ToolCallRequest) -> Unit = {}
    ): String = withContext(Dispatchers.IO) {
        val candidates = if (config.routingStrategy == RoutingStrategy.INTELLIGENT_AUTO) {
            listOf(targetModel) + OpenCodeModel.values().filter { it != targetModel }
        } else {
            listOf(targetModel)
        }
        val system = if (config.antiHallucinationEnabled) "$systemInstruction\n\nلا تختلق معلومات، واذكر حدود المعرفة بوضوح." else systemInstruction
        val messages = listOf(
            JSONObject().put("role", "system").put("content", "$system\n[USER_CONTEXT]\n$userContext"),
            JSONObject().put("role", "user").put("content", prompt)
        )
        var lastError: ProviderException? = null
        for (candidate in candidates) {
            val provider = ProviderRegistry.providers.first { it.id == candidate.providerModel.providerId }
            val key = credential(provider.credentialBuildConfig)
            if (key == null) {
                lastError = ProviderException.MissingCredential(provider.id)
                continue
            }
            try {
                return@withContext when (provider.protocol) {
                    Protocol.GEMINI_GENERATIVE_LANGUAGE -> streamGemini(provider, candidate.providerModel, key, system, prompt, tools, onChunk, onToolCall)
                    Protocol.OPENAI_CHAT_COMPLETIONS -> streamOpenAi(provider, candidate.providerModel, key, messages, tools, onChunk, onToolCall)
                }
            } catch (error: ProviderException) {
                lastError = error
                if (config.routingStrategy != RoutingStrategy.INTELLIGENT_AUTO) throw error
            }
        }
        throw lastError ?: ProviderException.Protocol("No configured provider is available")
    }

    private fun credential(name: String): String? = try {
        val value = when (name) {
            "GEMINI_API_KEY" -> BuildConfig.GEMINI_API_KEY
            "OPENAI_API_KEY" -> BuildConfig.OPENAI_API_KEY
            "DEEPSEEK_API_KEY" -> BuildConfig.DEEPSEEK_API_KEY
            else -> ""
        }
        value.takeIf { it.isNotBlank() && !it.startsWith("MY_") }
    } catch (_: Throwable) { null }

    private fun streamGemini(provider: ProviderDefinition, model: ProviderModel, key: String, system: String, prompt: String, tools: List<ToolDefinition>, onChunk: (String) -> Unit, onToolCall: (ToolCallRequest) -> Unit): String {
        val root = JSONObject().put("systemInstruction", JSONObject().put("parts", JSONArray().put(JSONObject().put("text", system))))
            .put("contents", JSONArray().put(JSONObject().put("role", "user").put("parts", JSONArray().put(JSONObject().put("text", prompt)))))
            .put("generationConfig", JSONObject().put("temperature", .4).put("topP", .85))
        if (tools.isNotEmpty()) root.put("tools", JSONArray().put(JSONObject().put("functionDeclarations", JSONArray(tools.map { JSONObject().put("name", it.name).put("description", it.description).put("parameters", it.parameters) }))))
        val request = Request.Builder().url("${provider.endpoint}/models/${model.modelId}:streamGenerateContent?alt=sse&key=$key")
            .post(root.toString().toRequestBody("application/json; charset=utf-8".toMediaType())).build()
        return executeStream(request) { json ->
            val candidates = json.optJSONArray("candidates") ?: return@executeStream ""
            val parts = candidates.optJSONObject(0)?.optJSONObject("content")?.optJSONArray("parts") ?: return@executeStream ""
            val out = StringBuilder()
            for (i in 0 until parts.length()) {
                val part = parts.optJSONObject(i) ?: continue
                part.optString("text").takeIf { it.isNotEmpty() }?.let { out.append(it); onChunk(it) }
                part.optJSONObject("functionCall")?.let { call -> onToolCall(ToolCallRequest("gemini-${System.nanoTime()}", call.optString("name"), call.optJSONObject("args")?.toString() ?: "{}")) }
            }
            out.toString()
        }
    }

    private fun streamOpenAi(provider: ProviderDefinition, model: ProviderModel, key: String, messages: List<JSONObject>, tools: List<ToolDefinition>, onChunk: (String) -> Unit, onToolCall: (ToolCallRequest) -> Unit): String {
        val root = JSONObject().put("model", model.modelId).put("messages", JSONArray(messages)).put("stream", true).put("temperature", .4)
        if (tools.isNotEmpty()) root.put("tools", JSONArray(tools.map { JSONObject().put("type", "function").put("function", JSONObject().put("name", it.name).put("description", it.description).put("parameters", it.parameters)) }))
        val request = Request.Builder().url("${provider.endpoint}/chat/completions").addHeader("Authorization", "Bearer $key").post(root.toString().toRequestBody("application/json; charset=utf-8".toMediaType())).build()
        return executeStream(request) { json ->
            val delta = json.optJSONArray("choices")?.optJSONObject(0)?.optJSONObject("delta") ?: return@executeStream ""
            val text = delta.optString("content")
            if (text.isNotEmpty()) onChunk(text)
            delta.optJSONArray("tool_calls")?.optJSONObject(0)?.let { call ->
                val fn = call.optJSONObject("function") ?: return@let
                onToolCall(ToolCallRequest(call.optString("id"), fn.optString("name"), fn.optString("arguments")))
            }
            text
        }
    }

    private fun executeStream(request: Request, parse: (JSONObject) -> String): String {
        var lastError: ProviderException? = null
        repeat(3) { attempt ->
            try {
                client.newCall(request).execute().use { response ->
                    val source = response.body?.source() ?: throw ProviderException.Protocol("Provider returned an empty body")
                    if (!response.isSuccessful) {
                        val body = source.readUtf8()
                        val transient = response.code == 408 || response.code == 429 || response.code in 500..599
                        val error = ProviderException.Http(response.code, body)
                        if (!transient || attempt == 2) throw error
                        lastError = error
                        Thread.sleep((250L shl attempt).coerceAtMost(2_000L))
                        return@use
                    }
                    val result = StringBuilder()
                    while (!source.exhausted()) {
                        val line = source.readUtf8Line() ?: break
                        if (!line.startsWith("data:")) continue
                        val data = line.removePrefix("data:").trim()
                        if (data == "[DONE]") break
                        if (data.isNotEmpty()) runCatching { result.append(parse(JSONObject(data))) }
                            .getOrElse { throw ProviderException.Protocol("Malformed provider SSE event") }
                    }
                    return result.toString()
                }
            } catch (e: ProviderException) {
                throw e
            } catch (e: IOException) {
                if (attempt == 2) throw ProviderException.Protocol("Provider network failure: ${e.message}")
                lastError = ProviderException.Protocol("Provider network failure: ${e.message}")
                Thread.sleep((250L shl attempt).coerceAtMost(2_000L))
            }
        }
        throw lastError ?: ProviderException.Protocol("Provider request failed")
    }

    companion object {
        @Volatile private var INSTANCE: OpenCodeControlSubsystem? = null
        fun getInstance(context: Context): OpenCodeControlSubsystem = INSTANCE ?: synchronized(this) { INSTANCE ?: OpenCodeControlSubsystem(context.applicationContext).also { INSTANCE = it } }
    }
}
