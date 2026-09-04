// الملف الشخصي — تحرير بيانات المستخدم (هوية الوكيل الشخصية).
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAgentStore } from '../../store/agentStore';
import { GlassCard } from '../../components/GlassComponents';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha, CyanNeon } from '../../theme/colors';
import { Spacer, Divider, TextButton } from '../../components/primitives';
import { SectionScaffold } from './SectionScaffold';

export function ProfileSection({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const profile = useAgentStore((s) => s.uiState.userProfile);
  const updateUserProfile = useAgentStore((s) => s.updateUserProfile);

  const [name, setName] = useState(profile.name ?? '');
  const [country, setCountry] = useState(profile.country ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [jobTitle, setJobTitle] = useState(profile.jobTitle ?? '');
  const [field, setField] = useState(profile.field ?? '');
  const [specialization, setSpecialization] = useState(profile.specialization ?? '');
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel ?? '');
  const [primaryGoal, setPrimaryGoal] = useState(profile.primaryGoal ?? '');
  const [language, setLanguage] = useState(profile.language ?? 'ar');

  function saveAll() {
    updateUserProfile({
      ...profile,
      name: name.trim(),
      country: country.trim(),
      city: city.trim(),
      jobTitle: jobTitle.trim(),
      field: field.trim(),
      specialization: specialization.trim(),
      experienceLevel: experienceLevel.trim(),
      primaryGoal: primaryGoal.trim(),
      language,
      updatedAt: Date.now(),
    });
  }

  const changed =
    name !== (profile.name ?? '') ||
    country !== (profile.country ?? '') ||
    city !== (profile.city ?? '') ||
    jobTitle !== (profile.jobTitle ?? '') ||
    field !== (profile.field ?? '') ||
    specialization !== (profile.specialization ?? '') ||
    experienceLevel !== (profile.experienceLevel ?? '') ||
    primaryGoal !== (profile.primaryGoal ?? '') ||
    language !== (profile.language ?? 'ar');

  return (
    <SectionScaffold title="الملف الشخصي" subtitle="عرّف الوكيل على هويتك وخبرتك" onBack={onBack}>
      <GlassCard style={{ alignItems: 'center', paddingVertical: 24 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: withAlpha(CyanNeon, 0.2), alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="person" size={40} color={CyanNeon} />
        </View>
        <Spacer h={8} />
        <Text style={{ color: colors.onSurface, ...typography.titleMedium, fontWeight: FontWeights.bold }}>{name.trim() || 'زرك الخاص'}</Text>
        <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>{jobTitle.trim() || 'صاحب هذا الوكيل'}</Text>
      </GlassCard>

      <Spacer h={10} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.labelMedium }}>الاسم</Text>
      <Field icon="badge" value={name} onChange={setName} placeholder="الاسم الكامل" colors={colors} />
      <Spacer h={10} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.labelMedium }}>الدولة</Text>
      <Field icon="public" value={country} onChange={setCountry} placeholder="مثال: اليمن" colors={colors} />
      <Spacer h={10} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.labelMedium }}>المدينة</Text>
      <Field icon="location-city" value={city} onChange={setCity} placeholder="مثال: صنعاء" colors={colors} />
      <Spacer h={10} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.labelMedium }}>المسمى الوظيفي</Text>
      <Field icon="work" value={jobTitle} onChange={setJobTitle} placeholder="مثال: مهندس ومطور برمجيات" colors={colors} />
      <Spacer h={10} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.labelMedium }}>المجال العام</Text>
      <Field icon="domain" value={field} onChange={setField} placeholder="مثال: الهندسة وتطوير الأنظمة" colors={colors} />
      <Spacer h={10} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.labelMedium }}>التخصص الدقيق</Text>
      <Field icon="memory" value={specialization} onChange={setSpecialization} placeholder="مثال: هندسة البرمجيات والذكاء الاصطناعي" colors={colors} />
      <Spacer h={10} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.labelMedium }}>مستوى الخبرة</Text>
      <Field icon="trending-up" value={experienceLevel} onChange={setExperienceLevel} placeholder="مثال: خبير / مهندس رئيسي" colors={colors} />
      <Spacer h={10} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.labelMedium }}>الهدف الأساسي</Text>
      <Field icon="flag" value={primaryGoal} onChange={setPrimaryGoal} placeholder="ما الذي يريد الوكيل أن يحققه لك؟" colors={colors} />

      <Spacer h={14} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.labelMedium }}>لغة الواجهة</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        {[
          { code: 'ar', label: 'العربية' },
          { code: 'en', label: 'English' },
        ].map((lang) => (
          <Pressable key={lang.code} onPress={() => setLanguage(lang.code)} style={[s.langChip, { borderColor: language === lang.code ? CyanNeon : withAlpha(colors.outline, 0.3), backgroundColor: language === lang.code ? withAlpha(CyanNeon, 0.15) : withAlpha(colors.surfaceVariant, 0.4) }]}>
            <Text style={{ color: language === lang.code ? CyanNeon : colors.onSurfaceVariant, ...typography.labelMedium }}>{lang.label}</Text>
          </Pressable>
        ))}
      </View>

      <Spacer h={18} />
      <Divider />
      <Spacer h={12} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <TextButton label={changed ? 'حفظ التغييرات' : 'لا توجد تغييرات'} onPress={saveAll} color={CyanNeon} />
      </View>
    </SectionScaffold>
  );
}

function Field({ icon, value, onChange, placeholder, colors }: any) {
  return (
    <View style={[s.field, { borderColor: withAlpha(colors.outline, 0.35), backgroundColor: withAlpha(colors.surfaceVariant, 0.35) }]}>
      <MaterialIcons name={icon} size={18} color={colors.onSurfaceVariant} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        style={{ flex: 1, color: colors.onBackground, ...typography.bodyMedium }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 6 },
  langChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
});
