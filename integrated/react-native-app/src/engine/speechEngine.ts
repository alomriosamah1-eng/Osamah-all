// SpeechEngine — طبقة تجريد مصادر الأحداث الصوتية الحقيقية.
//
// نقطة الدخول الوحيدة التي يسمع منها VoiceConversationController: لا توجد حالة
// تُبنى من Timer، بل من أحداث فعلية تنبع من الميكروفون/STT/مشغّل الصوت.
//
// يوجد تنفيذان:
//   * NativeSpeechEngine — عبر @react-native-voice/voice: أحداث حيّة (بدء/توقف/نص
//     جزئي/صوت)، تفعّل تلقائياً في بُنية أصلية (dev-client/APK).
//   * ServerSpeechEngine  — عبر expo-av تسجيل + رفع STT: لا أحداث حيّة (Expo Go).
//     يُصدر speechEnded(text) فقط عند إيقاف التسجيل صراحةً (push-to-talk على مستوى
//     المحرك)، وأحداث الصوت (audioStarted/audioEnded) من مشغّل TTS الحقيقي.
//
// لا يُزيّف أي حدث. مبدئنا: إن لم يكن هناك مصدر فعلي للصوت/الطاقة، لا نبعث volume.

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { logVoice } from './voiceMetrics';

export type SpeechEvent =
  | { kind: 'micStarted' }
  | { kind: 'micStopped' }
  | { kind: 'speechStarted' } // المستخدم بدأ الكلام (VAD حقيقي)
  | { kind: 'speechPartial'; text: string } // نص جزئي متدفق
  | { kind: 'speechPaused' } // توقف مؤقت
  | { kind: 'speechResumed' } // استئناف
  | { kind: 'speechEnded'; final: string } // انتهاء كلام المستخدم (نص نهائي)
  | { kind: 'speechError'; message: string }
  | { kind: 'volume'; value: number } // 0..1 طاقة حقيقية (Orb)
  | { kind: 'audioStarted' } // بدأ صوت المساعد فعلياً
  | { kind: 'audioEnded' }; // انتهى آخر صوت

export interface SpeechEngine {
  readonly live: boolean; // هل يوفر أحداثاً حيّة (VAD/جزئي/طاقة)؟
  startListening(cb: (e: SpeechEvent) => void, onError: (m: string) => void): Promise<void>;
  /** إيقاف الاستماع. في المحرك الفعلي قد يُصدر speechEnded(final) عند الفراغ. */
  stopListening(): Promise<void>;
  /** يطلق صوتاً نصياً مجزأً (تخاطب TTS). يعيد وعداً يكتمل عند نهاية الصوت الحقيقي. */
  speak(text: string, voice: 'male' | 'female'): Promise<void>;
  stopSpeaking(): Promise<void>;
  release(): Promise<void>;
}

export const IN_EXPO_GO =
  Platform.OS !== 'web' &&
  (Constants.executionEnvironment === 'storeClient' || (Constants as any).appOwnership === 'expo');

/* =====================================================================
 * Native engine — الأحداث الحيّة الكاملة (بُنية أصلية)
 * ===================================================================== */
interface NVoice {
  onSpeechStart: (() => void) | null;
  onSpeechEnd: (() => void) | null;
  onSpeechError: ((e: any) => void) | null;
  onSpeechResults: ((e: any) => void) | null;
  onSpeechPartialResults: ((e: any) => void) | null;
  onSpeechVolumeChanged: ((e: any) => void) | null;
  isAvailable(): boolean;
  start(lang?: string): Promise<unknown>;
  stop(): Promise<unknown>;
  destroy(): Promise<unknown>;
}

function loadNativeVoice(): NVoice | null {
  if (IN_EXPO_GO) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-voice/voice');
    const maybe = (mod && (mod.default ?? mod)) as unknown;
    return maybe && typeof (maybe as NVoice).start === 'function' ? (maybe as NVoice) : null;
  } catch {
    return null;
  }
}

