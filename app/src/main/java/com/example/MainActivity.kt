package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import com.example.ui.navigation.OsamahBottomNavigation
import com.example.ui.screens.*
import com.example.ui.theme.OsamahAgentTheme
import com.example.viewmodel.OsamahAgentViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: OsamahAgentViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            OsamahAgentTheme {
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    OsamahAgentApp(viewModel = viewModel)
                }
            }
        }
    }
}

@Composable
fun OsamahAgentApp(viewModel: OsamahAgentViewModel) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            OsamahBottomNavigation(
                currentTab = uiState.currentTab,
                onTabSelected = { viewModel.selectTab(it) }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            Crossfade(targetState = uiState.currentTab, label = "ScreenTransition") { tab ->
                when (tab) {
                    "home" -> HomeScreen(
                        viewModel = viewModel,
                        onNavigateToTab = { viewModel.selectTab(it) }
                    )
                    "chat" -> ChatScreen(viewModel = viewModel)
                    "browser" -> BrowserScreen(viewModel = viewModel)
                    "presentations" -> PresentationsScreen(viewModel = viewModel)
                    "files" -> FilesScreen(viewModel = viewModel)
                    "settings" -> SettingsScreen(viewModel = viewModel)
                    else -> HomeScreen(
                        viewModel = viewModel,
                        onNavigateToTab = { viewModel.selectTab(it) }
                    )
                }
            }
        }
    }
}

