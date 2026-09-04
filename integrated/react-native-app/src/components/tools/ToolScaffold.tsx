// ToolScaffold — غلاف موحّد لصفحات الأدوات (رأس + تراجع + تمرير).
import React from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha } from '../../theme/colors';
import { IconButton } from '../primitives';

export function ToolScaffold({
  title,
  subtitle,
  accent,
  onBack,
  actionIcon,
  onAction,
  actionLabel,
  children,
  Footer,
}: {
  title: string;
  subtitle?: string;
  accent: string;
  onBack?: () => void;
  actionIcon?: keyof typeof MaterialIcons.glyphMap;
  onAction?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
  Footer?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <View style={[s.header, { borderBottomColor: withAlpha(accent, 0.25), paddingTop: (insets.top > 0 ? insets.top : 0) + 12 }]}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.6 : 1 }]} accessibilityLabel="رجوع">
            <MaterialIcons name="arrow-back" size={24} color={accent} />
          </Pressable>
        ) : (
          <View style={{ padding: 6 }}>
            <MaterialIcons name="auto-awesome" size={24} color={accent} />
          </View>
        )}
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <Text style={{ color: colors.onBackground, ...typography.titleMedium, fontWeight: FontWeights.bold }} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actionIcon ? (
          <IconButton icon={actionIcon} onPress={() => onAction?.()} color={accent} label={actionLabel ?? 'إجراء'} />
        ) : null}
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: Footer ? 110 : 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {Footer ? <View style={[s.footer, { backgroundColor: withAlpha(colors.surface, 0.98), borderTopColor: withAlpha(colors.outline, 0.25) }]}>{Footer}</View> : null}
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
});
