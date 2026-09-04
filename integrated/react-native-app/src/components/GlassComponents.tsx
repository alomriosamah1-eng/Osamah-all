// GlassComponents — منقولة من ui/components/GlassComponents.kt
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { typography, FontWeights } from '../theme/typography';
import { withAlpha, Green, CyanNeon } from '../theme/colors';

export function PressableCard({
  children,
  style,
  onPress,
  cornerRadius = 14,
  alpha = 0.5,
  borderColor,
  borderWidth = 1,
  width,
}: {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  cornerRadius?: number;
  alpha?: number;
  borderColor?: string;
  borderWidth?: number;
  width?: number;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderRadius: cornerRadius,
          backgroundColor: withAlpha(colors.surfaceVariant, alpha),
          borderWidth,
          borderColor: borderColor ?? withAlpha(colors.outline, 0.2),
          padding: 12,
          width,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function GlassCard({
  children,
  style,
  cornerRadius = 20,
}: {
  children: React.ReactNode;
  style?: any;
  cornerRadius?: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: cornerRadius,
          backgroundColor: withAlpha(colors.surfaceVariant, 0.7),
          borderWidth: 1,
          borderColor: withAlpha(colors.outline, 0.25),
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ToolActivityCard({
  toolName,
  statusText,
  isCompleted = false,
  style,
}: {
  toolName: string;
  statusText: string;
  isCompleted?: boolean;
  style?: any;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: 14,
          backgroundColor: isCompleted ? 'rgba(16,185,129,0.10)' : 'rgba(0,240,255,0.15)',
          borderWidth: 1,
          borderColor: isCompleted ? 'rgba(16,185,129,0.30)' : 'rgba(0,240,255,0.30)',
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: isCompleted ? Green : CyanNeon,
        }}
      />
      <View style={{ width: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={[{ color: colors.primary }, typography.labelMedium, { fontWeight: FontWeights.medium }]}>
          {toolName}
        </Text>
        <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>{statusText}</Text>
      </View>
    </View>
  );
}

export function QuickActionChip({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap | React.ReactNode;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        borderRadius: 16,
        backgroundColor: withAlpha(colors.surfaceVariant, 0.8),
        borderWidth: 1,
        borderColor: withAlpha(colors.outline, 0.2),
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
      }}
    >
      <MaterialIcons name={icon as any} size={18} color={colors.primary} />
      <View style={{ width: 8 }} />
      <Text style={{ color: colors.onSurface, ...typography.labelLarge }}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({});