// VoiceBubbleCanvas — منقول من ui/components/VoiceBubbleCanvas.kt
// كرة صوت متحركة بـ react-native-svg + Animated (المدمج في RN): 19 ثيماً وحالات متعددة.
// بدون reanimated/worklets/useAnimated* — ثمين للرسم المستقر على iOS وAndroid وExpo Go.
//
// لكل حالة حركة مميزة وواضحة:
//   * الاستماع: نبض سريع + موجات حلقية + جسيمات + اهتزاز خفيف.
//   * التفكير:  دوران أسرع + جسيمات مدارية + نبض متوسط + اهتزاز خفيف.
//   * النطق:    نبض متقطع كالكلام + موجات + اهتزاز أوضح.
//   * متوقف:    تنفّس لطيف بلاحركة إضافية.
// مع ملصق حالة صغير أسفل الكرة (يستمع/يفكر/يتحدث/متوقف...).
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

export enum BubbleState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  TRANSCRIBING = 'TRANSCRIBING',
  THINKING = 'THINKING',
  SEARCHING = 'SEARCHING',
  GENERATING = 'GENERATING',
  SYNTHESIZING = 'SYNTHESIZING',
  SPEAKING = 'SPEAKING',
  INTERRUPTED = 'INTERRUPTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

export interface BubbleTheme {
  id: number;
  name: string;
  nameAr: string;
  primaryColor: string;
  secondaryColor: string;
  coreGlowColor: string;
}

export const BUBBLE_THEMES: BubbleTheme[] = [
  { id: 1, name: 'Cosmic Blue', nameAr: 'الأزرق الكوني', primaryColor: '#00F0FF', secondaryColor: '#0051FF', coreGlowColor: '#80FFFF' },
  { id: 2, name: 'Emerald Energy', nameAr: 'طاقة الزمرد', primaryColor: '#10B981', secondaryColor: '#047857', coreGlowColor: '#A7F3D0' },
  { id: 3, name: 'Solar Flare', nameAr: 'التوهج الشمسي', primaryColor: '#F59E0B', secondaryColor: '#DC2626', coreGlowColor: '#FDE68A' },
  { id: 4, name: 'Amethyst Pulse', nameAr: 'نبض الجمشت', primaryColor: '#8B5CF6', secondaryColor: '#6D28D9', coreGlowColor: '#DDD6FE' },
  { id: 5, name: 'Cyber Neon', nameAr: 'السايبر نيون', primaryColor: '#06B6D4', secondaryColor: '#EC4899', coreGlowColor: '#67E8F9' },
  { id: 6, name: 'Pearl Minimal', nameAr: 'اللؤلؤ البسيط', primaryColor: '#E2E8F0', secondaryColor: '#94A3B8', coreGlowColor: '#FFFFFF' },
  { id: 7, name: 'Ruby Core', nameAr: 'الياقوت الأحمر', primaryColor: '#EF4444', secondaryColor: '#991B1B', coreGlowColor: '#FECACA' },
  { id: 8, name: 'Deep Ocean', nameAr: 'أعماق المحيط', primaryColor: '#0284C7', secondaryColor: '#0F172A', coreGlowColor: '#38BDF8' },
  { id: 9, name: 'Golden Radiant', nameAr: 'الإشعاع الذهبي', primaryColor: '#FBBF24', secondaryColor: '#B45309', coreGlowColor: '#FEF3C7' },
  { id: 10, name: 'Vortex Gradient', nameAr: 'الدوامة المتدرجة', primaryColor: '#6366F1', secondaryColor: '#A855F7', coreGlowColor: '#C084FC' },
  { id: 11, name: 'Plasma Sphere', nameAr: 'كرة البلازما', primaryColor: '#3B82F6', secondaryColor: '#E11D48', coreGlowColor: '#93C5FD' },
  { id: 12, name: 'Aurora Borealis', nameAr: 'الشفق القطبي', primaryColor: '#34D399', secondaryColor: '#3B82F6', coreGlowColor: '#6EE7B7' },
  { id: 13, name: 'Obsidian Dark', nameAr: 'السبج المظلم', primaryColor: '#475569', secondaryColor: '#0F172A', coreGlowColor: '#94A3B8' },
  { id: 14, name: 'Mercury Flow', nameAr: 'تدفق الزئبق', primaryColor: '#CBD5E1', secondaryColor: '#64748B', coreGlowColor: '#F1F5F9' },
  { id: 15, name: 'Sunset Glow', nameAr: 'توهج الغروب', primaryColor: '#FB923C', secondaryColor: '#BE185D', coreGlowColor: '#FED7AA' },
  { id: 16, name: 'Quantum Grid', nameAr: 'الشبكة الكمومية', primaryColor: '#14B8A6', secondaryColor: '#1E1B4B', coreGlowColor: '#5EEAD4' },
  { id: 17, name: 'Prism Light', nameAr: 'ضوء المنشور', primaryColor: '#A78BFA', secondaryColor: '#F472B6', coreGlowColor: '#FBCFE8' },
  { id: 18, name: 'Echo Ripple', nameAr: 'تموج الصدى', primaryColor: '#38BDF8', secondaryColor: '#1D4ED8', coreGlowColor: '#BAE6FD' },
  { id: 19, name: 'Nova Fusion', nameAr: 'الاندماج النجمي', primaryColor: '#818CF8', secondaryColor: '#4338CA', coreGlowColor: '#E0E7FF' },
];

