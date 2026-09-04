// ConnectionStatusOrb — كرة صغيرة جداً في زاوية الشاشة تعكس حالة الاتصال الحقيقية.
// ممنوع أي نص بجانبها؛ اللون فقط (أخضر/أصفر/أزرق/أحمر). نبض خفيف جداً بلا تشتيت.
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

const ORB_COLORS = {
  green: '#22C55E',
  yellow: '#FACC15',
  blue: '#3B82F6',
  red: '#EF4444',
};

export function ConnectionStatusOrb({
  size = 10,
  style,
}: {
  size?: number;
  style?: ViewStyle | any;
}) {
  const color = useConnectionStatus();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const bg = ORB_COLORS[color];

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, style]}
      testID="connection-orb"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`حالة الاتصال: ${color}`}
    >
      <Animated.View
        style={[
          styles.halo,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, opacity: 0.35, transform: [{ scale: pulse }] },
        ]}
      />
      <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute' },
  halo: { position: 'absolute' },
});
