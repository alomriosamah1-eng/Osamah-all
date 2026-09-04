// MindMapToolScreen — الخرائط الذهنية: توليد حقيقي عبر الوكيل + محرر بنية عقد بسيط + سجل.
import React, { useState } from 'react';
import { Text, View, Pressable, TextInput } from 'react-native';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha } from '../../theme/colors';
import { Spacer, ThemedField } from '../../components/primitives';
import { ToolScaffold } from '../../components/tools/ToolScaffold';
import { SectionLabel, LanguageSelector, SegmentedField } from '../../components/tools/Selectors';
import { HistoryCard, EmptyState } from '../../components/tools/Feedback';
import { RunSection } from '../../components/tools/RunSection';
import { useToolsStore } from '../toolsStore';
import { buildMindMapPrompt, executeToolRun } from '../run';
import { useAgentStore } from '../../store/agentStore';
import { AdvancedOptions } from '../../components/tools/Selectors';

export function MindMapToolScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const cfg = useToolsStore((s) => s.mindmap);
  const setCfg = useToolsStore((s) => s.setMindmap);
  const isSending = useAgentStore((s) => s.isSending);
  const tasks = useAgentStore((s) => s.tasks);

  const [branchInput, setBranchInput] = useState('');
  const [branches, setBranches] = useState<string[]>([]);

  const canCreate = cfg.topic.trim().length > 0 && !isSending;
  const steps = [
    { key: 'analysis', label: 'تحليل المفهوم المركزي', detail: cfg.topic.slice(0, 40) || 'الموضوع', icon: 'search' as const },
    { key: 'structure', label: 'بناء هيكل الفروع', detail: `أسلوب ${cfg.style === 'tree' ? 'شجرة' : cfg.style === 'radial' ? 'شعاعي' : 'تدفق'}`, icon: 'account-tree' as const },
    { key: 'rendering', label: 'معالجة العلاقات', detail: 'كلمات مفتاحية وعلاقات بين المفاهيم', icon: 'hub' as const },
    { key: 'saving', label: 'حفظ الخريطة', detail: 'في قاعدة المهام', icon: 'save' as const },
  ];

  async function create() {
    if (!canCreate) return;
    await executeToolRun('mindmap', cfg.topic.trim(), buildMindMapPrompt(cfg));
  }

  function addBranch() {
    const b = branchInput.trim();
    if (!b) return;
    setBranches((prev) => [...prev, b]);
    setBranchInput('');
  }

  const mapTasks = tasks.filter((t) => t.title.toLowerCase().includes('خريطة'));
  const history =
    mapTasks.length > 0 ? (
      <View style={{ gap: 10 }}>
        {mapTasks.slice(0, 15).map((t) => (
          <HistoryCard key={t.id} title={t.title} subtitle={t.goal} meta={`${t.status} • ${t.id}`} icon="account-tree" accent={colors.secondary} chevron={false} />
        ))}
      </View>
    ) : (
      <EmptyState icon="account-tree" title="لا توجد خرائط بعد" hint="أنشئ خريطة سترى هيكلها هنا." />
    );

  return (
    <ToolScaffold title="الخرائط الذهنية" subtitle="توليد حقيقي + محرر بنية" accent={colors.secondary} onBack={onBack}>
      <SectionLabel text="المفهوم المركزي" hint="مطلوب" />
      <Spacer h={8} />
      <View style={{ borderWidth: 1, borderColor: withAlpha(colors.outline, 0.3), borderRadius: 12, paddingHorizontal: 12, backgroundColor: withAlpha(colors.surfaceVariant, 0.4) }}>
        <ThemedField value={cfg.topic} onChangeText={(t) => setCfg({ topic: t })} placeholder="مثال: الذكاء الاصطناعي" />
      </View>

      <Spacer h={16} />
      <SectionLabel text="اللغة" />
      <Spacer h={8} />
      <LanguageSelector value={cfg.language} onChange={(l) => setCfg({ language: l })} />

      <Spacer h={16} />
      <SegmentedField
        label="أسلوب الخريطة"
        value={cfg.style}
        onChange={(v) => setCfg({ style: v as 'tree' | 'radial' | 'flow' })}
        options={[
          { key: 'tree', label: 'شجرة' },
          { key: 'radial', label: 'شعاعي' },
          { key: 'flow', label: 'تدفق' },
        ]}
      />

      <Spacer h={18} />
      {!isSending && (
        <View style={{ borderRadius: 16, backgroundColor: colors.secondary, paddingVertical: 14, alignItems: 'center' }}>
          <Text onPress={create} style={{ color: '#FFFFFF', ...typography.titleSmall, fontWeight: FontWeights.bold }}>
            توليد الخريطة الذهنية
          </Text>
        </View>
      )}

      <Spacer h={16} />
      <RunSection
        tool="mindmap"
        accent={colors.secondary}
        steps={steps}
        resultTitle="اكتمل توليد الخريطة"
        resultSubtitle={cfg.topic}
        resultIcon="account-tree"
        resultActions={[
          { label: 'خريطة جديدة', icon: 'add', onPress: () => useToolsStore.setState({ run: { tool: 'mindmap', title: '', status: 'idle', startedAt: 0 } }) },
        ]}
        onReset={() => useToolsStore.setState({ run: { tool: 'mindmap', title: '', status: 'idle', startedAt: 0 } })}
        history={history}
      />

      {/* محرر بنية بسيط */}
      <Spacer h={20} />
      <AdvancedOptions title="محرر بنية العقد">
        <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall, marginBottom: 8 }}>
          أضف الفروع الرئيسية يدويًا لتخصيص شكل الخريطة (تظهر حول المفهوم المركزي).
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, borderWidth: 1, borderColor: withAlpha(colors.outline, 0.3), borderRadius: 10, paddingHorizontal: 10, backgroundColor: withAlpha(colors.surfaceVariant, 0.4) }}>
            <TextInput value={branchInput} onChangeText={setBranchInput} onSubmitEditing={addBranch} placeholder="اسم الفرع" placeholderTextColor={colors.onSurfaceVariant} style={{ color: colors.onBackground, ...typography.bodyMedium, paddingVertical: 8 }} />
          </View>
          <Pressable onPress={addBranch} style={({ pressed }) => [{ borderRadius: 10, backgroundColor: colors.secondary, paddingHorizontal: 14, paddingVertical: 10, opacity: pressed ? 0.8 : 1 }]}>
            <Text style={{ color: '#FFF', ...typography.labelMedium, fontWeight: FontWeights.bold }}>إضافة</Text>
          </Pressable>
        </View>
        {branches.length > 0 ? (
          <View style={{ marginTop: 10, gap: 8 }}>
            {branches.map((b, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: withAlpha(colors.secondary, 0.4), paddingHorizontal: 12, paddingVertical: 8, backgroundColor: withAlpha(colors.secondary, 0.08) }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.secondary, marginEnd: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFF', ...typography.labelSmall }}>{i + 1}</Text>
                </View>
                <Text style={{ color: colors.onSurface, ...typography.bodyMedium, flex: 1 }}>{b}</Text>
                <Pressable onPress={() => setBranches((prev) => prev.filter((_, ix) => ix !== i))} hitSlop={8}>
                  <Text style={{ color: colors.onSurfaceVariant, ...typography.labelLarge }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </AdvancedOptions>
    </ToolScaffold>
  );
}
