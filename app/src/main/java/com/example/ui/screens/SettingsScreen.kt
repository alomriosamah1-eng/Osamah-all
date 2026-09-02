package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.agent.opencode.OpenCodeControlSubsystem
import com.example.agent.opencode.OpenCodeModel
import com.example.agent.opencode.RoutingStrategy
import com.example.data.local.entity.UserProfileEntity
import com.example.ui.components.*
import com.example.ui.theme.CyanNeon
import com.example.ui.theme.ElectricBlue
import com.example.viewmodel.OsamahAgentViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: OsamahAgentViewModel
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val memories by viewModel.memories.collectAsState()
    val auditLogs by viewModel.auditLogs.collectAsState()

    val openCodeSubsystem = remember { OpenCodeControlSubsystem.getInstance(context) }
    var engineConfig by remember { mutableStateOf(openCodeSubsystem.config) }

    var showEditProfileDialog by remember { mutableStateOf(false) }
    var showAddMemoryDialog by remember { mutableStateOf(false) }
    var showClearMemoryConfirm by remember { mutableStateOf(false) }
    var showAuditLogsDialog by remember { mutableStateOf(false) }
    var showModelSelectorDialog by remember { mutableStateOf(false) }
    var showRoutingStrategyDialog by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        // 1. Header
        item {
            Text(
                text = "الإعدادات ولوحة التحكم بالوكيل",
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                text = "إدارة الوكيل، النماذج، الصوت، الذاكرة، والخصوصية",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // 2. Models and connections
        item {
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF10B981))
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "النماذج والاتصالات",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = Color(0x3310B981)
                        ) {
                            Text(
                                text = "اتصال الوكيل",
                                color = Color(0xFF10B981),
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Text(
                        text = "يتحقق الوكيل من الاتصال بالنماذج المتاحة، ويختار المسار الأنسب للطلب، ويدير السياق والمهام محلياً مع الحفاظ على بياناتك.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

                    // Active Model Card
                    Surface(
                        onClick = { showModelSelectorDialog = true },
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, CyanNeon.copy(alpha = 0.4f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "النموذج النشط:",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = engineConfig.activeModel.displayName,
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = CyanNeon
                                )
                                Text(
                                    text = "${engineConfig.activeModel.provider} • نافذة السياق: ${engineConfig.activeModel.contextWindow}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }

                            Icon(imageVector = Icons.Default.Tune, contentDescription = "تغيير النموذج", tint = CyanNeon)
                        }
                    }

                    // Routing Strategy
                    Surface(
                        onClick = { showRoutingStrategyDialog = true },
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "استراتيجية توزيع المهام الذكية:",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = engineConfig.routingStrategy.displayNameAr,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                                    color = ElectricBlue
                                )
                                Text(
                                    text = engineConfig.routingStrategy.descriptionAr,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            Icon(imageVector = Icons.Default.SwapHoriz, contentDescription = null, tint = ElectricBlue)
                        }
                    }

                    // Token Compression Toggle & Anti-Hallucination
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "نظام ضغط وتقليل استهلاك التوكن",
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium)
                            )
                            Text(
                                text = "تم توفير ~${engineConfig.totalTokensSavedEstimate} توكن عبر ضغط السياق",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFF10B981)
                            )
                        }
                        Switch(
                            checked = engineConfig.tokenCompressionEnabled,
                            onCheckedChange = {
                                openCodeSubsystem.toggleTokenCompression(it)
                                engineConfig = openCodeSubsystem.config
                            }
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "نظام منع الهلوسة والتحقق من الحقائق",
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium)
                            )
                            Text(
                                text = "إلزام الوكيل بالحقائق والأدلة الواقعية فقط",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Switch(
                            checked = engineConfig.antiHallucinationEnabled,
                            onCheckedChange = {
                                openCodeSubsystem.toggleAntiHallucination(it)
                                engineConfig = openCodeSubsystem.config
                            }
                        )
                    }
                }
            }
        }

        // 3. 19 Voice Bubbles Selector
        item {
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "اختر كرة المحادثة التفاعلية (19 كرة)",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "الكرة الحالية: ${BUBBLE_THEMES.find { it.id == uiState.voiceSettings.selectedBubbleId }?.nameAr ?: "الأزرق الكوني"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )

                Spacer(modifier = Modifier.height(14.dp))

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(BUBBLE_THEMES) { bubbleTheme ->
                        val isSelected = uiState.voiceSettings.selectedBubbleId == bubbleTheme.id
                        Surface(
                            onClick = { viewModel.updateVoiceBubble(bubbleTheme.id) },
                            shape = RoundedCornerShape(16.dp),
                            color = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f) else MaterialTheme.colorScheme.surface.copy(alpha = 0.5f),
                            border = androidx.compose.foundation.BorderStroke(
                                if (isSelected) 2.dp else 1.dp,
                                if (isSelected) CyanNeon else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                            ),
                            modifier = Modifier.width(100.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(10.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                VoiceBubbleCanvas(
                                    bubbleId = bubbleTheme.id,
                                    state = if (isSelected) BubbleState.LISTENING else BubbleState.IDLE,
                                    size = 54.dp
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = bubbleTheme.nameAr,
                                    style = MaterialTheme.typography.labelSmall,
                                    maxLines = 1,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }
        }

        // 4. Voice Engine Customization
        item {
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "المحرك الصوتي والنبرة",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Voice Gender
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("نوع الصوت:", style = MaterialTheme.typography.bodyMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = uiState.voiceSettings.voiceGender == "male",
                            onClick = { viewModel.updateVoiceGender("male") },
                            label = { Text("ذكوري") }
                        )
                        FilterChip(
                            selected = uiState.voiceSettings.voiceGender == "female",
                            onClick = { viewModel.updateVoiceGender("female") },
                            label = { Text("أنثوي") }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Accent
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("اللهجة / النطق:", style = MaterialTheme.typography.bodyMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = uiState.voiceSettings.accent == "syrian",
                            onClick = { viewModel.updateVoiceAccent("syrian") },
                            label = { Text("سورية") }
                        )
                        FilterChip(
                            selected = uiState.voiceSettings.accent == "fusha",
                            onClick = { viewModel.updateVoiceAccent("fusha") },
                            label = { Text("فصحى") }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Speed Slider
                Text(
                    text = "سرعة الكلام: ${String.format("%.2f", uiState.voiceSettings.speechRate)}x",
                    style = MaterialTheme.typography.bodySmall
                )
                Slider(
                    value = uiState.voiceSettings.speechRate,
                    onValueChange = {
                        viewModel.updateVoiceSliders(it, uiState.voiceSettings.pitch, uiState.voiceSettings.volume)
                    },
                    valueRange = 0.7f..1.4f
                )

                // Pitch Slider
                Text(
                    text = "طبقة الصوت: ${String.format("%.2f", uiState.voiceSettings.pitch)}",
                    style = MaterialTheme.typography.bodySmall
                )
                Slider(
                    value = uiState.voiceSettings.pitch,
                    onValueChange = {
                        viewModel.updateVoiceSliders(uiState.voiceSettings.speechRate, it, uiState.voiceSettings.volume)
                    },
                    valueRange = 0.7f..1.3f
                )
            }
        }

        // 5. User Profile Card
        item {
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "الملف الشخصي للمهندس أسامة",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "تخصيص هوية الوكيل لتناسب اختصاصك بدقة",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    IconButton(onClick = { showEditProfileDialog = true }) {
                        Icon(imageVector = Icons.Default.Edit, contentDescription = "تعديل", tint = MaterialTheme.colorScheme.primary)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                ProfileInfoRow(label = "الاسم الكامل", value = uiState.userProfile.name)
                ProfileInfoRow(label = "المسمى الوظيفي", value = uiState.userProfile.jobTitle)
                ProfileInfoRow(label = "المجال العام", value = uiState.userProfile.field)
                ProfileInfoRow(label = "التخصص الدقيق", value = uiState.userProfile.specialization)
                ProfileInfoRow(label = "الهدف الأساسي", value = uiState.userProfile.primaryGoal)
            }
        }

        // 6. Selective Memory Management
        item {
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "الذاكرة الانتقائية (Selective Memory)",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "ما يتذكره الوكيل عنك محلياً ومشفر (${memories.size} عنصر)",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Row {
                        IconButton(onClick = { showAddMemoryDialog = true }) {
                            Icon(imageVector = Icons.Default.AddCircle, contentDescription = "إضافة معلومة", tint = MaterialTheme.colorScheme.primary)
                        }
                        if (memories.isNotEmpty()) {
                            IconButton(onClick = { showClearMemoryConfirm = true }) {
                                Icon(imageVector = Icons.Default.DeleteOutline, contentDescription = "مسح الكل", tint = Color(0xFFEF4444))
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                if (memories.isEmpty()) {
                    Text(
                        text = "لا توجد ذكريات مخزنة حالياً. أضف معلومة جديدة وسيتذكرها الوكيل دائماً.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        memories.forEach { mem ->
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 12.dp, vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(text = mem.key, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.primary)
                                        Text(text = mem.value, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
                                    }
                                    IconButton(onClick = { viewModel.deleteMemory(mem.id) }) {
                                        Icon(imageVector = Icons.Default.Close, contentDescription = "حذف", modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 7. Audit Trail & Tool Execution Log
        item {
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "سجل العمليات والشفافية (Audit Trail)",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "تسجيل فوري لجميع أدوات واستدعاءات الوكيل",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    OutlinedButton(
                        onClick = { showAuditLogsDialog = true },
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(imageVector = Icons.Default.History, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("عرض السجل", style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }

        // 8. Developer Identity & About Section
        item {
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "عن وكيل أسامة — Osamah Agent",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "أنا وكيل أسامة، مساعدك الشخصي الذكي للتفكير والبحث والتنفيذ وإدارة المعرفة والمهام والمحادثة، مع احترام خصوصيتك وإتاحة التحكم في بياناتك.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "البنية المدمجة: Agent Infrastructure • الإصدار: 2.0.0",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }

    // Modal: Select available model
    if (showModelSelectorDialog) {
        AlertDialog(
            onDismissRequest = { showModelSelectorDialog = false },
            title = { Text("اختيار نموذج الذكاء الاصطناعي") },
            text = {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth().heightIn(max = 420.dp)
                ) {
                    items(OpenCodeModel.values()) { model ->
                        val isSelected = engineConfig.activeModel == model
                        Surface(
                            onClick = {
                                openCodeSubsystem.updateModel(model)
                                engineConfig = openCodeSubsystem.config
                                showModelSelectorDialog = false
                            },
                            shape = RoundedCornerShape(10.dp),
                            color = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.7f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            border = androidx.compose.foundation.BorderStroke(
                                if (isSelected) 2.dp else 1.dp,
                                if (isSelected) CyanNeon else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = model.displayName,
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                        color = if (isSelected) CyanNeon else MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = model.provider,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                Spacer(modifier = Modifier.height(3.dp))
                                Text(
                                    text = "التخصص: ${model.specialtyAr}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "السياق: ${model.contextWindow} • الكفاءة: ${model.costEfficiency}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showModelSelectorDialog = false }) { Text("إغلاق") }
            }
        )
    }

    // Modal: Select Routing Strategy
    if (showRoutingStrategyDialog) {
        AlertDialog(
            onDismissRequest = { showRoutingStrategyDialog = false },
            title = { Text("استراتيجية توجيه المهام الذكية") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    RoutingStrategy.values().forEach { strategy ->
                        val isSelected = engineConfig.routingStrategy == strategy
                        Surface(
                            onClick = {
                                openCodeSubsystem.updateRoutingStrategy(strategy)
                                engineConfig = openCodeSubsystem.config
                                showRoutingStrategyDialog = false
                            },
                            shape = RoundedCornerShape(10.dp),
                            color = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.7f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            border = androidx.compose.foundation.BorderStroke(
                                if (isSelected) 2.dp else 1.dp,
                                if (isSelected) ElectricBlue else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(
                                    text = strategy.displayNameAr,
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = if (isSelected) ElectricBlue else MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = strategy.descriptionAr,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showRoutingStrategyDialog = false }) { Text("إغلاق") }
            }
        )
    }

    // Dialog: Edit Profile
    if (showEditProfileDialog) {
        var name by remember { mutableStateOf(uiState.userProfile.name) }
        var job by remember { mutableStateOf(uiState.userProfile.jobTitle) }
        var spec by remember { mutableStateOf(uiState.userProfile.specialization) }
        var goal by remember { mutableStateOf(uiState.userProfile.primaryGoal) }

        AlertDialog(
            onDismissRequest = { showEditProfileDialog = false },
            title = { Text("تعديل الملف الشخصي") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("الاسم") })
                    OutlinedTextField(value = job, onValueChange = { job = it }, label = { Text("المسمى الوظيفي") })
                    OutlinedTextField(value = spec, onValueChange = { spec = it }, label = { Text("التخصص الدقيق") })
                    OutlinedTextField(value = goal, onValueChange = { goal = it }, label = { Text("الهدف الأساسي") })
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.updateUserProfile(
                            uiState.userProfile.copy(
                                name = name,
                                jobTitle = job,
                                specialization = spec,
                                primaryGoal = goal
                            )
                        )
                        showEditProfileDialog = false
                    }
                ) { Text("حفظ") }
            },
            dismissButton = {
                TextButton(onClick = { showEditProfileDialog = false }) { Text("إلغاء") }
            }
        )
    }

    // Dialog: Add Memory
    if (showAddMemoryDialog) {
        var key by remember { mutableStateOf("") }
        var value by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddMemoryDialog = false },
            title = { Text("إضافة معلومة للذاكرة الانتقائية") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = key, onValueChange = { key = it }, label = { Text("العنوان / المفتاح") }, placeholder = { Text("مثال: لغة البرمجة المفضلة") })
                    OutlinedTextField(value = value, onValueChange = { value = it }, label = { Text("القيمة / التفصيل") }, placeholder = { Text("مثال: Kotlin & Jetpack Compose") })
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (key.isNotBlank()) {
                            viewModel.addMemory(key, value)
                            showAddMemoryDialog = false
                        }
                    }
                ) { Text("إضافة") }
            },
            dismissButton = {
                TextButton(onClick = { showAddMemoryDialog = false }) { Text("إلغاء") }
            }
        )
    }

    // Dialog: Clear Memory Confirm
    if (showClearMemoryConfirm) {
        AlertDialog(
            onDismissRequest = { showClearMemoryConfirm = false },
            title = { Text("تأكيد مسح الذاكرة") },
            text = { Text("هل أنت متأكد من مسح جميع عناصر الذاكرة الانتقائية؟ هذا الإجراء لا يمكن التراجع عنه.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.clearAllMemories()
                        showClearMemoryConfirm = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                ) { Text("مسح الذاكرة بالكامل") }
            },
            dismissButton = {
                TextButton(onClick = { showClearMemoryConfirm = false }) { Text("إلغاء") }
            }
        )
    }

    // Dialog: Audit Logs Viewer
    if (showAuditLogsDialog) {
        AlertDialog(
            onDismissRequest = { showAuditLogsDialog = false },
            title = { Text("سجل العمليات والشفافية") },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 400.dp)
                ) {
                    if (auditLogs.isEmpty()) {
                        Text(
                            text = "لا توجد سجلات عمليات مسجلة حالياً.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(auditLogs) { log ->
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(
                                                text = log.actionName,
                                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Text(
                                                text = log.scope,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = log.details,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(onClick = { showAuditLogsDialog = false }) {
                    Text("إغلاق")
                }
            }
        )
    }
}

@Composable
private fun ProfileInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium), color = MaterialTheme.colorScheme.onSurface)
    }
}
