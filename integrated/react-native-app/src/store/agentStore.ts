// المتجر المركزي — منقول من viewmodel/OsamahAgentViewModel.kt
// يوفّر حالة واجهة المستخدم وجميع العمليات (إرسال رسالة، صوت، إعدادات، ذاكرة، GA).
import { create } from 'zustand';
import { AgentRepository } from '../data/AgentRepository';
import {
  ConversationEntity,
  defaultUserProfile,
  defaultVoiceSettings,
  MemoryEntity,
  MessageEntity,
  PresentationEntity,
  SlideEntity,
  TaskEntity,
  TaskStepEntity,
  UserProfileEntity,
  VoiceSettingsEntity,
  AuditLogEntity,
} from '../data/types';
import { AgentCore } from '../agent/AgentCore';
import { getCurrentSelectedModel } from '../agent/opencode/opencode-model-selection';
import { VoiceHelper } from '../engine/VoiceHelper';
import { serverApi } from '../server/api';
import { BubbleState } from '../components/voiceBubble';
import { buildVoiceController, VoiceControllerBundle } from '../engine/voiceControllerAdapter';

export interface AgentUiState {
  currentTab: string;
  agentState: BubbleState;
  activeTaskStatus: string;
  currentConversationId: string;
  isVoiceInputActive: boolean;
  browserUrl: string;
  browserSearchQuery: string;
  isReaderMode: boolean;
  userProfile: UserProfileEntity;
  voiceSettings: VoiceSettingsEntity;
  quickSuggestions: string[];
}

export type ConnectionStatus = 'connected' | 'weak' | 'working' | 'disconnected';

const defaultUiState: AgentUiState = {
  currentTab: 'home',
  agentState: BubbleState.IDLE,
  activeTaskStatus: 'جاهز لتنفيذ المهام والأبحاث',
  currentConversationId: 'default_session',
  isVoiceInputActive: false,
  browserUrl: 'https://developer.android.com',
  browserSearchQuery: '',
  isReaderMode: false,
  userProfile: defaultUserProfile,
  voiceSettings: defaultVoiceSettings,
  quickSuggestions: [
    'ابحث عن أحدث الممارسات في Kotlin وأنشئ لي خطة دراسية',
    'أنشئ عرضًا تقديميًا من 10 شرائح عن الذكاء الاصطناعي',
    'لخص أهداف مشروعي البرمجي وأنشئ ملف PDF',
    'تحدث معي صوتياً بلهجة سورية',
  ],
};

interface AgentStoreState {
  uiState: AgentUiState;
  conversations: ConversationEntity[];
  messages: MessageEntity[];
  tasks: TaskEntity[];
  presentations: PresentationEntity[];
  memories: MemoryEntity[];
  auditLogs: AuditLogEntity[];
  initialized: boolean;
  isSending: boolean;
  sendError: string | null;
  lastFailedText: string | null;
  connectionStatus: ConnectionStatus;
  voiceTurn: number; // يزداد عند كل بدء صوت/مقاطعة — لأي ردّ قديم لا يُنطق (barge-in).

  init(): Promise<void>;
  reloadCollections(): Promise<void>;

  selectTab(tab: string): void;
  sendUserMessage(text: string, speakResponse?: boolean, toolContext?: Record<string, string>): Promise<boolean>;
  retrySend(): Promise<boolean>;
  startVoiceListening(): Promise<void>;
  stopVoiceListening(): Promise<void>;
  interruptSpeech(): Promise<void>;
  stopVoiceConversation(): Promise<void>;

  newConversation(): Promise<string>;
  openConversation(id: string): Promise<void>;
  deleteConversation(id: string): Promise<void>;
  refreshConnectionStatus(): Promise<void>;

  updateVoiceBubble(bubbleId: number): Promise<void>;
  updateVoiceGender(gender: string): Promise<void>;
  updateVoiceAccent(accent: string): Promise<void>;
  updateVoiceSliders(speed: number, pitch: number, volume: number): Promise<void>;
  updateVoiceResponses(enabled: boolean): Promise<void>;
  updateContinuousListening(enabled: boolean): Promise<void>;
  updateVoiceLanguage(language: string): Promise<void>;
  updateNoiseSensitivity(value: number): Promise<void>;
  updateUserProfile(profile: UserProfileEntity): Promise<void>;
  addMemory(key: string, value: string): Promise<void>;
  deleteMemory(id: number): Promise<void>;
  clearAllMemories(): Promise<void>;
  setBrowserUrl(url: string): void;
  toggleReaderMode(): void;
  createPresentation(topic: string, count: number): Promise<void>;
}

