// ChatScreen — محادثة حقيقية End-to-End:
// جلسة مستقلة (currentConversationId) → store → AgentCore → الخادم/الوكيل → رد حقيقي.
// زر إرسال Stateful (قيد التنفيذ/خطأ/إعادة محاولة) + حقل إدخال مثبّت أسفل + كرة اتصال في الزاوية.
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAgentStore } from '../store/agentStore';
import { BubbleState } from '../components/voiceBubble';
import { VoiceBubbleCanvas } from '../components/voiceBubble';
import { ToolActivityCard } from '../components/GlassComponents';
import { ConnectionStatusOrb } from '../components/ConnectionStatusOrb';
import { ChatHistoryModal } from '../components/ChatHistoryModal';
import { useTheme } from '../theme/theme';
import { typography, FontWeights } from '../theme/typography';
import { withAlpha, CyanNeon, Red } from '../theme/colors';
import { useVoiceToggle } from '../hooks/useVoiceToggle';
import { Spacer, TextButton } from '../components/primitives';

const INPUT_MAX_HEIGHT = 120;

export function ChatScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const uiState = useAgentStore((s) => s.uiState);
  const messages = useAgentStore((s) => s.messages);
  const isSending = useAgentStore((s) => s.isSending);
  const sendError = useAgentStore((s) => s.sendError);
  const sendUserMessage = useAgentStore((s) => s.sendUserMessage);
  const retrySend = useAgentStore((s) => s.retrySend);
  const newConversation = useAgentStore((s) => s.newConversation);
  const interruptSpeech = useAgentStore((s) => s.interruptSpeech);
  const handleVoiceToggle = useVoiceToggle();

  const topSafeArea = insets.top > 0 ? insets.top + 8 : 12;

  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const listRef = useRef<FlatList>(null);

  const conversationTitle =
    uiState.currentConversationId === 'default_session' ? 'جلسة وكيل أسامة الرئيسية' : 'محادثة';
  const isListeningOrSpeaking =
    uiState.agentState === BubbleState.SPEAKING || uiState.isVoiceInputActive;
  const canSend = inputText.trim().length > 0 && !isSending;

  const scrollToEnd = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToEnd();
    }
  }, [messages.length]);

  const handleSend = async () => {
    const textToSend = inputText;
    if (!textToSend.trim() || isSending) return;
    setInputText('');
    await sendUserMessage(textToSend);
  };

  const handleNewChat = async () => {
    await newConversation();
    setInputText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[s.flex, { backgroundColor: colors.background }]}
    >
      {/* Header + كرة الاتصال في الزاوية (بدون نص بجانبها) */}
      <View style={[s.header, { paddingTop: topSafeArea }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: colors.onBackground, ...typography.titleLarge, fontWeight: FontWeights.bold }} numberOfLines={1}>
              {conversationTitle}
            </Text>
            <ConnectionStatusOrb size={9} />
          </View>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>
            {uiState.activeTaskStatus}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <HeaderIcon icon="history" color={colors.primary} onPress={() => setShowHistory(true)} accessibility="سجل المحادثات" />
          <HeaderIcon icon="add-comment" color={CyanNeon} onPress={handleNewChat} accessibility="محادثة جديدة" />
          <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden' }}>
            <VoiceBubbleCanvas
              bubbleId={uiState.voiceSettings.selectedBubbleId}
              state={uiState.agentState}
              size={44}
              onClick={() => handleVoiceToggle()}
            />
          </View>
        </View>
      </View>

      {/* حالة عملية (استماع/نطق) */}
      {isListeningOrSpeaking && (
        <View
          style={[
            s.banner,
            {
              backgroundColor: uiState.isVoiceInputActive ? 'rgba(239,68,68,0.15)' : 'rgba(0,240,255,0.15)',
              borderColor: uiState.isVoiceInputActive ? 'rgba(239,68,68,0.4)' : 'rgba(0,240,255,0.4)',
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <MaterialIcons
              name={uiState.isVoiceInputActive ? 'mic' : 'volume-up'}
              size={18}
              color={uiState.isVoiceInputActive ? Red : CyanNeon}
            />
            <Spacer w={8} />
            <Text style={{ color: colors.onSurface, ...typography.bodySmall }}>
              {uiState.isVoiceInputActive ? 'جارٍ الاستماع إليك...' : 'يتحدث وكيل أسامة...'}
            </Text>
          </View>
          <TextButton label="مقاطعة / إيقاف" onPress={() => interruptSpeech()} />
        </View>
      )}

      {/* رسالة خطأ قابلة لإعادة المحاولة (لا يُفقد نص الرسالة) */}
      {sendError && (
        <View style={[s.errorRow, { backgroundColor: withAlpha(Red, 0.12), borderColor: withAlpha(Red, 0.4) }]}>
          <MaterialIcons name="error-outline" size={18} color={Red} />
          <Text style={{ flex: 1, color: colors.onSurface, ...typography.bodySmall, marginHorizontal: 8 }}>
            {sendError}
          </Text>
          <TextButton
            label="إعادة المحاولة"
            color={Red}
            onPress={() => {
              void retrySend();
            }}
          />
        </View>
      )}

      {/* الرسائل (من الجلسة الحالية فقط) */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => (item.id ? `m${item.id}` : `k${item.timestamp}-${item.text.slice(0, 10)}`)}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <MaterialIcons name="auto-awesome" size={40} color={withAlpha(colors.primary, 0.5)} />
            <Spacer h={12} />
            <Text style={{ color: colors.onSurfaceVariant, ...typography.bodyMedium, textAlign: 'center' }}>
              ابدأ أولى جلساتك مع وكيل أسامة — اكتب مهمتك أو تحدث صوتياً.
            </Text>
          </View>
        }
        renderItem={({ item }) => <MessageItem message={item} />}
      />

      {/* حقل إدخال مثبّت أسفل + زر إرسال حالة */}
      <View style={[s.inputWrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={[s.inputBar, { backgroundColor: withAlpha(colors.surfaceVariant, 0.9), borderColor: withAlpha(colors.outline, 0.3) }]}>
          <Pressable
            onPress={() => handleVoiceToggle()}
            hitSlop={8}
            style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialIcons name={uiState.isVoiceInputActive ? 'mic-off' : 'mic'} size={24} color={uiState.isVoiceInputActive ? Red : colors.primary} />
          </Pressable>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="اكتب مهمتك لوكيل أسامة..."
            placeholderTextColor={colors.onSurfaceVariant}
            multiline
            style={[
              s.input,
              { color: colors.onSurface, ...typography.bodyMedium, maxHeight: INPUT_MAX_HEIGHT },
              Platform.select({ web: { outlineStyle: 'none' } as any }),
            ]}
          />
          {isSending ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ padding: 6, marginLeft: 6 }} />
          ) : (
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              hitSlop={8}
              style={({ pressed }) => [
                s.sendBtn,
                {
                  backgroundColor: canSend ? colors.primary : withAlpha(colors.outline, 0.25),
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialIcons name="send" size={20} color={canSend ? '#000' : colors.onSurfaceVariant} />
            </Pressable>
          )}
        </View>
      </View>

      <ChatHistoryModal visible={showHistory} onClose={() => setShowHistory(false)} />
    </KeyboardAvoidingView>
  );
}

function HeaderIcon({
  icon,
  color,
  onPress,
  accessibility,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress: () => void;
  accessibility: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel={accessibility}
      style={({ pressed }) => [
        { width: 36, height: 36, borderRadius: 18, backgroundColor: withAlpha(colors.surfaceVariant, 0.6), alignItems: 'center', justifyContent: 'center' },
        pressed && { opacity: 0.7 },
      ]}
    >
      <MaterialIcons name={icon} size={20} color={color} />
    </Pressable>
  );
}

function MessageItem({ message }: { message: any }) {
  const { colors } = useTheme();
  const isUser = message.sender === 'user';
  const isError = message.sender === 'system';
  return (
    <View style={{ alignItems: isError ? 'center' : isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && !isError && message.toolName ? (
        <View style={{ maxWidth: 340, marginBottom: 6 }}>
          <ToolActivityCard
            toolName={`الأداة المستخدمة: ${message.toolName}`}
            statusText={message.toolResult?.slice(0, 80) ?? 'تم إنجاز الخطوة بنجاح'}
            isCompleted
          />
        </View>
      ) : null}
      <View
        style={[
          s.bubble,
          {
            backgroundColor: isError
              ? withAlpha(Red, 0.14)
              : isUser
                ? colors.primary
                : withAlpha(colors.surfaceVariant, 0.9),
            borderColor: isUser || isError ? 'transparent' : withAlpha(colors.outline, 0.2),
            borderWidth: isUser || isError ? 0 : 1,
          },
        ]}
      >
        <Text
          style={{
            color: isError ? Red : isUser ? colors.onPrimary : colors.onSurface,
            ...typography.bodyMedium,
          }}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 6,
  },
  errorRow: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 6,
  },
  inputWrap: { paddingHorizontal: 10, paddingTop: 4 },
  inputBar: {
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  input: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, textAlignVertical: 'top' },
  sendBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  bubble: {
    borderRadius: 18,
    borderBottomStartRadius: 4,
    borderBottomEndRadius: 18,
    maxWidth: '85%',
    padding: 13,
  },
});
