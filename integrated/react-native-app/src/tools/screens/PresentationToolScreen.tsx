// PresentationToolScreen — صانع العروض: إعدادات حقيقية → طلب وكيل → عرض حقيقي يُحفظ في قاعدة البيانات.
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha } from '../../theme/colors';
import { Spacer, ThemedField } from '../../components/primitives';
import { ToolScaffold } from '../../components/tools/ToolScaffold';
import { SectionLabel, LanguageSelector, CountSelector, MultiSelectGrid, SingleSelectGrid, AdvancedOptions, ToggleRow } from '../../components/tools/Selectors';
import { ColorPicker } from '../../components/tools/ColorPicker';
import { HistoryCard, EmptyState } from '../../components/tools/Feedback';
import { RunSection } from '../../components/tools/RunSection';
import { useToolsStore } from '../toolsStore';
import { buildPresentationPrompt, useToolRun, executeToolRun } from '../run';
import { useAgentStore } from '../../store/agentStore';
import { PRESENTATION_TYPES, PRESENTATION_DESIGNS, PRESENTATION_LAYOUTS, SLIDE_PRESETS } from '../options';

export function PresentationToolScreen({ onBack, onOpenStudio }: { onBack: () => void; onOpenStudio: () => void }) {
  const { colors } = useTheme();
  const cfg = useToolsStore((s) => s.presentation);
  const setCfg = useToolsStore((s) => s.setPresentation);
  const isSending = useAgentStore((s) => s.isSending);
  const presentations = useAgentStore((s) => s.presentations);
  const { status } = useToolRun('presentation');

  const canCreate = cfg.topic.trim().length > 0 && !isSending;
  const steps = [
    { key: 'analysis', label: 'تحليل موضوع العرض', detail: cfg.topic.slice(0, 40) || 'موضوع العرض', icon: 'search' as const },
    { key: 'drafting', label: 'تأليف محتوى الشرائح', detail: `${cfg.slides} شريحة • ${cfg.type}`, icon: 'edit' as const },
    { key: 'designing', label: 'تنسيق وتصميم الشرائح', detail: `تصميم ${cfg.design} • هوية ${cfg.color}`, icon: 'palette' as const },
    { key: 'saving', label: 'حفظ العرض', detail: 'يُخزَّن في قاعدة بيانات العروض', icon: 'save' as const },
  ];

  async function create() {
    if (!canCreate) return;
    await executeToolRun('presentation', cfg.topic.trim(), buildPresentationPrompt(cfg));
  }

  const history =
    presentations.length > 0 ? (
      <View style={{ gap: 10 }}>
        {presentations.map((p) => (
          <HistoryCard
            key={p.id}
            title={p.title}
            subtitle={p.topic}
            meta={`${p.slidesCount} شريحة • ${p.id}`}
            icon="slideshow"
            accent={cfg.color}
            onOpen={onOpenStudio}
          />
        ))}
      </View>
    ) : (
      <EmptyState icon="slideshow" title="لا توجد عروض بعد" hint="أنشئ عرضًا من الإعدادات أعلاه." />
    );

  return (
    <ToolScaffold
      title="صانع العروض"
      subtitle="عرض تقديمي حقيقي بواسطة وكيل أسامة"
      accent={cfg.color}
      onBack={onBack}
      actionIcon="auto-stories"
      onAction={onOpenStudio}
      actionLabel="استوديو العروض"
    >
      <SectionLabel text="الموضوع" hint="مطلوب" />
      <Spacer h={8} />
      <View style={{ borderWidth: 1, borderColor: withAlpha(colors.outline, 0.3), borderRadius: 12, paddingHorizontal: 12, backgroundColor: withAlpha(colors.surfaceVariant, 0.4) }}>
        <ThemedField value={cfg.topic} onChangeText={(t) => setCfg({ topic: t })} placeholder="مثال: هندسة البرمجيات والذكاء الاصطناعي 2026" />
      </View>

      <Spacer h={16} />
      <SectionLabel text="اللغة" />
      <Spacer h={8} />
      <LanguageSelector value={cfg.language} onChange={(l) => setCfg({ language: l })} />

      <Spacer h={16} />
      <SectionLabel text="عدد الشرائح" />
      <Spacer h={8} />
      <CountSelector presets={SLIDE_PRESETS} value={cfg.slides} onChange={(n) => setCfg({ slides: n })} suffix="شريحة" min={4} max={120} />

      <Spacer h={16} />
      <SectionLabel text="نوع العرض" />
      <Spacer h={8} />
      <SingleSelectGrid options={PRESENTATION_TYPES} value={cfg.type} onChange={(k) => setCfg({ type: k })} accent={cfg.color} />

      <Spacer h={16} />
      <SectionLabel text="التصميم" />
      <Spacer h={8} />
      <SingleSelectGrid options={PRESENTATION_DESIGNS} value={cfg.design} onChange={(k) => setCfg({ design: k })} accent={cfg.color} />

      <Spacer h={16} />
      <SectionLabel text="تخطيطات الشرائح" hint="اختر عدة" />
      <Spacer h={8} />
      <MultiSelectGrid options={PRESENTATION_LAYOUTS} selected={cfg.layouts} onToggle={(k) => setCfg({ layouts: cfg.layouts.includes(k) ? cfg.layouts.filter((x) => x !== k) : [...cfg.layouts, k] })} />

      <Spacer h={16} />
      <ColorPicker value={cfg.color} onChange={(c) => setCfg({ color: c })} label="الهوية اللونية" />

      <Spacer h={16} />
      <AdvancedOptions title="خيارات متقدمة">
        <ToggleRow label="شريحة عنوان/غلاف" value={cfg.includeCover} onChange={(v) => setCfg({ includeCover: v })} />
        <ToggleRow label="شريحة شكر وخاتمة" value={cfg.includeThanks} onChange={(v) => setCfg({ includeThanks: v })} />
      </AdvancedOptions>

      <Spacer h={18} />
      {!isSending && status !== 'running' && (
        <View style={{ borderRadius: 16, backgroundColor: cfg.color, paddingVertical: 14, alignItems: 'center' }}>
          <Text onPress={create} style={{ color: '#000', ...typography.titleSmall, fontWeight: FontWeights.bold }}>
            إنشاء عرض تقديمي حقيقي
          </Text>
        </View>
      )}

      <Spacer h={16} />
      <RunSection
        tool="presentation"
        accent={cfg.color}
        steps={steps}
        resultTitle="اكتمل إنشاء العرض"
        resultSubtitle={cfg.topic}
        resultIcon="slideshow"
        resultActions={[
          { label: 'فتح الاستوديو', icon: 'auto-stories', onPress: onOpenStudio },
          { label: 'إنشاء آخر', icon: 'add', onPress: () => useToolsStore.setState({ run: { tool: 'presentation', title: '', status: 'idle', startedAt: 0 } }) },
        ]}
        onReset={() => useToolsStore.setState({ run: { tool: 'presentation', title: '', status: 'idle', startedAt: 0 } })}
        history={history}
      />
    </ToolScaffold>
  );
}