const agentCoreInstance = new AgentCore();
let voiceHelper: VoiceHelper | null = null;
let voiceBundle: VoiceControllerBundle | null = null;

function getVoiceHelper(set: (partial: Partial<AgentStoreState>) => void): VoiceHelper {
  if (!voiceHelper) {
    voiceHelper = new VoiceHelper((isSpeaking) => {
      // في حالة وجود المتحكّم، يمرَّر الحدث الحقيقي للمشغّل إليه (مصدر الحقيقة).
      // SPEAKING تُبنى من مشغّل الصوت الفعلي لا من Timer.
      if (voiceBundle) {
        voiceBundle.onPlaybackChange(isSpeaking);
      }
    });
  }
  return voiceHelper;
}

// ====== VoiceConversationController — المرجع الوحيد للحقيقة في حلقة الصوت ======
function getVoiceController(set: (partial: Partial<AgentStoreState>) => void): VoiceControllerBundle {
  if (!voiceBundle) {
    voiceBundle = buildVoiceController({
      getVoiceHelper: () => getVoiceHelper(set),
      submitUserTurn: (text) =>
        useAgentStore.getState().sendUserMessage(
          text,
          useAgentStore.getState().uiState.voiceSettings.voiceResponsesEnabled,
        ),
      applyUiState: (state, _phase) => {
        const ui = useAgentStore.getState().uiState;
        set({
          uiState: {
            ...ui,
            agentState: state,
            // الميكروفون مفتوح فعلياً فقط أثناء الاستماع.
            isVoiceInputActive: state === BubbleState.LISTENING,
          },
        });
      },
      onVolume: () => {},
      onError: () => {},
      onAgentPhase: () => {},
    });
  }
  return voiceBundle;
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  uiState: defaultUiState,
  conversations: [],
  messages: [],
  tasks: [],
  presentations: [],
  memories: [],
  auditLogs: [],
  initialized: false,
  isSending: false,
  sendError: null,
  lastFailedText: null,
  connectionStatus: 'disconnected',
  voiceTurn: 0,

  async init() {
    if (get().initialized) return;
    const profile = await AgentRepository.getCurrentUserProfile();
    let voice = await AgentRepository.getVoiceSettings();
    if (!voice) {
      voice = defaultVoiceSettings;
      await AgentRepository.saveVoiceSettings(voice);
    }

    // حلقة صوتية مستمرة افتراضياً: بعد كل رد يُعاد فتح الميكروفون تلقائياً.
    if (!voice.continuousListening) {
      voice = { ...voice, continuousListening: true };
      await AgentRepository.saveVoiceSettings(voice);
    }
    set({ uiState: { ...get().uiState, voiceSettings: voice } });

    // إنشاء جلسة الترحيب إن لم تكن موجودة
    await AgentRepository.createConversation('default_session', 'جلسة وكيل أسامة الرئيسية');
    const messages = await AgentRepository.getMessages('default_session');
    if (messages.length === 0) {
      await AgentRepository.addMessage(
        'default_session',
        'agent',
        `مرحباً بك يا ${profile.name}! أنا وكيل أسامة — Osamah Agent، وكيلك الشخصي الذكي لتنفيذ المهام، الأبحاث، إعداد العروض التقديمية والتقارير. كيف أستطيع خدمتك اليوم؟`
      );
    }

    // عرض ترحيبي أولي إن كانت قائمة العروض فارغة
    const presentations = await AgentRepository.getAllPresentations();
    if (presentations.length === 0) {
      await seedInitialPresentation();
    }

    getVoiceHelper(set);
    await get().reloadCollections();
    set({ initialized: true });
  },

  async reloadCollections() {
    const data = await AgentRepository.loadAllCollections(get().uiState.currentConversationId);
    const ui = get().uiState;
    set({
      conversations: data.conversations,
      messages: data.messages,
      tasks: data.tasks,
      presentations: data.presentations,
      memories: data.memories,
      auditLogs: data.auditLogs,
      uiState: {
        ...ui,
        userProfile: data.userProfile ?? ui.userProfile,
        voiceSettings: data.voiceSettings ?? ui.voiceSettings,
      },
    });
  },

  selectTab(tab: string) {
    set({ uiState: { ...get().uiState, currentTab: tab } });
  },

  /** إنشاء جلسة جديدة مستقلة والعودة إلى الشاشة الفارغة. */
  async newConversation(): Promise<string> {
    const id = `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    await AgentRepository.createConversation(id, 'محادثة جديدة');
    await get().reloadCollections();
    return id;
  },

  /** فتح جلسة من السجل: تحميل رسائلها فقط، دون خلط أي جلسة بأخرى. */
  async openConversation(id: string): Promise<void> {
    set({
      uiState: { ...get().uiState, currentConversationId: id, currentTab: 'chat' },
      sendError: null,
    });
    await get().reloadCollections();
  },

  async deleteConversation(id: string): Promise<void> {
    const isCurrent = get().uiState.currentConversationId === id;
    await AgentRepository.deleteConversation(id);
    if (isCurrent) {
      const remaining = await AgentRepository.getAllConversations();
      const nextId = remaining[0]?.id;
      if (nextId) {
        set({ uiState: { ...get().uiState, currentConversationId: nextId } });
        await get().reloadCollections();
      } else {
        await get().newConversation();
      }
    } else {
      await get().reloadCollections();
    }
  },

  /** تحديث حالة الاتصال الفعلية بالخادم (تُستدعى بصورة دورية + عند النشاط). */
  async refreshConnectionStatus(): Promise<void> {
    const start = Date.now();
    try {
      const health = await serverApi.health();
      const latency = Date.now() - start;
      // حالة «يعمل/يفكر» تتفوق على حالة الاتصال أثناء التنفيذ — يعكسها اللون الأزرق.
      set({ connectionStatus: latency > 1500 || health?.status !== 'ready' ? 'weak' : 'connected' });
    } catch {
      set({ connectionStatus: 'disconnected' });
    }
  },

  async sendUserMessage(text: string, speakResponse = false, toolContext?: Record<string, string>): Promise<boolean> {
    if (!text.trim()) return false;
    // منع إرسال الرسالة عدة مرات بالخطأ أثناء تنفيذ طلب سابق.
    if (get().isSending) return false;
    const myVoiceTurn = get().voiceTurn; // التقاط الدور: أي بدء صوت لاحق يبطل نطق هذا الرد.
    const conversationId = get().uiState.currentConversationId;

    // 1. إضافة رسالة المستخدم ثم تحديث حالة الإرسال والبث.
    await AgentRepository.addMessage(conversationId, 'user', text);
    const voiceActive = !!voiceBundle?.controller.isOpen();
    set({
      isSending: true,
      sendError: null,
      uiState: {
        ...get().uiState,
        // في وضع الصوت يتولّى VoiceConversationController حالة الكرة (مصدر الحقيقة).
        agentState: voiceActive ? get().uiState.agentState : BubbleState.THINKING,
        activeTaskStatus: 'جارٍ تحليل الطلب والتخطيط للمهمة...',
      },
    });

    // تحديث عنوان الجلسة انطلاقاً من أول رسالة مستخدم (للتمييز في السجل).
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (conv && (!conv.title || conv.title === 'محادثة جديدة')) {
      const derived = text.trim().slice(0, 32);
      await AgentRepository.updateConversationTitle(conversationId, derived);
    }

    const currentMemories = get().memories.map((m) => `${m.key}: ${m.value}`);
    const currentProfile = get().uiState.userProfile;

    try {
      // 2. التنفيذ عبر Agent Core (Server-First ثم المحرك المحلي الآمن عند الانقطاع).
      const planResult = await agentCoreInstance.executeTask(
        text,
        currentProfile,
        currentMemories,
        getCurrentSelectedModel(),
        (progress) => {
          set({ uiState: { ...get().uiState, activeTaskStatus: progress } });
        },
        toolContext,
      );

      // 3. حفظ المهمة وخطواتها (فشل الحفظ هنا لا يُسقط الرد؛ يُسجَّل تجاوزاً)
      try {
        const taskId = `task_${Date.now()}`;
        const taskEntity: TaskEntity = {
          id: taskId,
          title: text.slice(0, 40),
          goal: planResult.goal,
          status: 'COMPLETED',
          createdAt: Date.now(),
          completedAt: null,
        };
        const taskSteps: TaskStepEntity[] = planResult.steps.map((s) => ({
          id: 0,
          taskId,
          stepNumber: s.stepIndex,
          title: s.title,
          description: s.detail,
          toolRequired: s.toolName,
          status: s.status,
          output: s.detail,
        }));
        await AgentRepository.createTaskWithSteps(taskEntity, taskSteps);
      } catch (saveErr) {
        console.warn('[agentStore] فشل حفظ المهمة/الخطوات:', saveErr);
      }

      // 4. حفظ العرض إذا وُلد (مع مرونة في الفشل)
      if (planResult.intent === 'CREATE_PRESENTATION') {
        try {
          await saveGeneratedPresentation(text, planResult.generatedArtifacts);
        } catch (presErr) {
          console.warn('[agentStore] فشل حفظ العرض:', presErr);
        }
      }

      // 5. رسالة الوكيل
      const toolInfo = planResult.routedModelName
        ? `${planResult.primaryToolUsed ?? 'OpenCode Core'} [${planResult.routedModelName}]`
        : planResult.primaryToolUsed;
      await AgentRepository.addMessage(
        conversationId,
        'agent',
        planResult.finalResponse,
        toolInfo,
        planResult.tokenSavingsInfo ?? planResult.generatedArtifacts.join('\n')
      );

      // 6. سجل التدقيق
      try {
        await AgentRepository.logAction(
          planResult.primaryToolUsed ?? 'AI_RESPONSE',
          'AGENT_CORE',
          `Executed goal: ${text.slice(0, 50)}`
        );
      } catch (logErr) {
        console.warn('[agentStore] فشل تسجيل سجل التدقيق:', logErr);
      }

      set({
        isSending: false,
        sendError: null,
        lastFailedText: null,
        uiState: {
          ...get().uiState,
          agentState: voiceActive ? get().uiState.agentState : BubbleState.IDLE,
          activeTaskStatus: 'تم إنجاز المهمة بنجاح ✓',
        },
      });

      await get().reloadCollections();

      // 7. نطق الرد عند الطلب
      if (speakResponse && myVoiceTurn === get().voiceTurn) {
        const voice = get().uiState.voiceSettings;
        // إشعار المتحكم بأن الصوت يُجهَّز الآن (GENERATING → PREPARING_SPEECH)
        // حتى تنتقل الكرة لحالة «تجهيز النطق» ثم إلى SPEAKING عند أول صوت فعلي.
        voiceBundle?.controller.prepareSpeech();
        await getVoiceHelper(set).speak(
          planResult.finalResponse,
          voice.voiceGender === 'female',
          voice.speechRate,
          voice.pitch
        );
      }
      return true;
    } catch (e: any) {
      const message =
        (e && typeof e === 'object' && 'message' in e
          ? String((e as any).message)
          : 'تعذر تنفيذ المهمة')
        || 'خطأ غير متوقع أثناء تنفيذ المهمة';
      set({
        isSending: false,
        sendError: message,
        lastFailedText: text,
        uiState: {
          ...get().uiState,
          agentState: voiceActive ? get().uiState.agentState : BubbleState.ERROR,
          activeTaskStatus: 'حدث خطأ أثناء تنفيذ المهمة',
        },
      });
      await get().reloadCollections();
      return false;
    }
  },

  async retrySend(): Promise<boolean> {
    const failedText = get().lastFailedText;
    if (!failedText) return false;
    const conversationId = get().uiState.currentConversationId;
    // إزالة آخر رسالة مستخدم مكررة قبل إعادة الإرسال لمنع التكرار في السجل.
    await AgentRepository.deleteLastUserMessage(conversationId, failedText);
    return get().sendUserMessage(failedText);
  },

  async startVoiceListening() {
    const v = get().uiState.voiceSettings;
    set({ voiceTurn: get().voiceTurn + 1 }); // دور صوتي جديد: أي ردّ قديم لا يُنطق.
    await getVoiceController(set).controller.startConversation({
      continuous: v.continuousListening,
    });
  },

  async stopVoiceListening() {
    // المحرك (server) سيفرغ التسجيل ويصدر speechEnded(final) → يقرر المتحكم
    // النهاية والإرسال إلى الوكيل. (في المحرك الفعلي تُدار النهاية تلقائياً بـVAD).
    await getVoiceController(set).controller.stopListening();
  },

  async interruptSpeech() {
    set({ voiceTurn: get().voiceTurn + 1 }); // إبطال أي ردّ قيد النطق
    await getVoiceController(set).controller.handleInterruption();
  },

  async stopVoiceConversation() {
    // إنهاء الجلسة الصوتية بالكامل: إيقاف النطق وإغلاق الميكروفون دون إعادة فتحه.
    set({ voiceTurn: get().voiceTurn + 1 });
    await getVoiceController(set).controller.stopConversation();
  },

  async updateVoiceBubble(bubbleId: number) {
    const updated = { ...get().uiState.voiceSettings, selectedBubbleId: bubbleId };
    set({ uiState: { ...get().uiState, voiceSettings: updated } });
    await AgentRepository.saveVoiceSettings(updated);
  },

  async updateVoiceGender(gender: string) {
    const updated = { ...get().uiState.voiceSettings, voiceGender: gender };
    set({ uiState: { ...get().uiState, voiceSettings: updated } });
    await AgentRepository.saveVoiceSettings(updated);
  },

  async updateVoiceAccent(accent: string) {
    const updated = { ...get().uiState.voiceSettings, accent: accent };
    set({ uiState: { ...get().uiState, voiceSettings: updated } });
    await AgentRepository.saveVoiceSettings(updated);
  },

  async updateVoiceSliders(speed: number, pitch: number, volume: number) {
    const updated = { ...get().uiState.voiceSettings, speechRate: speed, pitch: pitch, volume: volume };
    set({ uiState: { ...get().uiState, voiceSettings: updated } });
    await AgentRepository.saveVoiceSettings(updated);
  },

  async updateVoiceResponses(enabled: boolean) {
    const updated = { ...get().uiState.voiceSettings, voiceResponsesEnabled: enabled };
    set({ uiState: { ...get().uiState, voiceSettings: updated } });
    await AgentRepository.saveVoiceSettings(updated);
  },

  async updateContinuousListening(enabled: boolean) {
    const updated = { ...get().uiState.voiceSettings, continuousListening: enabled };
    set({ uiState: { ...get().uiState, voiceSettings: updated } });
    await AgentRepository.saveVoiceSettings(updated);
  },

  async updateVoiceLanguage(language: string) {
    const updated = { ...get().uiState.voiceSettings, language: language };
    set({ uiState: { ...get().uiState, voiceSettings: updated } });
    await AgentRepository.saveVoiceSettings(updated);
  },

  async updateNoiseSensitivity(value: number) {
    const updated = { ...get().uiState.voiceSettings, noiseSensitivity: value };
    set({ uiState: { ...get().uiState, voiceSettings: updated } });
    await AgentRepository.saveVoiceSettings(updated);
  },

  async updateUserProfile(profile: UserProfileEntity) {
    set({ uiState: { ...get().uiState, userProfile: profile } });
    await AgentRepository.saveUserProfile(profile);
    await AgentRepository.logAction('UPDATE_PROFILE', 'USER_PROFILE', `Updated profile for ${profile.name}`);
    await get().reloadCollections();
  },

  async addMemory(key: string, value: string) {
    await AgentRepository.addMemory('custom', key, value);
    await AgentRepository.logAction('ADD_MEMORY', 'SELECTIVE_MEMORY', `Stored memory: ${key}`);
    await get().reloadCollections();
  },

  async deleteMemory(id: number) {
    await AgentRepository.deleteMemoryById(id);
    await AgentRepository.logAction('DELETE_MEMORY', 'SELECTIVE_MEMORY', `Deleted memory item #${id}`);
    await get().reloadCollections();
  },

  async clearAllMemories() {
    await AgentRepository.clearMemories();
    await AgentRepository.logAction('CLEAR_ALL_MEMORIES', 'SELECTIVE_MEMORY', 'Cleared all user selective memories');
    await get().reloadCollections();
  },

  setBrowserUrl(url: string) {
    set({ uiState: { ...get().uiState, browserUrl: url } });
  },

  toggleReaderMode() {
    set({ uiState: { ...get().uiState, isReaderMode: !get().uiState.isReaderMode } });
  },

  async createPresentation(topic: string, count: number) {
    await get().sendUserMessage(`أنشئ عرضًا تقديميًا من ${count} شرائح عن: ${topic}`);
  },
}));

