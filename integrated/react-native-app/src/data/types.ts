// الكيانات — منقولة حرفياً من data/local/entity/Entities.kt
export interface UserProfileEntity {
  id: number;
  name: string;
  language: string;
  country: string;
  city: string;
  jobTitle: string;
  field: string;
  specialization: string;
  experienceLevel: string;
  primaryGoal: string;
  updatedAt: number;
}

export const defaultUserProfile: UserProfileEntity = {
  id: 1,
  name: 'أسامة',
  language: 'ar',
  country: 'اليمن',
  city: 'صنعاء',
  jobTitle: 'مهندس ومطور برمجيات',
  field: 'الهندسة وتطوير الأنظمة الذكية',
  specialization: 'هندسة البرمجيات والذكاء الاصطناعي',
  experienceLevel: 'خبير / مهندس رئيسي',
  primaryGoal: 'الإنتاجية وإنجاز المشاريع والأبحاث البرمجية المتقدمة',
  updatedAt: Date.now(),
};

export interface MemoryEntity {
  id: number;
  category: string; // "preference" | "project" | "fact" | "rule"
  key: string;
  value: string;
  importance: number; // 1..5
  timestamp: number;
}

export interface ConversationEntity {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface MessageEntity {
  id: number;
  conversationId: string;
  sender: string; // "user" | "agent" | "system"
  text: string;
  timestamp: number;
  toolName?: string | null;
  toolInput?: string | null;
  toolResult?: string | null;
  status: string; // "PENDING" | "EXECUTING" | "COMPLETED" | "FAILED"
  sourcesJson?: string | null;
}

export interface TaskEntity {
  id: string;
  title: string;
  goal: string;
  status: string; // "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED"
  createdAt: number;
  completedAt: number | null;
}

export interface TaskStepEntity {
  id: number;
  taskId: string;
  stepNumber: number;
  title: string;
  description: string;
  toolRequired: string;
  status: string; // "PENDING" | "RUNNING" | "COMPLETED" | "FAILED"
  output?: string | null;
}

export interface PresentationEntity {
  id: string;
  title: string;
  topic: string;
  themeColor: string;
  createdAt: number;
  slidesCount: number;
}

export interface SlideEntity {
  id: number;
  presentationId: string;
  slideNumber: number;
  title: string;
  content: string;
  bulletPointsJson: string;
  notes?: string | null;
  iconName: string;
}

export interface AuditLogEntity {
  id: number;
  actionName: string;
  scope: string;
  details: string;
  timestamp: number;
  userConfirmed: boolean;
}

export interface VoiceSettingsEntity {
  id: number;
  voiceGender: string; // "male" | "female"
  accent: string; // "syrian" | "fusha"
  speechRate: number;
  pitch: number;
  volume: number;
  selectedBubbleId: number; // 1..19
  bargeInEnabled: boolean;
  voiceResponsesEnabled: boolean; // تشغيل/إيقاف الرد الصوتي
  continuousListening: boolean; // الاستماع المستمر (حلقة تلقائية)
  language: string; // "auto" | "ar" | "en"
  noiseSensitivity: number; // 0..1 (كلما زاد حساسيّة أعلى)
}

export const defaultVoiceSettings: VoiceSettingsEntity = {
  id: 1,
  voiceGender: 'male',
  accent: 'syrian',
  speechRate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  selectedBubbleId: 1,
  bargeInEnabled: true,
  voiceResponsesEnabled: true,
  continuousListening: true,
  language: 'ar',
  noiseSensitivity: 0.5,
};