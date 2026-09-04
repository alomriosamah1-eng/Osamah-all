// BrowserScreen — متصفح نظيف: مساحة النتائج الأساسية نظيفة، والعناصر الثانوية
// (إجراءات الوكيل، البوابات السريعة) منقولة إلى قائمة «مزيد» دون حذف أي وظيفة.
import React, { useRef, useState } from 'react';
import { Modal, ScrollView, Text, View, StyleSheet, Linking, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useAgentStore } from '../store/agentStore';
import { useTheme } from '../theme/theme';
import { typography, FontWeights } from '../theme/typography';
import { withAlpha, CyanNeon, ElectricBlue, Red } from '../theme/colors';
import { Spacer, IconButton, Divider, ActionChip, AssistChip, ThemedField } from '../components/primitives';

const QUICK_SHORTCUTS: [string, string][] = [
  ['Android Docs', 'https://developer.android.com'],
  ['Kotlin Docs', 'https://kotlinlang.org/docs/home.html'],
  ['Google News', 'https://news.google.com'],
  ['Wikipedia', 'https://ar.wikipedia.org'],
  ['GitHub', 'https://github.com'],
  ['arXiv AI', 'https://arxiv.org/list/cs.AI/recent'],
];

export function BrowserScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const uiState = useAgentStore((s) => s.uiState);
  const topSafeArea = insets.top > 0 ? insets.top + 6 : 12;
  const setBrowserUrl = useAgentStore((s) => s.setBrowserUrl);
  const toggleReaderMode = useAgentStore((s) => s.toggleReaderMode);
  const sendUserMessage = useAgentStore((s) => s.sendUserMessage);
  const selectTab = useAgentStore((s) => s.selectTab);

  const webviewRef = useRef<WebView>(null);
  const pendingExtract = useRef<string | null>(null);

  const [inputUrl, setInputUrl] = useState(uiState.browserUrl);
  const [loadedUrl, setLoadedUrl] = useState(uiState.browserUrl);
  const [pageTitle, setPageTitle] = useState('صفحة الويب الذكية');
  const [pageProgress, setPageProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedContent, setExtractedContent] = useState('');
  const [isAgentAutomating, setIsAgentAutomating] = useState(false);
  const [agentActionStatus, setAgentActionStatus] = useState('وكيل أسامة جاهز لأتمتة التصفح');
  const [menuOpen, setMenuOpen] = useState(false);

  function navigateTo(raw: string) {
    const target =
      raw.startsWith('http://') || raw.startsWith('https://')
        ? raw
        : raw.includes('.') && !raw.includes(' ')
        ? `https://${raw}`
        : `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
    setInputUrl(target);
    setBrowserUrl(target);
    setLoadedUrl(target);
  }

  function extractPageTextAndAutomate(actionPrompt: string) {
    setIsAgentAutomating(true);
    setAgentActionStatus('جارٍ استخراج المحتوى وتوجيهه لوكيل أسامة...');
    pendingExtract.current = actionPrompt;
    webviewRef.current?.injectJavaScript(
      `window.ReactNativeWebView.postMessage(document.body.innerText || document.documentElement.innerText); true;`
    );
  }

  function handleMessage(event: any) {
    const raw: string = event.nativeEvent?.data ?? '';
    if (raw.startsWith('TITLE:')) {
      setPageTitle(raw.replace('TITLE:', '').slice(0, 60));
      return;
    }
    if (pendingExtract.current) {
      const cleanText = raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').slice(0, 2500);
      setExtractedContent(cleanText);
      setIsAgentAutomating(false);
      setAgentActionStatus('تم استخلاص المحتوى بنجاح ✓');
      const action = pendingExtract.current;
      pendingExtract.current = null;
      sendUserMessage(`${action}: ${pageTitle}\nالرابط: ${uiState.browserUrl}\nالمحتوى المستخلص: ${cleanText}`);
      selectTab('chat');
    }
  }

  function runAgentShortcut(prompt: string) {
    setMenuOpen(false);
    extractPageTextAndAutomate(prompt);
  }

  return (
    <View style={{ flex: 1 }}>
      {/* شريط التنقل والبحث (عنصر تحكم أساسي، يبقى في الأعلى) */}
      <View style={[s.navBar, { backgroundColor: withAlpha(colors.surfaceVariant, 0.9), borderColor: withAlpha(colors.outline, 0.25), marginTop: topSafeArea }]}>
        <IconButton icon="arrow-forward" onPress={() => webviewRef.current?.goBack()} color={colors.onSurface} size={22} label="الرجوع" />
        <IconButton icon="arrow-back" onPress={() => webviewRef.current?.goForward()} color={colors.onSurface} size={22} label="للأمام" />
        <ThemedField
          value={inputUrl}
          onChangeText={setInputUrl}
          placeholder="أدخل رابط أو ابحث في الويب..."
          singleLine
          style={{ flex: 1, ...typography.bodySmall }}
        />
        {isLoading ? (
          <IconButton icon="close" onPress={() => webviewRef.current?.stopLoading()} color={Red} size={22} label="إيقاف" />
        ) : (
          <IconButton icon="refresh" onPress={() => webviewRef.current?.reload()} color={colors.primary} size={22} label="إعادة تحميل" />
        )}
        <IconButton icon="search" onPress={() => navigateTo(inputUrl)} color={colors.primary} size={22} label="انتقال" />
        <IconButton icon="more-vert" onPress={() => setMenuOpen(true)} color={colors.primary} size={22} label="قائمة إضافية" />
      </View>

      {/* شريط تقدم رفيع */}
      {isLoading && pageProgress > 0 && pageProgress < 100 && (
        <View style={{ height: 2, backgroundColor: withAlpha(colors.surfaceVariant, 0.6), width: '100%' }}>
          <View style={{ height: 2, width: `${pageProgress}%`, backgroundColor: CyanNeon }} />
        </View>
      )}

      {/* شريط حالة الوكيل الرفيع (حالة وليس بطاقة) */}
      <View style={[s.statusRow, { borderColor: withAlpha(colors.outline, 0.15) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <MaterialIcons name={isAgentAutomating ? 'smart-toy' : 'auto-mode'} size={15} color={CyanNeon} />
          <Spacer w={6} />
          <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }} numberOfLines={1}>
            {agentActionStatus}
          </Text>
        </View>
      </View>

      {/* مساحة النتائج الرئيسية النظيفة */}
      {uiState.isReaderMode ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ color: colors.onSurface, ...typography.titleLarge, fontWeight: FontWeights.bold }}>{pageTitle}</Text>
          <Spacer h={6} />
          <Text style={{ color: colors.primary, ...typography.bodySmall }}>{uiState.browserUrl}</Text>
          <Spacer h={14} />
          <Divider />
          <Spacer h={14} />
          <Text style={{ color: colors.onSurface, ...typography.bodyMedium, lineHeight: 24 }}>
            {extractedContent ||
              'المحتوى النقي: يتم الآن فحص الصفحة وتنظيف العناصر الترويجية لتقديم قراءة هادئة ومريحة لمقالاتك وأبحاثك.'}
          </Text>
        </ScrollView>
      ) : (
        <WebView
          ref={webviewRef}
          source={{ uri: loadedUrl }}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={true}
          onLoadStart={(e) => {
            setIsLoading(true);
            const url = e.nativeEvent?.url;
            if (url) {
              setInputUrl(url);
              setBrowserUrl(url);
            }
          }}
          onLoadEnd={() => setIsLoading(false)}
          onLoadProgress={(e) => setPageProgress(e.nativeEvent?.progress ? Math.round(e.nativeEvent.progress * 100) : 0)}
          onMessage={handleMessage}
          injectedJavaScript={`(function(){ try { window.ReactNativeWebView.postMessage('TITLE:' + document.title); } catch(e){} })(); true;`}
          onHttpError={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36"
        />
      )}

      {/* قائمة «مزيد» — محتويات ثانوية منقولة هنا (لا تحذف وظيفة) */}
      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setMenuOpen(false)} />
        <View style={[s.sheet, { backgroundColor: colors.surface, borderColor: withAlpha(colors.outline, 0.3) }]}>
          <View style={s.sheetHandle} />
          <Text style={{ color: colors.onBackground, ...typography.titleMedium, fontWeight: FontWeights.bold }}>
            أدوات المتصفح
          </Text>
          <Spacer h={10} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexWrap: 'wrap', flexDirection: 'row', gap: 8 }}>
              <ActionChip label="البوابات السريعة" icon="grid-view" accent={CyanNeon} onPress={() => {}} />
            </View>
            <Spacer h={6} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {QUICK_SHORTCUTS.map(([name, url]) => (
                <AssistChip key={url} label={name} onPress={() => { setMenuOpen(false); navigateTo(url); }} />
              ))}
            </View>
            <Divider style={{ marginVertical: 14 }} />
            <Text style={{ color: colors.onBackground, ...typography.titleSmall, fontWeight: FontWeights.bold }}>إجراءات وكيل أسامة</Text>
            <Spacer h={8} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <ActionChip label="وضع القراءة النقي" icon="auto-stories" accent={CyanNeon} onPress={() => { setMenuOpen(false); toggleReaderMode(); }} />
              <ActionChip label="تلخيص ذكي" icon="bolt" accent={CyanNeon} onPress={() => runAgentShortcut('قم بتلخيص هذه الصفحة واستخراج 5 نقاط جوهرية')} />
              <ActionChip label="توليد PDF" icon="picture-as-pdf" accent={Red} onPress={() => runAgentShortcut('أنشئ تقرير PDF توثيقي شامل مستنداً إلى محتوى هذه الصفحة')} />
              <ActionChip label="تحويل لعرض شرائح" icon="slideshow" accent={ElectricBlue} onPress={() => runAgentShortcut('أنشئ عرضًا تقديميًا تفاعليًا من 8 شرائح يلخص محتوى ودراسة هذه الصفحة')} />
              <ActionChip
                label="فتح في المتصفح الخارجي"
                icon="open-in-browser"
                accent={colors.onSurfaceVariant}
                onPress={() => { setMenuOpen(false); if (uiState.browserUrl) Linking.openURL(uiState.browserUrl).catch(() => {}); }}
              />
            </View>
          </ScrollView>
          <Spacer h={8} />
          <Pressable onPress={() => setMenuOpen(false)} style={{ alignSelf: 'center', paddingVertical: 8 }}>
            <Text style={{ color: colors.primary, ...typography.labelLarge, fontWeight: FontWeights.bold }}>إغلاق</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  navBar: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 2,
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: '75%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 10 },
});
