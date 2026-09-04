// HomeScreen — منقولة من ui/screens/HomeScreen.kt
import React from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAgentStore } from '../store/agentStore';
import { useTheme } from '../theme/theme';
import { typography, FontWeights } from '../theme/typography';
import { withAlpha, CyanNeon, Sky, DeepViolet, Red, Amber, Green as Emerald } from '../theme/colors';
import { GlassCard } from '../components/GlassComponents';
import { VoiceBubbleCanvas } from '../components/voiceBubble';
import { Spacer } from '../components/primitives';
import { useVoiceToggle } from '../hooks/useVoiceToggle';

export function HomeScreen({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const uiState = useAgentStore((s) => s.uiState);
  const tasks = useAgentStore((s) => s.tasks);
  const sendUserMessage = useAgentStore((s) => s.sendUserMessage);
  const handleVoiceToggle = useVoiceToggle();

  const topSafeArea = insets.top > 0 ? insets.top + 8 : 16;
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour <= 12 ? 'صباح الخير،' : hour >= 13 && hour <= 17 ? 'طاب يومك،' : 'مساء الخير،';
const userName = uiState.userProfile.name.trim() || 'أسامة';

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: topSafeArea, paddingBottom: 90 }}
    >
      {/* 1. Personalized Header */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.onBackground, ...typography.headlineMedium, fontWeight: FontWeights.bold }}>
            {greeting} {userName}
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodyMedium }}>
            وكيل أسامة — مستعد لتنفيذ مهامك وأبحاثك
          </Text>
        </View>
        <Pressable
          onPress={() => onNavigate('settings')}
          style={({ pressed }) => [
            { width: 46, height: 46, borderRadius: 23, backgroundColor: withAlpha(colors.primaryContainer, 0.5), alignItems: 'center', justifyContent: 'center' },
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialIcons name="person" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <Spacer h={18} />

      <Spacer h={10} />

      {/* 2. كرة المحادثة الصوتية — عنصر بصري نظيف ومركزي (اضغط للبدء/الإيقاف) */}
      <View style={{ alignItems: 'center' }}>
        <VoiceBubbleCanvas
          bubbleId={uiState.voiceSettings.selectedBubbleId}
          state={uiState.agentState}
          size={150}
          onClick={() => handleVoiceToggle()}
        />
        <Spacer h={12} />
        <Text style={{ color: colors.onSurfaceVariant, ...typography.labelMedium }}>
          {uiState.isVoiceInputActive ? 'اضغط للإيقاف' : 'اضغط للحديث الصوتي'}
        </Text>
      </View>

      <Spacer h={24} />

      {/* 3. Quick Action Hub */}
      <Text style={{ color: colors.onBackground, ...typography.titleMedium, fontWeight: FontWeights.bold }}>
        الإجراءات والأدوات السريعة
      </Text>
      <Spacer h={10} />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <QuickActionItem
          title="بحث معمق"
          icon="search"
          color={CyanNeon}
          onPress={() => {
            sendUserMessage('قم بإجراء بحث معمق واستخلاص المصادر والأدلة لأحدث تقنيات 2026');
            onNavigate('chat');
          }}
        />
        <QuickActionItem
          title="مخطط ومنظم الحياة"
          icon="calendar-month"
          color={Sky}
          onPress={() => {
            sendUserMessage('قم بتنظيم وجدولة مهامي وأولوياتي لهذا اليوم مع وضع خطة متكاملة');
            onNavigate('chat');
          }}
        />
      </View>
      <Spacer h={10} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <QuickActionItem title="عرض تقديمي" icon="slideshow" color={DeepViolet} onPress={() => onNavigate('presentations')} />
        <QuickActionItem
          title="تقرير PDF"
          icon="picture-as-pdf"
          color={Red}
          onPress={() => {
            sendUserMessage('أنشئ لي تقرير PDF تفصيلي عن خطة العمل الهندسية وتطوير الأنظمة');
            onNavigate('files');
          }}
        />
      </View>
      <Spacer h={10} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <QuickActionItem title="أتمتة المتصفح" icon="public" color={Emerald} onPress={() => onNavigate('browser')} />
        <QuickActionItem title="سجل العمليات" icon="history" color={Amber} onPress={() => onNavigate('settings')} />
      </View>

      <Spacer h={18} />

      {/* 4. Smart Adaptive Suggestions */}
      <Text style={{ color: colors.onBackground, ...typography.titleMedium, fontWeight: FontWeights.bold }}>
        اقتراحات مهام ذكية
      </Text>
      <Spacer h={8} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {uiState.quickSuggestions.map((suggestion, i) => (
          <Pressable
            key={i}
            onPress={() => {
              sendUserMessage(suggestion);
              onNavigate('chat');
            }}
            style={({ pressed }) => [
              {
                borderRadius: 14,
                backgroundColor: withAlpha(colors.surfaceVariant, 0.6),
                borderWidth: 1,
                borderColor: withAlpha(colors.outline, 0.2),
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                maxWidth: 280,
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            <MaterialIcons name="auto-awesome" size={18} color={colors.primary} />
            <Spacer w={8} />
            <Text style={{ flex: 1, color: colors.onSurface, ...typography.bodySmall }} numberOfLines={2}>
              {suggestion}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Spacer h={18} />

      {/* 5. Recent Tasks & History */}
      <Text style={{ color: colors.onBackground, ...typography.titleMedium, fontWeight: FontWeights.bold }}>
        سجل المهام والخطوات
      </Text>
      <Spacer h={8} />

      {tasks.length === 0 ? (
        <GlassCard>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodyMedium }}>
            لا توجد مهام سابقة بعد. اطلب من وكيل أسامة أي مهمة لبدء التنفيذ فوراً.
          </Text>
        </GlassCard>
      ) : (
        <View style={{ gap: 8 }}>
          {tasks.slice(0, 4).map((task) => (
            <TaskCardItem key={task.id} title={task.title} goal={task.goal} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function QuickActionItem({
  title,
  icon,
  color,
  onPress,
}: {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { flex: 1, height: 82, borderRadius: 16, backgroundColor: withAlpha(colors.surfaceVariant, 0.7), borderWidth: 1, borderColor: withAlpha(colors.outline, 0.25), padding: 12, justifyContent: 'space-between' },
        pressed && { opacity: 0.75 },
      ]}
    >
      <MaterialIcons name={icon} size={24} color={color} />
      <Text style={{ color: colors.onSurface, ...typography.labelLarge, fontWeight: FontWeights.medium }}>{title}</Text>
    </Pressable>
  );
}

function TaskCardItem({ title, goal }: { title: string; goal: string }) {
  const { colors } = useTheme();
  return (
    <View style={s.taskCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={s.greenDot} />
        <Spacer w={10} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.onSurface, ...typography.bodyMedium, fontWeight: FontWeights.semiBold }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }} numberOfLines={1}>
            الهدف: {goal.slice(0, 45)}...
          </Text>
        </View>
      </View>
      <View style={{ borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 8, paddingVertical: 4 }}>
        <Text style={{ color: Emerald, ...typography.labelSmall }}>مكتمل ✓</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(31,41,55,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 14,
  },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Emerald },
});