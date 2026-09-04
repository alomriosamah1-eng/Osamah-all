// VoiceHelper — TTS عبر expo-speech (لغة ar-SY، نبرة أنثى ×1.35 / ذكر ×0.88)،
// واستماع صوتي من مصدرين:
//   أ) @react-native-voice/voice (ar-SY) عند توفره (بُنى أصلية/dev).
//   ب) تسجيل عبر expo-av (مدعوم في Expo Go SDK 54) ← رفع للخادم POST /api/voice/transcribe
//      (STT عبر Google — engine=google)، إذ أن @react-native-voice/voice غير مضمّن في Expo Go.
// يُحمَّل كل من الوحدتين بشكل كسول مع fallback آمن.
import { PermissionsAndroid, Platform } from 'react-native';
import Constants from 'expo-constants';
import { logVoice, markVoice, nowMs } from './voiceMetrics';

/** صحيح داخل Expo Go: لا يمكن فيه استخدام أي وحدات JSX أصلية كـ @react-native-voice/voice
 *  (غير مضمّنة) — والـ require نفسه يرمي خطأ "native module doesn't exist" عند تقييمه.
 *  لذا نتجاهله كلياً ونعتمد مسار الخادم (expo-av تسجيل + Google STT). */
const IN_EXPO_GO =
  Platform.OS !== 'web' &&
  (Constants.executionEnvironment === 'storeClient' ||
    (Constants as any).appOwnership === 'expo');

interface VoiceModule {
  onSpeechStart: (() => void) | null;
  onSpeechEnd: (() => void) | null;
  onSpeechError: ((e: any) => void) | null;
  onSpeechResults: ((e: any) => void) | null;
  isAvailable(): boolean;
  start(lang?: string): Promise<unknown>;
  stop(): Promise<unknown>;
  destroy(): Promise<unknown>;
}

let speechModule: any = null;
let speechReady = false;

/** يحمّل expo-speech كسولاً (لا يُقيَّم أي وحدة أصلية عند تحميل الملف نفسه). */
function loadSpeech(): any {
  if (speechReady) return speechModule;
  try {
    const mod = require('expo-speech');
    speechModule = mod?.default?.default ?? mod?.default ?? mod ?? null;
    speechReady = !!speechModule && typeof speechModule.speak === 'function';
  } catch {
    speechModule = null;
    speechReady = false;
  }
  return speechModule;
}

let voiceModule: VoiceModule | null | undefined;
function loadVoice(): VoiceModule | null {
  if (voiceModule !== undefined) return voiceModule;
  // في Expo Go لا نلمس الوحدة الأصلية إطلاقاً (يتسبب `require` بانهيار فوري).
  if (IN_EXPO_GO) {
    voiceModule = null;
    return voiceModule;
  }
  try {
    const mod = require('@react-native-voice/voice');
    // تطبيع الشكل: قد يكون التصدير مباشرة أو تحت .default أو على شكل دالة.
    const maybe = (mod && (mod.default ?? mod)) as unknown;
    const candidate: VoiceModule | null =
      maybe && typeof (maybe as VoiceModule).start === 'function'
        ? (maybe as VoiceModule)
        : null;
    voiceModule = candidate;
  } catch {
    voiceModule = null;
  }
  return voiceModule;
}

let audioModule: any = null;
let recordingPreset: any = null;
let serverAudioReady = false;

/** يحمّل expo-audio (مدعوم في Expo Go SDK 57) كسولاً ويؤكّد توفر التسجيل.
 *  نفضّل جودة «متوسطة» على «عالية»: ملف أخف يُرفع ويُحوَّل أسرع (STT) مع خسارة
 *  ضئيلة في الدقة — توازن السرعة والدقة. expo-audio يوفر HIGH/LOW فقط، فنبني
 *  خياراً متوسطاً يدوياً (أحادي القناة + معدل بت مخفّض) لتحقيق ذلك التوازن. */
