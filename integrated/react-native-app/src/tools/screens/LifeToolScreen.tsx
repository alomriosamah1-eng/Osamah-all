// LifeToolScreen — مخطط الحياة: طلب خطة حقيقية عبر وكيل أسامة (tool_task_planner) → خطوات مخطط لها في قاعدة المهام.
import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha } from '../../theme/colors';
import { Spacer, ThemedField } from '../../components/primitives';
import { ToolScaffold } from '../../components/tools/ToolScaffold';
import { SectionLabel, AdvancedOptions, SegmentedField } from '../../components/tools/Selectors';
import { SingleSelectGrid } from '../../components/tools/Selectors';
import { HistoryCard, EmptyState } from '../../components/tools/Feedback';
import { RunSection } from '../../components/tools/RunSection';
import { useToolsStore } from '../toolsStore';
import { buildLifePrompt, executeToolRun } from '../run';
import { useAgentStore } from '../../store/agentStore';
import { LIFE_AREAS } from '../options';

export function LifeToolScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const cfg = useToolsStore((s) => s.life);
  const setCfg = useToolsStore((s) => s.setLife);
  const isSending = useAgentStore((s) => s.isSending);
  const tasks = useAgentStore((s) => s.tasks);

  const canCreate = cfg.goal.trim().length > 0 && !isSending;
  const steps = [
    { key: 'analysis', label: 'تحليل الهدف والمجال', detail: LIFE_AREAS.find((a) => a.key === cfg.area)?.label, icon: 'search' as const },
    { key: 'planning', label: 'تقسيم الهدف إلى مراحل', detail: cfg.isLongTerm ? 'أفق طويل المدى' : 'أفق قصير/متوسط', icon: 'account-tree' as const },
    { key: 'organization', label: 'تحديد الإجراءات والمؤشرات', detail: 'إجراءات وعوائق ومؤشرات نجاح', icon: 'checklist' as const },
    { key: 'saving', label: 'حفظ الخطة كخطوات', detail: 'في قاعدة المهام والخطوات', icon: 'save' as const },
  ];

  async function create() {
    if (!canCreate) return;
    await executeToolRun('life', cfg.goal.trim(), buildLifePrompt(cfg));
  }

  const lifeTasks = tasks.filter((t) => t.title.toLowerCase().includes('خطة') || t.title.toLowerCase().includes('هدف'));
  const history =
    lifeTasks.length > 0 ? (
      <View style={{ gap: 10 }}>
        {lifeTasks.slice(0, 15).map((t) => (
          <HistoryCard key={t.id} title={t.title} subtitle={t.goal} meta={`${t.status} • ${t.id}`} icon="flag" accent={colors.tertiary} chevron={false} />
        ))}
      </View>
    ) : (
      <EmptyState icon="flag" title="لا توجد خطط بعد" hint="خطط لهدفك وسيتم حفظ الخطة كخطوات منظمة." />
    );

  return (
    <ToolScaffold title="مخطط الحياة" subtitle="خطة عملية حقيقية لتحقيق أهدافك" accent={colors.tertiary} onBack={onBack}>
      <SectionLabel text="الهدف الذي تريد تحقيقه" hint="مطلوب" />
      <Spacer h={8} />
      <View style={{ borderWidth: 1, borderColor: withAlpha(colors.outline, 0.3), borderRadius: 12, paddingHorizontal: 12, backgroundColor: withAlpha(colors.surfaceVariant, 0.4) }}>
        <ThemedField value={cfg.goal} onChangeText={(g) => setCfg({ goal: g })} placeholder="مثال: إتقان هندسة البرمجيات والذكاء الاصطناعي خلال سنة" />
      </View>

      <Spacer h={16} />
      <SectionLabel text="المجال الأساسي" />
      <Spacer h={8} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {LIFE_AREAS.map((a) => {
          const active = cfg.area === a.key;
          return (
            <Pressable
              key={a.key}
              onPress={() => setCfg({ area: a.key })}
              style={({ pressed }) => [{ borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', borderColor: active ? colors.tertiary : withAlpha(colors.outline, 0.25), backgroundColor: active ? withAlpha(colors.tertiary, 0.13) : withAlpha(colors.surfaceVariant, 0.45), opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={{ color: active ? colors.tertiary : colors.onSurface, ...typography.labelMedium }}>{a.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Spacer h={16} />
      <AdvancedOptions title="إعدادات الخطة">
        <SegmentedField
          label="الأفق الزمني"
          value={cfg.isLongTerm ? 'long' : 'short'}
          onChange={(v) => setCfg({ isLongTerm: v === 'long' })}
          options={[
            { key: 'short', label: 'قصير/متوسط المدى' },
            { key: 'long', label: 'طويل المدى' },
          ]}
        />
      </AdvancedOptions>

      <Spacer h={18} />
      {!isSending && (
        <View style={{ borderRadius: 16, backgroundColor: colors.tertiary, paddingVertical: 14, alignItems: 'center' }}>
          <Text onPress={create} style={{ color: '#000', ...typography.titleSmall, fontWeight: FontWeights.bold }}>
            إنشاء خطة الطريق
          </Text>
        </View>
      )}

      <Spacer h={16} />
      <RunSection
        tool="life"
        accent={colors.tertiary}
        steps={steps}
        resultTitle="اكتملت الخطة"
        resultSubtitle={cfg.goal}
        resultIcon="flag"
        resultActions={[
          { label: 'خطة جديدة', icon: 'add', onPress: () => useToolsStore.setState({ run: { tool: 'life', title: '', status: 'idle', startedAt: 0 } }) },
        ]}
        onReset={() => useToolsStore.setState({ run: { tool: 'life', title: '', status: 'idle', startedAt: 0 } })}
        history={history}
      />
    </ToolScaffold>
  );
}
