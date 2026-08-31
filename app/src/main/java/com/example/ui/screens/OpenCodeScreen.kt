package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.engine.CodeExecutionResult
import com.example.engine.OpenCodeEngine
import com.example.ui.components.GlassCard
import com.example.ui.theme.CyanNeon
import com.example.ui.theme.ElectricBlue
import com.example.viewmodel.OsamahAgentViewModel
import kotlinx.coroutines.launch

@Composable
fun OpenCodeScreen(
    viewModel: OsamahAgentViewModel
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val openCodeEngine = remember { OpenCodeEngine(context) }

    var selectedLanguage by remember { mutableStateOf("kotlin") }
    var codeContent by remember { mutableStateOf(openCodeEngine.templates.first().code) }
    var executionResult by remember { mutableStateOf<CodeExecutionResult?>(null) }
    var isRunning by remember { mutableStateOf(false) }
    var showAiPromptDialog by remember { mutableStateOf(false) }
    var aiPromptText by remember { mutableStateOf("") }

    val languages = listOf(
        "kotlin" to "Kotlin",
        "python" to "Python",
        "javascript" to "JavaScript",
        "shell" to "Shell / Bash"
    )

    fun runCode() {
        isRunning = true
        coroutineScope.launch {
            val res = openCodeEngine.execute(codeContent, selectedLanguage)
            executionResult = res
            isRunning = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp)
            .padding(bottom = 80.dp)
    ) {
        // 1. Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Terminal,
                        contentDescription = null,
                        tint = CyanNeon,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "بيئة OpenCode البرمجية",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }
                Text(
                    text = "تشغيل الأكواد، السكربتات والأتمتة مع وكيل أسامة",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Button(
                onClick = { runCode() },
                enabled = !isRunning,
                colors = ButtonDefaults.buttonColors(containerColor = CyanNeon),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (isRunning) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = Color.Black,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = null,
                        tint = Color.Black,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("تشغيل", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }
        }

        // 2. Language Selector & AI Tools
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(languages) { (id, name) ->
                    FilterChip(
                        selected = selectedLanguage == id,
                        onClick = {
                            selectedLanguage = id
                            val matchTemplate = openCodeEngine.templates.find { it.language == id }
                            if (matchTemplate != null) {
                                codeContent = matchTemplate.code
                            }
                        },
                        label = { Text(name, style = MaterialTheme.typography.labelSmall) }
                    )
                }
            }

            IconButton(onClick = { showAiPromptDialog = true }) {
                Icon(
                    imageVector = Icons.Default.AutoFixHigh,
                    contentDescription = "توليد كود عبر الوكيل",
                    tint = CyanNeon
                )
            }
        }

        // 3. Quick Templates Chips
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.padding(bottom = 8.dp)
        ) {
            items(openCodeEngine.templates) { template ->
                AssistChip(
                    onClick = {
                        selectedLanguage = template.language
                        codeContent = template.code
                    },
                    label = { Text(template.title.take(24), style = MaterialTheme.typography.labelSmall) },
                    leadingIcon = {
                        Icon(imageVector = Icons.Default.Code, contentDescription = null, modifier = Modifier.size(14.dp))
                    }
                )
            }
        }

        // 4. Code Editor View
        Surface(
            modifier = Modifier
                .weight(1.2f)
                .fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFF0F172A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Editor Top Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF1E293B))
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(Color(0xFFEF4444)))
                        Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(Color(0xFFF59E0B)))
                        Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(Color(0xFF10B981)))
                    }

                    Text(
                        text = "main.${if (selectedLanguage == "kotlin") "kt" else if (selectedLanguage == "python") "py" else "js"}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF94A3B8),
                        fontFamily = FontFamily.Monospace
                    )

                    Row {
                        IconButton(
                            onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                clipboard.setPrimaryClip(ClipData.newPlainText("code", codeContent))
                                Toast.makeText(context, "تم نسخ الكود", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ContentCopy,
                                contentDescription = "نسخ",
                                tint = Color(0xFF94A3B8),
                                modifier = Modifier.size(14.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(4.dp))
                        IconButton(
                            onClick = { codeContent = "" },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.DeleteSweep,
                                contentDescription = "مسح",
                                tint = Color(0xFF94A3B8),
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                }

                // Code Input Area
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(12.dp)
                ) {
                    BasicTextField(
                        value = codeContent,
                        onValueChange = { codeContent = it },
                        textStyle = TextStyle(
                            color = Color(0xFFE2E8F0),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 13.sp,
                            lineHeight = 20.sp
                        ),
                        cursorBrush = SolidColor(CyanNeon),
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // 5. Terminal Console Output
        Surface(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFF020617),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp)
            ) {
                // Console Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "وحدة الإخراج (Terminal Console)",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color(0xFF38BDF8),
                            fontFamily = FontFamily.Monospace
                        )
                        if (executionResult != null) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = if (executionResult!!.success) Color(0x3310B981) else Color(0x33EF4444)
                            ) {
                                Text(
                                    text = if (executionResult!!.success) "SUCCESS (0)" else "ERROR",
                                    color = if (executionResult!!.success) Color(0xFF10B981) else Color(0xFFEF4444),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontSize = 10.sp,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }

                    if (executionResult != null) {
                        Text(
                            text = "${executionResult!!.executionTimeMs} ms • ${executionResult!!.memoryUsageKb} KB",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF64748B),
                            fontSize = 10.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                HorizontalDivider(color = Color(0xFF1E293B))
                Spacer(modifier = Modifier.height(8.dp))

                // Console Content
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                ) {
                    if (executionResult == null && !isRunning) {
                        Text(
                            text = "$ OpenCode ready. اضغط على \"تشغيل\" لتنفيذ الكود والحصول على المخرجات مباشرة.",
                            color = Color(0xFF64748B),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp
                        )
                    } else if (isRunning) {
                        Text(
                            text = "$ جارٍ تجميع وتشغيل البرنامج النصي عبر بيئة OpenCode...",
                            color = CyanNeon,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp
                        )
                    } else {
                        val res = executionResult!!
                        if (res.output.isNotBlank()) {
                            Text(
                                text = res.output,
                                color = Color(0xFF34D399),
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp,
                                lineHeight = 18.sp
                            )
                        }
                        if (res.error != null) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = res.error,
                                color = Color(0xFFF87171),
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }
    }

    // Modal: AI Code Generation Dialog
    if (showAiPromptDialog) {
        AlertDialog(
            onDismissRequest = { showAiPromptDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.SmartToy, contentDescription = null, tint = CyanNeon)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("طلب كود من وكيل أسامة")
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "اكتب ما تريد أن يبرمجه لك الوكيل بلغة $selectedLanguage:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    OutlinedTextField(
                        value = aiPromptText,
                        onValueChange = { aiPromptText = it },
                        placeholder = { Text("مثال: اكتب خوارزمية فرز سريعة مع قياس الأداء") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 4
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (aiPromptText.isNotBlank()) {
                            viewModel.sendUserMessage("اكتب كود برمجياً بلغة $selectedLanguage لتنفيذ: $aiPromptText واشرح طريقة تشغيله في OpenCode")
                            viewModel.selectTab("chat")
                            showAiPromptDialog = false
                        }
                    }
                ) {
                    Text("توليد في المحادثة")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAiPromptDialog = false }) {
                    Text("إلغاء")
                }
            }
        )
    }
}
