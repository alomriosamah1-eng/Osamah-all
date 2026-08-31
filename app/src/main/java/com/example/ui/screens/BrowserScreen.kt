package com.example.ui.screens

import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.webkit.*
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.components.GlassCard
import com.example.ui.theme.CyanNeon
import com.example.ui.theme.ElectricBlue
import com.example.viewmodel.OsamahAgentViewModel

@Composable
fun BrowserScreen(
    viewModel: OsamahAgentViewModel
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    var inputUrl by remember { mutableStateOf(uiState.browserUrl) }
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var pageTitle by remember { mutableStateOf("صفحة الويب الذكية") }
    var pageProgress by remember { mutableStateOf(0) }
    var isLoading by remember { mutableStateOf(false) }
    var extractedContent by remember { mutableStateOf("") }
    var isAgentAutomating by remember { mutableStateOf(false) }
    var agentActionStatus by remember { mutableStateOf("وكيل أسامة جاهز لأتمتة التصفح") }

    // Quick Bookmarks / Popular Research Portals
    val quickShortcuts = listOf(
        "Android Docs" to "https://developer.android.com",
        "Kotlin Docs" to "https://kotlinlang.org/docs/home.html",
        "Google News" to "https://news.google.com",
        "Wikipedia" to "https://ar.wikipedia.org",
        "GitHub" to "https://github.com",
        "arXiv AI" to "https://arxiv.org/list/cs.AI/recent"
    )

    fun navigateTo(url: String) {
        val target = if (url.startsWith("http://") || url.startsWith("https://")) {
            url
        } else if (url.contains(".") && !url.contains(" ")) {
            "https://$url"
        } else {
            "https://www.google.com/search?q=" + Uri.encode(url)
        }
        inputUrl = target
        viewModel.setBrowserUrl(target)
        webViewInstance?.loadUrl(target)
    }

    fun extractPageTextAndAutomate(actionPrompt: String) {
        isAgentAutomating = true
        agentActionStatus = "جارٍ استخراج المحتوى وتوجيهه لوكيل أسامة..."
        webViewInstance?.evaluateJavascript(
            "(function() { return document.body.innerText || document.documentElement.innerText; })();"
        ) { result ->
            val cleanText = (result ?: "").replace("\\n", "\n").replace("\\\"", "\"").take(2500)
            extractedContent = cleanText
            isAgentAutomating = false
            agentActionStatus = "تم استخلاص المحتوى بنجاح ✓"
            viewModel.sendUserMessage("$actionPrompt: $pageTitle\nالرابط: ${uiState.browserUrl}\nالمحتوى المستخلص: $cleanText")
            viewModel.selectTab("chat")
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(bottom = 80.dp)
    ) {
        // 1. Navigation & Search Bar
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.9f),
            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.25f))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 6.dp, vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = {
                        if (webViewInstance?.canGoBack() == true) {
                            webViewInstance?.goBack()
                        }
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = "الرجوع",
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }

                IconButton(
                    onClick = {
                        if (webViewInstance?.canGoForward() == true) {
                            webViewInstance?.goForward()
                        }
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "للأمام",
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }

                TextField(
                    value = inputUrl,
                    onValueChange = { inputUrl = it },
                    placeholder = { Text("أدخل رابط أو ابحث في الويب...", style = MaterialTheme.typography.bodySmall) },
                    modifier = Modifier.weight(1f),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    singleLine = true
                )

                if (isLoading) {
                    IconButton(onClick = { webViewInstance?.stopLoading() }) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "إيقاف", tint = Color(0xFFEF4444))
                    }
                } else {
                    IconButton(onClick = { webViewInstance?.reload() }) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "إعادة تحميل", tint = MaterialTheme.colorScheme.primary)
                    }
                }

                IconButton(onClick = { navigateTo(inputUrl) }) {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "انتقال",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        // Loading Progress Bar
        if (isLoading && pageProgress in 1..99) {
            LinearProgressIndicator(
                progress = { pageProgress / 100f },
                modifier = Modifier.fillMaxWidth().height(3.dp),
                color = CyanNeon,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
        }

        // 2. Autonomous Agent Automation Bar
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 4.dp),
            shape = RoundedCornerShape(12.dp),
            color = if (isAgentAutomating) Color(0x2600F0FF) else MaterialTheme.colorScheme.surface.copy(alpha = 0.7f),
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (isAgentAutomating) CyanNeon else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = if (isAgentAutomating) Icons.Default.SmartToy else Icons.Default.AutoMode,
                        contentDescription = null,
                        tint = CyanNeon,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = agentActionStatus,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1
                    )
                }

                IconButton(
                    onClick = {
                        try {
                            val shareIntent = Intent(Intent.ACTION_VIEW, Uri.parse(uiState.browserUrl))
                            context.startActivity(shareIntent)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    },
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.OpenInBrowser,
                        contentDescription = "فتح في المتصفح الخارجي",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        // 3. Quick Agent Action Chips (Web Automation Workflows)
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                FilterChip(
                    selected = uiState.isReaderMode,
                    onClick = { viewModel.toggleReaderMode() },
                    label = { Text("وضع القراءة النقي", style = MaterialTheme.typography.labelSmall) },
                    leadingIcon = {
                        Icon(imageVector = Icons.Default.AutoStories, contentDescription = null, modifier = Modifier.size(14.dp))
                    }
                )
            }

            item {
                SuggestionChip(
                    onClick = {
                        extractPageTextAndAutomate("قم بتلخيص هذه الصفحة واستخراج 5 نقاط جوهرية")
                    },
                    label = { Text("تلخيص ذكي عبر الوكيل", style = MaterialTheme.typography.labelSmall) },
                    icon = {
                        Icon(imageVector = Icons.Default.Bolt, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(14.dp))
                    }
                )
            }

            item {
                SuggestionChip(
                    onClick = {
                        extractPageTextAndAutomate("أنشئ تقرير PDF توثيقي شامل مستنداً إلى محتوى هذه الصفحة")
                    },
                    label = { Text("توليد PDF من الصفحة", style = MaterialTheme.typography.labelSmall) },
                    icon = {
                        Icon(imageVector = Icons.Default.PictureAsPdf, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(14.dp))
                    }
                )
            }

            item {
                SuggestionChip(
                    onClick = {
                        extractPageTextAndAutomate("أنشئ عرضًا تقديميًا تفاعليًا من 8 شرائح يلخص محتوى ودراسة هذه الصفحة")
                    },
                    label = { Text("تحويل لعرض شرائح", style = MaterialTheme.typography.labelSmall) },
                    icon = {
                        Icon(imageVector = Icons.Default.Slideshow, contentDescription = null, tint = ElectricBlue, modifier = Modifier.size(14.dp))
                    }
                )
            }
        }

        // 4. Quick Portals Row
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 2.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(quickShortcuts) { (name, url) ->
                AssistChip(
                    onClick = { navigateTo(url) },
                    label = { Text(name, style = MaterialTheme.typography.labelSmall) }
                )
            }
        }

        // 5. Main WebView or Reader Mode
        if (uiState.isReaderMode) {
            GlassCard(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(12.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                ) {
                    Text(
                        text = pageTitle,
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = uiState.browserUrl,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(14.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = extractedContent.ifBlank {
                            "المحتوى النقي: يتم الآن فحص الصفحة وتنظيف العناصر الترويجية لتقديم قراءة هادئة ومريحة لمقالاتك وأبحاثك."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        lineHeight = 24.sp
                    )
                }
            }
        } else {
            AndroidView(
                factory = { ctx ->
                    WebView(ctx).apply {
                        settings.apply {
                            javaScriptEnabled = true
                            domStorageEnabled = true
                            databaseEnabled = true
                            allowFileAccess = true
                            allowContentAccess = true
                            setSupportZoom(true)
                            builtInZoomControls = true
                            displayZoomControls = false
                            loadWithOverviewMode = true
                            useWideViewPort = true
                            cacheMode = WebSettings.LOAD_DEFAULT
                            userAgentString = "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36"
                            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        }

                        webViewClient = object : WebViewClient() {
                            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                                isLoading = true
                                if (url != null) {
                                    inputUrl = url
                                    viewModel.setBrowserUrl(url)
                                }
                            }

                            override fun onPageFinished(view: WebView?, url: String?) {
                                isLoading = false
                                pageTitle = view?.title ?: "صفحة الويب"
                                if (url != null) {
                                    inputUrl = url
                                    viewModel.setBrowserUrl(url)
                                }
                            }

                            override fun onReceivedError(
                                view: WebView?,
                                errorCode: Int,
                                description: String?,
                                failingUrl: String?
                            ) {
                                isLoading = false
                            }
                        }

                        webChromeClient = object : WebChromeClient() {
                            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                                pageProgress = newProgress
                                if (newProgress == 100) isLoading = false
                            }

                            override fun onReceivedTitle(view: WebView?, title: String?) {
                                if (title != null) pageTitle = title
                            }
                        }

                        loadUrl(uiState.browserUrl)
                        webViewInstance = this
                    }
                },
                update = { webView ->
                    if (webView.url != uiState.browserUrl && !uiState.browserUrl.isBlank()) {
                        webView.loadUrl(uiState.browserUrl)
                    }
                },
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(top = 4.dp)
            )
        }
    }
}
