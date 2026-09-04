// عناصر حالة الأدوات: EmptyState, TaskTimeline (تقدم حقيقي من متجر الوكيل), AgentStatusStrip, ResultCard, HistoryCard.
import React from 'react';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha } from '../../theme/colors';
import { IconName } from '../primitives';

export function EmptyState({ icon, title, hint, actionLabel, onAction, accent }: { icon: IconName; title: string; hint?: string; actionLabel?: string; onAction?: () => void; accent?: string }) {
  const { colors } = useTheme();
  const c = accent ?? colors.primary;
  return (
    <View style={{ alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: withAlpha(c, 0.12), alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <MaterialIcons name={icon} size={30} color={c} />
      </View>
      <Text style={{ color: colors.onBackground, ...typography.titleSmall, fontWeight: FontWeights.bold, textAlign: 'center' }}>{title}</Text>
      {hint ? <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall, textAlign: 'center', marginTop: 6 }}>{hint}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => [{ marginTop: 14, borderRadius: 24, backgroundColor: withAlpha(c, 0.16), paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.8 : 1 }]}>
          <MaterialIcons name="add" size={18} color={c} />
          <Text style={{ color: c, ...typography.labelLarge, fontWeight: FontWeights.bold, marginStart: 6 }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** شريط حالة الوكيل الحي — يُقرأ من المتجر الفعلي (يُمرَّر). */
export function AgentStatusStrip({ state, statusText, error, accent }: { state: 'idle' | 'sending' | 'error'; statusText?: string; error?: string | null; accent: string }) {
  const { colors } = useTheme();
  if (state === 'idle') return null;
  const isError = state === 'error';
  return (
    <View style={[s.statusStrip, { borderColor: withAlpha(isError ? '#F87171' : accent, 0.4), backgroundColor: withAlpha(isError ? '#F87171' : accent, 0.08) }]}>
      {isError ? (
        <MaterialIcons name="error-outline" size={18} color="#F87171" />
      ) : (
        <ActivityIndicator size="small" color={accent} />
      )}
      <Text style={{ color: isError ? '#F87171' : colors.onSurface, ...typography.bodySmall, marginStart: 8, flex: 1 }} numberOfLines={3}>
        {isError ? (error ?? 'حدث خطأ أثناء التنفيذ') : (statusText ?? 'يجري التنفيذ…')}
      </Text>
    </View>
  );
}

export interface TimelineStep {
  key: string;
  label: string;
  detail?: string;
  icon: IconName;
}

export type StepState = 'pending' | 'running' | 'done' | 'failed';

/** خط زمني بمراحل معروفة للأداة، تمتلئ أوضاعها من إشارات المتجر الحقيقية (sending/error). */
export function TaskTimeline({ steps, states, accent }: { steps: TimelineStep[]; states: StepState[]; accent: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: withAlpha(colors.outline, 0.25), padding: 12, backgroundColor: withAlpha(colors.surfaceVariant, 0.35) }}>
      {steps.map((step, i) => {
        const st = states[i] ?? 'pending';
        const isLast = i === steps.length - 1;
        const color =
          st === 'done' ? accent : st === 'running' ? accent : st === 'failed' ? '#F87171' : withAlpha(colors.onSurfaceVariant, 0.5);
        return (
          <View key={step.key} style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', marginEnd: 10 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: withAlpha(color, 0.16), alignItems: 'center', justifyContent: 'center' }}>
                {st === 'done' ? <MaterialIcons name="check" size={16} color={accent} /> : st === 'failed' ? <MaterialIcons name="close" size={16} color="#F87171" /> : st === 'running' ? <ActivityIndicator size="small" color={accent} /> : <MaterialIcons name={step.icon} size={14} color={color} />}
              </View>
              {!isLast ? <View style={{ width: 2, flex: 1, backgroundColor: withAlpha(color, 0.35), minHeight: 14 }} /> : null}
            </View>
            <View style={{ paddingBottom: isLast ? 0 : 12, flex: 1 }}>
              <Text style={{ color: color, ...typography.labelLarge, fontWeight: FontWeights.semiBold }}>{step.label}</Text>
              {step.detail ? <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall, marginTop: 2 }} numberOfLines={2}>{step.detail}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function ResultCard({ title, subtitle, icon, accent, actions, children }: { title: string; subtitle?: string; icon: IconName; accent: string; actions?: { label: string; icon: IconName; onPress: () => void }[]; children?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[s.resultCard, { borderColor: withAlpha(accent, 0.4) }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: withAlpha(accent, 0.16), alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name={icon} size={22} color={accent} />
        </View>
        <View style={{ flex: 1, marginStart: 10 }}>
          <Text style={{ color: colors.onBackground, ...typography.titleSmall, fontWeight: FontWeights.bold }} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
      {actions && actions.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {actions.map((a) => (
            <Pressable key={a.label} onPress={a.onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', borderRadius: 20, backgroundColor: withAlpha(accent, 0.15), paddingHorizontal: 14, paddingVertical: 8, opacity: pressed ? 0.8 : 1 }]}>
              <MaterialIcons name={a.icon} size={16} color={accent} />
              <Text style={{ color: accent, ...typography.labelMedium, fontWeight: FontWeights.bold, marginStart: 6 }}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function HistoryCard({ title, subtitle, meta, icon, accent, onOpen, onDelete, chevron = true }: { title: string; subtitle?: string; meta?: string; icon: IconName; accent: string; onOpen?: () => void; onDelete?: () => void; chevron?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onOpen} disabled={!onOpen} style={({ pressed }) => [s.history, { borderColor: withAlpha(colors.outline, 0.22), opacity: pressed && onOpen ? 0.7 : 1 }]}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: withAlpha(accent, 0.13), alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={icon} size={20} color={accent} />
      </View>
      <View style={{ flex: 1, marginStart: 10 }}>
        <Text style={{ color: colors.onBackground, ...typography.bodyMedium, fontWeight: FontWeights.semiBold }} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }} numberOfLines={1}>{subtitle}</Text> : null}
        {meta ? <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall, marginTop: 2 }}>{meta}</Text> : null}
      </View>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={8} style={{ padding: 4, marginEnd: 4 }}>
          <MaterialIcons name="delete-outline" size={20} color={colors.onSurfaceVariant} />
        </Pressable>
      ) : null}
      {chevron && onOpen ? <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} /> : null}
    </Pressable>
  );
}

export function ToolCard({ title, subtitle, icon, accent, onPress, tag }: { title: string; subtitle: string; icon: IconName; accent: string; onPress: () => void; tag?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.toolCard, { borderColor: withAlpha(accent, 0.35), opacity: pressed ? 0.85 : 1 }]}>
      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: withAlpha(accent, 0.15), alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={icon} size={26} color={accent} />
      </View>
      <View style={{ flex: 1, marginStart: 12 }}>
        <Text style={{ color: colors.onBackground, ...typography.titleSmall, fontWeight: FontWeights.bold }}>{title}</Text>
        <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall, marginTop: 4 }} numberOfLines={2}>{subtitle}</Text>
        {tag ? (
          <View style={{ alignSelf: 'flex-start', marginTop: 8, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: withAlpha(accent, 0.14) }}>
            <Text style={{ color: accent, ...typography.labelSmall }}>{tag}</Text>
          </View>
        ) : null}
      </View>
      <MaterialIcons name="chevron-right" size={26} color={accent} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  statusStrip: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10 },
  resultCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginTop: 10 },
  history: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12 },
  toolCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 16 },
});
