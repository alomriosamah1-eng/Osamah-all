// حالة الاتصال الفعلية بالخادم — كرة صغيرة في زاوية الشاشة.
// لا تُزيّف: تُقرأ من خادم OSAMAH الفعلي (serverApi.health) + حالة عمل الوكيل الحقيقية.
import { useEffect, useRef } from 'react';
import { useAgentStore } from '../store/agentStore';
import { BubbleState } from '../components/voiceBubble';

export type OrbColor = 'green' | 'yellow' | 'blue' | 'red';

// القاعدة: CONNECTED→أخضر، WEAK→أصفر، AGENT_WORKING→أزرق، DISCONNECTED→أحمر.
// حالة «يعمل/يفكر» (أزرق) تتفوق على حالة الاتصال أثناء تنفيذ الوكيل.
export function useConnectionStatus(intervalMs = 5000): OrbColor {
  const connectionStatus = useAgentStore((s) => s.connectionStatus);
  const agentState = useAgentStore((s) => s.uiState.agentState);
  const isSending = useAgentStore((s) => s.isSending);
  const refresh = useAgentStore((s) => s.refreshConnectionStatus);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void refresh();
    timerRef.current = setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  const isWorking =
    isSending ||
    agentState === BubbleState.THINKING ||
    agentState === BubbleState.LISTENING ||
    agentState === BubbleState.SPEAKING;

  if (isWorking) return 'blue';
  if (connectionStatus === 'disconnected') return 'red';
  if (connectionStatus === 'weak') return 'yellow';
  return 'green';
}
