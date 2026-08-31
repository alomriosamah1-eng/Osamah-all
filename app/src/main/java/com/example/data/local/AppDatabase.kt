package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.data.local.dao.AgentDao
import com.example.data.local.entity.*

@Database(
    entities = [
        UserProfileEntity::class,
        MemoryEntity::class,
        ConversationEntity::class,
        MessageEntity::class,
        TaskEntity::class,
        TaskStepEntity::class,
        PresentationEntity::class,
        SlideEntity::class,
        AuditLogEntity::class,
        VoiceSettingsEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun agentDao(): AgentDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "osamah_agent_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
