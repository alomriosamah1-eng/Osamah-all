// غلاف مشترك لصفحات الإدارات الفرعية في الإعدادات (رأس بعودة + تمرير).
import React from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha } from '../../theme/colors';

export function SectionScaffold({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <View style={[s.header, { borderBottomColor: withAlpha(colors.outline, 0.2) }]}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.6 : 1 }]}
          accessibilityLabel="رجوع"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
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
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});
