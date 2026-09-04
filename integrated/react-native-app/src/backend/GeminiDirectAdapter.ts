// المزوّد المباشر لـ Gemini REST — منقول من OpenCodeControlSubsystem.kt / GeminiService.kt
// يحتفظ بنفس نقطة النهاية (gemini-2.5-flash) ومعايير الولّد (temp 0.4 / topP 0.85).
// الأمان: لا يُقرأ أي سر من بيئة الجهاز/APK. المفتاح لا يحمل داخل التطبيق أبداً؛
// يُمرَّر فقط عبر سياق خادمي آمن (request.apiKey) في بنية Server-First.
import { OpenCodeModel, ProviderAdapter, ProviderRequest } from './ProviderAdapter';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const isBlankPlaceholderKey = (key: string | undefined): boolean =>
  !key || key.trim().length === 0 || key === 'MY_GEMINI_API_KEY';

export class GeminiDirectAdapter implements ProviderAdapter {
  readonly providerId = 'gemini-direct';

  getApiKey(): string {
    // الأسرار خادمية فقط — لا يُقرأ مفتاح من بيئة APK مطلقاً.
    return '';
  }

  isConnected(): boolean {
    // بدون سر خادمي يُمرَّر في الطلب، المزوّد المباشر غير موصول من الجهاز.
    return false;
  }

  async generateResponse(request: ProviderRequest): Promise<string | null> {
    if (request.model === OpenCodeModel.LOCAL_EMBEDDED_CORE) return null;
    const apiKey = request.apiKey ?? this.getApiKey();
    if (isBlankPlaceholderKey(apiKey)) return null;

    try {
      // معايير الصدق والتحقق الصارم المضادة للهلوسة
      const groundedSystemInstruction = `
${request.systemInstruction}

[معايير الصدق والتحقق الصارم — Anti-Hallucination Rules]:
1. لا تقدم أي معلومات أو إحصائيات وهمية أو مختلقة.
2. تحدث بحقائق موثقة وواقعية وقابلة للتطبيق.
3. أنت العقل المدبر والمساعد الشخصي للمهندس أسامة العُمري.
4. ركز على تنظيم المهام، إنتاجية الحياة، توليد العروض، والوثائق.`;

      const endpoint = request.endpoint ?? GEMINI_ENDPOINT;
      const separator = endpoint.includes('?') ? '&' : '?';
      const url = `${endpoint}${separator}key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `${groundedSystemInstruction}\n\n[USER_CONTEXT]\n${request.userContext}` }],
          },
          contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.85,
          },
        }),
      });

      if (!response.ok) return null;

      const json = await response.json();
      const candidates = json?.candidates as unknown[];
      const text = (candidates && candidates.length > 0
        ? extractTextFromCandidate(candidates[0])
        : '') as string;

      return text && text.trim().length > 0 ? text : null;
    } catch {
      return null;
    }
  }
}

function extractTextFromCandidate(candidate: any): string {
  const content = candidate?.content;
  const parts = content?.parts;
  if (parts && parts.length > 0) {
    return parts[0]?.text ?? '';
  }
  return '';
}