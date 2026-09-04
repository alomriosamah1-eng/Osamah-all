// toolsStore — حالة واجهة الأدوات (إعدادات كل أداة + جلسة التنفيذ الحالية).
// التخزين الحقيقي للمخرجات يبقى في SQLite/القرص (tasks/presentations/files)؛ هنا فقط حالة واجهة قابلة للحفظ عبر التنقل.
import { create } from 'zustand';
import { LanguageOption } from './options';

export type ToolRunStatus = 'idle' | 'running' | 'done' | 'failed';

export interface ToolRun {
  tool: 'pdf' | 'presentation' | 'life' | 'mindmap';
  title: string;
  status: ToolRunStatus;
  startedAt: number;
  finishedAt?: number;
  resultSummary?: string;
}

export interface PdfConfig {
  topic: string;
  language: LanguageOption;
  pages: number;
  design: string;
  color: string;
  contentTypes: string[];
  includeToc: boolean;
  includeCover: boolean;
  includeAppendices: boolean;
}

export interface PresentationConfig {
  topic: string;
  language: LanguageOption;
  slides: number;
  type: string;
  design: string;
  color: string;
  layouts: string[];
  includeCover: boolean;
  includeThanks: boolean;
}

export interface LifePlannerConfig {
  goal: string;
  area: string;
  isLongTerm: boolean;
}

export interface MindMapConfig {
  topic: string;
  language: LanguageOption;
  style: 'tree' | 'radial' | 'flow';
}

interface ToolsState {
  pdf: PdfConfig;
  presentation: PresentationConfig;
  life: LifePlannerConfig;
  mindmap: MindMapConfig;
  run: ToolRun;
  setPdf(p: Partial<PdfConfig>): void;
  setPresentation(p: Partial<PresentationConfig>): void;
  setLife(p: Partial<LifePlannerConfig>): void;
  setMindmap(p: Partial<MindMapConfig>): void;
  startRun(tool: ToolRun['tool'], title: string): void;
  finishRun(done: boolean, summary?: string): void;
}

const defaultPdf: PdfConfig = {
  topic: '',
  language: 'ar',
  pages: 20,
  design: 'academic',
  color: '#00F0FF',
  contentTypes: ['paragraphs', 'headings'],
  includeToc: true,
  includeCover: false,
  includeAppendices: false,
};

const defaultPresentation: PresentationConfig = {
  topic: '',
  language: 'ar',
  slides: 10,
  type: 'academic',
  design: 'modern',
  color: '#00F0FF',
  layouts: ['title', 'text', 'images'],
  includeCover: true,
  includeThanks: false,
};

const defaultLife: LifePlannerConfig = { goal: '', area: 'self_dev', isLongTerm: false };
const defaultMindmap: MindMapConfig = { topic: '', language: 'ar', style: 'tree' };

export const useToolsStore = create<ToolsState>((set) => ({
  pdf: defaultPdf,
  presentation: defaultPresentation,
  life: defaultLife,
  mindmap: defaultMindmap,
  run: { tool: 'pdf', title: '', status: 'idle', startedAt: 0 },
  setPdf: (p) => set((s) => ({ pdf: { ...s.pdf, ...p } })),
  setPresentation: (p) => set((s) => ({ presentation: { ...s.presentation, ...p } })),
  setLife: (p) => set((s) => ({ life: { ...s.life, ...p } })),
  setMindmap: (p) => set((s) => ({ mindmap: { ...s.mindmap, ...p } })),
  startRun: (tool, title) => set({ run: { tool, title, status: 'running', startedAt: Date.now() } }),
  finishRun: (done, summary) =>
    set((s) =>
      done
        ? { run: { ...s.run, status: 'done', finishedAt: Date.now(), resultSummary: summary } }
        : { run: { ...s.run, status: 'failed', finishedAt: Date.now(), resultSummary: summary } }
    ),
}));
