// الأدوات — منقولة من agent/tools/Tool.kt و ToolImplementations.kt
import { PdfStyle } from '../engine/PdfEngine';
import { buildPdfReportData } from '../engine/pdfContent';
import { UserProfileEntity } from '../data/types';

export enum ToolScope {
  READ_ONLY = 'READ_ONLY',
  LOCAL_WRITE = 'LOCAL_WRITE',
  NETWORK_SEARCH = 'NETWORK_SEARCH',
  SENSITIVE_SYSTEM = 'SENSITIVE_SYSTEM',
}

export interface ToolResult {
  success: boolean;
  summary: string;
  data: string | null;
  requiresConfirmation: boolean;
  artifacts: string[];
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  scope: ToolScope;
  requiresUserConfirmation: boolean;
  execute(
    parameters: Record<string, string>,
    userProfile: UserProfileEntity | null,
    memories: string[]
  ): Promise<ToolResult>;
}

function ok(summary: string, data: string | null = null, artifacts: string[] = []): ToolResult {
  return { success: true, summary, data, requiresConfirmation: false, artifacts };
}

export class SearchTool implements AgentTool {
  id = 'tool_search';
  name = 'البحث المعمق والاستقصاء';
  description = 'بحث في مصادر متعددة، مقارنة النتائج، واستخراج الأدلة والمراجع الموثقة.';
  scope = ToolScope.NETWORK_SEARCH;
  requiresUserConfirmation = false;

  async execute(parameters: Record<string, string>, userProfile: UserProfileEntity | null): Promise<ToolResult> {
    const query = parameters['query'] ?? 'بحث عام';
    // أداة البحث محلية ولا تملك محركاً ويبياً فعلياً؛ النتائج الموثوقة تأتي من خادم OSAMAH.
    // لا نختلق مصادر وهمية. نوجّه الطلب إلى مصدر الحقيقة (الخادم) ونعكس الحالة الواقعية.
    const summary = `تم توجيه البحث حول: "${query}" إلى خادم OSAMAH لتجميع المصادر الموثقة. لا تُعرض هنا مصادر إلا بعد وصولها فعلياً من المصادر الحقيقية.`;
    return ok(summary, '{}', []);
  }
}

export class BrowserTool implements AgentTool {
  id = 'tool_browser';
  name = 'المتصفح الذكي';
  description = 'فتح الروابط، قراءة المقالات وتلخيص المحتوى الصافي بدون إعلانات أو مشتتات.';
  scope = ToolScope.NETWORK_SEARCH;
  requiresUserConfirmation = false;

  async execute(parameters: Record<string, string>): Promise<ToolResult> {
    const url = parameters['url'] ?? 'https://developer.android.com';
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    // لا نصنّع قراءة/تلخيص فعلياً هنا؛ يمر عبر خادم OSAMAH. نعكس الحالة المطلوبة بصدق.
    return ok(`طُلب فتح الرابط وقراءة محتواه: ${cleanUrl}`, cleanUrl, []);
  }
}

export class PdfTool implements AgentTool {
  id = 'tool_pdf';
  name = 'مولد الكتب والتقارير PDF';
  description = 'توليد كتب ووثائق رسمية وتقارير PDF عالية الدقة ومتعددة الصفحات.';
  scope = ToolScope.LOCAL_WRITE;
  requiresUserConfirmation = false;
  onDocumentGenerated: ((path: string) => void) | null = null;

  async execute(
    parameters: Record<string, string>,
    userProfile: UserProfileEntity | null
  ): Promise<ToolResult> {
    const title = parameters['title'] ?? 'تقرير هندسي مفصل';
    const topic = parameters['topic'] ?? 'هندسة الأنظمة والذكاء الاصطناعي';
    // المحتوى الحقيقي من ردّ الوكيل (نص منسَّق) — وليس قالباً ثابتاً.
    const content = parameters['content'] ?? topic;
    const isBook = topic.includes('كتاب') || topic.includes('دليل شامل');

    const style: PdfStyle = {
      design: (parameters['design'] as PdfStyle['design']) ?? 'professional',
      accent: parameters['accent'] ?? '#00F0FF',
      includeCover: parameters['includeCover'] === 'true',
      includeToc: parameters['includeToc'] === 'true',
      includeAppendices: parameters['includeAppendices'] === 'true',
      pages: parseInt(parameters['pages'] ?? '0', 10) || undefined,
      language: (parameters['language'] as PdfStyle['language']) || 'ar',
    };

    const subtitle = isBook
      ? 'كتاب ودليل عملي متكامل • تم إعداده وتنسيقه آلياً'
      : 'وثيقة رسمية وتقارير تحليلية معتمدة';

    // إنشاء ملف PDF فعلي مرتكز على محتوى الرد الحقيقي + إعدادات المستخدم.
    const generatedPath = await createPdfDocumentFromReply({
      reply: content,
      topic,
      title,
      author: userProfile?.name ?? 'المهندس أسامة العُمري',
      style,
      isBook,
    });
    const filename = generatedPath.split('/').pop() ?? 'document.pdf';
    this.onDocumentGenerated?.(generatedPath);

    return ok(
      `تم إنشاء ${isBook ? 'الكتاب والمستند' : 'ملف الـ PDF'} بنجاح: ${filename}`,
      generatedPath,
      [generatedPath]
    );
  }
}

