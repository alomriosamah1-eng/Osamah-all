// عن التطبيق — هوية وكيل أسامة والمطور والمحرك المدمج.
import React from 'react';
import { Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAgentStore } from '../../store/agentStore';
import { GlassCard } from '../../components/GlassComponents';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha, CyanNeon } from '../../theme/colors';
import { Spacer, Divider } from '../../components/primitives';
import { SectionScaffold } from './SectionScaffold';

export function AboutSection({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const name = useAgentStore((s) => s.uiState.userProfile.name) || 'أسامة';

  return (
    <SectionScaffold title="عن التطبيق" subtitle="الهوية والإصدار" onBack={onBack}>
      {/* الشعار */}
      <GlassCard style={{ alignItems: 'center', paddingVertical: 28 }}>
        <View style={{ width: 88, height: 88, borderRadius: 24, backgroundColor: withAlpha(CyanNeon, 0.18), alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="smart-toy" size={52} color={CyanNeon} />
        </View>
        <Spacer h={12} />
        <Text style={{ color: colors.onSurface, ...typography.titleLarge, fontWeight: FontWeights.bold }}>وكيل أسامة</Text>
        <Text style={{ color: colors.primary, ...typography.bodyMedium }}>Osamah Agent</Text>
        <Spacer h={4} />
        <Text style={{ color: colors.onSurfaceVariant, ...typography.labelMedium }}>الإصدار 2.0.0</Text>
      </GlassCard>

      <Spacer h={12} />
      <GlassCard>
        <Text style={{ color: colors.onSurface, ...typography.titleMedium, fontWeight: FontWeights.bold }}>من هو وكيل أسامة؟</Text>
        <Spacer h={6} />
        <Text style={{ color: colors.onSurface, ...typography.bodyMedium, lineHeight: 24 }}>
          أنا وكيل أسامة، قام بتطويري وهندستي المهندس {name === 'أسامة' ? 'أسامة محمد علي سعيد العُمري' : name} كوكيل شخصي ومساعد ذكي متكامل وعقل ثانٍ، مع دمج محرك وسيرفر الوكيل المحلي كمدبر خفي للمهام والتخطيط والتنفيذ وصناعة العروض والمستندات.
        </Text>
        <Spacer h={10} />
        <Divider />
        <Spacer h={10} />
        <InfoRow icon="memory" label="المحرك المدمج" value="Agent Local Architecture Subsystem" />
        <Spacer h={8} />
        <InfoRow icon="devices" label="البنية" value="واجهة خفيفة (Thin Client) + خادم وكيل محلي" />
        <Spacer h={8} />
        <InfoRow icon="storage" label="التخزين" value="محلي ومشفر (SQLite عبر AgentRepository)" />
      </GlassCard>
    </SectionScaffold>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <MaterialIcons name={icon} size={18} color={colors.onSurfaceVariant} />
      <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall, marginStart: 8, width: 120 }}>{label}:</Text>
      <Text style={{ color: colors.onSurface, ...typography.bodySmall, flex: 1 }} numberOfLines={2}>{value}</Text>
    </View>
  );
}
