// ToolsHubScreen — مركز «الأدوات» مع بطاقات احترافية للأدوات الأربع + استوديو العروض الحالي (لا حذف وظيفة).
import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha, CyanNeon, ElectricBlue, EmeraldGlow, DeepViolet } from '../../theme/colors';
import { ToolCard } from '../../components/tools/Feedback';
import { PdfToolScreen } from './PdfToolScreen';
import { PresentationToolScreen } from './PresentationToolScreen';
import { LifeToolScreen } from './LifeToolScreen';
import { MindMapToolScreen } from './MindMapToolScreen';
import { PresentationsScreen } from '../../screens/PresentationsScreen';
import { Spacer } from '../../components/primitives';

type Mode = 'home' | 'pdf' | 'presentation' | 'life' | 'mindmap' | 'presStudio';

export function ToolsHubScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('home');

  if (mode === 'pdf') return <PdfToolScreen onBack={() => setMode('home')} />;
  if (mode === 'presentation') return <PresentationToolScreen onBack={() => setMode('home')} onOpenStudio={() => setMode('presStudio')} />;
  if (mode === 'life') return <LifeToolScreen onBack={() => setMode('home')} />;
  if (mode === 'mindmap') return <MindMapToolScreen onBack={() => setMode('home')} />;
  if (mode === 'presStudio') {
    return (
      <View style={{ flex: 1 }}>
        <Pressable onPress={() => setMode('home')} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: withAlpha(colors.outline, 0.25), opacity: pressed ? 0.7 : 1 }]} accessibilityLabel="رجوع إلى الأدوات">
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
          <Text style={{ color: colors.primary, ...typography.labelLarge, fontWeight: FontWeights.bold, marginStart: 8 }}>رجوع إلى الأدوات</Text>
        </Pressable>
        <PresentationsScreen />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top > 0 ? insets.top + 8 : 16, paddingBottom: 100 }}>
      <View style={s.headerRow}>
        <View>
          <Text style={{ color: colors.onBackground, ...typography.titleLarge, fontWeight: FontWeights.bold }}>الأدوات</Text>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>أدوات ذكية مدمجة مع وكيل أسامة</Text>
        </View>
      </View>

      <ToolCard
        title="صانع PDF"
        subtitle="تقرير/مستند احترافي يُنشأ من إعداداتك ويُحفظ كملف حقيقي"
        icon="picture-as-pdf"
        accent={CyanNeon}
        tag="PDF • حقيقي"
        onPress={() => setMode('pdf')}
      />
      <Spacer h={12} />
      <ToolCard
        title="صانع العروض"
        subtitle="عرض تقديمي بشرائح قابلة للتخصيص يُخزَّن في قاعدة البيانات"
        icon="slideshow"
        accent={ElectricBlue}
        tag="عروض"
        onPress={() => setMode('presentation')}
      />
      <Spacer h={12} />
      <ToolCard
        title="مخطط الحياة"
        subtitle="خطة عملية لهدفك مقسمة إلى مراحل وإجراءات من الوكيل"
        icon="flag"
        accent={EmeraldGlow}
        tag="خطط"
        onPress={() => setMode('life')}
      />
      <Spacer h={12} />
      <ToolCard
        title="الخرائط الذهنية"
        subtitle="خريطة مفاهيم حول موضوعك مع محرر بنية بسيط"
        icon="account-tree"
        accent={DeepViolet}
        tag="خرائط"
        onPress={() => setMode('mindmap')}
      />

      <Spacer h={20} />
      <View style={[s.studioCard, { borderColor: withAlpha(colors.primary, 0.35) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: withAlpha(colors.primary, 0.15), alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="view-carousel" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginStart: 12 }}>
            <Text style={{ color: colors.onBackground, ...typography.titleSmall, fontWeight: FontWeights.bold }}>استوديو العروض</Text>
            <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>عرض وتصفح العروض المحفوظة وشرائحها</Text>
          </View>
        </View>
        <Spacer h={10} />
        <Text onPress={() => setMode('presStudio')} style={{ color: colors.primary, ...typography.labelLarge, fontWeight: FontWeights.bold }}>
          فتح الاستوديو ←
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 16 },
  studioCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
});
