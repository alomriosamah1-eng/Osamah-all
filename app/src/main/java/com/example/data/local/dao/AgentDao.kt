package com.example.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.local.entity.*
import kotlinx.coroutines.flow.Flow

@Dao
interface AgentDao {

    // User Profile
    @Query("SELECT * FROM user_profiles WHERE id = 1 LIMIT 1")
    fun getUserProfileFlow(): Flow<UserProfileEntity?>

    @Query("SELECT * FROM user_profiles WHERE id = 1 LIMIT 1")
    suspend fun getUserProfile(): UserProfileEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateUserProfile(profile: UserProfileEntity)

    // Memories
    @Query("SELECT * FROM memories ORDER BY importance DESC, timestamp DESC")
    fun getAllMemoriesFlow(): Flow<List<MemoryEntity>>

    @Query("SELECT * FROM memories ORDER BY importance DESC, timestamp DESC")
    suspend fun getAllMemories(): List<MemoryEntity>

    @Query("SELECT * FROM memories WHERE category = :category ORDER BY timestamp DESC")
    suspend fun getMemoriesByCategory(category: String): List<MemoryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMemory(memory: MemoryEntity): Long

    @Delete
    suspend fun deleteMemory(memory: MemoryEntity)

    @Query("DELETE FROM memories WHERE id = :id")
    suspend fun deleteMemoryById(id: Long)

    @Query("DELETE FROM memories")
    suspend fun clearAllMemories()

    // Conversations
    @Query("SELECT * FROM conversations ORDER BY updatedAt DESC")
    fun getAllConversationsFlow(): Flow<List<ConversationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateConversation(conversation: ConversationEntity)

    @Query("DELETE FROM conversations WHERE id = :conversationId")
    suspend fun deleteConversation(conversationId: String)

    // Messages
    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY timestamp ASC")
    fun getMessagesForConversationFlow(conversationId: String): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY timestamp ASC")
    suspend fun getMessagesForConversation(conversationId: String): List<MessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity): Long

    @Query("DELETE FROM messages WHERE conversationId = :conversationId")
    suspend fun deleteMessagesForConversation(conversationId: String)

    // Tasks & Steps
    @Query("SELECT * FROM tasks ORDER BY createdAt DESC")
    fun getAllTasksFlow(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE id = :taskId LIMIT 1")
    suspend fun getTaskById(taskId: String): TaskEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateTask(task: TaskEntity)

    @Query("SELECT * FROM task_steps WHERE taskId = :taskId ORDER BY stepNumber ASC")
    fun getTaskStepsFlow(taskId: String): Flow<List<TaskStepEntity>>

    @Query("SELECT * FROM task_steps WHERE taskId = :taskId ORDER BY stepNumber ASC")
    suspend fun getTaskSteps(taskId: String): List<TaskStepEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTaskStep(step: TaskStepEntity): Long

    @Update
    suspend fun updateTaskStep(step: TaskStepEntity)

    // Presentations & Slides
    @Query("SELECT * FROM presentations ORDER BY createdAt DESC")
    fun getAllPresentationsFlow(): Flow<List<PresentationEntity>>

    @Query("SELECT * FROM presentations WHERE id = :id LIMIT 1")
    suspend fun getPresentationById(id: String): PresentationEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdatePresentation(presentation: PresentationEntity)

    @Query("DELETE FROM presentations WHERE id = :id")
    suspend fun deletePresentation(id: String)

    @Query("SELECT * FROM slides WHERE presentationId = :presentationId ORDER BY slideNumber ASC")
    fun getSlidesForPresentationFlow(presentationId: String): Flow<List<SlideEntity>>

    @Query("SELECT * FROM slides WHERE presentationId = :presentationId ORDER BY slideNumber ASC")
    suspend fun getSlidesForPresentation(presentationId: String): List<SlideEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSlide(slide: SlideEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSlides(slides: List<SlideEntity>)

    @Query("DELETE FROM slides WHERE presentationId = :presentationId")
    suspend fun deleteSlidesForPresentation(presentationId: String)

    // Audit Logs
    @Query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100")
    fun getAuditLogsFlow(): Flow<List<AuditLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAuditLog(log: AuditLogEntity): Long

    @Query("DELETE FROM audit_logs")
    suspend fun clearAuditLogs()

    // Voice Settings
    @Query("SELECT * FROM voice_settings WHERE id = 1 LIMIT 1")
    fun getVoiceSettingsFlow(): Flow<VoiceSettingsEntity?>

    @Query("SELECT * FROM voice_settings WHERE id = 1 LIMIT 1")
    suspend fun getVoiceSettings(): VoiceSettingsEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateVoiceSettings(settings: VoiceSettingsEntity)
}
