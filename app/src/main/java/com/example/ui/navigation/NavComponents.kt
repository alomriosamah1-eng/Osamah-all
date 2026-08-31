package com.example.ui.navigation

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

sealed class NavItem(
    val id: String,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    object Home : NavItem("home", "الرئيسية", Icons.Filled.Home, Icons.Outlined.Home)
    object Chat : NavItem("chat", "المحادثة", Icons.Filled.ChatBubble, Icons.Outlined.ChatBubbleOutline)
    object Browser : NavItem("browser", "المتصفح", Icons.Filled.Public, Icons.Outlined.Public)
    object Presentations : NavItem("presentations", "العروض", Icons.Filled.Slideshow, Icons.Outlined.Slideshow)
    object Files : NavItem("files", "الملفات", Icons.Filled.Folder, Icons.Outlined.Folder)
    object Settings : NavItem("settings", "الإعدادات", Icons.Filled.Settings, Icons.Outlined.Settings)
}

val NAV_ITEMS = listOf(
    NavItem.Home,
    NavItem.Chat,
    NavItem.Browser,
    NavItem.Presentations,
    NavItem.Files,
    NavItem.Settings
)

@Composable
fun OsamahBottomNavigation(
    currentTab: String,
    onTabSelected: (String) -> Unit
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
        tonalElevation = 8.dp
    ) {
        NAV_ITEMS.forEach { item ->
            val selected = currentTab == item.id
            NavigationBarItem(
                selected = selected,
                onClick = { onTabSelected(item.id) },
                icon = {
                    Icon(
                        imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.title,
                        modifier = Modifier.size(22.dp)
                    )
                },
                label = {
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.labelSmall
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)
                )
            )
        }
    }
}