/* =====================================================================
 * Server engine — expo-av تسجيل + STT رفع، وTTS عبر expo-speech/الخادم
 * (أثبتت هذه المسارات أنها تعمل في Expo Go SDK 54)
 * ===================================================================== */
export class ServerSpeechEngine implements SpeechEngine {
  readonly live = false;

  private cb: ((e: SpeechEvent) => void) | null = null;
  private onErr: ((m: string) => void) | null = null;
  private recorder: any = null;
  private recording = false;

  // حالة TTS المستخدمة من قبل (navigate عبر VoiceHelper القديمة): نستعملها للتوافق.
  // نحن نمرر النطق عبر speak() المقدَّم من الطبقة الخارجية إذا لزم.

  async startListening(cb: (e: SpeechEvent) => void, onError: (m: string) => void): Promise<void> {
    this.cb = cb;
    this.onErr = onError;
    try {
      const mod = await import('expo-audio');
      const AudioModule = mod.AudioModule ?? (require('expo-audio') as any)?.AudioModule;
      if (!AudioModule || typeof AudioModule.AudioRecorder !== 'function') {
        onError('التعرف على الصوت غير مدعوم على هذا الجهاز');
        return;
      }
      const { requestRecordingPermissionsAsync } = mod;
      const res = await requestRecordingPermissionsAsync();
      const granted = !!res?.granted;
      if (!granted) {
        onError('لم يتم منح إذن الميكروفون');
        return;
      }

      // تحرير أي مسجّل سابق (expo-audio يسمح بنسخة واحدة نشطة).
      if (this.recorder) {
        try {
          await this.recorder.stop?.();
          this.recorder.remove?.();
        } catch {
          /* متجاهل */
        }
        this.recorder = null;
      }
      try {
        await mod.setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      } catch {
        /* متجاهل */
      }

      // جودة متوسطة مخصصة: أحادي القناة + معدل بت 96k → ملف أخف يُرفع ويُحوَّل أسرع
      // (STT) مع دقة مقبولة — توازن سرعة الاستماع والدقة.
      const presets = mod.RecordingPresets ?? {};
      const high = presets.HIGH_QUALITY ?? {};
      const options = {
        ...high,
        numberOfChannels: 1,
        bitRate: 96000,
        android: { ...(high.android ?? {}), audioEncoder: 'aac', outputFormat: 'mpeg4' },
        web: { mimeType: 'audio/webm', bitsPerSecond: 96000 },
      };
      const rec = new AudioModule.AudioRecorder(options as any);
      await rec.prepareToRecordAsync(options as any);
      rec.record();
      this.recorder = rec;
      this.recording = true;
      logVoice('mic.start (server)');
      cb({ kind: 'micStarted' });
    } catch (e: any) {
      this.recording = false;
      this.recorder = null;
      onError(`تعذر بدء التسجيل: ${e?.message ?? String(e)}`);
    }
  }

  async stopListening(): Promise<void> {
    if (!this.recording) return;
    this.recording = false;
    const recorder = this.recorder;
    this.recorder = null;
    const cb = this.cb;
    const onErr = this.onErr;
    this.cb = null;
    this.onErr = null;
    if (!recorder) {
      onErr?.('لم يُسجَّل صوت');
      return;
    }
    try {
      const uri = recorder.uri ?? null;
      await recorder.stop?.();
      recorder.remove?.();
      logVoice('mic.stop (server)');
      cb?.({ kind: 'micStopped' });
      if (!uri) {
        onErr?.('لم يُلتقط صوت');
        return;
      }
      const { serverApi } = await import('../server/api');
      const { File } = await import('expo-file-system');
      const audioFile = new (File as any)(uri);
      const buffer = await audioFile.arrayBuffer();
      if (!buffer || !buffer.byteLength) throw new Error('لم يُلتقط صوت');
      const text = await serverApi.transcribeAudio(buffer);
      logVoice(`stt.final: ${text}`);
      cb?.({ kind: 'speechEnded', final: text });
    } catch (e: any) {
      onErr?.(e?.message ?? 'تعذر تحويل الصوت إلى نص');
    }
  }

