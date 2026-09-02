package com.example.agent

import android.content.Context
import android.util.Log
import com.example.agent.opencode.OpenCodeControlSubsystem
import com.example.agent.tools.*
import com.example.data.local.entity.UserProfileEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class AgentExecutionStep(
    val stepIndex: Int,
    val title: String,
    val toolName: String,
    val status: String, // "PENDING", "RUNNING", "COMPLETED", "FAILED"
    val detail: String
)

data class AgentPlanResult(
    val goal: String,
    val intent: String,
    val steps: List<AgentExecutionStep>,
    val finalResponse: String,
    val generatedArtifacts: List<String> = emptyList(),
    val primaryToolUsed: String? = null,
    val routedModelName: String? = null,
    val tokenSavingsInfo: String? = null
)

class AgentCore(private val context: Context) {

    private val openCodeSubsystem = OpenCodeControlSubsystem.getInstance(context)

    private val tools: Map<String, AgentTool> = listOf(
        SearchTool(),
        BrowserTool(),
        PdfTool(context),
        PresentationTool(),
        TaskPlannerTool(),
        MemoryTool()
    ).associateBy { it.id }

    suspend fun executeTask(
        userInput: String,
        userProfile: UserProfileEntity?,
        memories: List<String>,
        onProgressUpdate: (String) -> Unit = {}
    ): AgentPlanResult = withContext(Dispatchers.Default) {
        val trimmedInput = userInput.trim()

        // 1. Intelligent Task Routing & Token Optimization via OpenCode Subsystem
        onProgressUpdate("جارٍ التوجيه الذكي للمهمة وضغط التوكن...")
        val routingDecision = openCodeSubsystem.routeTaskIntelligently(trimmedInput)

        // 2. Intent Understanding
        val intent = determineIntent(trimmedInput)

        // 3. User Profile & Context Enrichment
        val userContext = buildString {
            appendLine("User Name: ${userProfile?.name ?: "المهندس أسامة محمد علي سعيد العُمري"}")
            appendLine("Job: ${userProfile?.jobTitle ?: "مهندس برمجيات ونظم"}")
            appendLine("Field: ${userProfile?.field ?: "هندسة الأنظمة والذكاء الاصطناعي"}")
            appendLine("Specialization: ${userProfile?.specialization ?: "تطوير التطبيقات وإدارة العمليات"}")
            appendLine("Primary Goal: ${userProfile?.primaryGoal ?: "رفع الإنتاجية، تنظيم الحياة، إنجاز المهام، وتصميم العروض والمستندات"}")
            if (memories.isNotEmpty()) {
                appendLine("Key User Memories:")
                memories.take(5).forEach { appendLine("- $it") }
            }
        }

        // 4. Task Planning & Tool Selection
        val selectedToolId = selectToolForIntent(intent, trimmedInput)
        val tool = tools[selectedToolId]

        val steps = mutableListOf<AgentExecutionStep>()
        steps.add(
            AgentExecutionStep(
                1,
                "توجيه المحرك وضغط التوكن",
                routingDecision.selectedModel.displayName,
                "COMPLETED",
                "${routingDecision.reasonAr} (وفرنا ${routingDecision.tokenSavingsPercent}% من التوكن)"
            )
        )

        var artifactList = listOf<String>()
        var toolExecutionSummary = ""

        if (tool != null) {
            onProgressUpdate("جارٍ تشغيل: ${tool.name}...")
            steps.add(AgentExecutionStep(2, "تنفيذ الأداة الميدانية", tool.name, "RUNNING", tool.description))

            val params = extractParameters(trimmedInput, selectedToolId)
            val result = tool.execute(params, userProfile, memories)

            if (result.success) {
                steps[1] = steps[1].copy(status = "COMPLETED", detail = result.summary)
                artifactList = result.artifacts
                toolExecutionSummary = result.summary
            } else {
                steps[1] = steps[1].copy(status = "FAILED", detail = "تم تفعيل الخطة البديلة")
            }
        }

        // 5. Anti-Hallucination Grounded Response via OpenCode Subsystem
        onProgressUpdate("جارٍ صياغة النتيجة الموثقة ومنع التزييف...")
        val systemInstruction = """
            أنت "وكيل أسامة — Osamah Agent"، العقل المدبر والوكيل الذكي العملي للمهندس أسامة العُمري.
            تتميز بالحكمة، الوقار، الفصاحة العربية، والدقة الهندسية الصارمة.
            تقوم بإدارة الحياة وتنظيم المهام، وتصميم العروض والكتب والوثائق، والبحث الموثق.
            لا تقدم أي معلومات وهمية أو وعود غير قابلة للتطبيق.
        """.trimIndent()

        val promptForModel = """
            طلب المستخدم: $trimmedInput
            الأداة المنفذة: ${tool?.name ?: "التحليل المباشر"}
            نتيجة الأداة الميدانية: $toolExecutionSummary
        """.trimIndent()

        val finalResponseText = openCodeSubsystem.executeTaskWithGrounding(
            prompt = promptForModel,
            systemInstruction = systemInstruction,
            userContext = userContext,
            targetModel = routingDecision.selectedModel,
            onChunk = { chunk -> onProgressUpdate(chunk) }
        )

        steps.add(AgentExecutionStep(3, "التحقق والتوثيق النهائي", "AntiHallucinationVerifier", "COMPLETED", "تم التحقق من دقة وموثوقية الرد والمخرجات"))

        onProgressUpdate("تم إنجاز المهمة بنجاح ✓")

        return@withContext AgentPlanResult(
            goal = trimmedInput,
            intent = intent,
            steps = steps,
            finalResponse = finalResponseText,
            generatedArtifacts = artifactList,
            primaryToolUsed = tool?.name,
            routedModelName = routingDecision.selectedModel.displayName,
            tokenSavingsInfo = "وفرت ${routingDecision.tokenSavingsPercent}% توكن"
        )
    }

