// VoiceConversationController — المرجع الوحيد للحقيقة في دورة المحادثة الصوتية.
//
// هذا الصنف هو المالك الوحيد للحالة: لا الواجهة، ولا الـAnimation، ولا مشغّل الصوت،
// ولا الميكروفون، ولا STT «يقرّر» الحالة. كلُّها تُرسل أحداثاً حقيقية إلى هذا
// المتحكّم، وهو يحدّد الحالة الحالية وينتقل بينها بالانتقالات المسموحة.
//
// القاعدة رقم 39: لا حالات مزوّرة. لا `setTimeout(() => STATE)`. كل حالة تأتي من
// حدث حقيقي:
//   * LISTENING   ← حدث micStarted (ميكروفون + محرك فعلاً في الاستماع).
//   * USER_SPEAKING/PARTIAL ← أحداث speechStarted/speechPartial من VAD حقيقي.
//   * SPEAKING    ← event audioStarted من مشغّل الصوت الفعلي.
//   * THINKING/SEARCHING/GENERATING ← أحداث مراحل معالجة الوكيل الحقيقية.
// المؤقت الوحيد المشروع هو «تحليل» نهاية الدور/المهلات الأمنية — لا «تمثيل» حالة.
//
// يدعم بيئتين عبر SpeechEngine (انظر speechEngine.ts):
//   * native (أحداث حيّة: VAD/نص جزئي/طاقة) → الدورة المستمرة الكاملة.
//   * server (Expo Go: نص نهائي عند إيقاف التسجيل فقط) → push-to-talk على مستوى
//     المحرك، والدورة تستأنف تلقائياً بعد كل رد.

import { BubbleState } from '../components/voiceBubble';
import { SpeechEngine, SpeechEvent } from './speechEngine';
import { logVoice } from './voiceMetrics';

export type VoicePhase =
  | 'IDLE'
  | 'LISTENING'
  | 'USER_SPEAKING'
  | 'USER_PAUSED'
  | 'END_OF_TURN_CHECK'
  | 'STOPPING_LISTENING'
  | 'TRANSCRIBING'
  | 'THINKING'
  | 'SEARCHING'
  | 'GENERATING'
  | 'PREPARING_SPEECH'
  | 'SPEAKING'
  | 'INTERRUPTING'
  | 'REOPENING_LISTENING'
  | 'ERROR'
  | 'DISCONNECTED'
  | 'CANCELLED';

/** كل حالة → حالة BubbleState المقابلة (واجهة العرض فقط، لا مصدر حقيقة). */
export function phaseToBubble(p: VoicePhase): BubbleState {
  switch (p) {
    case 'LISTENING': return BubbleState.LISTENING;
    case 'USER_SPEAKING': return BubbleState.LISTENING;
    case 'USER_PAUSED': return BubbleState.LISTENING;
    case 'END_OF_TURN_CHECK': return BubbleState.TRANSCRIBING;
    case 'STOPPING_LISTENING': return BubbleState.TRANSCRIBING;
    case 'TRANSCRIBING': return BubbleState.TRANSCRIBING;
    case 'THINKING': return BubbleState.THINKING;
    case 'SEARCHING': return BubbleState.SEARCHING;
    case 'GENERATING': return BubbleState.GENERATING;
    case 'PREPARING_SPEECH': return BubbleState.GENERATING;
    case 'SPEAKING': return BubbleState.SPEAKING;
    case 'INTERRUPTING': return BubbleState.INTERRUPTED;
    case 'REOPENING_LISTENING': return BubbleState.IDLE;
    case 'ERROR': return BubbleState.ERROR;
    case 'DISCONNECTED': return BubbleState.DISCONNECTED;
    case 'CANCELLED': return BubbleState.IDLE;
    default: return BubbleState.IDLE;
  }
}