async function saveGeneratedPresentation(topic: string, artifactTitles: string[]) {
  const presId = `pres_${Date.now()}`;
  const presentation: PresentationEntity = {
    id: presId,
    title: topic.slice(0, 35),
    topic: topic,
    themeColor: '#00F0FF',
    createdAt: Date.now(),
    slidesCount: Math.max(4, artifactTitles.length),
  };
  const slides: SlideEntity[] = artifactTitles.map((title, index) => ({
    id: 0,
    presentationId: presId,
    slideNumber: index + 1,
    title,
    content: `المحتوى التفصيلي للشريحة ${index} لموضوع: ${topic}`,
    bulletPointsJson: 'الركيزة الأساسية الأولى,مؤشر الأداء والإنتاجية,خطة التحقق والتسليم',
    notes: null,
    iconName: 'auto_awesome',
  }));
  await AgentRepository.savePresentationWithSlides(presentation, slides);
}

async function seedInitialPresentation() {
  const presId = 'pres_welcome';
  const presentation: PresentationEntity = {
    id: presId,
    title: 'وكيل أسامة — العرض المعماري والقدرات الذكية',
    topic: 'مقدمة شاملة عن وكيل أسامة',
    themeColor: '#00F0FF',
    createdAt: Date.now(),
    slidesCount: 5,
  };
  const slides: SlideEntity[] = [
    {
      id: 0,
      presentationId: presId,
      slideNumber: 1,
      title: 'وكيل أسامة — Osamah Agent',
      content: 'الوكيل الذكي العملي المتكامل للمهندس أسامة العُمري',
      bulletPointsJson: 'تنفيذ المهام المعقدة,توليد التقارير والعروض,تفاعل صوتي بـ 19 كرة',
      notes: null,
      iconName: 'auto_awesome',
    },
    {
      id: 0,
      presentationId: presId,
      slideNumber: 2,
      title: 'محرك التخطيط والتنفيذ (Agent Core)',
      content: 'فهم النية وتحديد الأدوات المؤتمتة ومتابعة الخطوات',
      bulletPointsJson: 'Search Tool,PDF Tool,Presentation Studio,Browser Automation',
      notes: null,
      iconName: 'star',
    },
    {
      id: 0,
      presentationId: presId,
      slideNumber: 3,
      title: 'الذاكرة الانتقائية والخصوصية',
      content: 'حفظ ما يسمح به المستخدم فقط مع إمكانية المحو الكامل',
      bulletPointsJson: 'Privacy-by-Design,تشفير البيانات,سجل تدقيق كامل',
      notes: null,
      iconName: 'shield',
    },
    {
      id: 0,
      presentationId: presId,
      slideNumber: 4,
      title: 'المتصفح والبحث المعمق',
      content: 'استخلاص المقالات والمصادر بدون إعلانات وتلخيص الأدلة',
      bulletPointsJson: 'Multi-Query Search,Reader Mode,Deduplication',
      notes: null,
      iconName: 'language',
    },
    {
      id: 0,
      presentationId: presId,
      slideNumber: 5,
      title: 'الخلاصة والبدء السريع',
      content: 'ابدأ بكتابة أو نطق مهمتك وسيقوم الوكيل بتنفيذها فوراً',
      bulletPointsJson: 'أداء خفيف جداً,حجم APK أقل من 25MB,تجربة مستخدم راقية',
      notes: null,
      iconName: 'rocket',
    },
  ];
  await AgentRepository.savePresentationWithSlides(presentation, slides);
}