function loadAudioModule(): boolean {
  if (serverAudioReady) return true;
  try {
    const mod = require('expo-audio');
    audioModule = mod?.AudioModule ?? mod;
    const presets = (mod?.RecordingPresets ?? {}) as Record<string, any>;
    const high = presets.HIGH_QUALITY ?? {};
    // جودة متوسطة مخصصة: أحادي القناة + معدل بت 96k → ملف أخف يُرفع أسرع (STT)
    // مع دقة صوت مقبولة، بدل HIGH الكامل الأثقل.
    const medium = {
      ...high,
      numberOfChannels: 1,
      bitRate: 96000,
      android: { ...(high.android ?? {}), audioEncoder: 'aac', outputFormat: 'mpeg4' },
      web: { mimeType: 'audio/webm', bitsPerSecond: 96000 },
    };
    recordingPreset = medium;
    serverAudioReady =
      !!audioModule &&
      typeof audioModule.AudioRecorder === 'function' &&
      typeof mod?.createAudioPlayer === 'function';
  } catch {
    serverAudioReady = false;
  }
  return serverAudioReady;
}

export class VoiceHelper {
  private onStateChange: (isSpeaking: boolean) => void;
  private ready = false;
  private nativeReady: Promise<void>;
  private readonly supported: boolean;

  private recordMode: 'native' | 'server' | null = null;
  private recording: any = null;
  private serverSound: any = null;
  private pendingResult: ((text: string) => void) | null = null;
  private pendingError: ((msg: string) => void) | null = null;

  // ==== Audio queue + turn (generation) token: منع التداخل/الردود القديمة/apple races ====
  private turnId = 0; // يزداد عند كل طلب/مقاطعة — أي استجابة قديمة تُهمل فوراً.
  private soundQueue: any[] = []; // أصوات جاهزة تنتظر التشغيل (chunks).
  private isPlaying = false;
  private speaking = false;

  constructor(onStateChange: (isSpeaking: boolean) => void) {
    this.onStateChange = onStateChange;
    this.supported = loadVoice() !== null;
    this.nativeReady = this.init();
  }

  private async init(): Promise<void> {
    const voice = loadVoice();
    if (voice) {
      voice.onSpeechStart = () => {};
      voice.onSpeechEnd = () => {};
      voice.onSpeechError = (e) => {
        this.pendingError?.(e?.error?.message ?? `رمز خطأ الصوت: ${e?.error?.code ?? 'unknown'}`);
        this.pendingResult = null;
        this.pendingError = null;
      };
      voice.onSpeechResults = (e) => {
        const matches = e?.value ?? [];
        if (matches.length > 0) {
          const result = matches[0];
          this.pendingResult?.(result);
          this.pendingResult = null;
          this.pendingError = null;
        }
      };
    }
    this.ready = true;
  }

  private async ensureNative(): Promise<void> {
    await this.nativeReady;
  }

  /** تطبيع نص النطق: ينزع علامات الترميز (Markdown/كود) ويوحّد المسافات مع الإبقاء على
   *  الكلمات الإنجليزية/أسماء المشاريع/الأرقام سليمة (لا نغيّر معنى كلام المستخدم). */
  normalizeForTts(raw: string): string {
    let t = (raw || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    // إزالة الرموز التعبيرية (Emoji) ومجموعات الـ ZWJ والأيقونات.
    t = t.replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]+/gu,
      ' '
    );
    // تقليل علامات الترقيم إلى مسافات، مع الإبقاء على نقاط نهاية الجمل (الوقف الطبيعي للنطق).
    t = t
      .replace(/[\u060C\u002C\u003B\u003A\u061B\u005F\u0028\u0029\u005B\u005D\u007B\u007D\u00AB\u00BB\u0022\u0027\u0060\u003C\u003E\u002A\u007E\u007C\u0040\u0023\u0024\u0025\u005E\u0026\u002B\u003D\u002F\u005C\u2013\u2014\u002D]+/g, ' ')
      .replace(/\s*([.!؟]+)\s*/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim();
    return t;
  }

