// voiceControllerAdapter — يربط VoiceConversationController ببنية Osamah Agent.
//
// يبني المتحكّم مع:
//   * المحرك الصوتي المناسب (native أو server — يُعدّل تلقائياً حسب البيئة).
//   * hooks تُمرّر أحداثه إلى المتجر (حالة العرض) وإلى مشغّل TTS الواقعي.
//
// نقطة الربط الحرجة: أحداث الصوت الحقيقية من VoiceHelper.onStateChange تُمرَّر
// إلى controller.notifyAudioPlaying حتى تكون حالة SPEAKING مبنيةً على مشغّل الصوت
// الفعلي لا على Timer (بند 19/39).

import { BubbleState } from '../components/voiceBubble';
import { VoiceHelper } from './VoiceHelper';
import { createSpeechEngine, SpeechEngine } from './speechEngine';
import {
  VoiceConversationController,
  phaseToBubble,
  VoicePhase,
} from './VoiceConversationController';

export interface ControllerStoreOps {
  getVoiceHelper(): VoiceHelper;
  submitUserTurn(text: string): Promise<boolean>;
  applyUiState(state: BubbleState, phase: VoicePhase): void;
  onVolume(value: number): void;
  onError(message: string): void;
  onAgentPhase(p: 'thinking' | 'searching' | 'generating'): void;
}

export interface VoiceControllerBundle {
  controller: VoiceConversationController;
  engine: SpeechEngine;
  /** استدعِه عند حدوث تغيّر في مشغّل الصوت الحقيقي. */
  onPlaybackChange(playing: boolean): void;
}

export function buildVoiceController(ops: ControllerStoreOps): VoiceControllerBundle {
  const engine = createSpeechEngine();

  const bridge = {
    playback(playing: boolean) {
      void controller.notifyAudioPlaying(playing);
    },
  };

  const controller = new VoiceConversationController(engine, {
    submitUserTurn: (text) => ops.submitUserTurn(text),
    // النطق يتمّ داخلياً عبر sendUserMessage (VoiceHelper.speak). المحرك هنا لا ينطق.
    speakReply: async () => {},
    onPhase: (phase) => {
      ops.applyUiState(phaseToBubble(phase), phase);
    },
    onAudioChange: () => {},
    onVolume: (v) => ops.onVolume(v),
    onError: (m) => ops.onError(m),
    onAgentPhase: (p) => ops.onAgentPhase(p),
  });

  return {
    controller,
    engine,
    onPlaybackChange: (playing) => bridge.playback(playing),
  };
}
