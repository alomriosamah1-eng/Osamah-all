// VoiceMetrics — مؤقتات وأدوات قياس زمن الاستجابة للمحادثة الصوتية (للمطوّر فقط، لا تُعرض للمستخدم).
// يقيس مؤشرات عنق الزجاجة الحقيقية:
//   TTFT  (Time To First Transcript)  : من بدء التسجيل حتى وصول النص من STT
//   TTFTT (Time To First Agent Token) : من إرسال النص حتى أول جزء/نص من الوكيل
//   TTFA  (Time To First Audio)       : من وصول الرد حتى بدء أول صوت
//   TRT   (Total Response Time)       : من بدء التسجيل حتى نهاية أول صوت
import { Platform } from 'react-native';

export interface VoiceMetrics {
  recordingStartedAt?: number;
  recordingStoppedAt?: number;
  transcriptAt?: number;
  agentRequestAt?: number;
  firstAgentTextAt?: number;
  synthesisStartAt?: number;
  firstAudioAt?: number;
}

const metrics: VoiceMetrics = {};

export function nowMs(): number {
  return Date.now();
}

export function markVoice(key: keyof VoiceMetrics): void {
  metrics[key] = nowMs();
}

export function elapsedMs(from?: number): number {
  if (!from) return 0;
  return nowMs() - from;
}

export function resetVoiceMetrics(): void {
  for (const k of Object.keys(metrics) as (keyof VoiceMetrics)[]) delete metrics[k];
}

function fmt(ms: number): string {
  return `${ms}ms`;
}

export function reportVoiceMetrics(): void {
  const p: string[] = [];
  const a = (label: string, from: keyof VoiceMetrics, to?: keyof VoiceMetrics) => {
    const fromAt = metrics[from];
    const toAt = to ? metrics[to] : nowMs();
    if (fromAt && toAt) p.push(`${label}=${fmt(toAt - fromAt)}`);
  };
  a('TTFT (transcript)', 'recordingStartedAt', 'transcriptAt');
  a('agent-request-latency', 'agentRequestAt', 'firstAgentTextAt');
  a('TTS-to-first-audio', 'synthesisStartAt', 'firstAudioAt');
  a('total(record→firstAudio)', 'recordingStartedAt', 'firstAudioAt');
  if (p.length > 0) logVoice(`[metrics] ${p.join('  ')}`);
}

/** سجل داخلي للمطوّر فقط (لا يظهر للمستخدم). يعمل على Android/iOS؛ يتجاهل web. */
export function logVoice(tag: string, data?: unknown): void {
  if (Platform.OS === 'web') return;
  // eslint-disable-next-line no-console
  console.log(`[Voice] ${tag}`, data === undefined ? '' : data);
}
