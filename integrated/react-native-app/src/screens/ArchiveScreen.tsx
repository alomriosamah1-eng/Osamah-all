// ArchiveScreen — «المحفوظات»: مكان مركزي لكل المخرجات الحقيقية (PDF على القرص + عروض + خطط/خرائط).
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAgentStore } from '../store/agentStore';
import { useTheme } from '../theme/theme';
import { typography, FontWeights } from '../theme/typography';
import { withAlpha } from '../theme/colors';
import { IconButton } from '../components/primitives';
import { EmptyState, HistoryCard } from '../components/tools/Feedback';

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

type Section = 'pdf' | 'presentations' | 'plans';

export function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const topSafeArea = insets.top > 0 ? insets.top + 8 : 16;
  const { colors } = useTheme();
  const presentations = useAgentStore((s) => s.presentations);
  const tasks = useAgentStore((s) => s.tasks);
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [section, setSection] = useState<Section>('pdf');

  const refresh = useCallback(() => setFiles(listPdfFiles()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const plans = tasks;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: topSafeArea, paddingBottom: 100 }}>
      <View style={s.headerRow}>
        <View>
          <Text style={{ color: colors.onBackground, ...typography.titleLarge, fontWeight: FontWeights.bold }}>المحفوظات</Text>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>كل مخرجاتك: ملفات PDF، عروض، خطط وخرائط</Text>
        </View>
        <IconButton icon="refresh" onPress={refresh} color={colors.primary} label="تحديث" />
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'pdf' as Section, label: 'ملفات PDF', icon: 'picture-as-pdf' as const, count: files.length },
          { key: 'presentations' as Section, label: 'عروض', icon: 'slideshow' as const, count: presentations.length },
          { key: 'plans' as Section, label: 'خطط وخرائط', icon: 'flag' as const, count: plans.length },
        ].map((x) => {
          const active = section === x.key;
          return (
            <Pressable
              key={x.key}
              onPress={() => setSection(x.key)}
              style={({ pressed }) => [{ flex: 1, borderRadius: 14, borderWidth: 1, borderColor: active ? colors.primary : withAlpha(colors.outline, 0.25), backgroundColor: active ? withAlpha(colors.primary, 0.12) : withAlpha(colors.surfaceVariant, 0.45), paddingVertical: 12, alignItems: 'center', opacity: pressed ? 0.8 : 1 }]}
            >
              <MaterialIcons name={x.icon} size={20} color={active ? colors.primary : colors.onSurfaceVariant} />
              <Text style={{ color: active ? colors.primary : colors.onSurface, ...typography.labelMedium, fontWeight: FontWeights.bold, marginTop: 4 }}>{x.label}</Text>
              <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>{x.count}</Text>
            </Pressable>
          );
        })}
      </View>

      {section === 'pdf' ? (
        files.length === 0 ? (
          <EmptyState icon="picture-as-pdf" title="لا توجد ملفات PDF" hint="أنشئ مستندًا من صانع PDF وسيظهر هنا." accent={colors.primary} />
        ) : (
          <View style={{ gap: 10 }}>
            {files.map((f) => (
              <PdfRow key={f.uri} file={f} onDelete={refresh} />
            ))}
          </View>
        )
      ) : null}

      {section === 'presentations' ? (
        presentations.length === 0 ? (
          <EmptyState icon="slideshow" title="لا توجد عروض" hint="أنشئ عرضًا من صانع العروض." accent={colors.primary} />
        ) : (
          <View style={{ gap: 10 }}>
            {presentations.map((p) => (
              <HistoryCard key={p.id} title={p.title} subtitle={p.topic} meta={`${p.slidesCount} شريحة • ${p.id}`} icon="slideshow" accent={colors.primary} chevron={false} />
            ))}
          </View>
        )
      ) : null}

      {section === 'plans' ? (
        plans.length === 0 ? (
          <EmptyState icon="flag" title="لا توجد خطط أو خرائط" hint="أنشئ خطة أو خريطة ذهنية وسيظهر هنا." accent={colors.tertiary} />
        ) : (
          <View style={{ gap: 10 }}>
            {plans.slice(0, 40).map((t) => (
              <HistoryCard key={t.id} title={t.title} subtitle={t.goal} meta={`${t.status} • ${t.id}`} icon={t.title.toLowerCase().includes('خريطة') ? 'account-tree' : 'flag'} accent={colors.tertiary} chevron={false} />
            ))}
          </View>
        )
      ) : null}
    </ScrollView>
  );
}

function PdfRow({ file, onDelete }: { file: PdfFile; onDelete: () => void }) {
  const { colors } = useTheme();
  const sizeKb = Math.max(1, Math.round(file.sizeBytes / 1024));

  function openPdf() { Linking.openURL(file.uri).catch(() => Alert.alert('تعذر الفتح', 'تعذر فتح الملف المحدد.')); }
  async function sharePdf() {
    if (!(await Sharing.isAvailableAsync())) { Alert.alert('غير متاح', 'المشاركة غير مدعومة هنا.'); return; }
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'مشاركة PDF' });
  }
  function deletePdf() { try { new File(file.uri).delete(); onDelete(); } catch { Alert.alert('خطأ', 'تعذر حذف الملف.'); } }

  return (
    <HistoryCard
      title={file.name.replace(/\.pdf$/i, '')}
      subtitle={`${sizeKb} KB • على القرص`}
      icon="picture-as-pdf"
      accent={colors.primary}
      onOpen={openPdf}
      onDelete={deletePdf}
    />
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 14 },
});
