// العقل الثاني والمعرفة — الذاكرة الانتقائية طويلة المدى وإدارة المعرفة.
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAgentStore } from '../../store/agentStore';
import { GlassCard } from '../../components/GlassComponents';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha, DeepViolet, Amber, Green } from '../../theme/colors';
import { Spacer, Divider, TextButton } from '../../components/primitives';
import { SectionScaffold } from './SectionScaffold';

const CATEGORY_LABELS: Record<string, string> = {
  preference: 'تفضيل',
  project: 'مشروع',
  fact: 'معلومة',
  rule: 'قاعدة',
  custom: 'مخصص',
};

const CATEGORY_OPTIONS: { key: string; label: string }[] = [
  { key: 'preference', label: 'تفضيل' },
  { key: 'project', label: 'مشروع' },
  { key: 'fact', label: 'معلومة' },
  { key: 'rule', label: 'قاعدة' },
  { key: 'custom', label: 'مخصص' },
];

export function SecondBrainSection({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const memories = useAgentStore((s) => s.memories);
  const addMemory = useAgentStore((s) => s.addMemory);
  const deleteMemory = useAgentStore((s) => s.deleteMemory);
  const clearAllMemories = useAgentStore((s) => s.clearAllMemories);

  const [showAdd, setShowAdd] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const [draftValue, setDraftValue] = useState('');
  const [draftCategory, setDraftCategory] = useState('custom');
  const [selectedTab, setSelectedTab] = useState<string>('all');

  const tabs = ['all', ...Object.keys(CATEGORY_LABELS)];
  const filtered = selectedTab === 'all' ? memories : memories.filter((m) => m.category === selectedTab);

  function saveDraft() {
    const key = draftKey.trim();
    const value = draftValue.trim();
    if (!key || !value) return;
    addMemory(key || 'ذِكر', value);
    setDraftKey('');
    setDraftValue('');
    setDraftCategory('custom');
    setShowAdd(false);
  }

  return (
    <SectionScaffold title="العقل الثاني والمعرفة" subtitle="الذاكرة الانتقائية والإدارة الذكية للمعرفة" onBack={onBack}>
      <GlassCard style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.onSurface, ...typography.titleSmall, fontWeight: FontWeights.bold }}>الذاكرة الانتقائية طويلة المدى</Text>
            <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>
              ما يتذكره الوكيل عنك محلياً ({memories.length} عنصر)؛ يُغذّى منه سياق الردود.
            </Text>
          </View>
          <SwitchPill active={memories.length > 0} />
        </View>
      </GlassCard>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <TabChip active={selectedTab === 'all'} label="الكل" color={Amber} onPress={() => setSelectedTab('all')} />
        {CATEGORY_OPTIONS.map((c) => (
          <TabChip key={c.key} active={selectedTab === c.key} label={c.label} color={DeepViolet} onPress={() => setSelectedTab(c.key)} />
        ))}
      </View>

      <View style={{ gap: 8 }}>
        {filtered.length === 0 && (
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall, textAlign: 'center' }}>
            لا توجد ذكريات في هذه الفئة.
          </Text>
        )}
        {filtered.map((memory) => (
          <GlassCard key={memory.id} style={{ paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <MaterialIcons name="lightbulb-outline" size={18} color={Amber} style={{ marginTop: 2, marginEnd: 8 }} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: colors.primary, ...typography.labelMedium, fontWeight: FontWeights.bold }}>{memory.key}</Text>
                  <Badge label={CATEGORY_LABELS[memory.category] ?? 'مخصص'} />
                  {Array.from({ length: memory.importance ?? 1 }).map((_, i) => (
                    <MaterialIcons key={i} name="star" size={11} color={Amber} />
                  ))}
                </View>
                <Spacer h={4} />
                <Text style={{ color: colors.onSurface, ...typography.bodyMedium }}>{memory.value}</Text>
                <Spacer h={6} />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <Pressable
                    onPress={() => {
                      Alert.alert('حذف الذاكرة', `هل تريد حذف «${memory.key}» نهائيًا؟`, [
                        { text: 'إلغاء', style: 'cancel' },
                        { text: 'حذف', style: 'destructive', onPress: () => deleteMemory(memory.id) },
                      ]);
                    }}
                    hitSlop={8}
                  >
                    <MaterialIcons name="delete-outline" size={18} color={colors.onSurfaceVariant} />
                  </Pressable>
                </View>
              </View>
            </View>
          </GlassCard>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Pressable onPress={() => setShowAdd(true)} style={[s.actionBtn, { borderColor: DeepViolet, backgroundColor: withAlpha(DeepViolet, 0.14) }]}>
          <MaterialIcons name="add" size={18} color={DeepViolet} />
          <Text style={{ color: DeepViolet, ...typography.labelLarge, fontWeight: FontWeights.bold }}>إضافة معلومة</Text>
        </Pressable>
        {memories.length > 0 && (
          <Pressable
            onPress={() => {
              Alert.alert('مسح الذاكرة', 'هل تريد مسح كل الذكريات المحفوظة؟', [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'مسح الكل', style: 'destructive', onPress: clearAllMemories },
              ]);
            }}
            style={[s.actionBtn, { borderColor: 'rgba(255,99,132,0.6)', backgroundColor: 'rgba(255,99,132,0.12)' }]}
          >
            <MaterialIcons name="delete-sweep" size={18} color="#FF6384" />
            <Text style={{ color: '#FF6384', ...typography.labelLarge, fontWeight: FontWeights.bold }}>مسح الكل</Text>
          </Pressable>
        )}
      </View>

      <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surface, borderColor: withAlpha(colors.outline, 0.3) }]}>
            <Text style={{ color: colors.onBackground, ...typography.titleMedium, fontWeight: FontWeights.bold }}>إضافة معلومة للذاكرة</Text>
            <Spacer h={6} />
            <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>اكتب معلومة مهمة يحفظها الوكيل ويعتمد عليها مستقبلاً.</Text>
            <Spacer h={12} />
            <TextInput
              value={draftKey}
              onChangeText={setDraftKey}
              placeholder="الموضوع (مثال: نبرة الرد)"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[s.draftInput, { borderColor: withAlpha(colors.outline, 0.3), color: colors.onBackground, ...typography.bodyMedium }]}
            />
            <Spacer h={8} />
            <TextInput
              value={draftValue}
              onChangeText={setDraftValue}
              multiline
              placeholder="المحتوى (مثال: استخدم نبرة ودودة ومشجعة)"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[s.draftInput, { borderColor: withAlpha(colors.outline, 0.3), color: colors.onBackground, ...typography.bodyMedium, minHeight: 70 }]}
            />
            <Spacer h={12} />
            <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>الفئة:</Text>
            <Spacer h={6} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORY_OPTIONS.map((c) => (
                <Pressable key={c.key} onPress={() => setDraftCategory(c.key)} style={[s.typeChip, { borderColor: draftCategory === c.key ? DeepViolet : withAlpha(colors.outline, 0.3), backgroundColor: draftCategory === c.key ? withAlpha(DeepViolet, 0.15) : withAlpha(colors.surfaceVariant, 0.4) }]}>
                  <Text style={{ color: draftCategory === c.key ? DeepViolet : colors.onSurfaceVariant, ...typography.labelMedium }}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
            <Spacer h={14} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TextButton label="إلغاء" onPress={() => setShowAdd(false)} />
              <TextButton label="حفظ" onPress={saveDraft} color={DeepViolet} />
            </View>
          </View>
        </View>
      </Modal>
      <Spacer h={20} />
      <Divider />
      <Spacer h={10} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall, lineHeight: 20 }}>
        تُخزَّن هذه الذكريات محلياً ومشفّرة عبر AgentRepository، ويُدمج أبرزها في سياق الوكيل عند الرد لتحقيق استمرارية شخصية دون حفظ المحادثات الكاملة.
      </Text>
    </SectionScaffold>
  );
}

function TabChip({ active, label, color, onPress }: { active: boolean; label: string; color: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[s.filterChip, { borderColor: active ? color : withAlpha(colors.outline, 0.3), backgroundColor: active ? withAlpha(color, 0.15) : withAlpha(colors.surfaceVariant, 0.4) }]}>
      <Text style={{ color: active ? color : colors.onSurfaceVariant, ...typography.labelMedium }}>{label}</Text>
    </Pressable>
  );
}

function Badge({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: withAlpha(Green, 0.18) }}>
      <Text style={{ color: Green, ...typography.labelSmall }}>{label}</Text>
    </View>
  );
}

function SwitchPill({ active }: { active: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: 42, height: 24, borderRadius: 12, backgroundColor: active ? withAlpha(Amber, 0.5) : withAlpha(colors.outline, 0.4), justifyContent: 'center', paddingHorizontal: 3 }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: active ? Amber : colors.surfaceVariant, alignSelf: active ? 'flex-end' : 'flex-start' }} />
    </View>
  );
}

const s = StyleSheet.create({
  filterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
  draftInput: { borderRadius: 12, borderWidth: 1, padding: 12, textAlignVertical: 'top' },
  typeChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
});
