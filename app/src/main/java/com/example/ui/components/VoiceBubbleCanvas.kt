package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.cos
import kotlin.math.sin

enum class BubbleState {
    IDLE,
    LISTENING,
    THINKING,
    SPEAKING,
    ERROR
}

data class BubbleTheme(
    val id: Int,
    val name: String,
    val nameAr: String,
    val primaryColor: Color,
    val secondaryColor: Color,
    val coreGlowColor: Color
)

val BUBBLE_THEMES = listOf(
    BubbleTheme(1, "Cosmic Blue", "الأزرق الكوني", Color(0xFF00F0FF), Color(0xFF0051FF), Color(0xFF80FFFF)),
    BubbleTheme(2, "Emerald Energy", "طاقة الزمرد", Color(0xFF10B981), Color(0xFF047857), Color(0xFFA7F3D0)),
    BubbleTheme(3, "Solar Flare", "التوهج الشمسي", Color(0xFFF59E0B), Color(0xFFDC2626), Color(0xFFFDE68A)),
    BubbleTheme(4, "Amethyst Pulse", "نبض الجمشت", Color(0xFF8B5CF6), Color(0xFF6D28D9), Color(0xFFDDD6FE)),
    BubbleTheme(5, "Cyber Neon", "السايبر نيون", Color(0xFF06B6D4), Color(0xFFEC4899), Color(0xFF67E8F9)),
    BubbleTheme(6, "Pearl Minimal", "اللؤلؤ البسيط", Color(0xFFE2E8F0), Color(0xFF94A3B8), Color(0xFFFFFFFF)),
    BubbleTheme(7, "Ruby Core", "الياقوت الأحمر", Color(0xFFEF4444), Color(0xFF991B1B), Color(0xFFFECACA)),
    BubbleTheme(8, "Deep Ocean", "أعماق المحيط", Color(0xFF0284C7), Color(0xFF0F172A), Color(0xFF38BDF8)),
    BubbleTheme(9, "Golden Radiant", "الإشعاع الذهبي", Color(0xFFFBBF24), Color(0xFFB45309), Color(0xFFFEF3C7)),
    BubbleTheme(10, "Vortex Gradient", "الدوامة المتدرجة", Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFC084FC)),
    BubbleTheme(11, "Plasma Sphere", "كرة البلازما", Color(0xFF3B82F6), Color(0xFFE11D48), Color(0xFF93C5FD)),
    BubbleTheme(12, "Aurora Borealis", "الشفق القطبي", Color(0xFF34D399), Color(0xFF3B82F6), Color(0xFF6EE7B7)),
    BubbleTheme(13, "Obsidian Dark", "السبج المظلم", Color(0xFF475569), Color(0xFF0F172A), Color(0xFF94A3B8)),
    BubbleTheme(14, "Mercury Flow", "تدفق الزئبق", Color(0xFFCBD5E1), Color(0xFF64748B), Color(0xFFF1F5F9)),
    BubbleTheme(15, "Sunset Glow", "توهج الغروب", Color(0xFFFB923C), Color(0xFFBE185D), Color(0xFFFED7AA)),
    BubbleTheme(16, "Quantum Grid", "الشبكة الكمومية", Color(0xFF14B8A6), Color(0xFF1E1B4B), Color(0xFF5EEAD4)),
    BubbleTheme(17, "Prism Light", "ضوء المنشور", Color(0xFFA78BFA), Color(0xFFF472B6), Color(0xFFFBCFE8)),
    BubbleTheme(18, "Echo Ripple", "تموج الصدى", Color(0xFF38BDF8), Color(0xFF1D4ED8), Color(0xFFBAE6FD)),
    BubbleTheme(19, "Nova Fusion", "الاندماج النجمي", Color(0xFF818CF8), Color(0xFF4338CA), Color(0xFFE0E7FF))
)

