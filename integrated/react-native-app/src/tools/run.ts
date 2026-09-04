// بناء طلب حقيقي للوكيل لكل أداة + خطاف يعكس الإشارات الحقيقية من متجر الوكيل،
// ومساعد تنفيذ يضبط دورة حياة الجلسة (start → send → finish) حصرياً دون الاعتماد على isSending العامة.
import { useAgentStore } from '../store/agentStore';
import { useToolsStore, PdfConfig, PresentationConfig, LifePlannerConfig, MindMapConfig, ToolRun } from './toolsStore';

function contentTypesLabel(keys: string[], labels: Record<string, string>): string {
  if (!keys.length) return '';
  return keys.map((k) => labels[k] ?? k).join('، ');
}

export function buildPdfPrompt(c: PdfConfig): string {
  const content = contentTypesLabel(c.contentTypes, {
    paragraphs: 'فقرات نصية',
    headings: 'عناوين رئيسية وفرعية',
    images: 'أقسام للصور',
    tables: 'جداول',
    cards: 'بطاقات معلوماتية',
    bullets: 'نقاط مختصرة',
    quotes: 'اقتباسات بارزة',
    charts: 'مخططات بيانية',
    illustrations: 'رسوم توضيحية',
    stats: 'أرقام وإحصائيات',
  });
  const lang = c.language === 'ar' ? 'باللغة العربية (اتجاه RTL)' : c.language === 'en' ? 'باللغة الإنجليزية (اتجاه LTR)' : 'باللغتين العربية والإنجليزية';
  return [
    `أنشئ ملف PDF احترافي بعنوان: ${c.topic || 'تقرير'}، ${lang}.`,
    `عدد الصفحات المطلوب: ${c.pages}.`,
    `التصميم/الأسلوب: ${c.design}.`,
    `اللون الرئيسي للهوية: ${c.color}.`,
    `مكوّنات المحتوى المطلوب تضمينها: ${content || 'محتوى غني متنوع'}.`,
    c.includeToc ? 'تضمين فهرس محتويات في بداية الملف.' : '',
    c.includeCover ? 'إضافة صفحة غلاف.' : '',
    c.includeAppendices ? 'إضافة ملاحق في نهاية الملف.' : '',
    'نظّم المحتوى بأقسام وفصول واضحة، بلغة سليمة ومحتوى مفيد يشمل مقدمة وجوهر الموضوع وخاتمة.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildPresentationPrompt(c: PresentationConfig): string {
  const layouts = contentTypesLabel(c.layouts, {
    title: 'عنوان',
    text: 'نص',
    images: 'صور',
    tables: 'جداول',
    cards: 'بطاقات',
    charts: 'مخططات',
    graphics: 'رسوم بيانية',
    quotes: 'اقتباسات',
    timeline: 'Timeline',
    compare: 'مقارنة',
    stats: 'إحصائيات',
  });
  const lang = c.language === 'ar' ? 'باللغة العربية (RTL)' : c.language === 'en' ? 'باللغة الإنجليزية (LTR)' : 'باللغتين';
  return [
    `أنشئ عرضًا تقديميًا احترافيًا من ${c.slides} شرائح عن: ${c.topic || 'موضوع العرض'}، ${lang}.`,
    `نوع العرض/السياق: ${c.type}.`,
    `التصميم البصري: ${c.design}.`,
    `اللون الرئيسي للهوية: ${c.color}.`,
    `تخطيطات الشرائح المفضلة: ${layouts || 'متنوعة'}.`,
    c.includeCover ? 'شريحة عنوان/غلاف في البداية.' : '',
    c.includeThanks ? 'شريحة شكر وخاتمة في النهاية.' : '',
    'اجعل المحتوى غنيًا ومنظمًا وفق بنية واضحة لكل شريحة.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildLifePrompt(c: LifePlannerConfig): string {
  const area = c.area;
  const horizon = c.isLongTerm ? 'خطة طويلة المدى (أكثر من سنة)' : 'خطة مرحلية قصيرة/متوسطة المدى';
  return [
    `ساعدني في وضع خطة عملية لتحقيق هذا الهدف: ${c.goal || 'هدف حياتي'}`,
    `المجال الأساسي: ${area}.`,
    `الأفق الزمني: ${horizon}.`,
    'حلّل الهدف، قسّمه إلى مراحل ومواعيد رئيسية، وحدد إجراءات عملية قابلة للتنفيذ، وعوائق متوقعة، ومؤشرات نجاح.',
    'جهّز الخطة كخطوات منظمة تنفَّذ تباعًا.',
  ].join('\n');
}

export function buildMindMapPrompt(c: MindMapConfig): string {
  const lang = c.language === 'ar' ? 'اللغة العربية' : 'اللغة الإنجليزية';
  const style = c.style === 'tree' ? 'شجرة' : c.style === 'radial' ? 'شعاعي' : 'تدفق';
  return [
    `أنشئ خريطة ذهنية احترافية حول الموضوع: ${c.topic || 'الموضوع'}، بأسلوب ${style} وباللغة ${lang}.`,
    'ابدأ بالمفهوم المركزي، ثم أضف الفروع الرئيسية والفرعية، مع كلمات مفتاحية موجزة وعلاقات واضحة بين المفاهيم.',
    'نظّم المحتوى كعقد متسلسلة (عقدة مركزية وعدد من الفروع) تصلح كأساس لمحرر الخريطة.',
  ].join('\n');
}

/**
 * ينفّذ أداة عبر وكيل أسامة الحقيقي (sendUserMessage) ويضبط دورة حياة الجلسة حصرياً:
 * startRun → sendUserMessage → finishRun. يقي من الرفض (مثل قيد expo-sqlite على الويب).
 */
export async function executeToolRun(tool: ToolRun['tool'], title: string, prompt: string, context?: Record<string, string>): Promise<boolean> {
  const store = useToolsStore.getState();
  store.startRun(tool, title);
  try {
    const ok = await useAgentStore.getState().sendUserMessage(prompt, false, context);
    if (ok) {
      store.finishRun(true, 'تم إنجاز المهمة بنجاح ✓');
    } else {
      store.finishRun(false, useAgentStore.getState().sendError ?? 'تعذر إكمال التنفيذ');
    }
    return ok;
  } catch (e: any) {
    store.finishRun(false, (e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'حدث خطأ أثناء التنفيذ'));
    return false;
  }
}

/** خطاف عرض بحت — يعكس حالة الجلسة الحالية + الإشارة الحية من متجر الوكيل. لا يغيّر الحالة. */
export function useToolRun(tool: ToolRun['tool']) {
  const activeTaskStatus = useAgentStore((s) => s.uiState.activeTaskStatus);
  const sendError = useAgentStore((s) => s.sendError);
  const run = useToolsStore((s) => s.run);
  const isRunning = run.status === 'running' && run.tool === tool;
  return { isRunning, status: run.status, liveStatus: activeTaskStatus, sendError };
}
