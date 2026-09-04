// voiceLogger — سجل تصحيح منظم لكل مرحلة من مراحل المحادثة الصوتية.
// الوسوم: [VAD] [EOT] [STT] [AGENT] [TTS] [AUDIO] [INTERRUPT] [LATENCY] [STATE]
// لا يُطبع إطلاقاً على الويب (view، وما شابه) — وللمطوّر فقط (console) في الـ debug/JIT.

const ENABLED = __DEV__ !== false;

type Tag =
  | 'VAD'
  | 'EOT'
  | 'STT'
  | 'AGENT'
  | 'TTS'
  | 'AUDIO'
  | 'INTERRUPT'
  | 'LATENCY'
  | 'STATE'
  | 'TURN';

/** يطبع سطراً مُعلَّماً بوسم المرحلة وزمن نسبي منذ بداية الجلسة. */
export function logVoice(tag: Tag, msg: string): void {
  if (!ENABLED) return;
  // eslint-disable-next-line no-console
  console.log(`[${tag}] ${msg}`);
}

/** أزمنة المراحل الحاسمة بنطاق 0..n (مريح لقياس زمن أول صوت). */
export class LatencyBoard {
  private marks: Record<string, number> = {};

  mark(name: string, ts: number = Date.now()): void {
    this.marks[name] = ts;
    logVoice('LATENCY', `${name}: ${new Date(ts).toISOString().slice(11, 23)}`);
  }

  elapsed(from: string, to: string): number | null {
    const a = this.marks[from];
    const b = this.marks[to];
    if (a == null || b == null) return null;
    return Math.max(0, b - a);
  }

  report(label: string): string {
    return `${label}: eot=${this.fmt(this.elapsed('speechEnd', 'eotCheck'))} ` +
      `stt=${this.fmt(this.elapsed('eotCheck', 'sttFinal'))} ` +
      `agentTTFT=${this.fmt(this.elapsed('sttFinal', 'agentStart'))} ` +
      `tts=${this.fmt(this.elapsed('agentStart', 'ttsStart'))} ` +
      `ttfa=${this.fmt(this.elapsed('speechEnd', 'firstAudio'))}`;
  }

  private fmt(v: number | null): string {
    return v == null ? 'n/a' : `${v}ms`;
  }
}
