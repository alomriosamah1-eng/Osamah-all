// PresentationsScreen — منقولة من ui/screens/PresentationsScreen.kt
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useAgentStore } from '../store/agentStore';
import { PresentationEntity } from '../data/types';
import { useTheme } from '../theme/theme';
import { typography, FontWeights } from '../theme/typography';
import { withAlpha, CyanNeon } from '../theme/colors';
import { GlassCard } from '../components/GlassComponents';
import { Spacer, FilledButton, OutlinedButton, TextButton, Chip, ThemedField, IconButton } from '../components/primitives';

const FIXED_POINTS = [
  'الركيزة الأولى: التخطيط الذكي وتفكيك المهام',
  'الركيزة الثانية: التحقق والقياس المستمر لمؤشرات الجودة',
  'الركيزة الثالثة: التوافق مع متطلبات الخصوصية والأداء الخفيف',
];

export function PresentationsScreen() {
  const insets = useSafeAreaInsets();
  const topSafeArea = insets.top > 0 ? insets.top + 8 : 16;
  const { colors } = useTheme();
  const presentations = useAgentStore((s) => s.presentations);
  const sendUserMessage = useAgentStore((s) => s.sendUserMessage);
  const selectTab = useAgentStore((s) => s.selectTab);
  const createPresentation = useAgentStore((s) => s.createPresentation);

  const [selected, setSelected] = useState<PresentationEntity | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [newTopic, setNewTopic] = useState('');
  const [newSlideCount, setNewSlideCount] = useState(8);

  useEffect(() => {
    if (!selected && presentations.length > 0) {
      setSelected(presentations[0]);
    }
  }, [presentations]);

  const pres = selected;

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: topSafeArea, paddingBottom: 80 }}>
      {/* Header */}
      <View style={s.headerRow}>
        <View>
          <Text style={{ color: colors.onBackground, ...typography.titleLarge, fontWeight: FontWeights.bold }}>
            استوديو العروض التقديمية
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>
            توليد وتنسيق العروض التفاعلية وتصديرها
          </Text>
        </View>
        <FilledButton label="عرض جديد" icon="add" onPress={() => setShowCreate(true)} />
      </View>

      {/* Horizontal Presentation Selector */}
      {presentations.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
          {presentations.map((p) => (
            <Chip
              key={p.id}
              label={p.title.slice(0, 20)}
              selected={selected?.id === p.id}
              onPress={() => {
                setSelected(p);
                setCurrentSlideIndex(0);
              }}
            />
          ))}
        </ScrollView>
      )}

      {/* Active Slide Deck Viewer */}
      {pres ? (
        <GlassCard style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            {/* Slide Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ borderRadius: 8, backgroundColor: withAlpha(colors.primaryContainer, 0.5), paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: colors.primary, ...typography.labelSmall }}>
                  شريحة {currentSlideIndex + 1} من {pres.slidesCount}
                </Text>
              </View>
              <IconButton
                icon="picture-as-pdf"
                onPress={() => {
                  sendUserMessage(`أنشئ ملف PDF لعرض: ${pres.title}`);
                  selectTab('archive');
                }}
                color={colors.primary}
                label="تصدير PDF"
              />
            </View>

            <Spacer h={14} />

            <Text style={{ color: colors.onSurface, ...typography.headlineSmall, fontWeight: FontWeights.bold }}>
              {currentSlideIndex === 0 ? pres.title : `المحور ${currentSlideIndex + 1}: ${pres.topic}`}
            </Text>
            <Spacer h={8} />
            <Text style={{ color: colors.onSurfaceVariant, ...typography.bodyMedium }}>
              المحتوى التفاعلي والدراسة التحليلية المعدة بواسطة وكيل أسامة لتغطية الأهداف ومؤشرات القياس الهندسية.
            </Text>
            <Spacer h={16} />

            {/* Bullet Points */}
            <View style={{ gap: 8, flex: 1 }}>
              {FIXED_POINTS.map((point, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                  <Spacer w={8} />
                  <Text style={{ color: colors.onSurface, ...typography.bodySmall }}>{point}</Text>
                </View>
              ))}
            </View>

            {/* Navigation Controls */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <OutlinedButton
                label="السابق"
                onPress={() => {
                  if (currentSlideIndex > 0) setCurrentSlideIndex(currentSlideIndex - 1);
                }}
                disabled={currentSlideIndex === 0}
              />
              <FilledButton
                label="التالي"
                onPress={() => {
                  if (currentSlideIndex < pres.slidesCount - 1) setCurrentSlideIndex(currentSlideIndex + 1);
                }}
                disabled={currentSlideIndex >= pres.slidesCount - 1}
              />
            </View>
          </View>
        </GlassCard>
      ) : (
        <GlassCard>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodyMedium }}>
            لا توجد عروض حالياً. انقر على "عرض جديد" لإنشاء عرض تقديمي ذكي فوراً.
          </Text>
        </GlassCard>
      )}

      {/* Create Presentation Modal */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surface, borderColor: withAlpha(colors.outline, 0.3) }]}>
            <Text style={{ color: colors.onBackground, ...typography.titleMedium, fontWeight: FontWeights.bold }}>
              إنشاء عرض تقديمي جديد
            </Text>
            <Spacer h={12} />
            <ThemedField
              value={newTopic}
              onChangeText={setNewTopic}
              placeholder="مثال: هندسة البرمجيات والذكاء الاصطناعي 2026"
              style={{ borderWidth: 1, borderColor: withAlpha(colors.outline, 0.3), borderRadius: 10, paddingHorizontal: 12 }}
            />
            <Spacer h={8} />
            <Text style={{ color: newSlideCount >= 100 ? CyanNeon : colors.onSurface, ...typography.labelMedium }}>
              عدد الشرائح: {newSlideCount} شريحة {newSlideCount >= 100 ? '(عرض تقديمي ضخم ⚡)' : ''}
            </Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={4}
              maximumValue={120}
              step={1}
              value={8}
              onValueChange={(v) => setNewSlideCount(Math.round(v))}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={withAlpha(colors.outline, 0.4)}
              thumbTintColor={colors.primary}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TextButton label="إلغاء" onPress={() => setShowCreate(false)} />
              <FilledButton
                label="توليد العرض"
                onPress={() => {
                  if (newTopic.trim()) {
                    createPresentation(newTopic.trim(), newSlideCount);
                    setShowCreate(false);
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
});