export function getBubbleTheme(bubbleId: number): BubbleTheme {
  return BUBBLE_THEMES.find((t) => t.id === bubbleId) ?? BUBBLE_THEMES[0];
}

/** ملصق الحالة الصغير أسفل الكرة (لغة طبيعية للمستخدم). */
export function statusLabelFor(state: BubbleState): string {
  switch (state) {
    case BubbleState.LISTENING: return 'يستمع';
    case BubbleState.TRANSCRIBING: return 'يفهم';
    case BubbleState.THINKING: return 'يفكر';
    case BubbleState.SEARCHING: return 'يبحث';
    case BubbleState.GENERATING: return 'يُنشئ';
    case BubbleState.SYNTHESIZING: return 'يُجهّز الصوت';
    case BubbleState.SPEAKING: return 'يتحدث';
    case BubbleState.INTERRUPTED: return 'متوقف مؤقتاً';
    case BubbleState.DISCONNECTED: return 'غير متصل';
    case BubbleState.ERROR: return 'خطأ';
    default: return 'متوقف';
  }
}

/** معاملات الحركة لكل حالة: نبض، دوران، موجات، جسيمات، اهتزاز (نطق واضح ومميز). */
interface Motion {
  minScale: number;
  maxScale: number;
  pulseMs: number;
  rotMs: number;
  ripples: boolean;
  particles: boolean;
  bobAmp: number; // سعة الاهتزاز الرأسي بالبكسل المضاعف (0 = لا اهتزاز)
  bobMs: number;
}