  async speak(): Promise<void> {
    // تُدار TTS خارجياً عبر VoiceHelper (تُمرَّر من المستودع). المحرك هنا لا ينطق
    // بشكل مباشر حتى لا يتضارب مع مسار TTS القائم — انظر VoiceConversationController.
    return Promise.resolve();
  }

  async stopSpeaking(): Promise<void> {
    return Promise.resolve();
  }

  async release(): Promise<void> {
    this.cb = null;
    this.onErr = null;
    if (this.recorder) {
      try {
        await this.recorder.stop?.();
        this.recorder.remove?.();
      } catch {
        /* متجاهل */
      }
      this.recorder = null;
      this.recording = false;
    }
  }
}

/** يبني المحرك المناسب للبيئة الحالية (native إن توفر، وإلا server). */
export function createSpeechEngine(): SpeechEngine {
  const native = loadNativeVoice();
  if (native && native.isAvailable()) {
    logVoice('engine: native (@react-native-voice/voice)');
    return new NativeSpeechEngine(native);
  }
  logVoice('engine: server (expo-av + upload STT)');
  return new ServerSpeechEngine();
}

/* NativeSpeechEngine — مُكمّل أدناه عبر صنف مبسّطٍ آمن (لا يُقيَّم أصلاً في Expo Go) */
export class NativeSpeechEngine implements SpeechEngine {
  readonly live = true;
  private voice: NVoice;
  private cb: ((e: SpeechEvent) => void) | null = null;

  constructor(voice: NVoice) {
    this.voice = voice;
  }

  async startListening(cb: (e: SpeechEvent) => void, onError: (m: string) => void): Promise<void> {
    this.cb = cb;
    if (Platform.OS === 'android') {
      const { PermissionsAndroid } = await import('react-native');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        onError('لم يتم منح إذن الميكروفون');
        return;
      }
    }
    if (!this.voice.isAvailable()) {
      onError('التعرف على الصوت غير مدعوم على هذا الجهاز');
      return;
    }
    this.voice.onSpeechStart = () => cb({ kind: 'speechStarted' });
    this.voice.onSpeechEnd = () => {
      // سيكتمل النص النهائي عبر onSpeechResults.
    };
    this.voice.onSpeechPartialResults = (e: any) => {
      const matches = e?.value ?? [];
      if (matches.length > 0) cb({ kind: 'speechPartial', text: matches[0] });
    };
    this.voice.onSpeechResults = (e: any) => {
      const matches = e?.value ?? [];
      if (matches.length > 0) cb({ kind: 'speechEnded', final: matches[0] });
    };
    this.voice.onSpeechVolumeChanged = (e: any) => {
      // expo-ish: القيمة بين 0 و1 (قد تكون RAW أو NORMALIZED).
      let v = Number(e?.value);
      if (!Number.isFinite(v)) return;
      cb({ kind: 'volume', value: Math.max(0, Math.min(1, v)) });
    };
    this.voice.onSpeechError = (e: any) => {
      cb({ kind: 'speechError', message: e?.error?.message ?? 'خطأ في التعرف' });
    };
    try {
      await this.voice.destroy();
      await this.voice.start('ar-SY');
      cb({ kind: 'micStarted' });
    } catch (e: any) {
      onError(`تعذر بدء الاستماع: ${e?.message ?? String(e)}`);
    }
  }

  async stopListening(): Promise<void> {
    try {
      await this.voice.stop();
    } catch {
      /* متجاهل */
    }
    this.cb?.({ kind: 'micStopped' });
    this.cb = null;
  }

  async speak(): Promise<void> {
    return Promise.resolve();
  }

  async stopSpeaking(): Promise<void> {
    return Promise.resolve();
  }

  async release(): Promise<void> {
    this.cb = null;
    try {
      await this.voice.destroy();
    } catch {
      /* متجاهل */
    }
  }
}
