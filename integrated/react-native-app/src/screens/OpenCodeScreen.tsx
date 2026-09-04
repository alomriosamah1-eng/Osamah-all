// OpenCodeScreen — منقولة من ui/screens/OpenCodeScreen.kt (غير موصولة بالتبويبات، كما في الأصل)
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAgentStore } from '../store/agentStore';
import { openCodeEngine, CodeExecutionResult } from '../engine/OpenCodeEngine';
import { useTheme } from '../theme/theme';
import { typography, FontWeights } from '../theme/typography';
import { withAlpha, CyanNeon, ElectricBlue, Green, GreenSoft, Red, EditorBackground, EditorBar, TerminalBackground, EditorText, EditorMuted, ErrorText } from '../theme/colors';
import { Spacer, IconButton, Chip, AssistChip, TextButton, FilledButton } from '../components/primitives';

const LANGUAGES: [string, string][] = [
  ['kotlin', 'Kotlin'],
  ['python', 'Python'],
  ['javascript', 'JavaScript'],
  ['shell', 'Shell / Bash'],
];

function extFor(language: string): string {
  if (language === 'kotlin') return 'kt';
  if (language === 'python') return 'py';
  if (language === 'shell') return 'sh';
  return 'js';
}

export function OpenCodeScreen() {
  const { colors } = useTheme();
  const sendUserMessage = useAgentStore((s) => s.sendUserMessage);
  const selectTab = useAgentStore((s) => s.selectTab);

  const [selectedLanguage, setSelectedLanguage] = useState('kotlin');
  const [codeContent, setCodeContent] = useState(openCodeEngine.templates[0]?.code ?? '');
  const [result, setResult] = useState<CodeExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPromptText, setAiPromptText] = useState('');

  async function runCode() {
    setIsRunning(true);
    const res = await openCodeEngine.execute(codeContent, selectedLanguage);
    setResult(res);
    setIsRunning(false);
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: 14, paddingBottom: 80 }}>
      {/* 1. Header */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="terminal" size={24} color={CyanNeon} />
            <Spacer w={8} />
            <Text style={{ color: colors.onBackground, ...typography.titleLarge, fontWeight: FontWeights.bold }}>
              بيئة الوكيل البرمجية
            </Text>
          </View>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>
            تشغيل الأكواد، السكربتات والأتمتة مع وكيل أسامة
          </Text>
        </View>
        <FilledButton
          label={isRunning ? '...' : 'تشغيل'}
          icon="play-arrow"
          onPress={runCode}
          disabled={isRunning}
          backgroundColor={CyanNeon}
          textColor="#000"
        />
      </View>

      {/* 2. Language Selector & AI Tools */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {LANGUAGES.map(([id, name]) => (
            <Chip
              key={id}
              label={name}
              selected={selectedLanguage === id}
              onPress={() => {
                setSelectedLanguage(id);
                const t = openCodeEngine.templates.find((x) => x.language === id);
                if (t) setCodeContent(t.code);
              }}
            />
          ))}
        </ScrollView>
        <IconButton icon="auto-fix-high" onPress={() => setShowAiPrompt(true)} color={CyanNeon} label="توليد كود عبر الوكيل" />
      </View>

      {/* 3. Quick Templates Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
        {openCodeEngine.templates.map((t) => (
          <AssistChip
            key={t.id}
            label={t.title.slice(0, 24)}
            onPress={() => {
              setSelectedLanguage(t.language);
              setCodeContent(t.code);
            }}
          />
        ))}
      </ScrollView>

      {/* 4. Code Editor View */}
      <View style={[s.editor, { borderColor: EditorBar }]}>
        {/* Editor Top Bar */}
        <View style={[s.editorBar, { backgroundColor: EditorBar }]}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={s.dotRed} />
            <View style={s.dotAmber} />
            <View style={s.dotGreen} />
          </View>
          <Text style={{ color: EditorMuted, ...typography.labelSmall, fontFamily: 'monospace' }}>
            main.{extFor(selectedLanguage)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton
              icon="content-copy"
              onPress={async () => {
                await Clipboard.setStringAsync(codeContent);
                Alert.alert('تم النسخ', 'تم نسخ الكود');
              }}
              color={EditorMuted}
              size={14}
              label="نسخ"
            />
            <IconButton icon="delete-sweep" onPress={() => setCodeContent('')} color={EditorMuted} size={14} label="مسح" />
          </View>
        </View>
        {/* Code Input Area */}
        <TextInput
          value={codeContent}
          onChangeText={setCodeContent}
          multiline
          style={{ flex: 1, color: EditorText, fontFamily: 'monospace', fontSize: 13, lineHeight: 20, padding: 12, textAlign: 'left' }}
        />
      </View>

      <Spacer h={10} />

      {/* 5. Terminal Console Output */}
      <View style={[s.console, { borderColor: EditorBar }]}>
        <View style={{ flex: 1, padding: 12 }}>
          {/* Console Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: Sky, ...typography.labelSmall, fontWeight: FontWeights.bold, fontFamily: 'monospace' }}>
                وحدة الإخراج (Terminal Console)
              </Text>
              {result && (
                <>
                  <Spacer w={8} />
                  <View style={{ borderRadius: 4, backgroundColor: result.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: result.success ? Green : Red, ...typography.labelSmall, fontSize: 10 }}>
                      {result.success ? 'SUCCESS (0)' : 'ERROR'}
                    </Text>
                  </View>
                </>
              )}
            </View>
            {result && (
              <Text style={{ color: '#64748B', ...typography.labelSmall, fontSize: 10 }}>
                {result.executionTimeMs} ms • {result.memoryUsageKb} KB
              </Text>
            )}
          </View>

          <Spacer h={8} />
          <View style={{ height: 1, backgroundColor: EditorBar }} />
          <Spacer h={8} />

          <ScrollView style={{ flex: 1 }}>
            {(() => {
              if (!result && !isRunning) {
                return (
                  <Text style={s.consoleText}>
                    $ Agent ready. اضغط على "تشغيل" لتنفيذ الكود والحصول على المخرجات مباشرة.
                  </Text>
                );
              }
              if (isRunning || !result) {
                return (
                  <Text style={[s.consoleText, { color: CyanNeon }]}>
                    $ جارٍ تجميع وتشغيل البرنامج النصي عبر بيئة الوكيل...
                  </Text>
                );
              }
              return (
                <>
                  {result.output ? (
                    <Text style={{ color: GreenSoft, ...typography.bodySmall, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 }}>
                      {result.output}
                    </Text>
                  ) : null}
                  {result.error ? (
                    <>
                      <Spacer h={6} />
                      <Text style={{ color: ErrorText, ...typography.bodySmall, fontFamily: 'monospace', fontSize: 12 }}>{result.error}</Text>
                    </>
                  ) : null}
                </>
              );
            })()}
          </ScrollView>
        </View>
      </View>

      {/* Modal: AI Code Generation */}
      <Modal visible={showAiPrompt} transparent animationType="fade" onRequestClose={() => setShowAiPrompt(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surface, borderColor: withAlpha(colors.outline, 0.3) }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="smart-toy" size={22} color={CyanNeon} />
              <Spacer w={8} />
              <Text style={{ color: colors.onBackground, ...typography.titleMedium, fontWeight: FontWeights.bold }}>
                طلب كود من وكيل أسامة
              </Text>
            </View>
            <Spacer h={10} />
            <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>
              اكتب ما تريد أن يبرمجه لك الوكيل بلغة {selectedLanguage}:
            </Text>
            <Spacer h={10} />
            <TextInput
              value={aiPromptText}
              onChangeText={setAiPromptText}
              multiline
              placeholder="مثال: اكتب خوارزمية فرز سريعة مع قياس الأداء"
              placeholderTextColor={colors.onSurfaceVariant}
              style={{ color: colors.onSurface, ...typography.bodyMedium, borderWidth: 1, borderColor: withAlpha(colors.outline, 0.3), borderRadius: 10, padding: 12, minHeight: 90 }}
            />
            <Spacer h={12} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TextButton label="إلغاء" onPress={() => setShowAiPrompt(false)} />
              <FilledButton
                label="توليد في المحادثة"
                onPress={() => {
                  if (aiPromptText.trim()) {
                    sendUserMessage(`اكتب كود برمجياً بلغة ${selectedLanguage} لتنفيذ: ${aiPromptText} واشرح طريقة تشغيله في محرك الوكيل`);
                    selectTab('chat');
                    setShowAiPrompt(false);
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

const Sky = '#38BDF8';

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 10 },
  editor: { flex: 1.2, borderRadius: 16, borderWidth: 1, backgroundColor: EditorBackground, overflow: 'hidden' },
  editorBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: Red },
  dotAmber: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F59E0B' },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: Green },
  console: { flex: 1, borderRadius: 16, borderWidth: 1, backgroundColor: TerminalBackground, overflow: 'hidden' },
  consoleText: { color: '#64748B', ...typography.bodySmall, fontFamily: 'monospace', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
});