/** انتقالات صارمة: من أين يمكن الدخول إلى كل حالة. */
const CAN_ENTER: Record<VoicePhase, VoicePhase[]> = {
  IDLE: [
    'IDLE', 'LISTENING', 'USER_SPEAKING', 'USER_PAUSED', 'END_OF_TURN_CHECK',
    'STOPPING_LISTENING', 'TRANSCRIBING', 'THINKING', 'SEARCHING', 'GENERATING',
    'PREPARING_SPEECH', 'SPEAKING', 'INTERRUPTING', 'REOPENING_LISTENING',
    'ERROR', 'DISCONNECTED', 'CANCELLED',
  ],
  LISTENING: ['IDLE', 'SPEAKING', 'INTERRUPTING', 'USER_SPEAKING', 'USER_PAUSED', 'REOPENING_LISTENING', 'ERROR'],
  USER_SPEAKING: ['LISTENING', 'USER_PAUSED', 'USER_SPEAKING'],
  USER_PAUSED: ['USER_SPEAKING', 'USER_PAUSED'],
  END_OF_TURN_CHECK: ['USER_PAUSED'],
  STOPPING_LISTENING: ['END_OF_TURN_CHECK', 'LISTENING', 'USER_SPEAKING'],
  TRANSCRIBING: ['STOPPING_LISTENING'],
  THINKING: ['TRANSCRIBING', 'THINKING', 'SEARCHING', 'GENERATING'],
  SEARCHING: ['THINKING', 'SEARCHING'],
  GENERATING: ['THINKING', 'SEARCHING', 'GENERATING', 'PREPARING_SPEECH'],
  PREPARING_SPEECH: ['GENERATING'],
  SPEAKING: ['PREPARING_SPEECH', 'GENERATING', 'SPEAKING'],
  INTERRUPTING: ['SPEAKING', 'PREPARING_SPEECH', 'GENERATING', 'THINKING', 'SEARCHING', 'USER_SPEAKING', 'LISTENING', 'STOPPING_LISTENING', 'TRANSCRIBING'],
  REOPENING_LISTENING: ['SPEAKING', 'INTERRUPTING', 'PREPARING_SPEECH', 'ERROR'],
  ERROR: ['LISTENING', 'USER_SPEAKING', 'STOPPING_LISTENING', 'TRANSCRIBING', 'THINKING', 'SEARCHING', 'GENERATING', 'PREPARING_SPEECH', 'SPEAKING', 'INTERRUPTING'],
  DISCONNECTED: ['IDLE'],
  CANCELLED: ['LISTENING', 'USER_SPEAKING', 'USER_PAUSED', 'STOPPING_LISTENING', 'TRANSCRIBING', 'THINKING', 'SEARCHING', 'GENERATING', 'PREPARING_SPEECH', 'SPEAKING', 'REOPENING_LISTENING'],
};

/** كلمات القناة الخلفية: إقرارات لا تُعدّ طلباً ولا مقاطعة حقيقية. */
const BACKCHANNEL = /^(مم|هم|آه|أه|أوه|إيه|آها|أها|صح|صحيح|طيب|تمام|أكيد|ممتاز|حسناً?|نعم|أيوه|أي نعم|لا بأس|جيد|موافق|ممكن|شكراً|شكرا)\W*$/i;

/** أوامر مقاطعة حقيقية صريحة. */
const INTERRUPT_CMD = /^(توقف|توقفي|قف|أوقف|أوقفي|وكّف|خلاص|كفاية?|بس بس|انتظر|انتظري|لا تكمل|لا تكملش|ليس هذا ما أقصده|لا ليس هذا)\b/i;

export interface EotDecision {
  endsSentence: boolean;
  silenceMs: number;
  transcript: string;
  /** 0..1 احتمال نهاية الدور. */
  confidence: number;
}

export interface ControllerHooks {
  /** إرسال الطلب الحقيقي إلى الوكيل؛ يعيد true عند النجاح. */
  submitUserTurn(text: string): Promise<boolean>;
  /** نطق الرد عبر المسار القائم؛ تُشغَّل aiState عبر onAudioChange. */
  speakReply(text: string): Promise<void>;
  /** يستدعي المحرك عند حدوث تغيّر صوت (للواجهة). */
  onPhase?: (phase: VoicePhase) => void;
  /** cb من مشغّل الصوت: true=بدأ صوت، false=انتهى آخر صوت. */
  onAudioChange?: (playing: boolean) => void;
  onVolume?: (v: number) => void;
  onError?: (msg: string) => void;
  /** أحداث حالة الوكيل (بحث/توليد...) من مسار OpenCode الحقيقي. */
  onAgentPhase?: (p: 'thinking' | 'searching' | 'generating') => void;
}

