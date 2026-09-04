// عناصر اختيار قابلة لإعادة الاستخدام للأدوات الأربع (لغة / عدد / نوع محتوى / تصميم / خيارات متقدمة).
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha } from '../../theme/colors';
import { IconName, Spacer } from '../primitives';
import { LANGUAGE_OPTIONS, LanguageOption } from '../../tools/options';

export function SectionLabel({ text, hint }: { text: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
      <Text style={{ color: colors.onSurface, ...typography.labelLarge, fontWeight: FontWeights.bold }}>{text}</Text>
      {hint ? (
        <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function LanguageSelector({ value, onChange }: { value: LanguageOption; onChange: (l: LanguageOption) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {LANGUAGE_OPTIONS.map((l) => {
        const active = value === l.key;
        return (
          <Pressable
            key={l.key}
            onPress={() => onChange(l.key)}
            style={({ pressed }) => [
              s.choice,
              { borderColor: active ? colors.primary : withAlpha(colors.outline, 0.3), backgroundColor: active ? withAlpha(colors.primary, 0.14) : withAlpha(colors.surfaceVariant, 0.4), opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <MaterialIcons name="translate" size={16} color={active ? colors.primary : colors.onSurfaceVariant} />
            <Text style={{ color: active ? colors.primary : colors.onSurface, ...typography.labelMedium, marginStart: 6 }}>{l.label}</Text>
            <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall, marginStart: 4 }}>{l.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CountSelector({
  presets,
  value,
  onChange,
  suffix,
  min = 1,
  max = 200,
}: {
  presets: number[];
  value: number;
  onChange: (n: number) => void;
  suffix: string;
  min?: number;
  max?: number;
}) {
  const { colors } = useTheme();
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  function applyCustom() {
    const n = parseInt(customText, 10);
    if (Number.isNaN(n)) return;
    onChange(Math.max(min, Math.min(max, Math.round(n))));
    setCustomOpen(false);
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {presets.map((p) => {
          const active = value === p && !customOpen;
          return (
            <Pressable
              key={p}
              onPress={() => {
                setCustomOpen(false);
                onChange(p);
              }}
              style={({ pressed }) => [
                s.choice,
                { borderColor: active ? colors.primary : withAlpha(colors.outline, 0.3), backgroundColor: active ? withAlpha(colors.primary, 0.14) : withAlpha(colors.surfaceVariant, 0.4), opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={{ color: active ? colors.primary : colors.onSurface, ...typography.labelMedium }}>{p}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setCustomOpen((v) => !v)}
          style={({ pressed }) => [
            s.choice,
            { borderColor: customOpen ? colors.primary : withAlpha(colors.outline, 0.3), backgroundColor: customOpen ? withAlpha(colors.primary, 0.14) : withAlpha(colors.surfaceVariant, 0.4), opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <MaterialIcons name="edit" size={16} color={customOpen ? colors.primary : colors.onSurfaceVariant} />
          <Text style={{ color: customOpen ? colors.primary : colors.onSurface, ...typography.labelMedium, marginStart: 6 }}>مخصص</Text>
        </Pressable>
      </View>
      {customOpen ? (
        <View style={[s.customBox, { borderColor: withAlpha(colors.primary, 0.4) }]}>
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            keyboardType="number-pad"
            placeholder={`عدد ${suffix} (${min}..${max})`}
            placeholderTextColor={colors.onSurfaceVariant}
            style={{ flex: 1, color: colors.onBackground, ...typography.bodyMedium }}
          />
          <Pressable onPress={applyCustom} style={[s.applyBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#000', ...typography.labelMedium, fontWeight: FontWeights.bold }}>تطبيق</Text>
          </Pressable>
        </View>
      ) : null}
      <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall, marginTop: 8 }}>المحدد: {value} {suffix}</Text>
    </View>
  );
}

export function MultiSelectGrid({
  options,
  selected,
  onToggle,
  columns = 2,
}: {
  options: { key: string; label: string; icon: IconName }[];
  selected: string[];
  onToggle: (key: string) => void;
  columns?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const active = selected.includes(o.key);
        if (columns === 2) {
          return (
            <Pressable
              key={o.key}
              onPress={() => onToggle(o.key)}
              style={({ pressed }) => [
                { width: '48%', borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', borderColor: active ? colors.primary : withAlpha(colors.outline, 0.25), backgroundColor: active ? withAlpha(colors.primary, 0.12) : withAlpha(colors.surfaceVariant, 0.45), opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <MaterialIcons name={o.icon} size={18} color={active ? colors.primary : colors.onSurfaceVariant} />
              <Text style={{ color: active ? colors.primary : colors.onSurface, ...typography.labelMedium, marginStart: 8, flex: 1 }} numberOfLines={1}>
                {o.label}
              </Text>
              <MaterialIcons name={active ? 'check-circle' : 'radio-button-unchecked'} size={18} color={active ? colors.primary : withAlpha(colors.outline, 0.6)} />
            </Pressable>
          );
        }
        return (
          <Pressable
            key={o.key}
            onPress={() => onToggle(o.key)}
            style={({ pressed }) => [
              s.choice,
              { borderColor: active ? colors.primary : withAlpha(colors.outline, 0.3), backgroundColor: active ? withAlpha(colors.primary, 0.14) : withAlpha(colors.surfaceVariant, 0.4), opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <MaterialIcons name={o.icon} size={15} color={active ? colors.primary : colors.onSurfaceVariant} />
            <Text style={{ color: active ? colors.primary : colors.onSurface, ...typography.labelMedium, marginStart: 6 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SingleSelectGrid({
  options,
  value,
  onChange,
  accent,
}: {
  options: { key: string; label: string; icon: IconName }[];
  value: string;
  onChange: (k: string) => void;
  accent?: string;
}) {
  const { colors } = useTheme();
  const c = accent ?? colors.primary;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const active = value === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={({ pressed }) => [
              { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, borderColor: active ? c : withAlpha(colors.outline, 0.25), backgroundColor: active ? withAlpha(c, 0.13) : withAlpha(colors.surfaceVariant, 0.45), opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <MaterialIcons name={o.icon} size={17} color={active ? c : colors.onSurfaceVariant} />
            <Text style={{ color: active ? c : colors.onSurface, ...typography.labelMedium, marginStart: 6 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AdvancedOptions({ title = 'خيارات متقدمة', children }: { title?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: withAlpha(colors.outline, 0.25), overflow: 'hidden' }}>
      <Pressable onPress={() => setOpen((v) => !v)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: withAlpha(colors.surfaceVariant, 0.45), opacity: pressed ? 0.8 : 1 }]}>
        <MaterialIcons name="tune" size={18} color={colors.primary} />
        <Text style={{ color: colors.onSurface, ...typography.labelLarge, fontWeight: FontWeights.semiBold, marginStart: 8, flex: 1 }}>{title}</Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color={colors.onSurfaceVariant} />
      </Pressable>
      {open ? <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>{children}</View> : null}
    </View>
  );
}

export function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.onSurface, ...typography.bodyMedium }}>{label}</Text>
        {hint ? <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>{hint}</Text> : null}
      </View>
      <Pressable onPress={() => onChange(!value)} hitSlop={8} style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: value ? withAlpha(colors.primary, 0.5) : withAlpha(colors.outline, 0.4), justifyContent: 'center', paddingHorizontal: 3 }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: value ? colors.primary : colors.surfaceVariant, alignSelf: value ? 'flex-end' : 'flex-start' }} />
      </Pressable>
    </View>
  );
}

export function SegmentedField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { key: string; label: string }[] }) {
  const { colors } = useTheme();
  return (
    <View>
      <SectionLabel text={label} />
      <Spacer h={8} />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const active = value === o.key;
          return (
            <Pressable key={o.key} onPress={() => onChange(o.key)} style={({ pressed }) => [s.choice, { borderColor: active ? colors.primary : withAlpha(colors.outline, 0.3), backgroundColor: active ? withAlpha(colors.primary, 0.14) : withAlpha(colors.surfaceVariant, 0.4), opacity: pressed ? 0.8 : 1 }]}>
              <Text style={{ color: active ? colors.primary : colors.onSurface, ...typography.labelMedium }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  choice: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  customBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  applyBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
});