function motionFor(state: BubbleState): Motion {
  switch (state) {
    case BubbleState.LISTENING:
      return { minScale: 1, maxScale: 1.16, pulseMs: 480, rotMs: 5200, ripples: true, particles: true, bobAmp: 7, bobMs: 900 };
    case BubbleState.TRANSCRIBING:
      return { minScale: 1, maxScale: 1.08, pulseMs: 820, rotMs: 6800, ripples: false, particles: true, bobAmp: 3, bobMs: 1200 };
    case BubbleState.THINKING:
      return { minScale: 1, maxScale: 1.09, pulseMs: 720, rotMs: 2800, ripples: false, particles: true, bobAmp: 4, bobMs: 1350 };
    case BubbleState.SEARCHING:
      return { minScale: 1, maxScale: 1.11, pulseMs: 760, rotMs: 2400, ripples: false, particles: true, bobAmp: 4, bobMs: 1200 };
    case BubbleState.GENERATING:
      return { minScale: 1, maxScale: 1.13, pulseMs: 660, rotMs: 2100, ripples: false, particles: true, bobAmp: 5, bobMs: 1050 };
    case BubbleState.SYNTHESIZING:
      return { minScale: 1, maxScale: 1.15, pulseMs: 560, rotMs: 3600, ripples: true, particles: true, bobAmp: 5, bobMs: 900 };
    case BubbleState.SPEAKING:
      return { minScale: 1, maxScale: 1.2, pulseMs: 380, rotMs: 6200, ripples: true, particles: false, bobAmp: 9, bobMs: 650 };
    case BubbleState.INTERRUPTED:
      return { minScale: 1, maxScale: 1.03, pulseMs: 1300, rotMs: 9000, ripples: false, particles: false, bobAmp: 1, bobMs: 2000 };
    case BubbleState.DISCONNECTED:
      return { minScale: 1, maxScale: 1.03, pulseMs: 1800, rotMs: 10000, ripples: false, particles: false, bobAmp: 0, bobMs: 0 };
    case BubbleState.ERROR:
      return { minScale: 0.96, maxScale: 1.0, pulseMs: 800, rotMs: 9000, ripples: false, particles: false, bobAmp: 0, bobMs: 0 };
    default: // IDLE
      return { minScale: 1, maxScale: 1.04, pulseMs: 1500, rotMs: 9000, ripples: false, particles: false, bobAmp: 0, bobMs: 0 };
  }
}

const fill = StyleSheet.absoluteFill as any;