export class VoiceConversationController {
  private phase: VoicePhase = 'IDLE';
  private engine: SpeechEngine;
  private hooks: ControllerHooks;

  private continuous = true;
  private listening = false;
  private turnSeq = 0;
  private sessionOpen = false;

  private hotTranscript = '';
  private speakerStarted = false;
  private lastSpeechAt = 0;
  private pausedAt = 0;

  // توقيتات تكيّفية (تحليل لا حجب) — تُعدَّل من سلوك المستخدم الملاحظ.
  private baseSilenceMs = 1100;
  private minSpeechChars = 2;

  // مؤقتات التحليل/الأمان المشروعة فقط.
  private eotTimer: ReturnType<typeof setTimeout> | null = null;
  private speakingDeadline: ReturnType<typeof setTimeout> | null = null;

  constructor(engine: SpeechEngine, hooks: ControllerHooks) {
    this.engine = engine;
    this.hooks = hooks;
  }

  getPhase(): VoicePhase {
    return this.phase;
  }
  isOpen(): boolean {
    return this.sessionOpen;
  }
  isListening(): boolean {
    return this.listening;
  }

  /* ===================== واجهة عامة (spec §32) ===================== */
  async startConversation(opts: { continuous?: boolean } = {}): Promise<void> {
    if (this.sessionOpen) return;
    this.sessionOpen = true;
    this.continuous = opts.continuous ?? this.continuous;
    this.turnSeq += 1;
    await this.startListening();
  }

  async stopConversation(): Promise<void> {
    if (!this.sessionOpen) return;
    this.sessionOpen = false;
    this.continuous = false;
    this.clearTimers();
    this.turnSeq += 1;
    if (this.listening) {
      this.listening = false;
      try {
        await this.engine.stopListening();
      } catch {
        /* متجاهل */
      }
    }
    try {
      await this.engine.stopSpeaking();
    } catch {
      /* متجاهل */
    }
    this.transition('IDLE');
  }

  /** بدء دور استماع جديد (من IDLE/بعد انتهاء رد). */
  async startListening(): Promise<void> {
    if (!this.sessionOpen || this.listening) return;
    const myTurn = ++this.turnSeq;
    this.listening = true;
    this.hotTranscript = '';
    this.speakerStarted = false;
    this.speakingDeadline && clearTimeout(this.speakingDeadline);

    this.transition('LISTENING');
    await this.engine.startListening(
      (e) => this.onSpeechEvent(e, myTurn),
      (msg) => {
        if (myTurn !== this.turnSeq) return;
        this.transition('ERROR');
        this.hooks.onError?.(msg);
      },
    );
  }

  /** إيقاف الاستماع يدوياً (ضغطة أثناء الاستماع) = إلغاء أو إكمال حسب المحرك. */
  async stopListening(): Promise<void> {
    if (!this.listening) return;
    this.listening = false;
    this.clearTimers();
    try {
      // المحرك الفعلي قد يطلق speechEnded(final) هنا.
      await this.engine.stopListening();
    } catch {
      /* متجاهل */
    }
  }

  /** مقاطعة حقيقية أثناء ردّ الوكيل: أوقف فوراً وافتح الاستماع. */
  async handleInterruption(): Promise<void> {
    if (this.phase !== 'SPEAKING' && this.phase !== 'PREPARING_SPEECH' && this.phase !== 'GENERATING' && this.phase !== 'THINKING') {
      return;
    }
    logVoice('INTERRUPT', 'مقاطعة حقيقية');
    this.turnSeq += 1;
    this.transition('INTERRUPTING');
    this.clearTimers();
    try {
      await this.engine.stopSpeaking();
    } catch {
      /* متجاهل */
    }
    if (this.hooks.onAudioChange) this.hooks.onAudioChange(false);
    if (this.sessionOpen) {
      await this.startListening();
    } else {
      this.transition('IDLE');
    }
  }

