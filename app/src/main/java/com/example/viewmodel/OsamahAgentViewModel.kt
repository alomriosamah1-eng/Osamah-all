package com.example.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.agent.AgentCore
import com.example.data.local.AppDatabase
import com.example.data.local.entity.*
import com.example.data.repository.AgentRepository
import com.example.engine.VoiceHelper
import com.example.ui.components.BubbleState
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.File

data class AgentUiState(
    val currentTab: String = "home", // "home", "chat", "browser", "presentations", "files", "settings"
    val agentState: BubbleState = BubbleState.IDLE,
    val activeTaskStatus: String = "جاهز لتنفيذ المهام والأبحاث",
    val currentConversationId: String = "default_session",
    val isVoiceInputActive: Boolean = false,
    val browserUrl: String = "https://developer.android.com",
    val browserSearchQuery: String = "",
    val isReaderMode: Boolean = false,
    val userProfile: UserProfileEntity = UserProfileEntity(),
    val voiceSettings: VoiceSettingsEntity = VoiceSettingsEntity(),
    val quickSuggestions: List<String> = listOf(
        "ابحث عن أحدث الممارسات في Kotlin وأنشئ لي خطة دراسية",
        "أنشئ عرضًا تقديميًا من 10 شرائح عن الذكاء الاصطناعي",
        "لخص أهداف مشروعي البرمجي وأنشئ ملف PDF",
        "تحدث معي صوتياً بلهجة سورية"
    )
)

class OsamahAgentViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: AgentRepository
    private val agentCore: AgentCore
    private val voiceHelper: VoiceHelper

    private val _uiState = MutableStateFlow(AgentUiState())
    val uiState: StateFlow<AgentUiState> = _uiState.asStateFlow()

    val conversations: StateFlow<List<ConversationEntity>>
    val messages: StateFlow<List<MessageEntity>>
    val tasks: StateFlow<List<TaskEntity>>
    val presentations: StateFlow<List<PresentationEntity>>
    val memories: StateFlow<List<MemoryEntity>>
    val auditLogs: StateFlow<List<AuditLogEntity>>

    init {
        val database = AppDatabase.getDatabase(application)
        repository = AgentRepository(database.agentDao())
        agentCore = AgentCore(application)

        voiceHelper = VoiceHelper(application) { isSpeaking ->
            _uiState.update {
                it.copy(agentState = if (isSpeaking) BubbleState.SPEAKING else BubbleState.IDLE)
            }
        }

        conversations = repository.allConversations.stateIn(
            viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
        )

        messages = repository.getMessagesFlow("default_session").stateIn(
            viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
        )

        tasks = repository.allTasks.stateIn(
            viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
        )

        presentations = repository.allPresentations.stateIn(
            viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
        )

        memories = repository.allMemories.stateIn(
            viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
        )

        auditLogs = repository.auditLogs.stateIn(
            viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
        )

        loadInitialProfileAndSettings()
    }

    private fun loadInitialProfileAndSettings() {
        viewModelScope.launch {
            val profile = repository.getCurrentUserProfile()
            val voice = repository.getVoiceSettings()
            _uiState.update {
                it.copy(userProfile = profile, voiceSettings = voice)
            }

            // Create initial conversation if empty
            repository.createConversation("default_session", "جلسة وكيل أسامة الرئيسية")
            if (repository.getMessages("default_session").isEmpty()) {
                repository.addMessage(
                    conversationId = "default_session",
                    sender = "agent",
                    text = "مرحباً بك يا ${profile.name}! أنا وكيل أسامة — Osamah Agent، وكيلك الشخصي الذكي لتنفيذ المهام، الأبحاث، إعداد العروض التقديمية والتقارير. كيف أستطيع خدمتك اليوم؟"
                )
            }

            // Seed sample presentation if empty
            if (repository.allPresentations.first().isEmpty()) {
                seedInitialPresentation()
            }
        }
    }

    fun selectTab(tab: String) {
        _uiState.update { it.copy(currentTab = tab) }
    }

    fun sendUserMessage(text: String, speakResponse: Boolean = false) {
        if (text.isBlank()) return

        val conversationId = _uiState.value.currentConversationId
        viewModelScope.launch {
            // 1. Add User Message
            repository.addMessage(
                conversationId = conversationId,
                sender = "user",
                text = text
            )

            _uiState.update {
                it.copy(
                    agentState = BubbleState.THINKING,
                    activeTaskStatus = "جارٍ تحليل الطلب والتخطيط للمهمة..."
                )
            }

            val currentMemories = repository.getMemoriesList().map { "${it.key}: ${it.value}" }
            val currentProfile = _uiState.value.userProfile

            // 2. Execute via Agent Core
            val planResult = agentCore.executeTask(
                userInput = text,
                userProfile = currentProfile,
                memories = currentMemories,
                onProgressUpdate = { progress ->
                    _uiState.update { it.copy(activeTaskStatus = progress) }
                }
            )

            // 3. Save Task and steps
            val taskId = "task_${System.currentTimeMillis()}"
            val taskEntity = TaskEntity(
                id = taskId,
                title = text.take(40),
                goal = planResult.goal,
                status = "COMPLETED"
            )
            val taskSteps = planResult.steps.map {
                TaskStepEntity(
                    taskId = taskId,
                    stepNumber = it.stepIndex,
                    title = it.title,
                    description = it.detail,
                    toolRequired = it.toolName,
                    status = it.status,
                    output = it.detail
                )
            }
            repository.createTaskWithSteps(taskEntity, taskSteps)

            // 4. If presentation was generated, save into Room
            if (planResult.intent == "CREATE_PRESENTATION") {
                saveGeneratedPresentation(text, planResult.generatedArtifacts)
            }

            // 5. Add Agent Message
            val toolInfo = if (planResult.routedModelName != null) {
                "${planResult.primaryToolUsed ?: "محرك الوكيل"} [${planResult.routedModelName}]"
            } else {
                planResult.primaryToolUsed
            }
            repository.addMessage(
                conversationId = conversationId,
                sender = "agent",
                text = planResult.finalResponse,
                toolName = toolInfo,
                toolResult = planResult.tokenSavingsInfo ?: planResult.generatedArtifacts.joinToString("\n")
            )

            // 6. Log Audit
            repository.logAction(
                actionName = planResult.primaryToolUsed ?: "AI_RESPONSE",
                scope = "AGENT_CORE",
                details = "Executed goal: ${text.take(50)}"
            )

            _uiState.update {
                it.copy(
                    agentState = BubbleState.IDLE,
                    activeTaskStatus = "تم إنجاز المهمة بنجاح ✓"
                )
            }

            // 7. Voice output if requested
            if (speakResponse) {
                val voice = _uiState.value.voiceSettings
                voiceHelper.speak(
                    text = planResult.finalResponse,
                    isFemale = voice.voiceGender == "female",
                    speed = voice.speechRate,
                    pitch = voice.pitch
                )
            }
        }
    }

    fun startVoiceListening() {
        _uiState.update {
            it.copy(agentState = BubbleState.LISTENING, isVoiceInputActive = true)
        }
        voiceHelper.startListening(
            onResult = { spokenText ->
                _uiState.update { it.copy(isVoiceInputActive = false) }
                sendUserMessage(spokenText, speakResponse = true)
            },
            onError = { errorMsg ->
                _uiState.update {
                    it.copy(
                        agentState = BubbleState.ERROR,
                        isVoiceInputActive = false,
                        activeTaskStatus = errorMsg
                    )
                }
            }
        )
    }

    fun stopVoiceListening() {
        voiceHelper.stopListening()
        _uiState.update {
            it.copy(agentState = BubbleState.IDLE, isVoiceInputActive = false)
        }
    }

    fun interruptSpeech() {
        voiceHelper.stopSpeaking()
        _uiState.update { it.copy(agentState = BubbleState.IDLE) }
    }

    fun updateVoiceBubble(bubbleId: Int) {
        val updated = _uiState.value.voiceSettings.copy(selectedBubbleId = bubbleId)
        _uiState.update { it.copy(voiceSettings = updated) }
        viewModelScope.launch { repository.saveVoiceSettings(updated) }
    }

    fun updateVoiceGender(gender: String) {
        val updated = _uiState.value.voiceSettings.copy(voiceGender = gender)
        _uiState.update { it.copy(voiceSettings = updated) }
        viewModelScope.launch { repository.saveVoiceSettings(updated) }
    }

    fun updateVoiceAccent(accent: String) {
        val updated = _uiState.value.voiceSettings.copy(accent = accent)
        _uiState.update { it.copy(voiceSettings = updated) }
        viewModelScope.launch { repository.saveVoiceSettings(updated) }
    }

    fun updateVoiceSliders(speed: Float, pitch: Float, volume: Float) {
        val updated = _uiState.value.voiceSettings.copy(
            speechRate = speed,
            pitch = pitch,
            volume = volume
        )
        _uiState.update { it.copy(voiceSettings = updated) }
        viewModelScope.launch { repository.saveVoiceSettings(updated) }
    }

    fun updateUserProfile(profile: UserProfileEntity) {
        _uiState.update { it.copy(userProfile = profile) }
        viewModelScope.launch {
            repository.saveUserProfile(profile)
            repository.logAction("UPDATE_PROFILE", "USER_PROFILE", "Updated profile for ${profile.name}")
        }
    }

    fun addMemory(key: String, value: String) {
        viewModelScope.launch {
            repository.addMemory("custom", key, value)
            repository.logAction("ADD_MEMORY", "SELECTIVE_MEMORY", "Stored memory: $key")
        }
    }

    fun deleteMemory(id: Long) {
        viewModelScope.launch {
            repository.deleteMemory(id)
            repository.logAction("DELETE_MEMORY", "SELECTIVE_MEMORY", "Deleted memory item #$id")
        }
    }

    fun clearAllMemories() {
        viewModelScope.launch {
            repository.clearMemories()
            repository.logAction("CLEAR_ALL_MEMORIES", "SELECTIVE_MEMORY", "Cleared all user selective memories")
        }
    }

    fun setBrowserUrl(url: String) {
        _uiState.update { it.copy(browserUrl = url) }
    }

    fun toggleReaderMode() {
        _uiState.update { it.copy(isReaderMode = !it.isReaderMode) }
    }

    fun createPresentation(topic: String, count: Int) {
        sendUserMessage("أنشئ عرضًا تقديميًا من $count شرائح عن: $topic")
    }

    private suspend fun saveGeneratedPresentation(topic: String, artifactTitles: List<String>) {
        val presId = "pres_${System.currentTimeMillis()}"
        val presentation = PresentationEntity(
            id = presId,
            title = topic.take(35),
            topic = topic,
            slidesCount = artifactTitles.size.coerceAtLeast(4)
        )
        val slides = artifactTitles.mapIndexed { index, title ->
            SlideEntity(
                presentationId = presId,
                slideNumber = index + 1,
                title = title,
                content = "المحتوى التفصيلي للشريحة $index لموضوع: $topic",
                bulletPointsJson = "الركيزة الأساسية الأولى,مؤشر الأداء والإنتاجية,خطة التحقق والتسليم",
                iconName = "auto_awesome"
            )
        }
        repository.savePresentationWithSlides(presentation, slides)
    }

    private suspend fun seedInitialPresentation() {
        val presId = "pres_welcome"
        val presentation = PresentationEntity(
            id = presId,
            title = "وكيل أسامة — العرض المعماري والقدرات الذكية",
            topic = "مقدمة شاملة عن وكيل أسامة",
            slidesCount = 5
        )
        val slides = listOf(
            SlideEntity(
                presentationId = presId,
                slideNumber = 1,
                title = "وكيل أسامة — Osamah Agent",
                content = "الوكيل الذكي العملي المتكامل للمهندس أسامة العُمري",
                bulletPointsJson = "تنفيذ المهام المعقدة,توليد التقارير والعروض,تفاعل صوتي بـ 19 كرة"
            ),
            SlideEntity(
                presentationId = presId,
                slideNumber = 2,
                title = "محرك التخطيط والتنفيذ (Agent Core)",
                content = "فهم النية وتحديد الأدوات المؤتمتة ومتابعة الخطوات",
                bulletPointsJson = "Search Tool,PDF Tool,Presentation Studio,Browser Automation"
            ),
            SlideEntity(
                presentationId = presId,
                slideNumber = 3,
                title = "الذاكرة الانتقائية والخصوصية",
                content = "حفظ ما يسمح به المستخدم فقط مع إمكانية المحو الكامل",
                bulletPointsJson = "Privacy-by-Design,تشفير البيانات,سجل تدقيق كامل"
            ),
            SlideEntity(
                presentationId = presId,
                slideNumber = 4,
                title = "المتصفح والبحث المعمق",
                content = "استخلاص المقالات والمصادر بدون إعلانات وتلخيص الأدلة",
                bulletPointsJson = "Multi-Query Search,Reader Mode,Deduplication"
            ),
            SlideEntity(
                presentationId = presId,
                slideNumber = 5,
                title = "الخلاصة والبدء السريع",
                content = "ابدأ بكتابة أو نطق مهمتك وسيقوم الوكيل بتنفيذها فوراً",
                bulletPointsJson = "أداء خفيف جداً,حجم APK أقل من 25MB,تجربة مستخدم راقية"
            )
        )
        repository.savePresentationWithSlides(presentation, slides)
    }

    override fun onCleared() {
        super.onCleared()
        voiceHelper.release()
    }
}
