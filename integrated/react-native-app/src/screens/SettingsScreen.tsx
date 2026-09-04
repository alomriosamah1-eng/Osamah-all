// SettingsScreen — لوحة تحكم مركزي: توزَّع الوظائف على 6 إدارات مستقلة،
// تفتح كل منها في صفحة مستقلة (بعد عدم وجود stack تنقل، إدارة تنقل داخلي).
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { typography, FontWeights } from '../theme/typography';
import { withAlpha, CyanNeon, ElectricBlue, DeepViolet, Amber, Green } from '../theme/colors';
import { Spacer, Divider } from '../components/primitives';
import { ConnectionControlSection } from './settings/ConnectionControlSection';
import { SecondBrainSection } from './settings/SecondBrainSection';
import { ProfileSection } from './settings/ProfileSection';
import { ChatSettingsSection } from './settings/ChatSettingsSection';
import { AppearanceSection } from './settings/AppearanceSection';
import { AboutSection } from './settings/AboutSection';

type SectionKey = 'control' | 'knowledge' | 'profile' | 'chat' | 'appearance' | 'about';

interface AdminMeta {
  key: SectionKey;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

const ADMINS: AdminMeta[] = [
  { key: 'control', title: 'مركز التحكم والاتصال', subtitle: 'الخادم، النماذج، وتوجيه المهام الذكية', icon: 'tune', color: CyanNeon },
  { key: 'knowledge', title: 'العقل الثاني والمعرفة', subtitle: 'الذاكرة الانتقائية وإدارة المعرفة', icon: 'psychology', color: DeepViolet },
  { key: 'profile', title: 'الملف الشخصي', subtitle: 'هوية المستخدم وخبرته وأهدافه', icon: 'person', color: Amber },
  { key: 'chat', title: 'إعدادات المحادثة', subtitle: 'كرة المحادثة والمحرك الصوتي والنبرة', icon: 'chat-bubble', color: ElectricBlue },
  { key: 'appearance', title: 'تخصيص التطبيق', subtitle: 'المظهر ولغة الواجهة', icon: 'palette', color: Green },
  { key: 'about', title: 'عن التطبيق', subtitle: 'الهوية والإصدار والمطور', icon: 'info', color: '#FF6384' },
];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topSafeArea = insets.top > 0 ? insets.top + 8 : 16;
  const { colors } = useTheme();
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);

  if (activeSection === 'control') return <ConnectionControlSection onBack={() => setActiveSection(null)} />;
  if (activeSection === 'knowledge') return <SecondBrainSection onBack={() => setActiveSection(null)} />;
  if (activeSection === 'profile') return <ProfileSection onBack={() => setActiveSection(null)} />;
  if (activeSection === 'chat') return <ChatSettingsSection onBack={() => setActiveSection(null)} />;
  if (activeSection === 'appearance') return <AppearanceSection onBack={() => setActiveSection(null)} />;
  if (activeSection === 'about') return <AboutSection onBack={() => setActiveSection(null)} />;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: topSafeArea, paddingBottom: 120 }}>
      <View>
        <Text style={{ color: colors.onSurface, ...typography.titleLarge, fontWeight: FontWeights.bold }}>الإعدادات</Text>
        <Text style={{ color: colors.onSurfaceVariant, ...typography.bodyMedium }}>لوحة تحكم مقسّمة إلى إدارات مستقلة</Text>
      </View>
      <Spacer h={18} />
      <Divider />
      <Spacer h={16} />

      <View style={{ gap: 12 }}>
        {ADMINS.map((admin) => (
          <Pressable
            key={admin.key}
            onPress={() => setActiveSection(admin.key)}
            style={({ pressed }) => [
              s.adminCard,
              { borderColor: withAlpha(admin.color, 0.35), backgroundColor: withAlpha(colors.surfaceVariant, 0.4), opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={[s.iconWrap, { backgroundColor: withAlpha(admin.color, 0.16) }]}>
              <MaterialIcons name={admin.icon} size={24} color={admin.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.onSurface, ...typography.titleSmall, fontWeight: FontWeights.bold }}>{admin.title}</Text>
              <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }} numberOfLines={1}>{admin.subtitle}</Text>
            </View>
            <MaterialIcons name="chevron-left" size={24} color={colors.onSurfaceVariant} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
