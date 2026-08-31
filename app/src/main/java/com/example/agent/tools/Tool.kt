package com.example.agent.tools

import com.example.data.local.entity.UserProfileEntity

enum class ToolScope {
    READ_ONLY,
    LOCAL_WRITE,
    NETWORK_SEARCH,
    SENSITIVE_SYSTEM
}

data class ToolResult(
    val success: Boolean,
    val summary: String,
    val data: String? = null,
    val requiresConfirmation: Boolean = false,
    val artifacts: List<String> = emptyList()
)

interface AgentTool {
    val id: String
    val name: String
    val description: String
    val scope: ToolScope
    val requiresUserConfirmation: Boolean

    suspend fun execute(
        parameters: Map<String, String>,
        userProfile: UserProfileEntity?,
        memories: List<String>
    ): ToolResult
}
