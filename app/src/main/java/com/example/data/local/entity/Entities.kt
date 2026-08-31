package com.example.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_profiles")
data class UserProfileEntity(
    @PrimaryKey val id: Int = 1,
    val name: String = "أسامة",
    val language: String = "ar",
    val country: String = "اليمن",
    val city: String = "صنعاء",
    val jobTitle: String = "مهندس ومطور برمجيات",
    val field: String = "الهندسة وتطوير الأنظمة الذكية",
    val specialization: String = "هندسة البرمجيات والذكاء الاصطناعي",
    val experienceLevel: String = "خبير / مهندس رئيسي",
    val primaryGoal: String = "الإنتاجية وإنجاز المشاريع والأبحاث البرمجية المتقدمة",
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "memories")
data class MemoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val category: String, // "preference", "project", "fact", "rule"
    val key: String,
    val value: String,
    val importance: Int = 1, // 1 to 5
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "conversations")
data class ConversationEntity(
    @PrimaryKey val id: String,
    val title: String,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val conversationId: String,
    val sender: String, // "user", "agent", "system"
    val text: String,
    val timestamp: Long = System.currentTimeMillis(),
    val toolName: String? = null,
    val toolInput: String? = null,
    val toolResult: String? = null,
    val status: String = "COMPLETED", // "PENDING", "EXECUTING", "COMPLETED", "FAILED"
    val sourcesJson: String? = null
)

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val goal: String,
    val status: String = "PENDING", // "PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"
    val createdAt: Long = System.currentTimeMillis(),
    val completedAt: Long? = null
)

@Entity(tableName = "task_steps")
data class TaskStepEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val taskId: String,
    val stepNumber: Int,
    val title: String,
    val description: String,
    val toolRequired: String,
    val status: String = "PENDING", // "PENDING", "RUNNING", "COMPLETED", "FAILED"
    val output: String? = null
)

@Entity(tableName = "presentations")
data class PresentationEntity(
    @PrimaryKey val id: String,
    val title: String,
    val topic: String,
    val themeColor: String = "#00F0FF",
    val createdAt: Long = System.currentTimeMillis(),
    val slidesCount: Int = 0
)

@Entity(tableName = "slides")
data class SlideEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val presentationId: String,
    val slideNumber: Int,
    val title: String,
    val content: String,
    val bulletPointsJson: String, // Comma or JSON array
    val notes: String? = null,
    val iconName: String = "auto_awesome"
)

@Entity(tableName = "audit_logs")
data class AuditLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val actionName: String,
    val scope: String,
    val details: String,
    val timestamp: Long = System.currentTimeMillis(),
    val userConfirmed: Boolean = true
)

@Entity(tableName = "voice_settings")
data class VoiceSettingsEntity(
    @PrimaryKey val id: Int = 1,
    val voiceGender: String = "male", // "male" or "female"
    val accent: String = "syrian", // "syrian" or "fusha"
    val speechRate: Float = 1.0f,
    val pitch: Float = 1.0f,
    val volume: Float = 1.0f,
    val selectedBubbleId: Int = 1, // 1 to 19
    val bargeInEnabled: Boolean = true
)
