// واجهات مكتوبة لقدرات خادم OSAMAH (تطابق الإجراءات في osamah-agent/server/routers.ts).
// هذه هي الجسر الوحيد بين الجهاز (Thin Client) والخادم؛ لا يتصل الجهاز بأي مزوّد مباشرة.
import { createOsamahClient, OsamahClient } from './client';
import { getApiBaseUrl } from '../constants/oauth';

export interface ServerHealth {
  status: 'ready';
  schemaVersion: string;
  mode: 'review_only' | 'full';
  message: string;
}

export type CapabilityState = 'available' | 'review_only' | 'unavailable';

export interface Capability {
  id: string;
  label: string;
  state: CapabilityState;
  reason?: string;
  requiresApproval: boolean;
}

export interface OpenCodeLiveStatus {
  state: string;
  connected: boolean;
  providerCount: number;
  modelCount: number;
  providers: { id: string; name: string; connected: boolean; models: { id: string; name: string }[] }[];
  defaultModels: { providerId: string; modelId: string }[];
  agents: { name: string; description?: string; mode?: string; native: boolean }[];
  sessions: { title?: string; updatedAt?: string }[];
  configuration: unknown;
  message: string;
}

/** نموذج حي في كتالوج OpenCode (يُقرأ من الخادم، لا يُزيّف). */
export interface LiveModel {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  connected: boolean;
  zenFree: boolean;
  reasoning: boolean;
  toolCalling: boolean;
  attachments: boolean;
  inputModalities: string[];
}

export interface LiveModelCatalog {
  state: 'ready' | 'not_configured' | 'authorization_required' | 'unreachable' | 'invalid_response';
  models: LiveModel[];
  total: number;
  offset: number;
  limit: number;
  nextOffset: number | null;
  previousOffset: number | null;
  message: string;
}

export interface LiveModelCatalogInput {
  offset?: number;
  limit?: number;
  search?: string;
  zenFreeOnly?: boolean;
}

export interface OpenCodeChatInput {
  text: string;
  confirmed: true;
  model?: { providerId: string; modelId: string };
  profile?: {
    name: string;
    jobTitle: string;
    field: string;
    specialization: string;
    primaryGoal: string;
  };
  memories?: Array<{ key: string; value: string }>;
}

export type OpenCodeChatResult = {
  state: 'completed' | 'not_configured' | 'authorization_required' | 'provider_authorization_required' | 'provider_unavailable' | 'model_unavailable' | 'unreachable' | 'invalid_response' | 'response_unavailable';
  reply?: string;
  message: string;
};

export interface FreeModelSelection {
  models: LiveModel[];
  selected: LiveModel | null;
  freeCount: number;
  connectedFreeCount: number;
}

class ServerApi {
  private readonly client: OsamahClient;

  constructor() {
    this.client = createOsamahClient();
  }

  async health(): Promise<ServerHealth> {
    return (await (this.client as unknown as { osamah: { health: { query: () => Promise<unknown> } } }).osamah.health.query()) as ServerHealth;
  }

  async capabilities(): Promise<Capability[]> {
    return (await (this.client as unknown as { osamah: { capabilities: { query: () => Promise<unknown> } } }).osamah.capabilities.query()) as Capability[];
  }

  async openCodeStatus(): Promise<OpenCodeLiveStatus> {
    return (await (this.client as unknown as { osamah: { opencode: { status: { query: () => Promise<unknown> } } } }).osamah.opencode.status.query()) as OpenCodeLiveStatus;
  }

  async liveModels(input: LiveModelCatalogInput): Promise<LiveModelCatalog> {
    return (await (this.client as unknown as { osamah: { opencode: { liveModels: { query: (i: LiveModelCatalogInput) => Promise<unknown> } } } }).osamah.opencode.liveModels.query(input)) as LiveModelCatalog;
  }

  async openCodeChat(input: OpenCodeChatInput): Promise<OpenCodeChatResult> {
    return (await (this.client as unknown as { osamah: { opencode: { chat: { mutate: (i: OpenCodeChatInput) => Promise<unknown> } } } }).osamah.opencode.chat.mutate(input)) as OpenCodeChatResult;
  }

  /** إرسال تسجيل صوتي خام إلى الخادم لتحويله نصاً (STT) عبر واجهة /api/voice/transcribe. */
  async transcribeAudio(audioBody: ArrayBuffer, engine: 'google' | 'local' = 'google'): Promise<string> {
    const res = await fetch(`${getApiBaseUrl()}/api/voice/transcribe?engine=${engine}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: audioBody,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `فشل تحويل الصوت إلى نص (${res.status})`);
    }
    const data = (await res.json()) as { text?: string; engine?: string; error?: string };
    if (!data?.text?.trim()) {
      throw new Error(data?.error || 'لم يُلتقط صوت واضح');
    }
    return data.text.trim();
  }

  /** جلب صوت عربي (TTS) من الخادم عبر /api/voice/tts — يعيد وحدات البايت ونوع الوسائط. */
  async fetchTtsAudio(text: string, voice: 'male' | 'female' = 'male'): Promise<{ bytes: ArrayBuffer; mimeType: string; engine: string } | null> {
    let res: Response;
    try {
      res = await fetch(`${getApiBaseUrl()}/api/voice/tts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });
    } catch {
      return null;
    }
    if (!res.ok) return null;
    const mimeType = res.headers.get('Content-Type')?.split(';')[0]?.trim() ?? 'audio/mpeg';
    const engine = res.headers.get('X-Voice') ?? 'sherpa-onnx';
    const bytes = await res.arrayBuffer().catch(() => null);
    if (!bytes || bytes.byteLength === 0) return null;
    return { bytes, mimeType, engine };
  }
}

export const serverApi = new ServerApi();

/**
 * نظام الاتصال والتبديل الذكي بين النماذج المجانية.
 * يقرأ الكتالوج الحي من الخادم، ويفضّل النماذج المتصلة ذات التكلفة الصفرية (zenFree).
 * لا يختار نموذجاً غير متصل ولا يخترع نماذج.
 */
export async function pickSmartFreeModel(limit = 60): Promise<FreeModelSelection> {
  const catalog = await serverApi.liveModels({ offset: 0, limit, zenFreeOnly: true });
  const models = Array.isArray(catalog?.models) ? catalog.models : [];
  const connectedFree = models.filter((model) => model.connected);
  return {
    models,
    selected: connectedFree[0] ?? null,
    freeCount: models.length,
    connectedFreeCount: connectedFree.length,
  };
}