export function VoiceBubbleCanvas({
  bubbleId,
  state,
  size = 180,
  style,
  onClick,
  showLabel = true,
}: {
  bubbleId: number;
  state: BubbleState;
  size?: number;
  style?: ViewStyle | any;
  onClick?: () => void;
  /** إظهار ملصق الحالة الصغير أسفل الكرة (يستمع/يفكر/يتحدث/متوقف...). */
  showLabel?: boolean;
}) {
  const theme = getBubbleTheme(bubbleId);

  // ألوان حالة الخطأ (كما في الأصلي)
  const primary = state === BubbleState.ERROR ? '#EF4444' : theme.primaryColor;
  const secondary = state === BubbleState.ERROR ? '#7F1D1D' : theme.secondaryColor;
  const glow = state === BubbleState.ERROR ? '#FECACA' : theme.coreGlowColor;

  const center = size / 2;
  const baseRadius = size / 2.6;

  const motion = motionFor(state);
  const showRipples = motion.ripples;
  const showParticles = motion.particles;
  // عند الأحجام الصغيرة جداً نُخفي الجسيمات حتى لا تطمس الكرة نفسها.
  const effParticles = showParticles && size >= 64;

  // توقف/استئناف متدرّج عند تبديل الحالة حتى لا «يقفز» حجم الأنيميشن.
  const pulseScale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const rippleA = useRef(new Animated.Value(0)).current;
  const rippleB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops: Animated.CompositeAnimation[] = [];
    const { minScale, maxScale, pulseMs, rotMs, bobAmp, bobMs } = motion;

    // تمهيد لحظي إلى النطاق الجديد يمنع القفز ويجعل التبديل بين الحالات سلساً.
    Animated.timing(pulseScale, { toValue: minScale, duration: 120, useNativeDriver: true }).start();

    loops.push(
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: maxScale, duration: pulseMs, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: minScale, duration: pulseMs, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      )
    );

    loops.push(
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: rotMs,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    );

    // اهتزاز عمودي: يجعل النطق/الاستماع/التفكير حركةً واضحة لا تُخطئها العين.
    if (bobAmp > 0) {
      loops.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(bob, { toValue: 1, duration: bobMs / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(bob, { toValue: -1, duration: bobMs, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(bob, { toValue: 0, duration: bobMs / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ])
        )
      );
    }

    if (showRipples) {
      const rippleLoop = (value: Animated.Value, delayMs: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delayMs),
            Animated.timing(value, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        );
      loops.push(rippleLoop(rippleA, 0));
      loops.push(rippleLoop(rippleB, 900));
    }

    loops.forEach((l) => l.start());
    return () => {
      loops.forEach((l) => l.stop());
    };
    // إعادة إنشاء الحلقات فقط عند تغيّر الحالة الفعلي.
  }, [state]);

  const rotateDeg = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const translateY = bob.interpolate({ inputRange: [-1, 0, 1], outputRange: [-motion.bobAmp, 0, motion.bobAmp] });
  const rippleScaleA = rippleA.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.4] });
  const rippleOpacityA = rippleA.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const rippleScaleB = rippleB.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.4] });
  const rippleOpacityB = rippleB.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  const lightSource = { cx: center - baseRadius * 0.35, cy: center - baseRadius * 0.35 };

  const baseSvg = (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="atmosphere" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={primary} stopOpacity={0.85} />
          <Stop offset="55%" stopColor={secondary} stopOpacity={0.6} />
          <Stop offset="100%" stopColor={primary} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="coreGlow" gradientUnits="userSpaceOnUse" cx={lightSource.cx} cy={lightSource.cy} r={baseRadius}>
          <Stop offset="0%" stopColor={glow} />
          <Stop offset="55%" stopColor={primary} />
          <Stop offset="100%" stopColor={secondary} />
        </RadialGradient>
        <RadialGradient id="specular" cx={size / 2 - baseRadius * 0.3} cy={size / 2 - baseRadius * 0.35} r={baseRadius * 0.45}>
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.65} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={center} cy={center} r={baseRadius * 1.35} fill="url(#atmosphere)" />
      <Circle cx={center} cy={center} r={baseRadius} fill={secondary} />
    </Svg>
  );

  // النواة الدوارة (مصدر الضوء + الجسيمات)
  const rotatingCore = (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={center} cy={center} r={baseRadius} fill="url(#coreGlow)" />
      {effParticles &&
        Array.from({ length: 6 }).map((_, i) => {
          const angleDeg = (i * 360) / 6;
          const rad = (angleDeg * Math.PI) / 180;
          const d = baseRadius * 1.12;
          return (
            <Circle
              key={`p${i}`}
              cx={center + d * Math.cos(rad)}
              cy={center + d * Math.sin(rad)}
              r={3}
              fill={glow}
              opacity={0.9}
            />
          );
        })}
    </Svg>
  );

  // اللمعة البلورية الثابتة
  const specularSvg = (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={center - baseRadius * 0.3}
        cy={center - baseRadius * 0.35}
        r={baseRadius * 0.45}
        fill="url(#specular)"
      />
    </Svg>
  );

  const showStatusLabel = showLabel && size >= 64;

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <Pressable onPress={onClick} collapsable={false}>
        <Animated.View
          style={[
            { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' } as ViewStyle,
            { transform: [{ translateY }, { scale: pulseScale }] },
          ]}
        >
          {/* موجات حلقية (الاستماع/النطق) */}
          {showRipples && (
            <>
              <Animated.View pointerEvents="none" style={[fill, { transform: [{ scale: rippleScaleA }], opacity: rippleOpacityA }]}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  <Circle cx={center} cy={center} r={baseRadius * 1.15} stroke={primary} strokeWidth={2.5} fill="none" />
                </Svg>
              </Animated.View>
              <Animated.View pointerEvents="none" style={[fill, { transform: [{ scale: rippleScaleB }], opacity: rippleOpacityB }]}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  <Circle cx={center} cy={center} r={baseRadius * 1.15} stroke={secondary} strokeWidth={1.5} fill="none" />
                </Svg>
              </Animated.View>
            </>
          )}

          {/* الغلاف المتدرج + القاعدة */}
          {baseSvg}

          {/* النواة الدوارة */}
          <Animated.View pointerEvents="none" style={[fill, { transform: [{ rotate: rotateDeg }] }]}>{rotatingCore}</Animated.View>

          {/* اللمعة */}
          {specularSvg}
        </Animated.View>
      </Pressable>

      {/* ملصق الحالة الصغير أسفل الكرة (يستمع/يفكر/يتحدث/متوقف...) */}
      {showStatusLabel && (
        <View style={styles.labelPill}>
          <Text style={styles.labelText} numberOfLines={1}>
            {statusLabelFor(state)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labelPill: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    maxWidth: 140,
  },
  labelText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});