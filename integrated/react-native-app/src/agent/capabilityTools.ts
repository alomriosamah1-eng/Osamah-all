import { AgentTool, ToolResult, ToolScope } from './tools';
import { UserProfileEntity } from '../data/types';

function completed(summary: string, data: string | null = null, artifacts: string[] = []): ToolResult {
  return { success: true, summary, data, requiresConfirmation: false, artifacts };
}

/** Contract-level adapter for react-native-svg and react-native-qrcode-svg. */
export class QrCodeTool implements AgentTool {
  id = 'tool_qr_code';
  name = 'مولد رمز QR';
  description = 'إنشاء نموذج QR قابل للرسم عبر react-native-qrcode-svg وreact-native-svg.';
  scope = ToolScope.LOCAL_WRITE;
  requiresUserConfirmation = false;

  async execute(parameters: Record<string, string>): Promise<ToolResult> {
    const value = (parameters.value ?? parameters.url ?? '').trim();
    if (!value) return { success: false, summary: 'قيمة QR فارغة', data: null, requiresConfirmation: false, artifacts: [] };
    return completed('تم تجهيز QR للرسم عبر محرك SVG الأصلي.', JSON.stringify({ value, size: 256, logo: null }), []);
  }
}

/** Presentation-independent resume data adapter; rendering remains replaceable. */
export class ResumeTool implements AgentTool {
  id = 'tool_resume';
  name = 'منشئ السيرة الذاتية';
  description = 'تجهيز بيانات سيرة ذاتية منظمة قابلة للتصيير عبر محرك PDF أو قالب مستقبلي.';
  scope = ToolScope.LOCAL_WRITE;
  requiresUserConfirmation = false;

  async execute(parameters: Record<string, string>, profile: UserProfileEntity | null): Promise<ToolResult> {
    const name = profile?.name ?? parameters.name ?? 'المستخدم';
    const resume = {
      name,
      headline: profile?.jobTitle ?? parameters.headline ?? '',
      field: profile?.field ?? parameters.field ?? '',
      specialization: profile?.specialization ?? parameters.specialization ?? '',
      experience: profile?.experienceLevel ?? parameters.experience ?? '',
      summary: parameters.summary ?? '',
    };
    return completed('تم تجهيز نموذج السيرة الذاتية المنظم.', JSON.stringify(resume), []);
  }
}

/** Structured mind-map output adapter; visual layout is intentionally UI-independent. */
export class MindMapTool implements AgentTool {
  id = 'tool_mind_map';
  name = 'منشئ الخريطة الذهنية';
  description = 'تحويل الموضوع إلى بنية عقد وروابط قابلة للرسم بأي محرك MindMap مستقبلاً.';
  scope = ToolScope.LOCAL_WRITE;
  requiresUserConfirmation = false;

  async execute(parameters: Record<string, string>): Promise<ToolResult> {
    const topic = (parameters.topic ?? '').trim();
    if (!topic) return { success: false, summary: 'موضوع الخريطة فارغ', data: null, requiresConfirmation: false, artifacts: [] };
    const branches = (parameters.branches ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    const nodes = [{ id: 'root', label: topic, parentId: null }, ...branches.map((label, index) => ({ id: `node_${index + 1}`, label, parentId: 'root' }))];
    return completed('تم إنشاء بنية الخريطة الذهنية.', JSON.stringify({ topic, style: parameters.style ?? 'tree', nodes }), []);
  }
}

/** LiveKit boundary; token acquisition stays server-side and no secret is accepted here. */
export class VoiceAssistantTool implements AgentTool {
  id = 'tool_voice_assistant';
  name = 'المساعد الصوتي LiveKit';
  description = 'حد فاصل للمحادثة الصوتية؛ التوكن والاتصال يصدران من الخادم فقط.';
  scope = ToolScope.NETWORK_SEARCH;
  requiresUserConfirmation = false;

  async execute(parameters: Record<string, string>): Promise<ToolResult> {
    if (parameters.token || parameters.apiKey) {
      return { success: false, summary: 'رفض تمرير أسرار LiveKit إلى التطبيق', data: null, requiresConfirmation: false, artifacts: [] };
    }
    return completed('تم تجهيز طلب جلسة صوتية آمنة عبر خادم OSAMAH.', JSON.stringify({ room: parameters.room ?? null, tokenSource: 'server' }), []);
  }
}

export const CAPABILITY_TOOLS: AgentTool[] = [new QrCodeTool(), new ResumeTool(), new MindMapTool(), new VoiceAssistantTool()];
