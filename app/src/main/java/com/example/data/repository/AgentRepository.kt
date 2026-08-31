package com.example.data.repository

import com.example.data.local.dao.AgentDao
import com.example.data.local.entity.*
import kotlinx.coroutines.flow.Flow

class AgentRepository(private val agentDao: AgentDao) {

    // User Profile
    val userProfile: Flow<UserProfileEntity?> = agentDao.getUserProfileFlow()

    suspend fun getCurrentUserProfile(): UserProfileEntity {
        val existing = agentDao.getUserProfile()
        if (existing != null) return existing
        val defaultProfile = UserProfileEntity()
        agentDao.insertOrUpdateUserProfile(defaultProfile)
        return defaultProfile
    }

    suspend fun saveUserProfile(profile: UserProfileEntity) {
        agentDao.insertOrUpdateUserProfile(profile)
    }

    // Memories
    val allMemories: Flow<List<MemoryEntity>> = agentDao.getAllMemoriesFlow()

    suspend fun getMemoriesList(): List<MemoryEntity> = agentDao.getAllMemories()

    suspend fun addMemory(category: String, key: String, value: String, importance: Int = 3): Long {
        return agentDao.insertMemory(
            MemoryEntity(
                category = category,
                key = key,
                value = value,
                importance = importance
            )
        )
    }

    suspend fun deleteMemory(id: Long) {
        agentDao.deleteMemoryById(id)
    }

    suspend fun clearMemories() {
        agentDao.clearAllMemories()
    }

    // Conversations
    val allConversations: Flow<List<ConversationEntity>> = agentDao.getAllConversationsFlow()

    suspend fun createConversation(id: String, title: String) {
        agentDao.insertOrUpdateConversation(ConversationEntity(id = id, title = title))
    }

    suspend fun deleteConversation(id: String) {
        agentDao.deleteMessagesForConversation(id)
        agentDao.deleteConversation(id)
    }

    fun getMessagesFlow(conversationId: String): Flow<List<MessageEntity>> =
        agentDao.getMessagesForConversationFlow(conversationId)

    suspend fun getMessages(conversationId: String): List<MessageEntity> =
        agentDao.getMessagesForConversation(conversationId)

    suspend fun addMessage(
        conversationId: String,
        sender: String,
        text: String,
        toolName: String? = null,
        toolInput: String? = null,
        toolResult: String? = null,
        status: String = "COMPLETED",
        sourcesJson: String? = null
    ): Long {
        return agentDao.insertMessage(
            MessageEntity(
                conversationId = conversationId,
                sender = sender,
                text = text,
                toolName = toolName,
                toolInput = toolInput,
                toolResult = toolResult,
                status = status,
                sourcesJson = sourcesJson
            )
        )
    }

    // Tasks
    val allTasks: Flow<List<TaskEntity>> = agentDao.getAllTasksFlow()

    fun getTaskStepsFlow(taskId: String): Flow<List<TaskStepEntity>> =
        agentDao.getTaskStepsFlow(taskId)

    suspend fun createTaskWithSteps(task: TaskEntity, steps: List<TaskStepEntity>) {
        agentDao.insertOrUpdateTask(task)
        steps.forEach { step ->
            agentDao.insertTaskStep(step)
        }
    }

    suspend fun updateTaskStatus(taskId: String, status: String) {
        val task = agentDao.getTaskById(taskId)
        if (task != null) {
            val completedTime = if (status == "COMPLETED" || status == "FAILED") System.currentTimeMillis() else null
            agentDao.insertOrUpdateTask(task.copy(status = status, completedAt = completedTime))
        }
    }

    suspend fun updateTaskStep(step: TaskStepEntity) {
        agentDao.updateTaskStep(step)
    }

    // Presentations
    val allPresentations: Flow<List<PresentationEntity>> = agentDao.getAllPresentationsFlow()

    fun getSlidesFlow(presentationId: String): Flow<List<SlideEntity>> =
        agentDao.getSlidesForPresentationFlow(presentationId)

    suspend fun getSlides(presentationId: String): List<SlideEntity> =
        agentDao.getSlidesForPresentation(presentationId)

    suspend fun savePresentationWithSlides(presentation: PresentationEntity, slides: List<SlideEntity>) {
        agentDao.insertOrUpdatePresentation(presentation)
        agentDao.deleteSlidesForPresentation(presentation.id)
        agentDao.insertSlides(slides)
    }

    suspend fun deletePresentation(id: String) {
        agentDao.deleteSlidesForPresentation(id)
        agentDao.deletePresentation(id)
    }

    // Audit Logs
    val auditLogs: Flow<List<AuditLogEntity>> = agentDao.getAuditLogsFlow()

    suspend fun logAction(actionName: String, scope: String, details: String, confirmed: Boolean = true) {
        agentDao.insertAuditLog(
            AuditLogEntity(
                actionName = actionName,
                scope = scope,
                details = details,
                userConfirmed = confirmed
            )
        )
    }

    suspend fun clearAuditLogs() {
        agentDao.clearAuditLogs()
    }

    // Voice Settings
    val voiceSettings: Flow<VoiceSettingsEntity?> = agentDao.getVoiceSettingsFlow()

    suspend fun getVoiceSettings(): VoiceSettingsEntity {
        val current = agentDao.getVoiceSettings()
        if (current != null) return current
        val defaultSettings = VoiceSettingsEntity()
        agentDao.insertOrUpdateVoiceSettings(defaultSettings)
        return defaultSettings
    }

    suspend fun saveVoiceSettings(settings: VoiceSettingsEntity) {
        agentDao.insertOrUpdateVoiceSettings(settings)
    }
}
