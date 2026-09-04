// تخصيص التطبيق — المظهر ولغة الواجهة (لا صناديق/مفاتيح وهمية؛ فقط ما هو مدعوم فعلاً).
import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAgentStore } from '../../store/agentStore';
import { GlassCard } from '../../components/GlassComponents';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha, CyanNeon } from '../../theme/colors';
import { Spacer, Divider } from '../../components/primitives';
import { SectionScaffold } from './SectionScaffold';

export function AppearanceSection({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const profile = useAgentStore((s) => s.uiState.userProfile);
  const updateUserProfile = useAgentStore((s) => s.updateUserProfile);
  const currentLang = profile.language ?? 'ar';

  function setLanguage(lang: string) {
    updateUserProfile({ ...profile, language: lang, updatedAt: Date.now() });
  }

  return (
    <SectionScaffold title="تخصيص التطبيق" subtitle="المظهر ولغة الواجهة" onBack={onBack}>
      {/* المظهر — وصف لتوجه التصميم الحالي دون مفاتيح وهمية */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.onSurface, ...typography.titleSmall, fontWeight: FontWeights.bold }}>مظهر التطبيق</Text>
        <Spacer h={8} />
        <View style={[s.themeRow, { backgroundColor: withAlpha(colors.surfaceVariant, 0.5), borderColor: withAlpha(colors.outline, 0.3) }]}>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: withAlpha(CyanNeon, 0.2), alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="dark-mode" size={20} color={CyanNeon} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.onSurface, ...typography.bodyMedium, fontWeight: FontWeights.semiBold }}>الوضع الليلي (Dark) — مفعّل</Text>
            <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>
              يعتمد التطبيق على موضوع داكن عصري بألوان النيون، وهو توجّه التصميم الحالي للوكيل.
            </Text>
          </View>
        </View>
        <Spacer h={10} />
        <View style={[s.themeRow, { backgroundColor: withAlpha(colors.surfaceVariant, 0.25), borderColor: withAlpha(colors.outline, 0.2) }]}>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: withAlpha('#FFD54F', 0.15), alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="light-mode" size={20} color="#FFD54F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.onSurfaceVariant, ...typography.bodyMedium }}>الوضع الفاتح (Light)</Text>
            <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>غير متاح في هذا الإصدار مبدئياً (موضوع الوكيل داكن بطبيعته).</Text>
          </View>
          <MaterialIcons name="lock-outline" size={18} color={colors.onSurfaceVariant} />
        </View>
      </GlassCard>

      {/* لغة الواجهة — مرتبطة فعلياً بهوية المستخدم */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.onSurface, ...typography.titleSmall, fontWeight: FontWeights.bold }}>لغة الواجهة والردود</Text>
        <Spacer h={10} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { code: 'ar', label: 'العربية', icon: 'translate' as const },
            { code: 'en', label: 'English', icon: 'translate' as const },
          ].map((lang) => {
            const active = currentLang === lang.code;
            return (
              <Pressable key={lang.code} onPress={() => setLanguage(lang.code)} style={[s.langChip, { borderColor: active ? CyanNeon : withAlpha(colors.outline, 0.3), backgroundColor: active ? withAlpha(CyanNeon, 0.15) : withAlpha(colors.surfaceVariant, 0.4) }]}>
                <MaterialIcons name={lang.icon} size={16} color={active ? CyanNeon : colors.onSurfaceVariant} />
                <Text style={{ marginStart: 6, color: active ? CyanNeon : colors.onSurfaceVariant, ...typography.labelMedium }}>{lang.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </GlassCard>

      <Divider />
      <Spacer h={10} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall, lineHeight: 20 }}>
        تُدار إعدادات العرض مثل حجم الخط وعناصر الواجهة عبر هذا القسم عند توفرها؛ ويتولى التطبيق حالياً تنسيقاً موحّداً للأنماط والمسافات (spacing/radius/typography) عبر نظام الثيم المركزي.
      </Text>
    </SectionScaffold>
  );
}

const s = StyleSheet.create({
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  langChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
});
