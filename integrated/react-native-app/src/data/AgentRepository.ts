// الـ Repository — منقول من data/repository/AgentRepository.kt
import { getDb } from './db';
import {
  AuditLogEntity,
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
} from './types';
import * as SQLite from 'expo-sqlite';

function rowToMessage(r: any): MessageEntity {
  return {
    id: r.id,
    conversationId: r.conversationId,
    sender: r.sender,
    text: r.text,
    timestamp: r.timestamp,
    toolName: r.toolName ?? null,
    toolInput: r.toolInput ?? null,
    toolResult: r.toolResult ?? null,
    status: r.status,
    sourcesJson: r.sourcesJson ?? null,
  };
}

function rowToPresentation(r: any): PresentationEntity {
  return {
    id: r.id,
    title: r.title,
    topic: r.topic,
    themeColor: r.themeColor,
    createdAt: r.createdAt,
    slidesCount: r.slidesCount,
  };
}

function rowToSlide(r: any): SlideEntity {
  return {
    id: r.id,
    presentationId: r.presentationId,
    slideNumber: r.slideNumber,
    title: r.title,
    content: r.content,
    bulletPointsJson: r.bulletPointsJson,
    notes: r.notes ?? null,
    iconName: r.iconName,
  };
}

function rowToMemory(r: any): MemoryEntity {
  return {
    id: r.id,
    category: r.category,
    key: r.key,
    value: r.value,
    importance: r.importance,
    timestamp: r.timestamp,
  };
}

function rowToTask(r: any): TaskEntity {
  return {
    id: r.id,
    title: r.title,
    goal: r.goal,
    status: r.status,
    createdAt: r.createdAt,
    completedAt: r.completedAt ?? null,
  };
}

function rowToTaskStep(r: any): TaskStepEntity {
  return {
    id: r.id,
    taskId: r.taskId,
    stepNumber: r.stepNumber,
    title: r.title,
    description: r.description,
    toolRequired: r.toolRequired,
    status: r.status,
    output: r.output ?? null,
  };
}

function rowToAuditLog(r: any): AuditLogEntity {
  return {
    id: r.id,
    actionName: r.actionName,
    scope: r.scope,
    details: r.details,
    timestamp: r.timestamp,
    userConfirmed: !!r.userConfirmed,
  };
}

function rowToConversation(r: any): ConversationEntity {
  return { id: r.id, title: r.title, createdAt: r.createdAt, updatedAt: r.updatedAt };
}

function rowToUserProfile(r: any): UserProfileEntity {
  return {
    id: r.id,
    name: r.name,
    language: r.language,
    country: r.country,
    city: r.city,
    jobTitle: r.jobTitle,
    field: r.field,
    specialization: r.specialization,
    experienceLevel: r.experienceLevel,
    primaryGoal: r.primaryGoal,
    updatedAt: r.updatedAt,
  };
}

function rowToVoiceSettings(r: any): VoiceSettingsEntity {
  return {
    id: r.id,
    voiceGender: r.voiceGender,
    accent: r.accent,
    speechRate: r.speechRate,
    pitch: r.pitch,
    volume: r.volume,
    selectedBubbleId: r.selectedBubbleId,
    bargeInEnabled: !!r.bargeInEnabled,
    voiceResponsesEnabled: r.voiceResponsesEnabled === undefined ? true : !!r.voiceResponsesEnabled,
    continuousListening: r.continuousListening === undefined ? false : !!r.continuousListening,
    language: r.language ?? 'ar',
    noiseSensitivity: r.noiseSensitivity === undefined ? 0.5 : r.noiseSensitivity,
  };
}