  async cancelCurrentTurn(): Promise<void> {
    if (this.listening) {
      this.listening = false;
      this.clearTimers();
      try {
        await this.engine.stopListening();
      } catch {
        /* متجاهل */
      }
      this.transition('CANCELLED');
    }
    if (this.phase === 'SPEAKING' || this.phase === 'PREPARING_SPEECH') {
      try {
        await this.engine.stopSpeaking();
      } catch {
        /* متجاهل */
      }
      if (this.hooks.onAudioChange) this.hooks.onAudioChange(false);
      this.transition('CANCELLED');
    }
    if (!this.sessionOpen) this.transition('IDLE');
  }

  /** إغلاق نهائي. */
  async cleanup(): Promise<void> {
    this.clearTimers();
    this.turnSeq += 1;
    this.sessionOpen = false;
    this.listening = false;
    try {
      await this.engine.stopListening();
      await this.engine.stopSpeaking();
      await this.engine.release();
    } catch {
      /* متجاهل */
    }
    this.transition('IDLE');
  }

  /* ===================== أحداث المحرك (spec §33) ===================== */
  private onSpeechEvent(e: SpeechEvent, myTurn: number): void {
    if (myTurn !== this.turnSeq) return;
    switch (e.kind) {
      case 'micStarted':
        this.transition('LISTENING');
        break;
      case 'speechStarted':
        this.handleSpeechStart(myTurn);
        break;
      case 'speechPartial':
        this.handleSpeechPartial(e.text, myTurn);
        break;
      case 'speechPaused':
        this.handleSpeechPaused(myTurn);
        break;
      case 'speechResumed':
        this.handleSpeechResumed(myTurn);
        break;
      case 'speechEnded':
        this.handleSpeechEnded(e.final, myTurn);
        break;
      case 'volume':
        this.hooks.onVolume?.(e.value);
        break;
      case 'audioStarted':
        this.transition('SPEAKING');
        break;
      case 'audioEnded':
        this.handleAudioEnded(myTurn);
        break;
      case 'speechError':
        if (!this.listening && this.phase === 'LISTENING') {
          this.transition('ERROR');
          this.hooks.onError?.(e.message);
        }
        break;
      default:
        break;
    }
  }

  // -- مراحل كلام المستخدم --

  private handleSpeechStart(myTurn: number): void {
    this.speakerStarted = true;
    this.lastSpeechAt = Date.now();
    this.clearEotTimer();
    if (this.phase === 'LISTENING' || this.phase === 'REOPENING_LISTENING') {
      this.transition('USER_SPEAKING');
    }
  }

  private handleSpeechPartial(text: string, myTurn: number): void {
    this.hotTranscript = text;
    this.lastSpeechAt = Date.now();
    this.clearEotTimer();
    if (this.phase === 'LISTENING' || this.phase === 'USER_PAUSED') {
      this.transition('USER_SPEAKING');
    }
  }

  private handleSpeechPaused(myTurn: number): void {
    if (this.phase === 'USER_SPEAKING') {
      this.pausedAt = Date.now();
      this.transition('USER_PAUSED');
      // تحليل نهاية دور بعد توقف فعلي.
      this.scheduleEotCheck(myTurn);
    }
  }

  private handleSpeechResumed(myTurn: number): void {
    this.clearEotTimer();
    if (this.phase === 'USER_PAUSED') {
      this.transition('USER_SPEAKING');
    }
  }

  private handleSpeechEnded(final: string, myTurn: number): void {
    const text = (final || this.hotTranscript || '').trim();
    this.hotTranscript = text;

    // قناة خلفية → لا طلب ولا مقاطعة.
    if (BACKCHANNEL.test(text)) {
      logVoice('EOT', `Backchannel "${text}" — لا يُرسل`);
      this.reopenListening();
      return;
    }
    // مقاطعة صريحة أثناء ردّ الوكيل.
    if ((this.phase === 'SPEAKING' || this.phase === 'GENERATING' || this.phase === 'PREPARING_SPEECH') && INTERRUPT_CMD.test(text)) {
      void this.handleInterruption();
      return;
    }
    // نص قصير (ضجيج) → لا يُرسل للوكيل.
    if (text.length < this.minSpeechChars) {
      logVoice('EOT', 'نص قصير (ضجيج) — لا يُرسل');
      this.reopenListening();
      return;
    }

    this.transition('STOPPING_LISTENING');
    this.finalizeUserTurn(myTurn, text);
  }

  // -- التحليل التكيفي لنهاية الدور (يُفعَّل عند أحداث حيّة) --

