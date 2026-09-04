// فتح/إيقاف الصوت — يطلب إذن التسجيل داخل مسار التسجيل نفسه (Audio.requestPermissionsAsync
// الموثوق في Expo Go)، فلا نكرّر طلب الإذن هنا لتجنّب تعارض يؤدي لتوقف فوري.
import { useCallback } from 'react';
import { useAgentStore } from '../store/agentStore';
import { BubbleState } from '../components/voiceBubble';

export function useVoiceToggle(): () => Promise<void> {
  const agentState = useAgentStore((s) => s.uiState.agentState);
  const isVoiceInputActive = useAgentStore((s) => s.uiState.isVoiceInputActive);
  const startVoiceListening = useAgentStore((s) => s.startVoiceListening);
  const stopVoiceListening = useAgentStore((s) => s.stopVoiceListening);
  const interruptSpeech = useAgentStore((s) => s.interruptSpeech);

  return useCallback(async () => {
    if (agentState === BubbleState.SPEAKING) {
      await interruptSpeech();
      return;
    }
    if (isVoiceInputActive) {
      await stopVoiceListening();
      return;
    }
    await startVoiceListening();
  }, [agentState, isVoiceInputActive, startVoiceListening, stopVoiceListening, interruptSpeech]);
}