@Composable
fun VoiceBubbleCanvas(
    bubbleId: Int,
    state: BubbleState,
    modifier: Modifier = Modifier,
    size: Dp = 180.dp,
    onClick: () -> Unit = {}
) {
    val theme = BUBBLE_THEMES.find { it.id == bubbleId } ?: BUBBLE_THEMES[0]

    val infiniteTransition = rememberInfiniteTransition(label = "BubbleAnimation")

    // Pulse animation based on state
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.88f,
        targetValue = when (state) {
            BubbleState.LISTENING -> 1.12f
            BubbleState.SPEAKING -> 1.18f
            BubbleState.THINKING -> 1.05f
            BubbleState.ERROR -> 0.95f
            BubbleState.IDLE -> 0.96f
        },
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = when (state) {
                    BubbleState.LISTENING -> 600
                    BubbleState.SPEAKING -> 450
                    BubbleState.THINKING -> 900
                    else -> 1500
                },
                easing = FastOutSlowInEasing
            ),
            repeatMode = RepeatMode.Reverse
        ),
        label = "PulseScale"
    )

    // Continuous rotation for Thinking and Speaking
    val rotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = if (state == BubbleState.THINKING) 2500 else 6000,
                easing = LinearEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "RotationAngle"
    )

    // Harmonic ring waves
    val waveOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1800, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "WaveOffset"
    )

    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val center = Offset(this.size.width / 2f, this.size.height / 2f)
            val baseRadius = (this.size.minDimension / 2.6f) * pulseScale

            val primary = if (state == BubbleState.ERROR) Color(0xFFEF4444) else theme.primaryColor
            val secondary = if (state == BubbleState.ERROR) Color(0xFF7F1D1D) else theme.secondaryColor
            val glow = if (state == BubbleState.ERROR) Color(0xFFFECACA) else theme.coreGlowColor

            // 1. Exterior Radiant Ripple Waves
            if (state == BubbleState.LISTENING || state == BubbleState.SPEAKING) {
                val rippleRadius1 = baseRadius * (1f + waveOffset * 0.4f)
                val rippleAlpha1 = (1f - waveOffset).coerceIn(0f, 1f) * 0.5f
                drawCircle(
                    color = primary.copy(alpha = rippleAlpha1),
                    radius = rippleRadius1,
                    center = center,
                    style = Stroke(width = 2.5.dp.toPx())
                )

                val rippleRadius2 = baseRadius * (1f + ((waveOffset + 0.5f) % 1f) * 0.4f)
                val rippleAlpha2 = (1f - ((waveOffset + 0.5f) % 1f)).coerceIn(0f, 1f) * 0.35f
                drawCircle(
                    color = secondary.copy(alpha = rippleAlpha2),
                    radius = rippleRadius2,
                    center = center,
                    style = Stroke(width = 1.5.dp.toPx())
                )
            }

            // 2. Outer Gradient Atmosphere
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        primary.copy(alpha = 0.85f),
                        secondary.copy(alpha = 0.6f),
                        Color.Transparent
                    ),
                    center = center,
                    radius = baseRadius * 1.35f
                ),
                radius = baseRadius * 1.35f,
                center = center
            )

            // 3. Spherical Core Gradient
            val lightSource = Offset(
                center.x - baseRadius * 0.35f * cos(Math.toRadians(rotationAngle.toDouble())).toFloat(),
                center.y - baseRadius * 0.35f * sin(Math.toRadians(rotationAngle.toDouble())).toFloat()
            )

            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(glow, primary, secondary),
                    center = lightSource,
                    radius = baseRadius
                ),
                radius = baseRadius,
                center = center
            )

            // 4. Orbiting energy quantum particles (for Thinking & Listening)
            if (state == BubbleState.THINKING || state == BubbleState.LISTENING) {
                val particleCount = 6
                for (i in 0 until particleCount) {
                    val angleDeg = rotationAngle + (i * (360f / particleCount))
                    val rad = Math.toRadians(angleDeg.toDouble())
                    val particleDist = baseRadius * 1.12f
                    val px = center.x + (particleDist * cos(rad)).toFloat()
                    val py = center.y + (particleDist * sin(rad)).toFloat()

                    drawCircle(
                        color = glow.copy(alpha = 0.9f),
                        radius = 3.dp.toPx(),
                        center = Offset(px, py)
                    )
                }
            }

            // 5. Internal Crystal Specular Highlight
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Color.White.copy(alpha = 0.65f), Color.Transparent),
                    center = Offset(center.x - baseRadius * 0.3f, center.y - baseRadius * 0.35f),
                    radius = baseRadius * 0.45f
                ),
                radius = baseRadius * 0.45f,
                center = Offset(center.x - baseRadius * 0.3f, center.y - baseRadius * 0.35f)
            )
        }
    }
}