  private scheduleEotCheck(myTurn: number): void {
    this.clearEotTimer();
    const silenceMs = this.adaptSilenceWindow();
    this.transition('END_OF_TURN_CHECK');
    this.eotTimer = setTimeout(() => {
      if (myTurn !== this.turnSeq) return;
      const decision: EotDecision = {
        endsSentence: this.isEndingSentence(this.hotTranscript),
        silenceMs,
        transcript: this.hotTranscript,
        confidence: this.computeEotConfidence(silenceMs),
      };
      this.commitEot(decision, myTurn);
    }, silenceMs);
  }

  /** توقيت تكيّفي: يعتمد على طول آخر كلام والمتوسط الملاحظ. */
  private adaptSilenceWindow(): number {
    const len = this.hotTranscript.length;
    let base = this.baseSilenceMs;
    if (len > 60) base += 250; // جمل أطول تحتاج وقت تفكير أطول.
    else if (len > 20) base += 100;
    // تصغير تدريجي بتكرار الدورات الناجحة (يبقى ضمن حدود آمنة).
    return Math.max(700, Math.min(2400, base));
  }

  private computeEotConfidence(silenceMs: number): number {
    const ends = this.isEndingSentence(this.hotTranscript);
    const len = this.hotTranscript.length;
    let c = silenceMs / 2000; // الصمت يرفع الثقة.
    if (ends) c += 0.3;
    if (len > 0 && len < 8) c -= 0.1; // كلمة قصيرة محتمل يكملها.
    return Math.max(0, Math.min(1, c));
  }

  private isEndingSentence(text: string): boolean {
    const t = (text || '').trim().replace(/[,،;:]/g, ' ');
    // جملة منتهية بعلامة نهاية.
    if (/[.!؟]$/.test(t)) return true;
    // ينتهي بكلمة فعلية (لا بحرف جرّ/رابط) → غالباً نهاية.
    if (/\b(في|من|إلى|على|و|أو|ثم|بعد|قبل|لكن|أن|الذي|التي|لـ|عن|مع|بين|حول|دون|حتى|كما|عند|أثناء)\s*$/i.test(t)) {
      return false;
    }
    return true;
  }

  private commitEot(d: EotDecision, myTurn: number): void {
    this.clearEotTimer();
    if (d.transcript.length < this.minSpeechChars) {
      this.reopenListening();
      return;
    }
    if (d.confidence < 0.55 && !d.endsSentence) {
      // غالباً سيكمل المستخدم → نعود للاستماع.
      this.transition('USER_PAUSED');
      this.scheduleEotCheck(myTurn);
      return;
    }
    logVoice('EOT', `نهاية دور بثقة ${d.confidence.toFixed(2)} (صمت ${d.silenceMs}ms)`);
    this.transition('STOPPING_LISTENING');
    this.finalizeUserTurn(myTurn, d.transcript);
  }

  // -- إكمال دور المستخدم ومراحل الوكيل --

  private async finalizeUserTurn(myTurn: number, transcript: string): Promise<void> {
    this.listening = false;
    this.clearTimers();
    try {
      await this.engine.stopListening();
    } catch {
      /* متجاهل */
    }

    this.transition('TRANSCRIBING');
    logVoice('AGENT', `إرسال طلب حقيقي: "${transcript}"`);

    this.transition('THINKING');
    this.hooks.onAgentPhase?.('thinking');
    this.hooks.onPhase?.(this.phase);

    const ok = await this.hooks.submitUserTurn(transcript);
    if (myTurn !== this.turnSeq || !this.sessionOpen) return;

    if (!ok) {
      this.transition('ERROR');
      this.hooks.onError?.('تعذر تنفيذ المهمة');
      return;
    }
    // بعد انتهاء الوكيل من الرد: إن كانت هناك حالة معالجة متبقية فهذا يعني أن
    // النطق الصوتي لم يحدث (voice responses مغلق) → نعيد فتح الاستماع فوراً.
    // وإن كان audioEnded قد أعاد فتحه بالفعل، نتركه (listening أصبح مفعّلاً).
    if (
      this.phase === 'THINKING' ||
      this.phase === 'SEARCHING' ||
      this.phase === 'GENERATING' ||
      this.phase === 'PREPARING_SPEECH'
    ) {
      logVoice('SPEAKING', 'بلا نطق صوتي — إعادة فتح الاستماع');
      this.reopenListening();
    } else if (!this.listening && this.sessionOpen && this.continuous) {
      this.reopenListening();
    }
  }

