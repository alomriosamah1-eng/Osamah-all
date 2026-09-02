package com.example

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.example.ui.theme.OsamahAgentTheme
import com.example.viewmodel.OsamahAgentViewModel
import androidx.test.core.app.ApplicationProvider
import com.github.takahirom.roborazzi.RobolectricDeviceQualifiers
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = RobolectricDeviceQualifiers.Pixel8, sdk = [36])
class GreetingScreenshotTest {

  @get:Rule val composeTestRule = createComposeRule()

  @Test
  fun osamah_agent_home_screenshot() {
    composeTestRule.setContent {
      OsamahAgentTheme {
        OsamahAgentApp(viewModel = OsamahAgentViewModel(ApplicationProvider.getApplicationContext()))
      }
    }
    composeTestRule.onRoot().captureRoboImage(filePath = "src/test/screenshots/osamah-agent-home.png")
  }
}
