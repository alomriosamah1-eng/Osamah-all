// ChatHistoryModal — سجل المحادثات: قائمة الجلسات المستقلة، فتح أي جلسة، إنشاء جديدة، حذف.
// كل جلسة تحمل Session ID مستقل؛ لا يُخلط أي محتوى بين جلسة وأخرى.
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAgentStore } from '../store/agentStore';
import { useTheme } from '../theme/theme';
import { typography, FontWeights } from '../theme/typography';
import { withAlpha, CyanNeon, Red, Green } from '../theme/colors';
import { AgentRepository } from '../data/AgentRepository';

export function ChatHistoryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const conversations = useAgentStore((s) => s.conversations);
  const currentId = useAgentStore((s) => s.uiState.currentConversationId);
  const openConversation = useAgentStore((s) => s.openConversation);
  const deleteConversation = useAgentStore((s) => s.deleteConversation);
  const newConversation = useAgentStore((s) => s.newConversation);
  const selectTab = useAgentStore((s) => s.selectTab);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const c of conversations) {
        const p = await AgentRepository.getLastMessagePreview(c.id);
        if (cancelled) return;
        map[c.id] = p || 'لم تبدأ محادثة بعد';
      }
      if (!cancelled) setPreviews(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, conversations]);

  const handleNew = async () => {
    await newConversation();
    onClose();
    selectTab('chat');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: withAlpha(colors.outline, 0.3) }]}>
          <View style={s.headerRow}>
            <View>
              <Text style={{ color: colors.onBackground, ...typography.titleMedium, fontWeight: FontWeights.bold }}>
                سجل المحادثات
              </Text>
              <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>
                {conversations.length} جلسة مستقلة
              </Text>
            </View>
            <Pressable onPress={handleNew} style={[s.newBtn, { backgroundColor: withAlpha(colors.primaryContainer, 0.6) }]}>
              <MaterialIcons name="add" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, ...typography.labelMedium, fontWeight: FontWeights.bold }}>جلسة جديدة</Text>
            </Pressable>
          </View>

          <FlatList
            data={conversations}
            keyExtractor={(c) => c.id}
            style={{ marginTop: 12 }}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
            ListEmptyComponent={
              <Text style={{ color: colors.onSurfaceVariant, ...typography.bodyMedium, textAlign: 'center', padding: 24 }}>
                لا توجد محادثات بعد. ابدأ أول جلسة الآن.
              </Text>
            }
            renderItem={({ item }) => {
              const isCurrent = item.id === currentId;
              return (
                <Pressable
                  onPress={() => {
                    void openConversation(item.id);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    s.row,
                    {
                      backgroundColor: isCurrent ? withAlpha(colors.primaryContainer, 0.35) : withAlpha(colors.surfaceVariant, 0.6),
                      borderColor: isCurrent ? CyanNeon : withAlpha(colors.outline, 0.2),
                    },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialIcons name="chat-bubble-outline" size={16} color={isCurrent ? CyanNeon : colors.onSurfaceVariant} />
                      <View style={{ width: 8 }} />
                      <Text
                        style={{ flex: 1, color: isCurrent ? CyanNeon : colors.onSurface, ...typography.bodyMedium, fontWeight: FontWeights.semiBold }}
                        numberOfLines={1}
                      >
                        {item.title || 'بلا عنوان'}
                      </Text>
                      {isCurrent && (
                        <View style={{ borderRadius: 6, backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: Green, ...typography.labelSmall }}>الحالية</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall, marginTop: 3 }} numberOfLines={1}>
                      {previews[item.id] ?? '...'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => void deleteConversation(item.id)}
                    hitSlop={8}
                    style={({ pressed }) => [{ padding: 6 }, pressed && { opacity: 0.6 }]}
                  >
                    <MaterialIcons name="delete-outline" size={20} color={Red} />
                  </Pressable>
                </Pressable>
              );
            }}
          />

          <Pressable onPress={onClose} style={s.closeRow}>
            <Text style={{ color: colors.primary, ...typography.labelLarge, fontWeight: FontWeights.bold }}>إغلاق</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, maxHeight: '80%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  row: { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center' },
  closeRow: { alignItems: 'center', paddingTop: 8 },
});