export const AgentRepository = {
  // ---------- User Profile ----------
  async getUserProfile(): Promise<UserProfileEntity | null> {
    const db = await getDb();
    const r = await db.getFirstAsync('SELECT * FROM user_profiles WHERE id = 1 LIMIT 1');
    return r ? rowToUserProfile(r) : null;
  },

  async getCurrentUserProfile(): Promise<UserProfileEntity> {
    const existing = await this.getUserProfile();
    if (existing) return existing;
    await AgentRepository.saveUserProfile(defaultUserProfile);
    return defaultUserProfile;
  },

  async saveUserProfile(profile: UserProfileEntity): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO user_profiles
       (id, name, language, country, city, jobTitle, field, specialization, experienceLevel, primaryGoal, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      profile.id,
      profile.name,
      profile.language,
      profile.country,
      profile.city,
      profile.jobTitle,
      profile.field,
      profile.specialization,
      profile.experienceLevel,
      profile.primaryGoal,
      profile.updatedAt
    );
  },

  // ---------- Memories ----------
  async getAllMemories(): Promise<MemoryEntity[]> {
    const db = await getDb();
    const rows = await db.getAllAsync('SELECT * FROM memories ORDER BY importance DESC, timestamp DESC');
    return rows.map(rowToMemory);
  },

  async addMemory(category: string, key: string, value: string, importance = 3): Promise<number> {
    const db = await getDb();
    const res = await db.runAsync(
      'INSERT OR REPLACE INTO memories (category, key, value, importance, timestamp) VALUES (?, ?, ?, ?, ?)',
      category,
      key,
      value,
      importance,
      Date.now()
    );
    return res.lastInsertRowId;
  },

  async deleteMemoryById(id: number): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM memories WHERE id = ?', id);
  },

  async clearMemories(): Promise<void> {
    const db = await getDb();
    await db.execAsync('DELETE FROM memories');
  },

  // ---------- Conversations ----------
  async createConversation(id: string, title: string): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    await db.runAsync(
      'INSERT OR REPLACE INTO conversations (id, title, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      id,
      title,
      now,
      now
    );
  },

  async getAllConversations(): Promise<ConversationEntity[]> {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM conversations ORDER BY updatedAt DESC'
    );
    return rows.map(rowToConversation);
  },

  async updateConversationTitle(id: string, title: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE conversations SET title = ?, updatedAt = ? WHERE id = ?', title, Date.now(), id);
  },

  async getLastMessagePreview(conversationId: string): Promise<string> {
    const db = await getDb();
    const r: any = await db.getFirstAsync(
      'SELECT text FROM messages WHERE conversationId = ? AND sender = ? ORDER BY timestamp DESC LIMIT 1',
      conversationId,
      'user'
    );
    return r?.text ?? '';
  },

  async deleteConversation(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM messages WHERE conversationId = ?', id);
    await db.runAsync('DELETE FROM conversations WHERE id = ?', id);
  },

  // ---------- Messages ----------
  async getMessages(conversationId: string): Promise<MessageEntity[]> {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC',
      conversationId
    );
    return rows.map(rowToMessage);
  },

  async addMessage(
    conversationId: string,
    sender: string,
    text: string,
    toolName: string | null = null,
    toolInput: string | null = null,
    toolResult: string | null = null,
    status = 'COMPLETED',
    sourcesJson: string | null = null
  ): Promise<number> {
    const db = await getDb();
    // تحديث updatedAt على المحادثة عند كل رسالة (مثل سلوك الأصل في تحديثات المحادثات)
    const res = await db.runAsync(
      `INSERT OR REPLACE INTO messages
       (conversationId, sender, text, timestamp, toolName, toolInput, toolResult, status, sourcesJson)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      conversationId,
      sender,
      text,
      Date.now(),
      toolName,
      toolInput,
      toolResult,
      status,
      sourcesJson
    );
    await db.runAsync('UPDATE conversations SET updatedAt = ? WHERE id = ?', Date.now(), conversationId);
    return res.lastInsertRowId;
  },

  async deleteMessagesForConversation(conversationId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM messages WHERE conversationId = ?', conversationId);
  },

  /** يُحذف آخر رسالة مستخدم مطابقة للنص (تُستدعى قبل إعادة المحاولة لمنع التكرار). */
  async deleteLastUserMessage(conversationId: string, text: string): Promise<void> {
    const db = await getDb();
    const row: any = await db.getFirstAsync(
      'SELECT id FROM messages WHERE conversationId = ? AND sender = ? AND text = ? ORDER BY timestamp DESC LIMIT 1',
      conversationId,
      'user',
      text
    );
    if (row) await db.runAsync('DELETE FROM messages WHERE id = ?', row.id);
  },

  // ---------- Tasks ----------
  async getAllTasks(): Promise<TaskEntity[]> {
    const db = await getDb();
    const rows = await db.getAllAsync('SELECT * FROM tasks ORDER BY createdAt DESC');
    return rows.map(rowToTask);
  },

  async getTaskById(taskId: string): Promise<TaskEntity | null> {
    const db = await getDb();
    const r = await db.getFirstAsync('SELECT * FROM tasks WHERE id = ? LIMIT 1', taskId);
    return r ? rowToTask(r) : null;
  },

  async createTaskWithSteps(task: TaskEntity, steps: TaskStepEntity[]): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO tasks (id, title, goal, status, createdAt, completedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      task.id,
      task.title,
      task.goal,
      task.status,
      task.createdAt,
      task.completedAt
    );
    for (const step of steps) {
      await db.runAsync(
        `INSERT OR REPLACE INTO task_steps (taskId, stepNumber, title, description, toolRequired, status, output)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        step.taskId,
        step.stepNumber,
        step.title,
        step.description,
        step.toolRequired,
        step.status,
        step.output ?? null
      );
    }
  },

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    const task = await this.getTaskById(taskId);
    if (!task) return;
    const updated: TaskEntity = {
      ...task,
      status,
      completedAt: status === 'COMPLETED' ? Date.now() : null,
    };
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO tasks (id, title, goal, status, createdAt, completedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      updated.id,
      updated.title,
      updated.goal,
      updated.status,
      updated.createdAt,
      updated.completedAt
    );
  },

  async getTaskSteps(taskId: string): Promise<TaskStepEntity[]> {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM task_steps WHERE taskId = ? ORDER BY stepNumber ASC',
      taskId
    );
    return rows.map(rowToTaskStep);
  },

  async updateTaskStep(step: TaskStepEntity): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE task_steps SET taskId=?, stepNumber=?, title=?, description=?, toolRequired=?, status=?, output=?
       WHERE id=?`,
      step.taskId,
      step.stepNumber,
      step.title,
      step.description,
      step.toolRequired,
      step.status,
      step.output ?? null,
      step.id
    );
  },

  // ---------- Presentations ----------
  async getAllPresentations(): Promise<PresentationEntity[]> {
    const db = await getDb();
    const rows = await db.getAllAsync('SELECT * FROM presentations ORDER BY createdAt DESC');
    return rows.map(rowToPresentation);
  },

  async getPresentationById(id: string): Promise<PresentationEntity | null> {
    const db = await getDb();
    const r = await db.getFirstAsync('SELECT * FROM presentations WHERE id = ? LIMIT 1', id);
    return r ? rowToPresentation(r) : null;
  },

  async getSlides(presentationId: string): Promise<SlideEntity[]> {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM slides WHERE presentationId = ? ORDER BY slideNumber ASC',
      presentationId
    );
    return rows.map(rowToSlide);
  },

  async savePresentationWithSlides(presentation: PresentationEntity, slides: SlideEntity[]): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO presentations (id, title, topic, themeColor, createdAt, slidesCount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      presentation.id,
      presentation.title,
      presentation.topic,
      presentation.themeColor,
      presentation.createdAt,
      presentation.slidesCount
    );
    await db.runAsync('DELETE FROM slides WHERE presentationId = ?', presentation.id);
    for (const slide of slides) {
      await db.runAsync(
        `INSERT OR REPLACE INTO slides
         (presentationId, slideNumber, title, content, bulletPointsJson, notes, iconName)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        slide.presentationId,
        slide.slideNumber,
        slide.title,
        slide.content,
        slide.bulletPointsJson,
        slide.notes ?? null,
        slide.iconName
      );
    }
  },

  async deletePresentation(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM slides WHERE presentationId = ?', id);
    await db.runAsync('DELETE FROM presentations WHERE id = ?', id);
  },

  // ---------- Audit Logs ----------
  async getAuditLogs(): Promise<AuditLogEntity[]> {
    const db = await getDb();
    const rows = await db.getAllAsync('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    return rows.map(rowToAuditLog);
  },

  async logAction(actionName: string, scope: string, details: string, confirmed = true): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO audit_logs (actionName, scope, details, timestamp, userConfirmed) VALUES (?, ?, ?, ?, ?)',
      actionName,
      scope,
      details,
      Date.now(),
      confirmed ? 1 : 0
    );
  },

  async clearAuditLogs(): Promise<void> {
    const db = await getDb();
    await db.execAsync('DELETE FROM audit_logs');
  },

  // ---------- Voice Settings ----------
  async getVoiceSettings(): Promise<VoiceSettingsEntity | null> {
    const db = await getDb();
    const r = await db.getFirstAsync('SELECT * FROM voice_settings WHERE id = 1 LIMIT 1');
    return r ? rowToVoiceSettings(r) : null;
  },

  async saveVoiceSettings(settings: VoiceSettingsEntity): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO voice_settings
       (id, voiceGender, accent, speechRate, pitch, volume, selectedBubbleId, bargeInEnabled,
        voiceResponsesEnabled, continuousListening, language, noiseSensitivity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      settings.id,
      settings.voiceGender,
      settings.accent,
      settings.speechRate,
      settings.pitch,
      settings.volume,
      settings.selectedBubbleId,
      settings.bargeInEnabled ? 1 : 0,
      settings.voiceResponsesEnabled ? 1 : 0,
      settings.continuousListening ? 1 : 0,
      settings.language ?? 'ar',
      settings.noiseSensitivity ?? 0.5
    );
  },

  // ---------- مزامنة كاملة (تُستدعى بعد كل كتابة لتحديث حالة التطبيق) ----------
  async loadAllCollections(conversationId = 'default_session'): Promise<{
    conversations: ConversationEntity[];
    messages: MessageEntity[];
    tasks: TaskEntity[];
    presentations: PresentationEntity[];
    memories: MemoryEntity[];
    auditLogs: AuditLogEntity[];
    userProfile: UserProfileEntity | null;
    voiceSettings: VoiceSettingsEntity | null;
  }> {
    const [conversations, messages, tasks, presentations, memories, auditLogs, userProfile, voiceSettings] =
      await Promise.all([
        this.getAllConversations(),
        this.getMessages(conversationId),
        this.getAllTasks(),
        this.getAllPresentations(),
        this.getAllMemories(),
        this.getAuditLogs(),
        this.getUserProfile(),
        this.getVoiceSettings(),
      ]);
    return { conversations, messages, tasks, presentations, memories, auditLogs, userProfile, voiceSettings };
  },
};

export type { SQLite };