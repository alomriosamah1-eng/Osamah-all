// إعدادات المحادثة — كرات المحادثة التفاعلية، المحرك الصوتي واللهجة، ونبرة الصوت.
import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAgentStore } from '../../store/agentStore';
import { GlassCard, PressableCard } from '../../components/GlassComponents';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha, CyanNeon } from '../../theme/colors';
import { Spacer, Chip } from '../../components/primitives';
import { BubbleState, BUBBLE_THEMES, VoiceBubbleCanvas } from '../../components/voiceBubble';
import { SectionScaffold } from './SectionScaffold';

export function ChatSettingsSection({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const voice = useAgentStore((s) => s.uiState.voiceSettings);
  const updateVoiceBubble = useAgentStore((s) => s.updateVoiceBubble);
  const updateVoiceGender = useAgentStore((s) => s.updateVoiceGender);
  const updateVoiceAccent = useAgentStore((s) => s.updateVoiceAccent);
  const updateVoiceSliders = useAgentStore((s) => s.updateVoiceSliders);
  const updateVoiceResponses = useAgentStore((s) => s.updateVoiceResponses);
  const updateContinuousListening = useAgentStore((s) => s.updateContinuousListening);
  const updateVoiceLanguage = useAgentStore((s) => s.updateVoiceLanguage);
  const updateNoiseSensitivity = useAgentStore((s) => s.updateNoiseSensitivity);

  const selectedBubbleName = BUBBLE_THEMES.find((t) => t.id === voice.selectedBubbleId)?.nameAr ?? 'الأزرق الكوني';

  return (
    <SectionScaffold title="إعدادات المحادثة" subtitle="كرة المحادثة والمحرك الصوتي والنبرة" onBack={onBack}>
      {/* 19 كرات محادثة */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.onSurface, ...typography.titleMedium, fontWeight: FontWeights.bold }}>
          اختر كرة المحادثة التفاعلية ({BUBBLE_THEMES.length} كرة)
        </Text>
        <Spacer h={4} />
        <Text style={{ color: colors.primary, ...typography.bodySmall }}>الكرة الحالية: {selectedBubbleName}</Text>
        <Spacer h={14} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {BUBBLE_THEMES.map((theme) => {
            const isSelected = voice.selectedBubbleId === theme.id;
            return (
              <PressableCard
                key={theme.id}
                onPress={() => updateVoiceBubble(theme.id)}
                alpha={isSelected ? 0.6 : 0.5}
                borderColor={isSelected ? CyanNeon : withAlpha(colors.outline, 0.2)}
                width={100}
                borderWidth={isSelected ? 2 : 1}
              >
                <View style={{ alignItems: 'center' }}>
                  <VoiceBubbleCanvas bubbleId={theme.id} state={isSelected ? BubbleState.LISTENING : BubbleState.IDLE} size={54} />
                  <Spacer h={6} />
                  <Text style={{ color: colors.onSurface, ...typography.labelSmall }} numberOfLines={1}>
                    {theme.nameAr}
                  </Text>
                </View>
              </PressableCard>
            );
          })}
        </ScrollView>
      </GlassCard>

      {/* المحرك الصوتي */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.onSurface, ...typography.titleMedium, fontWeight: FontWeights.bold }}>
          المحرك الصوتي والنبرة
        </Text>
        <Spacer h={12} />

        <View style={s.settingsRow}>
          <Text style={{ color: colors.onSurface, ...typography.bodyMedium }}>نوع الصوت:</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="ذكوري" selected={voice.voiceGender === 'male'} onPress={() => updateVoiceGender('male')} />
            <Chip label="أنثوي" selected={voice.voiceGender === 'female'} onPress={() => updateVoiceGender('female')} />
          </View>
        </View>
        <Spacer h={8} />

        <View style={s.settingsRow}>
          <Text style={{ color: colors.onSurface, ...typography.bodyMedium }}>اللهجة / النطق:</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="سورية" selected={voice.accent === 'syrian'} onPress={() => updateVoiceAccent('syrian')} />
            <Chip label="فصحى" selected={voice.accent === 'fusha'} onPress={() => updateVoiceAccent('fusha')} />
          </View>
        </View>
        <Spacer h={12} />

        <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>سرعة الكلام: {voice.speechRate.toFixed(2)}x</Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0.7}
          maximumValue={1.4}
          value={voice.speechRate}
          onValueChange={(v) => updateVoiceSliders(v, voice.pitch, voice.volume)}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={withAlpha(colors.outline, 0.4)}
          thumbTintColor={colors.primary}
        />
        <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>طبقة الصوت: {voice.pitch.toFixed(2)}</Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0.7}
          maximumValue={1.3}
          value={voice.pitch}
          onValueChange={(v) => updateVoiceSliders(voice.speechRate, v, voice.volume)}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={withAlpha(colors.outline, 0.4)}
          thumbTintColor={colors.primary}
        />
        <Spacer h={10} />

        <View style={s.settingsRow}>
          <Text style={{ color: colors.onSurface, ...typography.bodyMedium }}>الردود الصوتية</Text>
          <Chip label={voice.voiceResponsesEnabled ? 'مفعّلة' : 'معطّلة'} selected={voice.voiceResponsesEnabled} onPress={() => updateVoiceResponses(!voice.voiceResponsesEnabled)} />
        </View>
        <Spacer h={8} />

        <View style={s.settingsRow}>
          <Text style={{ color: colors.onSurface, ...typography.bodyMedium }}>الاستماع المستمر</Text>
          <Chip label={voice.continuousListening ? 'مفعّل' : 'معطّل'} selected={voice.continuousListening} onPress={() => updateContinuousListening(!voice.continuousListening)} />
        </View>
        <Spacer h={8} />

        <View style={s.settingsRow}>
          <Text style={{ color: colors.onSurface, ...typography.bodyMedium }}>اللغة</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="تلقائي" selected={voice.language === 'auto'} onPress={() => updateVoiceLanguage('auto')} />
            <Chip label="عربية" selected={voice.language === 'ar'} onPress={() => updateVoiceLanguage('ar')} />
            <Chip label="إنجليزية" selected={voice.language === 'en'} onPress={() => updateVoiceLanguage('en')} />
          </View>
        </View>
        <Spacer h={12} />

        <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>
          حساسية الضوضاء: {Math.round(voice.noiseSensitivity * 100)}%
        </Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={1}
          step={0.05}
          value={voice.noiseSensitivity}
          onValueChange={(v) => updateNoiseSensitivity(v)}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={withAlpha(colors.outline, 0.4)}
          thumbTintColor={colors.primary}
        />
      </GlassCard>
    </SectionScaffold>
  );
}

const s = StyleSheet.create({
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
});
