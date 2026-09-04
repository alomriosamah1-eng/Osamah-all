// حاجز أخطاء جذري — بدل شاشة سوداء فارغة يعرض رسالة الخطأ الفعلية لقراءة التشخيص
import React, { Component, type ReactNode } from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  message: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { message: error instanceof Error ? `${error.name}: ${error.message}` : String(error) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('[OSErrorBoundary]', error, info);
  }

  render() {
    if (this.state.message) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>حدث خطأ غير متوقع</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            <Text style={styles.message}>{this.state.message}</Text>
          </ScrollView>
          <Text style={styles.hint}>سيظهر فوق رسالة الخطأ الـ stack trace في سجل Metro (طرفية المطور).</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E17', justifyContent: 'center', padding: 24 },
  title: { color: '#FECACA', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  message: { color: '#F8FAFC', fontSize: 13, fontFamily: 'monospace', lineHeight: 20 },
  hint: { color: '#64748B', fontSize: 12, marginTop: 16 },
});