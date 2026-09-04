// مركز التحكم والاتصال — الخادم، الاتصال، الخلفية/الـ API، النماذج، توجيه النماذج، ضغط التوكن.
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAgentStore } from '../../store/agentStore';
import { GlassCard } from '../../components/GlassComponents';
import { useTheme } from '../../theme/theme';
import { typography, FontWeights } from '../../theme/typography';
import { withAlpha, CyanNeon, ElectricBlue, Green, Red } from '../../theme/colors';
import { Spacer, Divider, TextButton, Chip } from '../../components/primitives';
import { serverApi, Capability, LiveModelCatalog } from '../../server/api';
import { ROUTING_STRATEGIES } from '../../backend/ProviderAdapter';
import { openCodeSubsystem } from '../../agent/opencode/OpenCodeControlSubsystem';
import { useOpenCodeModelSelection } from '../../agent/opencode/opencode-model-selection';
import { SectionScaffold } from './SectionScaffold';

export function ConnectionControlSection({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const { selectedModel, selectModel } = useOpenCodeModelSelection();
  const [engineConfig, setEngineConfig] = useState({ ...openCodeSubsystem.config });
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showRoutingStrategy, setShowRoutingStrategy] = useState(false);

  const [serverStatus, setServerStatus] = useState<{ kind: 'loading' | 'online' | 'offline'; capabilities: Capability[] }>({ kind: 'loading', capabilities: [] });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const caps = await serverApi.capabilities();
        if (cancelled) return;
        setServerStatus({ kind: 'online', capabilities: Array.isArray(caps) ? caps : [] });
      } catch {
        if (!cancelled) setServerStatus({ kind: 'offline', capabilities: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [liveCatalog, setLiveCatalog] = useState<LiveModelCatalog | null>(null);
  const [liveModelsLoading, setLiveModelsLoading] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const catalog = await serverApi.liveModels({ offset: 0, limit: 30, zenFreeOnly: false });
        if (cancelled) return;
        if (catalog?.state === 'ready') setLiveCatalog(catalog);
        else setLiveCatalog(null);
      } catch {
        if (!cancelled) setLiveCatalog(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!freeOnly) return;
    let cancelled = false;
    (async () => {
      try {
        const catalog = await serverApi.liveModels({ offset: 0, limit: 30, zenFreeOnly: true });
        if (cancelled || catalog?.state !== 'ready') return;
        setLiveCatalog(catalog);
        if (!selectedModel) {
          const firstFreeConnected = catalog.models.find((m) => m.zenFree && m.connected);
          if (firstFreeConnected) selectModel({ providerId: firstFreeConnected.providerId, providerName: firstFreeConnected.providerName, modelId: firstFreeConnected.modelId, modelName: firstFreeConnected.modelName });
        }
      } catch {
        /* تجاهل العابر */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeOnly]);

  const activeModel = selectedModel;
  const activeModelMeta = activeModel ? liveCatalog?.models.find((m) => m.providerId === activeModel.providerId && m.modelId === activeModel.modelId) ?? null : null;
  const activeModelLabel = activeModel ? activeModel.modelName : liveCatalog?.models?.find((m) => m.connected)?.modelName ?? 'لم يُحدَّد بعد';
  const activeModelProvider = activeModel ? activeModel.providerName : liveCatalog?.models?.find((m) => m.connected)?.providerName ?? '—';

  return (
    <SectionScaffold title="مركز التحكم والاتصال" subtitle="الخادم، النماذج، التوجيه، وضغط التوكن" onBack={onBack}>
      {/* حالة الخادم */}
      <GlassCard style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.onSurface, ...typography.titleSmall, fontWeight: FontWeights.bold }}>حالة خادم الوكيل</Text>
          {serverStatus.kind === 'loading' && <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>جارٍ التحقق...</Text>}
          {serverStatus.kind === 'online' && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Green }} />
              <Spacer w={6} />
              <Text style={{ color: Green, ...typography.labelSmall }}>متصل</Text>
            </View>
          )}
          {serverStatus.kind === 'offline' && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Red }} />
              <Spacer w={6} />
              <Text style={{ color: Red, ...typography.labelSmall }}>غير متصل (وضع غير متصل)</Text>
            </View>
          )}
        </View>
        {serverStatus.kind === 'online' && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {serverStatus.capabilities.map((capability) => (
              <Chip key={capability.id} label={`${capability.label}: ${capability.state === 'available' ? 'متاح' : capability.state === 'review_only' ? 'مراجعة' : 'غير متاح'}`} selected={capability.state === 'available'} onPress={() => {}} />
            ))}
          </View>
        )}
        {serverStatus.kind === 'offline' && (
          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall, marginTop: 10 }}>
            يعمل التطبيق حالياً بالمحرك المحلي المغلق. عند توصيل الخادم تُفعَّل قدرات المراجعة والبحث والعروض خادمياً.
          </Text>
        )}
      </GlassCard>

      {/* النموذج النشط */}
      <Pressable onPress={() => setShowModelSelector(true)} style={[s.row, { borderColor: withAlpha(CyanNeon, 0.4), backgroundColor: withAlpha(colors.surfaceVariant, 0.5) }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>النموذج النشط:</Text>
          <Text style={{ color: CyanNeon, ...typography.titleMedium, fontWeight: FontWeights.bold }}>{activeModelLabel}</Text>
          <Text style={{ color: colors.onSurface, ...typography.bodySmall }}>
            {activeModelProvider}
            {activeModel ? ` • ${activeModel.modelId}` : ''}
            {activeModelMeta?.connected ? ' • متصل' : ''}
            {activeModelMeta?.zenFree ? ' • مجاني' : ''}
          </Text>
        </View>
        <MaterialIcons name="tune" size={20} color={CyanNeon} />
      </Pressable>
      <Spacer h={8} />

      {/* التبديل الذكي للنماذج المجانية */}
      <Pressable onPress={() => setFreeOnly((v) => !v)} style={[s.row, { borderColor: withAlpha(Green, 0.35), backgroundColor: withAlpha(colors.surfaceVariant, 0.4) }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>التبديل الذكي للنماذج المجانية:</Text>
          <Text style={{ color: Green, ...typography.bodyMedium, fontWeight: FontWeights.semiBold }}>
            {freeOnly ? 'مُفعّل (النماذج المتصلة ذات التكلفة الصفرية)' : 'معطّل'}
          </Text>
        </View>
        <Switch value={freeOnly} onValueChange={setFreeOnly} trackColor={{ true: Green }} />
      </Pressable>
      <Spacer h={8} />

      {/* استراتيجية التوجيه */}
      <Pressable onPress={() => setShowRoutingStrategy(true)} style={[s.row, { borderColor: withAlpha(colors.outline, 0.2), backgroundColor: withAlpha(colors.surfaceVariant, 0.4) }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>استراتيجية توزيع المهام الذكية:</Text>
          <Text style={{ color: ElectricBlue, ...typography.bodyMedium, fontWeight: FontWeights.semiBold }}>
            {ROUTING_STRATEGIES[engineConfig.routingStrategy].displayNameAr}
          </Text>
        </View>
        <MaterialIcons name="swap-horiz" size={20} color={ElectricBlue} />
      </Pressable>
      <Spacer h={8} />

      {/* ضغط التوكن */}
      <GlassCard style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.onSurface, ...typography.bodyMedium, fontWeight: FontWeights.medium }}>نظام ضغط وتقليل استهلاك التوكن</Text>
            <Text style={{ color: Green, ...typography.labelSmall }}>تم توفير ~{engineConfig.totalTokensSavedEstimate} توكن عبر ضغط السياق</Text>
          </View>
          <Switch value={engineConfig.tokenCompressionEnabled} onValueChange={(v) => { openCodeSubsystem.toggleTokenCompression(v); setEngineConfig({ ...openCodeSubsystem.config }); }} trackColor={{ true: CyanNeon, false: withAlpha(colors.outline, 0.4) }} thumbColor="#0A0E17" />
        </View>
        <Divider style={{ marginVertical: 12 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.onSurface, ...typography.bodyMedium, fontWeight: FontWeights.medium }}>نظام منع الهلوسة والتحقق من الحقائق</Text>
            <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>إلزام الوكيل بالحقائق والأدلة الواقعية فقط</Text>
          </View>
          <Switch value={engineConfig.antiHallucinationEnabled} onValueChange={(v) => { openCodeSubsystem.toggleAntiHallucination(v); setEngineConfig({ ...openCodeSubsystem.config }); }} trackColor={{ true: CyanNeon, false: withAlpha(colors.outline, 0.4) }} thumbColor="#0A0E17" />
        </View>
      </GlassCard>

      {/* Modal: محدد النماذج */}
      <Modal visible={showModelSelector} transparent animationType="fade" onRequestClose={() => setShowModelSelector(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surface, borderColor: withAlpha(colors.outline, 0.3) }]}>
            <Text style={{ color: colors.onBackground, ...typography.titleMedium, fontWeight: FontWeights.bold }}>اختيار نموذج الذكاء الاصطناعي</Text>
            <Spacer h={4} />
            <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>
              {liveCatalog ? `${liveCatalog.total} نموذجًا من السجل الحي لخادم الوكيل` : 'لا يوجد كتالوج حي'}
            </Text>
            <Spacer h={12} />
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={{ gap: 8 }}>
                {liveModelsLoading && <Text style={{ color: colors.onSurfaceVariant, ...typography.labelSmall }}>جارٍ تحميل النماذج الحية...</Text>}
                {!liveModelsLoading && !liveCatalog && <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>تعذر قراءة كتالوج النماذج من الخادم. تأكد من أن الخادم متصل.</Text>}
                {!liveModelsLoading && liveCatalog && (liveCatalog.models.length === 0 ? (
                  <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>{freeOnly ? 'لا توجد نماذج مجانية متاحة حاليًا.' : 'لا توجد نماذج في السجل الحالي.'}</Text>
                ) : (
                  liveCatalog.models.map((m) => {
                    const isSelected = selectedModel?.providerId === m.providerId && selectedModel?.modelId === m.modelId;
                    return (
                      <Pressable key={`${m.providerId}.${m.modelId}`} onPress={() => { selectModel({ providerId: m.providerId, providerName: m.providerName, modelId: m.modelId, modelName: m.modelName }); setShowModelSelector(false); }} style={[s.row, { backgroundColor: withAlpha(colors.surfaceVariant, isSelected ? 0.7 : 0.4), borderColor: isSelected ? CyanNeon : withAlpha(colors.outline, 0.2), borderWidth: isSelected ? 2 : 1 }]}>
                        <View style={{ gap: 3, flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ flex: 1, color: isSelected ? CyanNeon : colors.onSurface, ...typography.titleSmall, fontWeight: FontWeights.bold }} numberOfLines={1}>{m.modelName}</Text>
                            <View style={{ flexDirection: 'row', gap: 4 }}>
                              {m.connected && <Badge text="متصل" color={Green} />}
                              {m.zenFree && <Badge text="مجاني" color={Green} />}
                            </View>
                          </View>
                          <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }} numberOfLines={1}>{m.providerName} • {m.modelId}</Text>
                        </View>
                      </Pressable>
                    );
                  })
                ))}
              </View>
            </ScrollView>
            <Spacer h={8} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TextButton label="إغلاق" onPress={() => setShowModelSelector(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: استراتيجية التوجيه */}
      <Modal visible={showRoutingStrategy} transparent animationType="fade" onRequestClose={() => setShowRoutingStrategy(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surface, borderColor: withAlpha(colors.outline, 0.3) }]}>
            <Text style={{ color: colors.onBackground, ...typography.titleMedium, fontWeight: FontWeights.bold }}>استراتيجية توجيه المهام الذكية</Text>
            <Spacer h={12} />
            <View style={{ gap: 8 }}>
              {(Object.keys(ROUTING_STRATEGIES) as (keyof typeof ROUTING_STRATEGIES)[]).map((strategy) => {
                const info = ROUTING_STRATEGIES[strategy];
                const isSelected = engineConfig.routingStrategy === strategy;
                return (
                  <Pressable key={strategy} onPress={() => { openCodeSubsystem.updateRoutingStrategy(strategy); setEngineConfig({ ...openCodeSubsystem.config }); setShowRoutingStrategy(false); }} style={[s.row, { alignItems: 'flex-start', backgroundColor: withAlpha(colors.surfaceVariant, isSelected ? 0.7 : 0.5), borderColor: isSelected ? ElectricBlue : withAlpha(colors.outline, 0.2), borderWidth: isSelected ? 2 : 1 }]}>
                    <View style={{ gap: 2, flex: 1 }}>
                      <Text style={{ color: isSelected ? ElectricBlue : colors.onSurface, ...typography.titleSmall, fontWeight: FontWeights.bold }}>{info.displayNameAr}</Text>
                      <Text style={{ color: colors.onSurfaceVariant, ...typography.bodySmall }}>{info.descriptionAr}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Spacer h={8} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TextButton label="إغلاق" onPress={() => setShowRoutingStrategy(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </SectionScaffold>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ borderRadius: 6, backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ color, ...typography.labelSmall }}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
});
