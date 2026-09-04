// ColorPicker — لون محدد (Ubiquity) مع أقفال تباين (Accessibility) حسب المتغيرات المتاحة.
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha, CyanNeon, ElectricBlue, EmeraldGlow, AccentPurple, DeepViolet, MagentaGlow, Sky } from '../../theme/colors';
import { Spacer } from '../primitives';
import { SectionLabel } from './Selectors';

export const PALETTE = [
  { hex: CyanNeon, name: 'نيون سماوي' },
  { hex: ElectricBlue, name: 'أزرق' },
  { hex: EmeraldGlow, name: 'زمردي' },
  { hex: AccentPurple, name: 'بنفسجي' },
  { hex: DeepViolet, name: 'بنفسجي داكن' },
  { hex: '#F59E0B', name: 'كهرماني' },
  { hex: '#EF4444', name: 'أحمر' },
  { hex: MagentaGlow, name: 'وردي' },
  { hex: '#22C55E', name: 'أخضر' },
  { hex: Sky, name: 'سماوي فاتح' },
];

// تباين نص أسود/أبيض على خلفية لونية (قاعدة تبسيطية لنص عريض).
function bestReadable(hex: string): { fg: string; on: string } {
  const h = hex.replace('#', '');
  if (h.length !== 6) return { fg: '#FFFFFF', on: '#000000' };
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? { fg: '#000000', on: '#FFFFFF' } : { fg: '#FFFFFF', on: '#000000' };
}

export function isValidHex(color: string): boolean {
  return /^#([0-9A-Fa-f]{6})$/.test(color.trim());
}

export function ColorPicker({ value, onChange, label = 'اللون الرئيسي' }: { value: string; onChange: (c: string) => void; label?: string }) {
  const { colors } = useTheme();
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const contrast = bestReadable(value);

  const isCustom = !PALETTE.some((p) => p.hex.toLowerCase() === value.toLowerCase());

  function applyCustom() {
    if (isValidHex(custom)) {
      onChange(custom.trim());
      setShowCustom(false);
    }
  }

  return (
    <View>
      <SectionLabel text={label} hint="يُطبَّق على المخرجات" />
      <Spacer h={8} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {PALETTE.map((p) => {
          const active = value.toLowerCase() === p.hex.toLowerCase();
          return (
            <Pressable
              key={p.hex}
              onPress={() => onChange(p.hex)}
              accessibilityLabel={p.name}
              style={({ pressed }) => [
                { width: 36, height: 36, borderRadius: 18, backgroundColor: p.hex, borderWidth: 2, borderColor: active ? colors.primary : withAlpha(colors.outline, 0.4), opacity: pressed ? 0.8 : 1, alignItems: 'center', justifyContent: 'center' },
              ]}
            >
              {active ? <Text style={{ color: bestReadable(p.hex).fg, ...typography.labelMedium, fontWeight: FontWeights.bold }}>✓</Text> : null}
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setShowCustom((v) => !v)}
          style={({ pressed }) => [
            { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: isCustom ? colors.primary : withAlpha(colors.outline, 0.5), alignItems: 'center', justifyContent: 'center', backgroundColor: isCustom ? value : undefined, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={{ color: isCustom ? bestReadable(value).fg : colors.onSurfaceVariant }}>+</Text>
        </Pressable>
      </View>
      {showCustom ? (
        <View style={[s.customRow, { borderColor: withAlpha(colors.primary, 0.4) }]}>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            placeholder="#RRGGBB"
            placeholderTextColor={colors.onSurfaceVariant}
            autoCapitalize="characters"
            style={{ flex: 1, color: colors.onBackground, ...typography.bodyMedium }}
          />
          <Pressable onPress={applyCustom} style={[s.applyBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#000', ...typography.labelMedium, fontWeight: FontWeights.bold }}>تطبيق</Text>
          </Pressable>
        </View>
      ) : null}
      <Spacer h={10} />
      {/* معاينة قابلة للقراءة */}
      <View style={{ borderRadius: 12, padding: 14, backgroundColor: value, alignItems: 'center' }}>
        <Text style={[typography.titleSmall, { color: contrast.fg, fontWeight: FontWeights.bold }]}>معاينة اللون المحدد</Text>
        <Text style={{ color: contrast.on, ...typography.labelSmall }}>{value.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  applyBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
});
