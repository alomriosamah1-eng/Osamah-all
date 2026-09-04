// طبقة التزويد (ProviderAdapter) — عزل الاتصال بالنماذج خلف واجهة موحدة.
// الهدف: الحفاظ على سلوك الأصل (Gemini REST مباشر + الرد المحلي) مع تمكين ربط
// OpenCode (نماذج/مزوّدات/اتصال) لاحقاً دون تغيير بقية النظام.

export enum OpenCodeModel {
  GEMINI_2_5_FLASH = 'GEMINI_2_5_FLASH',
  GEMINI_3_PRO = 'GEMINI_3_PRO',
  CLAUDE_3_5_SONNET = 'CLAUDE_3_5_SONNET',
  GPT_4O = 'GPT_4O',
  DEEPSEEK_V3 = 'DEEPSEEK_V3',
  LOCAL_EMBEDDED_CORE = 'LOCAL_EMBEDDED_CORE',
}

export interface AgentModelInfo {
  modelId: string;
  displayName: string;
  provider: string;
  contextWindow: string;
  costEfficiency: string;
  specialtyAr: string;
}

export const OPENCODE_MODELS: Record<OpenCodeModel, AgentModelInfo> = {
  [OpenCodeModel.GEMINI_2_5_FLASH]: {
    modelId: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    provider: 'Google',
    contextWindow: '1M Tokens',
    costEfficiency: 'عالية جداً (سريع وخفيف)',
    specialtyAr: 'الاستجابة الفورية، الصوت، والتحليل اللحظي',
  },
  [OpenCodeModel.GEMINI_3_PRO]: {
    modelId: 'gemini-3-pro',
    displayName: 'Gemini 3 Pro',
    provider: 'Google',
    contextWindow: '2M Tokens',
    costEfficiency: 'متوازنة (قدرات استدلال عليا)',
    specialtyAr: 'العروض الضخمة (100+ شريحة) والمستندات والكتب',
  },
  [OpenCodeModel.CLAUDE_3_5_SONNET]: {
    modelId: 'claude-3-5-sonnet',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextWindow: '200K Tokens',
    costEfficiency: 'متوازنة',
    specialtyAr: 'الصياغة الأدبية والتحليل الفلسفي والتنظيمي',
  },
  [OpenCodeModel.GPT_4O]: {
    modelId: 'gpt-4o',
    displayName: 'GPT-4o Omnichannel',
    provider: 'OpenAI',
    contextWindow: '128K Tokens',
    costEfficiency: 'قياسية',
    specialtyAr: 'حل المشكلات متعددة الوسائط والمنطق',
  },
  [OpenCodeModel.DEEPSEEK_V3]: {
    modelId: 'deepseek-chat-v3',
    displayName: 'DeepSeek V3',
    provider: 'DeepSeek',
    contextWindow: '128K Tokens',
    costEfficiency: 'اقتصادية جداً',
    specialtyAr: 'الرياضيات، المنطق، وهندسة المعمارية',
  },
  [OpenCodeModel.LOCAL_EMBEDDED_CORE]: {
    modelId: 'opencode-embedded',
    displayName: 'محرك OpenCode المحلي المدمج',
    provider: 'Offline Native',
    contextWindow: 'غير محدود محلياً',
    costEfficiency: 'صفر استهلاك للشبكة (محلي 100%)',
    specialtyAr: 'العمل بدون إنترنت، الخصوصية التامة',
  },
};

export enum RoutingStrategy {
  INTELLIGENT_AUTO = 'INTELLIGENT_AUTO',
  MAX_PERFORMANCE = 'MAX_PERFORMANCE',
  TOKEN_SAVER = 'TOKEN_SAVER',
  OFFLINE_ONLY = 'OFFLINE_ONLY',
}

export const ROUTING_STRATEGIES: Record<RoutingStrategy, { displayNameAr: string; descriptionAr: string }> = {
  [RoutingStrategy.INTELLIGENT_AUTO]: {
    displayNameAr: 'التوجيه الذكي التلقائي (موصى به)',
    descriptionAr: 'اختيار النموذج الأنسب للمهمة وتقليل استهلاك التوكن',
  },
  [RoutingStrategy.MAX_PERFORMANCE]: {
    displayNameAr: 'أقصى أداء واستدلال',
    descriptionAr: 'توجيه كافة المهام المعقدة لأقوى النماذج الاستدلالية',
  },
  [RoutingStrategy.TOKEN_SAVER]: {
    displayNameAr: 'التوفير الذكي للتوكن',
    descriptionAr: 'ضغط السياق واستخدام نماذج سريعة واقتصادية',
  },
  [RoutingStrategy.OFFLINE_ONLY]: {
    displayNameAr: 'العمل المحلي دون إنترنت',
    descriptionAr: 'الاعتماد 100% على الخادم والمحرك الداخلي',
  },
};

export interface ProviderRequest {
  systemInstruction: string;
  prompt: string;
  userContext: string;
  model: OpenCodeModel;
  apiKey?: string;
  endpoint?: string;
}

/** واجهة موحدة لكل مزوّد — تُعيد نص الرد أو null عند الفشل/عدم الربط */
export interface ProviderAdapter {
  readonly providerId: string;
  generateResponse(request: ProviderRequest): Promise<string | null>;
  /** التحقق من جاهزية الاتصال بالمزوّد */
  isConnected(): boolean;
}