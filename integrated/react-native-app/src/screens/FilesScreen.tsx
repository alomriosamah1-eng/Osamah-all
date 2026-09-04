// FilesScreen — منقولة من ui/screens/FilesScreen.kt (expo-file-system 19)
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAgentStore } from '../store/agentStore';
import { useTheme } from '../theme/theme';
import { typography, FontWeights } from '../theme/typography';
import { withAlpha, Red } from '../theme/colors';
import { GlassCard } from '../components/GlassComponents';
import { Spacer, FilledButton, OutlinedButton, IconButton } from '../components/primitives';

interface PdfFile {
  uri: string;
  name: string;
  sizeBytes: number;
  modified: number;
}

function listPdfFiles(): PdfFile[] {
  try {
    const dir = new Directory(Paths.document, 'generated_documents');
    if (!dir.exists) return [];
    return dir
      .list()
      .filter((e) => !(e instanceof Directory) && e.name.toLowerCase().endsWith('.pdf'))
      .map((e) => {
        const f = new File(e.uri);
        return {
          uri: e.uri,
          name: e.name,
          sizeBytes: f.size ?? 0,
          modified: f.modificationTime ?? 0,
        };
      })
      .sort((a, b) => b.modified - a.modified);
  } catch {
    return [];
  }
}

export function FilesScreen() {
  const insets = useSafeAreaInsets();
  const topSafeArea = insets.top > 0 ? insets.top + 8 : 16;
  const { colors } = useTheme();
  const sendUserMessage = useAgentStore((s) => s.sendUserMessage);
  const [files, setFiles] = useState<PdfFile[]>([]);

  const refresh = useCallback(() => setFiles(listPdfFiles()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: topSafeArea, paddingBottom: 90 }}>
      {/* Header */}
      <View style={s.headerRow}>
        <View>
          <Text style={{ color: colors.onBackground, ...typography.titleLarge, fontWeight: FontWeights.bold }}>
            المستندات والتقارير
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>
            ملفات PDF والخطط المولدة آلياً
          </Text>
        </View>
        <IconButton icon="refresh" onPress={refresh} color={colors.primary} label="تحديث" />
      </View>

      {/* Quick Generators */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <FilledButton
          label="خطة دراسية PDF"
          icon="add"
          onPress={() => {
            sendUserMessage('أنشئ تقرير PDF لخطة دراسية متقدمة في Kotlin والأنظمة الذكية');
            setTimeout(refresh, 1200);
          }}
          style={{ flex: 1 }}
        />
        <OutlinedButton
          label="تقرير المعمارية"
          onPress={() => {
            sendUserMessage('أنشئ تقرير PDF تحليلي لمعمارية وكيل أسامة والمشروع');
            setTimeout(refresh, 1200);
          }}
          style={{ flex: 1 }}
        />
      </View>

      {files.length === 0 ? (
        <GlassCard>
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <MaterialIcons name="folder-open" size={48} color={colors.onSurfaceVariant} />
            <Spacer h={10} />
            <Text style={{ color: colors.onSurfaceVariant, ...typography.bodyMedium }}>
              لا توجد مستندات PDF محفوظة حالياً.
            </Text>
            <Spacer h={6} />
            <Text style={{ color: colors.primary, ...typography.bodySmall }}>
              انقر على أحد الأزرار أعلاه لتوليد تقريرك الأول فوراً.
            </Text>
          </View>
        </GlassCard>
      ) : (
        <View style={{ gap: 10 }}>
          {files.map((file) => (
            <PdfFileCard key={file.uri} file={file} onDelete={refresh} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function PdfFileCard({ file, onDelete }: { file: PdfFile; onDelete: () => void }) {
  const { colors } = useTheme();
  const sizeKb = Math.max(1, Math.round(file.sizeBytes / 1024));

  function openPdf() {
    Linking.openURL(file.uri).catch(() => {
      Alert.alert('تعذر الفتح', `تعذر فتح الملف: ${file.name}`);
    });
  }

  async function sharePdf() {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('المشاركة غير متاحة', 'المشاركة غير مدعومة على هذا الجهاز.');
      return;
    }
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'مشاركة تقرير PDF' });
  }

  function deletePdf() {
    try {
      new File(file.uri).delete();
      onDelete();
    } catch {
      Alert.alert('خطأ', 'تعذر حذف الملف.');
    }
  }

  return (
    <Pressable
      onPress={openPdf}
      style={({ pressed }) => [
        s.pdfCard,
        { backgroundColor: withAlpha(colors.surfaceVariant, 0.7), borderColor: withAlpha(colors.outline, 0.2) },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="picture-as-pdf" size={24} color={Red} />
        </View>
        <Spacer w={12} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.onSurface, ...typography.bodyMedium, fontWeight: FontWeights.semiBold }} numberOfLines={1}>
            {file.name.replace(/\.pdf$/i, '').slice(0, 40)}
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>
            الحجم: {sizeKb} KB • انقر للفتح أو المشاركة
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="share" onPress={sharePdf} color={colors.primary} size={20} label="مشاركة" />
        <IconButton icon="delete" onPress={deletePdf} color={colors.onSurfaceVariant} size={20} label="حذف" />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 12 },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
});