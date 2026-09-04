// PdfToolScreen — صانع PDF: إعدادات حقيقية تُبنى كطلب للوكيل (sendUserMessage) → ملف PDF فعلي على القرص.
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, Linking, Alert } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
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
import { buildPdfPrompt, executeToolRun } from '../run';
import { useAgentStore } from '../../store/agentStore';
import { PDF_DESIGNS, PDF_CONTENT_TYPES, PAGE_PRESETS } from '../options';

interface PdfFile { uri: string; name: string; sizeBytes: number; modified: number; }

function listPdfFiles(): PdfFile[] {
  try {
    const dir = new Directory(Paths.document, 'generated_documents');
    if (!dir.exists) return [];
    return dir
      .list()
      .filter((e) => !(e instanceof Directory) && e.name.toLowerCase().endsWith('.pdf'))
      .map((e) => {
        const f = new File(e.uri);
        return { uri: e.uri, name: e.name, sizeBytes: f.size ?? 0, modified: f.modificationTime ?? 0 };
      })
      .sort((a, b) => b.modified - a.modified);
  } catch {
    return [];
  }
}

export function PdfToolScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const cfg = useToolsStore((s) => s.pdf);
  const setCfg = useToolsStore((s) => s.setPdf);
  const isSending = useAgentStore((s) => s.isSending);
  const [files, setFiles] = useState<PdfFile[]>([]);

  const refresh = useCallback(() => setFiles(listPdfFiles()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const runStatus = useToolsStore((s) => s.run.status);
  useEffect(() => {
    if (runStatus === 'done' || runStatus === 'failed') refresh();
  }, [runStatus, refresh]);

  const canCreate = cfg.topic.trim().length > 0 && !isSending;
  const steps = [
    { key: 'analysis', label: 'تحليل الموضوع', detail: cfg.topic.slice(0, 40) || 'موضوع التقرير', icon: 'search' as const },
    { key: 'drafting', label: 'كتابة المحتوى', detail: `تصميم ${cfg.design} • ${cfg.pages} صفحة`, icon: 'edit' as const },
    { key: 'rendering', label: 'بناء ملف PDF', detail: `اللغة: ${cfg.language === 'ar' ? 'عربية' : cfg.language === 'en' ? 'إنجليزية' : 'ثنائية'}`, icon: 'picture-as-pdf' as const },
    { key: 'saving', label: 'حفظ في المحفوظات', detail: 'مسار generated_documents', icon: 'save' as const },
  ];

  async function create() {
    if (!canCreate) return;
    await executeToolRun('pdf', cfg.topic.trim(), buildPdfPrompt(cfg), {
      design: cfg.design || 'professional',
      accent: cfg.color || '#00F0FF',
      pages: String(cfg.pages || 10),
      language: cfg.language || 'ar',
      includeCover: cfg.includeCover ? 'true' : 'false',
      includeToc: cfg.includeToc ? 'true' : 'false',
      includeAppendices: cfg.includeAppendices ? 'true' : 'false',
    });
  }

  function openPdf(file: PdfFile) {
    Linking.openURL(file.uri).catch(() => Alert.alert('تعذر الفتح', 'تعذر فتح الملف المحدد.'));
  }
  async function sharePdf(file: PdfFile) {
    if (!(await Sharing.isAvailableAsync())) { Alert.alert('غير متاح', 'المشاركة غير مدعومة هنا.'); return; }
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'مشاركة PDF' });
  }
  function deletePdf(file: PdfFile) { try { new File(file.uri).delete(); refresh(); } catch { Alert.alert('خطأ', 'تعذر حذف الملف.'); } }

  const history =
    files.length > 0 ? (
      <View style={{ gap: 10 }}>
        {files.map((f) => (
          <HistoryCard
            key={f.uri}
            title={f.name.replace(/\.pdf$/i, '')}
            subtitle={`${Math.max(1, Math.round(f.sizeBytes / 1024))} KB • على القرص`}
            icon="picture-as-pdf"
            accent={cfg.color}
            onOpen={() => openPdf(f)}
            onDelete={() => deletePdf(f)}
          />
        ))}
      </View>
    ) : (
      <EmptyState icon="picture-as-pdf" title="لا توجد ملفات PDF بعد" hint="أنشئ تقريرًا من الإعدادات أعلاه وسيظهر هنا." />
    );

  return (
    <ToolScaffold
      title="صانع PDF"
      subtitle="تقرير/مستند احترافي حقيقي يُبنى بواسطة الوكيل"
      accent={cfg.color}
      onBack={onBack}
    >
      <SectionLabel text="الموضوع" hint="مطلوب" />
      <Spacer h={8} />
      <View style={{ borderWidth: 1, borderColor: withAlpha(colors.outline, 0.3), borderRadius: 12, paddingHorizontal: 12, backgroundColor: withAlpha(colors.surfaceVariant, 0.4) }}>
        <ThemedField
          value={cfg.topic}
          onChangeText={(t) => setCfg({ topic: t })}
          placeholder="مثال: معمارية وكيل أسامة والأنظمة الذكية 2026"
        />
      </View>

      <Spacer h={16} />
      <SectionLabel text="اللغة" />
      <Spacer h={8} />
      <LanguageSelector value={cfg.language} onChange={(l) => setCfg({ language: l })} />

      <Spacer h={16} />
      <SectionLabel text="عدد الصفحات" />
      <Spacer h={8} />
      <CountSelector presets={PAGE_PRESETS} value={cfg.pages} onChange={(n) => setCfg({ pages: n })} suffix="صفحة" min={1} max={200} />

      <Spacer h={16} />
      <SectionLabel text="التصميم / الأسلوب" />
      <Spacer h={8} />
      <SingleSelectGrid options={PDF_DESIGNS} value={cfg.design} onChange={(k) => setCfg({ design: k })} accent={cfg.color} />

      <Spacer h={16} />
      <SectionLabel text="مكوّنات المحتوى" hint="اختر عدة عناصر" />
      <Spacer h={8} />
      <MultiSelectGrid options={PDF_CONTENT_TYPES} selected={cfg.contentTypes} onToggle={(k) => setCfg({ contentTypes: cfg.contentTypes.includes(k) ? cfg.contentTypes.filter((x) => x !== k) : [...cfg.contentTypes, k] })} />

      <Spacer h={16} />
      <ColorPicker value={cfg.color} onChange={(c) => setCfg({ color: c })} label="الهوية اللونية" />

      <Spacer h={16} />
      <AdvancedOptions title="خيارات متقدمة">
        <ToggleRow label="فهرس محتويات" hint="في بداية الملف" value={cfg.includeToc} onChange={(v) => setCfg({ includeToc: v })} />
        <ToggleRow label="صفحة غلاف" value={cfg.includeCover} onChange={(v) => setCfg({ includeCover: v })} />
        <ToggleRow label="ملاحق" hint="في نهاية الملف" value={cfg.includeAppendices} onChange={(v) => setCfg({ includeAppendices: v })} />
      </AdvancedOptions>

      <Spacer h={18} />
      {!isSending && (
        <View style={{ borderRadius: 16, backgroundColor: cfg.color, paddingVertical: 14, alignItems: 'center' }}>
          <Text onPress={create} style={{ color: '#000', ...typography.titleSmall, fontWeight: FontWeights.bold }}>
            إنشاء مستند PDF الحقيقي
          </Text>
        </View>
      )}

      <Spacer h={16} />
      <RunSection
        tool="pdf"
        accent={cfg.color}
        steps={steps}
        resultTitle="اكتمل إنشاء مستند PDF"
        resultSubtitle={cfg.topic}
        resultIcon="picture-as-pdf"
        resultActions={[
          { label: 'عرض الملفات', icon: 'folder-open', onPress: () => refresh() },
          { label: 'إنشاء آخر', icon: 'add', onPress: () => useToolsStore.setState({ run: { tool: 'pdf', title: '', status: 'idle', startedAt: 0 } }) },
        ]}
        onReset={() => useToolsStore.setState({ run: { tool: 'pdf', title: '', status: 'idle', startedAt: 0 } })}
        history={history}
      />
    </ToolScaffold>
  );
}