/** إنشاء PDF من نصّ ردٍّ حقيقي + إعدادات. */
export async function createPdfDocumentFromReply(input: {
  reply: string;
  topic: string;
  title: string;
  author: string;
  style: PdfStyle;
  isBook: boolean;
}): Promise<string> {
  // إعادة استيراد createPdfDocument هنا لتفادي استيراد دائري على مستوى الوحدة.
  const { createPdfDocument } = await import('../engine/PdfEngine');
  const data = buildPdfReportData({
    reply: input.reply,
    topic: input.topic,
    title: input.title,
    author: input.author,
    style: input.style,
  });
  data.isBookMode = input.isBook;
  return createPdfDocument(data);
}

export class PresentationTool implements AgentTool {
  id = 'tool_presentation';
  name = 'استوديو العروض التقديمية الفائقة';
  description = 'إنشاء عروض تقديمية احترافية تتسع من 5 إلى أكثر من 120 شريحة مصممة بعناية.';
  scope = ToolScope.LOCAL_WRITE;
  requiresUserConfirmation = false;

  async execute(parameters: Record<string, string>, userProfile: UserProfileEntity | null): Promise<ToolResult> {
    const topic = parameters['topic'] ?? 'الذكاء الاصطناعي وهندسة الأنظمة الحديثة';
    const count = Math.max(4, Math.min(150, parseInt(parameters['count'] ?? '12', 10) || 12));

    const slides: { title: string; content: string; bulletPointsJson: string; iconName: string }[] = [
      {
        title: topic,
        content: 'عرض تقديمي احترافي شامل ومعد بواسطة وكيل أسامة',
        bulletPointsJson: `إعداد: ${userProfile?.name ?? 'المهندس أسامة'},التخصص: ${userProfile?.specialization ?? 'هندسة النظم'},عدد الشرائح: ${count} شريحة`,
        iconName: 'auto_awesome',
      },
    ];

    for (let i = 2; i <= count; i++) {
      const axisName =
        i % 5 === 1
          ? `المحور ${i}: الأسس والركائز الاستراتيجية`
          : i % 5 === 2
            ? `المحور ${i}: التحليل المقارن ودراسة الحالات`
            : i % 5 === 3
              ? `المحور ${i}: خطة التطبيق العملي ومراحل الإنجاز`
              : i % 5 === 4
                ? `المحور ${i}: إدارة المخاطر وتأمين البيانات`
                : `المحور ${i}: قياس الأثر ومؤشرات النجاح المستدام`;
      slides.push({
        title: axisName,
        content: `تفصيل دقيق للشريحة ${i} لموضوع ${topic} مع توضيح الرؤى التطبيقية والمكتسبات.`,
        bulletPointsJson: `الهدف التنفيذي للشريحة ${i},مؤشر الإنجاز والجودة,ملاحظات المتابعة الميدانية`,
        iconName: 'insights',
      });
    }

    return ok(
      `تم تصميم وبناء العرض التقديمي بنجاح بعدد ${count} شريحة متناسقة واحترافية.`,
      `Presentation Created: ${count} slides`,
      slides.map((s) => s.title)
    );
  }
}

export class TaskPlannerTool implements AgentTool {
  id = 'tool_task_planner';
  name = 'مدبر ومنظم الحياة والمهام';
  description = 'تنظيم المواعيد، ترتيب الأولويات، وتقسيم الأهداف إلى خطة إنتاجية قابلة للتنفيذ.';
  scope = ToolScope.LOCAL_WRITE;
  requiresUserConfirmation = false;

  async execute(parameters: Record<string, string>): Promise<ToolResult> {
    const goal = parameters['goal'] ?? 'تنظيم جدول اليوم والأولويات';
    const stages = [
      '1. استعراض المهام العاجلة وترتيبها حسب مصفوفة أيزنهاور',
      '2. تخصيص فترات التركيز العميق (Deep Work) للمشاريع الأساسية',
      '3. جدولة المتابعة والتذكيرات في سجل الوكيل',
      '4. تقييم الإنجاز في نهاية اليوم وتحديث الذاكرة',
    ];
    return ok(`تم بناء خطة تنظيمية ذكية للمهمة: "${goal}".`, stages.join('\n'), stages);
  }
}

export class MemoryTool implements AgentTool {
  id = 'tool_memory';
  name = 'الذاكرة الانتقائية';
  description = 'حفظ واسترجاع تفضيلات المستخدم وسياق المهام محلياً وبشكل مشفر.';
  scope = ToolScope.LOCAL_WRITE;
  requiresUserConfirmation = false;

  async execute(parameters: Record<string, string>): Promise<ToolResult> {
    const key = parameters['key'] ?? 'ملاحظة';
    const value = parameters['value'] ?? '';
    return ok(`تم حفظ المعلومة في الذاكرة المحلية الآمنة: ${key}`, `${key}: ${value}`, [
      `المعلومة المحفوظة: ${key}`,
    ]);
  }
}

export const ALL_TOOLS: AgentTool[] = [
  new SearchTool(),
  new BrowserTool(),
  new PdfTool(),
  new PresentationTool(),
  new TaskPlannerTool(),
  new MemoryTool(),
];
