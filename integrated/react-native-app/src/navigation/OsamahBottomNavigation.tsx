// OsamahBottomNavigation — تبويبات محلية بسيطة (بدون react-navigation/react-native-screens)
// لضمان الرسم المستقر على iOS (Expo Go) وAndroid معاً مع تماثل الشاشات الأصلية.
import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { typography } from '../theme/typography';
import { withAlpha } from '../theme/colors';
import { useAgentStore } from '../store/agentStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { BrowserScreen } from '../screens/BrowserScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ToolsHubScreen } from '../tools/screens/ToolsHubScreen';
import { ArchiveScreen } from '../screens/ArchiveScreen';

interface NavTabDef {
  name: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const NAV_TABS: NavTabDef[] = [
  { name: 'home', label: 'الرئيسية', icon: 'home' },
  { name: 'chat', label: 'المحادثة', icon: 'chat-bubble-outline' },
  { name: 'browser', label: 'المتصفح', icon: 'public' },
  { name: 'tools', label: 'الأدوات', icon: 'widgets' },
  { name: 'archive', label: 'المحفوظات', icon: 'collections-bookmark' },
  { name: 'settings', label: 'الإعدادات', icon: 'settings' },
];

export function OsamahBottomNavigation() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const currentTab = useAgentStore((s) => s.uiState.currentTab);
  const selectTab = useAgentStore((s) => s.selectTab);
  
  // A subtle lift that still leaves visible space below while clearing the
  // Android nav/gesture area (reduced again per request).
  const lift = Math.round(height * 0.07 / 7);
  const gapBelow = insets.bottom + 2 + lift;

  const renderScreen = () => {
    switch (currentTab) {
      case 'home':
        return <HomeScreen onNavigate={(tab: string) => selectTab(tab)} />;
      case 'chat':
        return <ChatScreen key="chat" />;
      case 'browser':
        return <BrowserScreen key="browser" />;
      case 'tools':
        return <ToolsHubScreen />;
      case 'archive':
        return <ArchiveScreen key="archive" />;
      case 'settings':
        return <SettingsScreen key="settings" />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>{renderScreen()}</View>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: withAlpha(colors.surface, 0.98),
            borderTopColor: withAlpha(colors.outline, 0.25),
            marginBottom: gapBelow, // real empty space below the bar
          },
        ]}
      >
        {NAV_TABS.map((tab) => {
          const focused = currentTab === tab.name;
          return (
            <Pressable
              key={tab.name}
              onPress={() => selectTab(tab.name)}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
            >
              <MaterialIcons name={tab.icon} size={22} color={focused ? colors.primary : colors.onSurfaceVariant} />
              <Text
                style={[typography.labelSmall, { color: focused ? colors.primary : colors.onSurfaceVariant, marginTop: 2 }]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
});