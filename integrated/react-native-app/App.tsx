import { useEffect } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAgentStore } from './src/store/agentStore';
import { ThemeProvider, useTheme } from './src/theme/theme';
import { OsamahBottomNavigation } from './src/navigation/OsamahBottomNavigation';
import { OpenCodeModelSelectionProvider } from './src/agent/opencode/opencode-model-selection';
import ErrorBoundary from './src/components/ErrorBoundary';

// إجبار اتجاه RTL (مطابق لأصل MainActivity: LocalLayoutDirection.Rtl)
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

function Root() {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.background === '#0A0E17' ? 'light' : 'dark'} />
      <OsamahBottomNavigation />
    </View>
  );
}

function Bootstrap() {
  useEffect(() => {
    useAgentStore.getState().init().catch((e) => console.warn('init failed', e));
  }, []);

  return <Root />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <ThemeProvider>
            <OpenCodeModelSelectionProvider>
              <Bootstrap />
            </OpenCodeModelSelectionProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});