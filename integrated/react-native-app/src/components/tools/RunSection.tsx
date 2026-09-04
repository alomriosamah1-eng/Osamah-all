// RunSection — يعرض حالة تنفيذ الأداة الحية (من إشارات الوكيل الحقيقية) + النتيجة + السجل،
// ويُستخدم في أدوات الإنشاء (PDF/العروض/المخططات/الخرائط). لا يختلق نسباً؛ يستند إلى isSending/sendError/agentState الحقيقية.
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha } from '../../theme/colors';
import { Spacer } from '../primitives';
import { AgentStatusStrip, TaskTimeline, ResultCard, EmptyState, TimelineStep } from './Feedback';
import { useToolRun } from '../../tools/run';
import { ToolRun } from '../../tools/toolsStore';

export interface RunSectionProps {
  tool: 'pdf' | 'presentation' | 'life' | 'mindmap';
  accent: string;
  steps: TimelineStep[];
  resultTitle: string;
  resultSubtitle?: string;
  resultIcon: React.ComponentProps<typeof ResultCard>['icon'];
  resultActions?: { label: string; icon: React.ComponentProps<typeof ResultCard>['icon']; onPress: () => void }[];
  onReset: () => void;
  history?: React.ReactNode;
  historyEmpty?: React.ReactNode;
}

const PHASE_ORDER: Record<ToolRun['tool'], string[]> = {
  pdf: ['analysis', 'drafting', 'rendering', 'saving'],
  presentation: ['analysis', 'drafting', 'designing', 'saving'],
  life: ['analysis', 'planning', 'organization', 'saving'],
  mindmap: ['analysis', 'structure', 'rendering', 'saving'],
};

export function RunSection({ tool, accent, steps, resultTitle, resultSubtitle, resultIcon, resultActions, onReset, history, historyEmpty }: RunSectionProps) {
  const { colors } = useTheme();
  const { status, liveStatus, sendError } = useToolRun(tool);

  return (
    <View>
      {status === 'running' ? (
        <>
          <Text style={{ color: colors.onSurface, ...typography.titleSmall, fontWeight: FontWeights.bold }}>جارٍ التنفيذ عبر وكيل أسامة…</Text>
          <Spacer h={8} />
          <TaskTimeline steps={steps} states={steps.map((s) => (PHASE_ORDER[tool].includes(s.key) ? 'running' : 'pending' as const))} accent={accent} />
          <AgentStatusStrip state="sending" statusText={liveStatus} accent={accent} />
        </>
      ) : null}

      {status === 'done' ? (
        <>
          <ResultCard
            title={resultTitle}
            subtitle={resultSubtitle}
            icon={resultIcon}
            accent={accent}
            actions={resultActions}
          />
          <Spacer h={8} />
          <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>{liveStatus}</Text>
        </>
      ) : null}

      {status === 'failed' ? (
        <>
          <AgentStatusStrip state="error" error={sendError} accent={accent} />
          <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall, textAlign: 'center', marginTop: 10 }}>
            تعذر إكمال التنفيذ. يمكنك المحاولة مرة أخرى من الأسفل.
          </Text>
        </>
      ) : null}

      {/* السجل الحقيقي */}
      <View style={{ marginTop: 8 }}>
        <Text style={{ color: colors.onBackground, ...typography.titleSmall, fontWeight: FontWeights.bold, borderBottomColor: withAlpha(colors.outline, 0.2), borderBottomWidth: 1, paddingBottom: 8 }}>
          السجل
        </Text>
        <Spacer h={8} />
        {history ?? historyEmpty ?? (
          <EmptyState icon="history" title="لا يوجد سجل بعد" hint="أنشئ أول مهمة لتظهر هنا." />
        )}
      </View>
    </View>
  );
}
