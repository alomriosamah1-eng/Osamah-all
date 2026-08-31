package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.entity.PresentationEntity
import com.example.data.local.entity.SlideEntity
import com.example.ui.components.GlassCard
import com.example.ui.theme.CyanNeon
import com.example.ui.theme.ElectricBlue
import com.example.viewmodel.OsamahAgentViewModel

@Composable
fun PresentationsScreen(
    viewModel: OsamahAgentViewModel
) {
    val presentations by viewModel.presentations.collectAsState()
    var selectedPresentation by remember { mutableStateOf<PresentationEntity?>(null) }
    var showCreateDialog by remember { mutableStateOf(false) }
    var currentSlideIndex by remember { mutableStateOf(0) }

    var newTopic by remember { mutableStateOf("") }
    var newSlideCount by remember { mutableStateOf(8) }

    LaunchedEffect(presentations) {
        if (selectedPresentation == null && presentations.isNotEmpty()) {
            selectedPresentation = presentations.first()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .padding(bottom = 80.dp)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "استوديو العروض التقديمية",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = "توليد وتنسيق العروض التفاعلية وتصديرها",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Button(
                onClick = { showCreateDialog = true },
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("عرض جديد")
            }
        }

        // Horizontal Presentation Selector
        if (presentations.isNotEmpty()) {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 12.dp)
            ) {
                items(presentations) { pres ->
                    val isSelected = selectedPresentation?.id == pres.id
                    FilterChip(
                        selected = isSelected,
                        onClick = {
                            selectedPresentation = pres
                            currentSlideIndex = 0
                        },
                        label = { Text(pres.title.take(20)) }
                    )
                }
            }
        }

        // Active Slide Deck Viewer
        if (selectedPresentation != null) {
            val pres = selectedPresentation!!
            GlassCard(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Slide Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                        ) {
                            Text(
                                text = "شريحة ${currentSlideIndex + 1} من ${pres.slidesCount}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }

                        IconButton(
                            onClick = {
                                viewModel.sendUserMessage("أنشئ ملف PDF لعرض: ${pres.title}")
                                viewModel.selectTab("files")
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.PictureAsPdf,
                                contentDescription = "تصدير PDF",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Slide Main Title & Topic
                    Text(
                        text = if (currentSlideIndex == 0) pres.title else "المحور ${currentSlideIndex + 1}: ${pres.topic}",
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "المحتوى التفاعلي والدراسة التحليلية المعدة بواسطة وكيل أسامة لتغطية الأهداف ومؤشرات القياس الهندسية.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Bullet Points List
                    Column(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        val points = listOf(
                            "الركيزة الأولى: التخطيط الذكي وتفكيك المهام",
                            "الركيزة الثانية: التحقق والقياس المستمر لمؤشرات الجودة",
                            "الركيزة الثالثة: التوافق مع متطلبات الخصوصية والأداء الخفيف"
                        )
                        points.forEach { point ->
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = point,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }

                    // Navigation Controls
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedButton(
                            onClick = {
                                if (currentSlideIndex > 0) currentSlideIndex--
                            },
                            enabled = currentSlideIndex > 0
                        ) {
                            Text("السابق")
                        }

                        Button(
                            onClick = {
                                if (currentSlideIndex < pres.slidesCount - 1) currentSlideIndex++
                            },
                            enabled = currentSlideIndex < pres.slidesCount - 1
                        ) {
                            Text("التالي")
                        }
                    }
                }
            }
        } else {
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "لا توجد عروض حالياً. انقر على \"عرض جديد\" لإنشاء عرض تقديمي ذكي فوراً.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }

    // Create Presentation Modal Dialog
    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = { Text("إنشاء عرض تقديمي جديد") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = newTopic,
                        onValueChange = { newTopic = it },
                        label = { Text("موضوع العرض") },
                        placeholder = { Text("مثال: هندسة البرمجيات والذكاء الاصطناعي 2026") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Text(
                        text = "عدد الشرائح: $newSlideCount شريحة ${if (newSlideCount >= 100) "(عرض تقديمي ضخم ⚡)" else ""}",
                        style = MaterialTheme.typography.labelMedium,
                        color = if (newSlideCount >= 100) CyanNeon else MaterialTheme.colorScheme.onSurface
                    )

                    Slider(
                        value = newSlideCount.toFloat(),
                        onValueChange = { newSlideCount = it.toInt() },
                        valueRange = 4f..120f
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newTopic.isNotBlank()) {
                            viewModel.createPresentation(newTopic, newSlideCount)
                            showCreateDialog = false
                        }
                    }
                ) {
                    Text("توليد العرض")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("إلغاء")
                }
            }
        )
    }
}