  /** تقسيم ردّ طويل إلى جمل/فقرات قصيرة (وحدات نطق) دون قطع كلمة. */
  splitForTts(text: string): string[] {
    const normalized = this.normalizeForTts(text);
    if (!normalized) return [];
    // نقطة نهاية/فواصل عربية وإنكليزية — نحافظ على علامات الترقيم داخل الوحدة.
    const parts = normalized.match(/[^.!?؟]+[.!?؟]*/g) ?? [normalized];
    const chunks: string[] = [];
    let acc = '';
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      let candidate = acc ? `${acc} ${trimmed}` : trimmed;
      // حد أقصى ~260 حرفاً للوحدة: إذا تجاوز والفاصلة الحالية وحدها ضمن الحدّ، نبدأ وحدة جديدة.
      if (candidate.length > 280 && acc && trimmed.length <= 280) {
        chunks.push(acc.trim());
        acc = trimmed;
      } else {
        acc = candidate;
        if (acc.length >= 200) {
          chunks.push(acc.trim());
          acc = '';
        }
      }
    }
    if (acc.trim()) chunks.push(acc.trim());
    return chunks.length > 0 ? chunks : [normalized];
  }

  /** نطق ردّ حقيقي على دفعات: يجهّز الوحدة الأولى ويبدأ تشغيلها فوراً (أقل زمن لأول صوت)،
   *  ويجهّز البقية في الخلفية ويصفّها دون تداخل. أي طلب/مقاطعة أحدث يلغي هذا الدور (turnId). */
  async speak(text: string, isFemale = false, speed = 1.0, pitch = 1.0): Promise<void> {
    await this.ensureNative();
    const cleanText = this.normalizeForTts(text);
    if (!cleanText.trim()) return;
    const myTurn = ++this.turnId; // استحوذ على الدور — أي نقاش سابق يُهمل.
    markVoice('synthesisStartAt');
    logVoice(`speak.turn=${myTurn} female=${isFemale} chars=${cleanText.length}`);

    this.setStateSpeaking(false);
    loadSpeech()?.stop?.();

    const chunks = this.splitForTts(cleanText);
    // مسار واحد: الخادم أولاً؛ إن غاب → نطق محلي دفعة واحدة.
    const usedServer = await this.playChunkedViaServer(chunks, isFemale ? 'female' : 'male', myTurn);
    if (usedServer) return;

    if (myTurn !== this.turnId) return; // أُلغي أثناء الانتظار.
    // Fallback: نطق محلي عبر expo-speech (دفعة واحدة).
    const actualPitch = isFemale ? pitch * 1.35 : pitch * 0.88;
    const speech = loadSpeech();
    if (!speech) {
      this.setStateSpeaking(false);
      return;
    }
    speech.speak(cleanText, {
      language: 'ar-SY',
      pitch: actualPitch,
      rate: Math.max(0.5, Math.min(2.0, speed)),
      onStart: () => { if (myTurn === this.turnId) this.setStateSpeaking(true); },
      onDone: () => { if (myTurn === this.turnId) this.setStateSpeaking(false); },
      onStopped: () => { if (myTurn === this.turnId) this.setStateSpeaking(false); },
      onError: () => { if (myTurn === this.turnId) this.setStateSpeaking(false); },
    });
  }

  /** يجلب صوت كل وحدة من الخادم بالتوازي (لا بالتتابع) ثم يصفّها بالترتيب الصحيح
   *  للتشغيل المتتابع. التوازي يجعل ردّ الوكيل يُنطق أسرع بكثير: كل الوحدات تُحدَّث
   *  في نفس الوقت، وأول صوت يصل يبدأ فوراً بدل انتظار كل وحدة على حدة.
   *  يعيد true إذا بدأ أي صوت خادم. */
  private async playChunkedViaServer(chunks: string[], voice: 'male' | 'female', myTurn: number): Promise<boolean> {
    let usedServer = false;
    if (myTurn !== this.turnId) return usedServer;

    // نطلق طلبات التوليف كلها بالتوازي (الحفاظ على الترتيب عبر الفهرس)، مع تجاهل
    // الوحدات الفاشلة. يمنع هذا «مصيدة التتابع» حيث تُولَّف وحدة بعد وحدة بتأخير تراكمي.
    const results = await Promise.all(
      chunks.map(async (chunk, index) => {
        const audio = await this.fetchTtsChunk(chunk, voice);
        return { audio, index };
      }),
    );

    // بعد انتهاء كل الجلب: إن أُلغي الدور أثناء الانتظار نتوقف فوراً.
    if (myTurn !== this.turnId) return usedServer;

    // نرتّب النتائج بترتيب الوحدات الأصلي ثم نضعها في الصف بالترتيب الصحيح
    // (كتابة الملفات المحلية سريعة، والتتابع هنا يحفظ ترتيب التشغيل).
    const ordered = results.sort((a, b) => a.index - b.index);
    for (const r of ordered) {
      if (!r.audio) continue;
      usedServer = true;
      await this.enqueueSound(r.audio, r.index, myTurn);
      if (myTurn !== this.turnId) return usedServer;
    }

    return usedServer;
  }

  private async fetchTtsChunk(text: string, voice: 'male' | 'female'): Promise<{ bytes: ArrayBuffer; mimeType: string } | null> {
    try {
      const { serverApi } = await import('../server/api');
      const audio = await serverApi.fetchTtsAudio(text, voice);
      if (!audio || !audio.bytes.byteLength) return null;
      return { bytes: audio.bytes, mimeType: audio.mimeType };
    } catch {
      return null;
    }
  }

  /** يحفظ الصوت ويصفّه؛ يشغّل الأول فوراً والباقي تباعاً عند انتهاء السابق. */
  private async enqueueSound(audio: { bytes: ArrayBuffer; mimeType: string }, seq: number, myTurn: number): Promise<void> {
    try {
      const fs = await import('expo-file-system');
      const { Directory, File, Paths } = fs;
      const dir = new Directory(Paths.cache, 'osamah_tts');
      if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
      const ext = audio.mimeType.includes('wav') ? 'wav'
        : (audio.mimeType.includes('mpeg') || audio.mimeType.includes('mp3')) ? 'mp3' : 'm4a';
      const file = new File(dir, `tts_${myTurn}_${seq}.${ext}`);
      if (!file.exists) file.create();
      file.write(new Uint8Array(audio.bytes));

      const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      const sound = createAudioPlayer(file.uri);
      if (myTurn !== this.turnId) {
        sound.remove();
        return;
      }
      this.soundQueue.push({ sound, myTurn });
      logVoice(`enqueue chunk#${seq} turn=${myTurn} queue=${this.soundQueue.length}`);
      markVoice('firstAudioAt');
      void this.pumpQueue();
    } catch {
      logVoice(`enqueue chunk#${seq} FAILED`);
    }
  }

  /** مشغّل الصف: يشغّل أول صوت فقط في كل لحظة حتى لا يتداخل الصوت. */
  private async pumpQueue(): Promise<void> {
    if (this.isPlaying || this.soundQueue.length === 0) return;
    const current = this.turnId;
    // إسقاط أي أصوات لا تخص الدور الحالي.
    this.soundQueue = this.soundQueue.filter((s) => s.myTurn === current);
    const next = this.soundQueue.shift();
    if (!next) return;
    const sound = next.sound;
    this.isPlaying = true;
    this.setStateSpeaking(true);
    const subscription =
      typeof sound.addListener === 'function'
        ? sound.addListener('playbackStatusUpdate', (status: any) => {
            if (status?.didJustFinish) {
              subscription?.remove();
              this.isPlaying = false;
              sound.remove();
              this.setStateSpeaking(this.soundQueue.length > 0);
              void this.pumpQueue();
            }
          })
        : null;
    try {
      sound.play();
      if (current !== this.turnId) {
        // أُلغي أثناء بدء التشغيل → أوقف فوراً.
        this.isPlaying = false;
        subscription?.remove();
        sound.pause();
        sound.remove();
        this.setStateSpeaking(false);
        this.soundQueue = [];
      }
    } catch {
      subscription?.remove();
      this.isPlaying = false;
      this.setStateSpeaking(false);
      void this.pumpQueue();
    }
  }

  private setStateSpeaking(v: boolean): void {
    if (this.speaking !== v) {
      this.speaking = v;
      this.onStateChange(v);
    }
  }

  /** إيقاف فوري للنطق الحالي وإخراج كل الأصوات المتبقية (يُستخدم للمقاطعة/الخروج). */
  async stopSpeaking(): Promise<void> {
    this.turnId += 1; // ألغِ أي دور قيد الجلب/التشغيل.
    logVoice('stopSpeaking (turn invalidated)');
    const queue = this.soundQueue;
    this.soundQueue = [];
    for (const item of queue) {
      try {
        item.sound.pause?.();
        item.sound.remove?.();
      } catch {
        /* متجاهل */
      }
    }
    if (this.serverSound) {
      const s = this.serverSound;
      this.serverSound = null;
      try {
        s.pause?.();
        s.remove?.();
      } catch {
        /* متجاهل */
      }
    }
    this.isPlaying = false;
    loadSpeech()?.stop?.();
    this.setStateSpeaking(false);
  }

  /** بدء الاستماع: يستخدم @react-native-voice/voice إن توفر، وإلا التسجيل عبر expo-av + الخادم. */
  async startListening(onResult: (text: string) => void, onError: (msg: string) => void): Promise<void> {
    await this.ensureNative();
    const voice = loadVoice();
    if (voice && this.supported) {
      this.recordMode = 'native';
      await this.startNative(voice, onResult, onError);
      return;
    }
    // مسار Expo Go: تسجيل عبر expo-av ثم رفع للخادم عند التوقف.
    this.recordMode = 'server';
    await this.startServerRecording(onResult, onError);
  }

  private async startNative(
    voice: VoiceModule,
    onResult: (text: string) => void,
    onError: (msg: string) => void
  ): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          onError('لم يتم منح إذن الميكروفون');
          return;
        }
      }
      if (!voice.isAvailable()) {
        onError('التعرف على الصوت غير مدعوم على هذا الجهاز');
        return;
      }
    } catch {
      onError('التعرف على الصوت غير مدعوم على هذا الجهاز');
      return;
    }

    await this.stopSpeaking();

    this.pendingResult = onResult;
    this.pendingError = onError;
    try {
      await voice.destroy();
      await voice.start('ar-SY');
    } catch (e: any) {
      onError(`تعذر بدء الاستماع: ${e.message ?? String(e)}`);
    }
  }

  private async startServerRecording(onResult: (text: string) => void, onError: (msg: string) => void): Promise<void> {
    if (!loadAudioModule()) {
      onError('التعرف على الصوت غير مدعوم على هذا الجهاز');
      this.recordMode = null;
      return;
    }
    try {
      // في Expo Go نستخدم واجهة أذونات expo-audio الموثوقة (requestRecordingPermissionsAsync)،
      // لا PermissionsAndroid الخام الذي لا يعمل بشكل صحيح داخل Expo Go.
      const { requestRecordingPermissionsAsync } = await import('expo-audio');
      const res = await requestRecordingPermissionsAsync();
      const granted = !!res?.granted;
      if (!granted) {
        onError('لم يتم منح إذن الميكروفون');
        this.recordMode = null;
        return;
      }
    } catch {
      onError('تعذر الوصول إلى الميكروفون');
      this.recordMode = null;
      return;
    }

    await this.stopSpeaking();

    this.pendingResult = onResult;
    this.pendingError = onError;

    try {
      // نظّف أي مسجّل متبقٍ (expo-audio يسمح بمسجّل واحد نشط في كل مرة، فوجوده يمنع بدء
      // تسجيل جديد). نحرّر أيضاً وضع الصوت حتى لا يعيقه صوت سابق.
      if (this.recording) {
        try {
          await this.recording.stop?.();
          this.recording.remove?.();
        } catch {
          /* متجاهل */
        }
        this.recording = null;
      }
      try {
        const { setAudioModeAsync } = await import('expo-audio');
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      } catch {
        /* متجاهل */
      }

      const options = recordingPreset || undefined;
      const rec = new audioModule.AudioRecorder(options);
      await rec.prepareToRecordAsync(options);
      rec.record();
      this.recording = rec;
      logVoice('microphone.start');
      markVoice('recordingStartedAt');
    } catch (e: any) {
      this.recording = null;
      this.pendingResult = null;
      this.pendingError = null;
      onError(`تعذر بدء التسجيل: ${e?.message ?? String(e)}`);
    }
  }

  async stopListening(): Promise<void> {
    if (this.recordMode === 'server') {
      await this.finishServerRecording();
      return;
    }
    // المسار الأصلي
    const voice = loadVoice();
    try {
      await voice?.stop();
    } catch {
      // تجاهل
    }
    this.pendingResult = null;
    this.pendingError = null;
  }

  private async finishServerRecording(): Promise<void> {
    const recorder = this.recording;
    this.recording = null;
    const onResult = this.pendingResult;
    const onError = this.pendingError;
    this.pendingResult = null;
    this.pendingError = null;

    if (!recorder) {
      onError?.('لم يُسجَّل صوت');
      return;
    }
    try {
      const uri = recorder.uri ?? null;
      await recorder.stop?.();
      recorder.remove?.();
      markVoice('recordingStoppedAt');
      logVoice('microphone.stop');
      if (!uri) {
        onError?.('لم يُلتقط صوت');
        return;
      }
      const { serverApi } = await import('../server/api');
      // قراءة الملف المحلي عبر expo-file-system (موثوق) بدل fetch(file://) الذي
      // غالباً يعيد فارغاً في React Native/Expo — كان سبب "لا يستمع لشي".
      const { File } = await import('expo-file-system');
      const audioFile = new (File as any)(uri);
      const buffer = await audioFile.arrayBuffer();
      if (!buffer || !buffer.byteLength) {
        throw new Error('لم يُلتقط صوت');
      }
      const text = await serverApi.transcribeAudio(buffer);
      markVoice('transcriptAt');
      logVoice(`stt.transcript: ${text}`);
      onResult?.(text);
    } catch (e: any) {
      onError?.(e?.message ?? 'تعذر تحويل الصوت إلى نص');
    }
  }

  async release(): Promise<void> {
    this.ready = false;
    this.turnId += 1; // ألغِ أي جلب/تشغيل معلّق.
    const voice = loadVoice();
    try {
      loadSpeech()?.stop?.();
      await voice?.destroy();
    } catch {
      // تجاهل
    }
    const queue = this.soundQueue;
    this.soundQueue = [];
    for (const item of queue) {
      try {
        item.sound.pause?.();
        item.sound.remove?.();
      } catch {
        /* متجاهل */
      }
    }
    if (this.serverSound) {
      const s = this.serverSound;
      this.serverSound = null;
      try {
        s.pause?.();
        s.remove?.();
      } catch {
        // تجاهل
      }
    }
    if (this.recording) {
      const rec = this.recording;
      this.recording = null;
      try {
        await rec.stop?.();
        rec.remove?.();
      } catch {
        // تجاهل
      }
    }
  }
}