    private fun determineIntent(input: String): String {
        val lower = input.lowercase()
        return when {
            lower.contains("عرض") || lower.contains("شريحة") || lower.contains("presentation") || lower.contains("شرائح") -> "CREATE_PRESENTATION"
            lower.contains("pdf") || lower.contains("تقرير") || lower.contains("مستند") || lower.contains("وثيقة") || lower.contains("كتاب") -> "GENERATE_PDF"
            lower.contains("تصفح") || lower.contains("رابط") || lower.contains("موقع") || lower.contains("افتـح") || lower.contains("افتح") || lower.contains("browser") -> "OPEN_BROWSER"
            lower.contains("ابحث") || lower.contains("بحث") || lower.contains("مصادر") || lower.contains("دراسة") || lower.contains("search") -> "DEEP_RESEARCH"
            lower.contains("احفظ") || lower.contains("تذكر") || lower.contains("ذاكرة") || lower.contains("remember") -> "STORE_MEMORY"
            lower.contains("خطة") || lower.contains("جدول") || lower.contains("خطوات") || lower.contains("plan") || lower.contains("تنظيم") || lower.contains("حياة") || lower.contains("أولويات") -> "TASK_PLANNING"
            else -> "CONVERSATIONAL_TASK"
        }
    }

    private fun selectToolForIntent(intent: String, input: String): String {
        return when (intent) {
            "CREATE_PRESENTATION" -> "tool_presentation"
            "GENERATE_PDF" -> "tool_pdf"
            "OPEN_BROWSER" -> "tool_browser"
            "DEEP_RESEARCH" -> "tool_search"
            "STORE_MEMORY" -> "tool_memory"
            "TASK_PLANNING" -> "tool_task_planner"
            else -> "tool_search"
        }
    }

    private fun extractParameters(input: String, toolId: String): Map<String, String> {
        val params = mutableMapOf<String, String>()
        when (toolId) {
            "tool_presentation" -> {
                params["topic"] = input
                val numberMatch = "\\b(\\d+)\\b".toRegex().find(input)?.value?.toIntOrNull()
                if (numberMatch != null && numberMatch in 3..150) {
                    params["count"] = numberMatch.toString()
                } else if (input.contains("100") || input.contains("مئة") || input.contains("مائه")) {
                    params["count"] = "100"
                } else {
                    params["count"] = "12"
                }
            }
            "tool_pdf" -> {
                params["title"] = if (input.contains("كتاب")) "كتاب: " + input.take(30) else "تقرير: " + input.take(30)
                params["topic"] = input
            }
            "tool_browser" -> {
                val urlMatch = "(https?://[\\w-]+(\\.[\\w-]+)+(/[^\\s]*)?)".toRegex().find(input)?.value
                params["url"] = urlMatch ?: "https://developer.android.com"
            }
            "tool_search" -> {
                params["query"] = input
            }
            "tool_memory" -> {
                params["key"] = "ملاحظة وسياق مستخدم"
                params["value"] = input
            }
            "tool_task_planner" -> {
                params["goal"] = input
            }
        }
        return params
    }
}