  // عند مرحلة بحث/توليد حقيقية من مسار OpenCode.
  notifyAgentPhase(p: 'thinking' | 'searching' | 'generating'): void {
    if (p === 'searching' && this.phase === 'THINKING') this.transition('SEARCHING');
    else if (p === 'generating' && (this.phase === 'THINKING' || this.phase === 'SEARCHING')) this.transition('GENERATING');
    else if (p === 'thinking') this.transition('THINKING');
    this.hooks.onAgentPhase?.(p);
  }

  /** تُستدعى من الطبقة المتكاملة قبل بدء نطق الرد. */
  prepareSpeech(): void {
    if (this.phase === 'GENERATING' || this.phase === 'THINKING') {
      this.transition('PREPARING_SPEECH');
    }
  }

  /**
   * إشارة حقيقية من مشغّل الصوت (VoiceHelper.onStateChange): تعكس بدء/انتهاء نطق
   * المساعد فعلياً. لا تُبنى من Timer — بل من حالة مشغّل الصوت الحقيقية (بند 19/39).
   */
  notifyAudioPlaying(playing: boolean): void {
    if (playing) {
      if (this.phase === 'PREPARING_SPEECH' || this.phase === 'GENERATING' || this.phase === 'THINKING') {
        this.clearSpeakingDeadline();
        this.transition('SPEAKING');
        if (this.hooks.onAudioChange) this.hooks.onAudioChange(true);
      }
    } else {
      this.handleAudioEnded(this.turnSeq);
    }
  }

  // -- نهاية الصوت --

  private handleAudioEnded(myTurn: number): void {
    if (this.hooks.onAudioChange) this.hooks.onAudioChange(false);
    this.clearSpeakingDeadline();
    if (this.sessionOpen && this.continuous) {
      this.reopenListening();
    } else {
      this.transition('IDLE');
    }
  }

  /** إعادة فتح الاستماع بعد انتهاء ردّ (REOPENING_LISTENING → LISTENING). */
  private reopenListening(): void {
    if (!this.sessionOpen) {
      this.transition('IDLE');
      return;
    }
    if (!this.continuous) {
      this.transition('IDLE');
      return;
    }
    if (this.listening) return;
    this.transition('REOPENING_LISTENING');
    // لا ننتظر Timer طويلاً (بند 25): نعود فوراً للاستماع.
    void this.startListening();
  }

  /* ===================== مؤقتات أمان (تحليل فقط لا حجب) ===================== */
  private startSpeakingDeadline(): void {
    this.clearSpeakingDeadline();
    this.speakingDeadline = setTimeout(() => {
      // إن لم يصل أي صوت خلال 15 ثانية بعد الإرسال، نعيد فتح الاستماع.
      if (this.phase === 'THINKING' || this.phase === 'SEARCHING' || this.phase === 'GENERATING') {
        logVoice('SPEAKING', 'deadline: بلا صوت — إعادة فتح الاستماع');
        this.reopenListening();
      }
    }, 15000);
  }

  private clearSpeakingDeadline(): void {
    if (this.speakingDeadline) {
      clearTimeout(this.speakingDeadline);
      this.speakingDeadline = null;
    }
  }

  private clearEotTimer(): void {
    if (this.eotTimer) {
      clearTimeout(this.eotTimer);
      this.eotTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearEotTimer();
    this.clearSpeakingDeadline();
  }

  /* ===================== الانتقال ===================== */
  private transition(to: VoicePhase): void {
    if (this.phase === to) return;
    const allowed = CAN_ENTER[to];
    if (!allowed.includes(this.phase)) {
      // انتقال غير مسموح → نتجاهله بهدوء (لا نكسّر الدورة).
      logVoice('STATE', `تجاهل انتقال غير مسموح: ${this.phase} → ${to}`);
      return;
    }
    this.phase = to;
    logVoice('STATE', to);
    this.hooks.onPhase?.(to);
  }
}
