// اختيار نموذج عابر لجلد OSAMAH — نسخ مطابق لمرجع osamah-agent/lib/opencode-model-selection.tsx.
// هو تفضيل واجهة فقط، وليس سجل إعدادات OpenCode؛ الخادم يعيد التحقق من النموذج حياً عند الإرسال.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type OpenCodeSelectedModel = {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
};

type OpenCodeModelSelectionContextValue = {
  selectedModel: OpenCodeSelectedModel | null;
  selectModel: (model: OpenCodeSelectedModel) => void;
};

const OpenCodeModelSelectionContext = createContext<OpenCodeModelSelectionContextValue | null>(null);

// مرجع على مستوى الوحدة: يسمح للكود غير-React (مثل store/agentStore) بقراءة
// الاختيار الحالي عند الإرسال، تماماً كما يقرأ المرجع useOpenCodeModelSelection في chat.tsx.
let currentSelection: OpenCodeSelectedModel | null = null;

export function getCurrentSelectedModel(): { providerId: string; modelId: string } | null {
  return currentSelection ? { providerId: currentSelection.providerId, modelId: currentSelection.modelId } : null;
}

export function OpenCodeModelSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedModel, selectModelState] = useState<OpenCodeSelectedModel | null>(null);
  const selectModel = (model: OpenCodeSelectedModel) => {
    currentSelection = model;
    selectModelState(model);
  };
  const value = useMemo(() => ({ selectedModel, selectModel }), [selectedModel]);
  return <OpenCodeModelSelectionContext.Provider value={value}>{children}</OpenCodeModelSelectionContext.Provider>;
}

export function useOpenCodeModelSelection() {
  const value = useContext(OpenCodeModelSelectionContext);
  if (!value) throw new Error('OpenCodeModelSelectionProvider is required.');
  return value;
}
