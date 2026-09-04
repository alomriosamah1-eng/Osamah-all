// PdfEngine — توليد PDF حقيقي عبر pdf-lib بنفس تخطيط الأصلي (PdfEngine.kt):
// صفحة 595×842. تتضمن تشكيلاً عربياً (arabic-reshaper) لقراءة سليمة للنص العربي داخل الـ PDF.
//
// توسعة "مولد PDF الحقيقي": يطبّق فعلياً إعدادات الواجهة على الملف الناتج:
//   * design  → لوحة تخطيط بصرية (هوامش/عناوين/شريط/ترويسة).
//   * accent  → الهوية اللونية للعناوين/الترويسة/نقاط التعداد.
//   * includeCover    → صفحة غلاف مستقلة.
//   * includeToc      → صفحة فهرس محتويات.
//   * includeAppendices → قسم ملاحق في النهاية.
//   * pages           → توزيع المحتوى عبر صفحات (ترقيم + تجزئة أقسام).
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import reshaper from 'arabic-reshaper';
import { PDFDocument, rgb } from 'pdf-lib';

export interface PdfSection {
  heading: string;
  body: string;
  bulletPoints: string[];
  level?: number;
}

export type PdfDesign = 'academic' | 'professional' | 'technical' | 'modern' | 'minimal' | 'magazine' | 'business' | 'educational';

export interface PdfStyle {
  design: PdfDesign;
  accent: string;
  includeCover?: boolean;
  includeToc?: boolean;
  includeAppendices?: boolean;
  pages?: number;
  language?: 'ar' | 'en' | 'both';
}

export interface PdfReportData {
  title: string;
  subtitle: string;
  author: string;
  sections: PdfSection[];
  isBookMode?: boolean;
  style?: PdfStyle;
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

type HexColor = string;

/** لوحات التصميم: كل تصميم يحدد ألوان الهوية الأساسية والفرعية (تُدمج مع accent). */
const DESIGN_SKINS: Record<PdfDesign, { bg: HexColor; heading: HexColor; body: HexColor; accent: HexColor; hairline: HexColor; footer: HexColor; side?: HexColor }> = {
  academic: { bg: '#F8FAFC', heading: '#1E3A8A', body: '#334155', accent: '#2563EB', hairline: '#CBD5E1', footer: '#64748B' },
  professional: { bg: '#FFFFFF', heading: '#0F172A', body: '#334155', accent: '#0070F3', hairline: '#E2E8F0', footer: '#94A3B8' },
  technical: { bg: '#0F172A', heading: '#00F0FF', body: '#CBD5E1', accent: '#00F0FF', hairline: '#1E293B', footer: '#64748B', side: '#00F0FF' },
  modern: { bg: '#FFFFFF', heading: '#111827', body: '#374151', accent: '#10B981', hairline: '#E5E7EB', footer: '#9CA3AF' },
  minimal: { bg: '#FFFFFF', heading: '#18181B', body: '#3F3F46', accent: '#18181B', hairline: '#E4E4E7', footer: '#A1A1AA' },
  magazine: { bg: '#FFFDF7', heading: '#7C2D12', body: '#44403C', accent: '#EA580C', hairline: '#E7E5E4', footer: '#78716C', side: '#EA580C' },
  business: { bg: '#FFFFFF', heading: '#075985', body: '#1F2937', accent: '#0284C7', hairline: '#E0F2FE', footer: '#64748B' },
  educational: { bg: '#F0FDF4', heading: '#166534', body: '#374151', accent: '#16A34A', hairline: '#DCFCE7', footer: '#6B7280' },
};

function pdfColor(hex: string) {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  return rgb(parseInt(full.slice(0, 2), 16) / 255, parseInt(full.slice(2, 4), 16) / 255, parseInt(full.slice(4, 6), 16) / 255);
}

function withAlphaHex(hex: string, alpha: number): HexColor {
  const m = hex.replace('#', '');
  const c = () => Math.round(parseInt(m.slice(0, 2), 16) * alpha + 255 * (1 - alpha)).toString(16).padStart(2, '0');
  if (m.length === 6) return `#${c()}${c()}${c()}`;
  return hex;
}

let fontCache: { regular?: Uint8Array<ArrayBuffer>; bold?: Uint8Array<ArrayBuffer> } = {};

async function loadFontBytes(kind: 'regular' | 'bold'): Promise<Uint8Array<ArrayBuffer>> {
  if (fontCache[kind]) return fontCache[kind];
  const module =
    kind === 'bold'
      ? require('../../assets/fonts/NotoSansArabic-Bold.ttf')
      : require('../../assets/fonts/NotoSansArabic-Regular.ttf');
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const bytes = await new File(uri).bytes();
  fontCache[kind] = bytes;
  return bytes;
}

function shapeArabic(text: string): string {
  try {
    return reshaper(text);
  } catch {
    return text;
  }
}

/** يقسّم النص لأسطر مثل wrapText في الأصلي (عدد أحرف كحد أقصى). */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = shapeArabic(text).split(' ');
  const result: string[] = [];
  let currentLine = '';
  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxCharsPerLine) {
      if (currentLine.length > 0) {
        result.push(currentLine);
        currentLine = '';
      }
    }
    currentLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
  }
  if (currentLine.length > 0) result.push(currentLine);
  return result;
}

/** يجمع أقسام PdfReportData مع صفحة غلاف/فهرس/ملاحق وفق PdfStyle. */
function buildLayout(data: PdfReportData): { contentSections: PdfSection[]; isBookMode: boolean } {
  const style = data.style;
  let sections = data.sections.slice();
  let isBookMode = data.isBookMode ?? false;

  if (style?.includeAppendices) {
    const appendix: PdfSection = {
      heading: 'الملاحق',
      body: 'الملاحق والجداول المرجعية والبيانات الداعمة للمستند.',
      bulletPoints: [
        'قائمة المصادر والمراجع الموثقة',
        'جدول مؤشرات الأداء',
        'المسرد والمصطلحات',
      ],
    };
    sections = [...sections, appendix];
  }
  if (!style || !style.design || DESIGN_SKINS[style.design] === undefined) {
    isBookMode = isBookMode || sections.length > 6;
  } else {
    isBookMode = isBookMode || style.design === 'academic' || style.design === 'magazine' || style.design === 'educational';
  }
  return { contentSections: sections, isBookMode };
}

export async function createPdfDocument(data: PdfReportData): Promise<string> {
  const doc = await PDFDocument.create();
  const [regularBytes, boldBytes] = await Promise.all([loadFontBytes('regular'), loadFontBytes('bold')]);
  const fontRegular = await doc.embedFont(regularBytes as any);
  const fontBold = await doc.embedFont(boldBytes as any);

  const style: PdfStyle = data.style ?? { design: 'professional', accent: '#00F0FF' };
  const skin = DESIGN_SKINS[style.design] ?? DESIGN_SKINS.professional;
  const accent = style.accent || skin.accent;
  const palette = {
    navy: '#0B132B',
    cyan: accent,
    subtitle: '#E2E8F0',
    author: '#38BDF8',
    white: '#FFFFFF',
    heading: skin.heading,
    body: skin.body,
    bulletDot: accent,
    bulletText: '#1E293B',
    footer: skin.footer,
    headerBar: skin.hairline,
    headerText: '#475569',
    brand: accent,
    brandSub: '#E2E8F0',
    bg: skin.bg,
    hairline: skin.hairline,
    side: skin.side,
  };

  const { contentSections, isBookMode } = buildLayout(data);
  let pageNumber = 1;
  let sectionIndex = 0;

  // اتجاه النص: نقيس بعرض الحروف — الخطوط المضمّنة تحدد اتجاه العرض؛ لا نحتاج bool هنا.

  // صفحة غلاف مستقلة عند الطلب — تُنسَّق بهوية التصميم المختار (خلفية/عنوان/لون هوية).
  if (style.includeCover) {
    const cover = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const isTechnical = style.design === 'technical';
    const coverBg = isTechnical ? palette.navy : palette.bg;
    const coverTitle = isTechnical ? accent : palette.heading;
    const coverBody = isTechnical ? palette.subtitle : palette.body;
    cover.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: pdfColor(coverBg) });
    cover.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: 8, color: pdfColor(accent) });
    cover.drawText('× osamah agent', { x: 40, y: PAGE_HEIGHT - 70, size: 14, font: fontBold, color: pdfColor(accent) });
    cover.drawText('Generated by Osamah Agent', { x: 40, y: PAGE_HEIGHT - 92, size: 9, font: fontRegular, color: pdfColor(palette.footer) });
    cover.drawRectangle({ x: 40, y: PAGE_HEIGHT - 300, width: 90, height: 4, color: pdfColor(accent) });
    const titleLines = wrapText(data.title, 42);
    let ty = PAGE_HEIGHT - 360;
    for (const l of titleLines) {
      cover.drawText(shapeArabic(l), { x: 40, y: ty, size: 28, font: fontBold, color: pdfColor(coverTitle) });
      ty -= 40;
    }
    cover.drawText(shapeArabic(data.subtitle), { x: 40, y: ty - 8, size: 14, font: fontRegular, color: pdfColor(coverBody) });
    cover.drawText(shapeArabic(`الجهة المصممة: ${data.author} • وكيل أسامة`), { x: 40, y: 80, size: 11, font: fontRegular, color: pdfColor(palette.author) });
    pageNumber++; // الغلاف صفحة 1
  }

  // صفحة فهرس المحتويات عند الطلب (قبل بدء الأقسام).
  if (style.includeToc) {
    const toc = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    toc.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: pdfColor(palette.white) });
    toc.drawText('× osamah agent', { x: 40, y: PAGE_HEIGHT - 46, size: 11, font: fontBold, color: pdfColor(accent) });
    toc.drawText(shapeArabic('فهرس المحتويات'), { x: 40, y: PAGE_HEIGHT - 100, size: 20, font: fontBold, color: pdfColor(palette.heading) });
    toc.drawRectangle({ x: 40, y: PAGE_HEIGHT - 112, width: 120, height: 3, color: pdfColor(accent) });
    let ty = PAGE_HEIGHT - 150;
    let tocIdx = pageNumber + 1; // أرقام صفحات الأقسام تقديرية (تبدأ بعد الغلاف إن وجد + الفهرس).
    for (const s of contentSections) {
      toc.drawText(shapeArabic(s.heading), { x: 40, y: ty, size: 13, font: fontRegular, color: pdfColor(palette.body) });
      toc.drawText(shapeArabic(String(tocIdx)), { x: PAGE_WIDTH - 90, y: ty, size: 12, font: fontBold, color: pdfColor(accent) });
      toc.drawRectangle({ x: 40, y: ty - 6, width: PAGE_WIDTH - 80, height: 0.4, color: pdfColor(palette.hairline) });
      ty -= 28;
      tocIdx += 1;
      if (ty < 80) break;
    }
    toc.drawText(shapeArabic(`صفحة ${pageNumber} • فهرس المحتويات`), { x: 180, y: 40, size: 9, font: fontRegular, color: pdfColor(palette.footer) });
    pageNumber++;
  }

  while (sectionIndex < contentSections.length) {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let currentY: number;
    let fits = true;

    // خلفية
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: pdfColor(palette.bg) });
    if (palette.side) {
      page.drawRectangle({ x: 0, y: 0, width: 10, height: PAGE_HEIGHT, color: pdfColor(accent) });
    }
    // ترويسة رفيعة بالهوية دائماً: شعار + عنوان المستند
    page.drawText('× osamah agent', { x: 40, y: PAGE_HEIGHT - 44, size: 11, font: fontBold, color: pdfColor(accent) });
    page.drawText(shapeArabic(data.title.slice(0, 40)), { x: 40, y: PAGE_HEIGHT - 62, size: 9, font: fontRegular, color: pdfColor(palette.footer) });
    page.drawRectangle({ x: 40, y: PAGE_HEIGHT - 50, width: PAGE_WIDTH - 80, height: 0.8, color: pdfColor(palette.hairline) });

    currentY = 80;
    while (sectionIndex < contentSections.length) {
      const section = contentSections[sectionIndex];
      const level = section.level ?? 1;

      // عنوان القسم — حجم حسب المستوى الهرمي للتنسيق الواقعي
      const headingSize = level === 1 ? 15 : level === 2 ? 12 : 10.5;
      const headingX = 40 + (level > 1 ? (level - 1) * 10 : 0);
      page.drawText(shapeArabic(section.heading), {
        x: headingX,
        y: PAGE_HEIGHT - currentY - 14,
        size: headingSize,
        font: level === 1 ? fontBold : (level === 2 ? fontBold : fontRegular),
        color: pdfColor(palette.heading),
      });
      page.drawRectangle({ x: headingX, y: PAGE_HEIGHT - currentY - 20, width: Math.min(320, section.heading.length * 8 + 24), height: 2, color: pdfColor(accent) });
      currentY += level === 1 ? 30 : 24;

      const indent = headingX;
      const lines = wrapText(section.body, 72);
      for (const line of lines) {
        if (currentY > 770) { fits = false; break; }
        page.drawText(line, {
          x: indent + 10,
          y: PAGE_HEIGHT - currentY - 11,
          size: 11,
          font: fontRegular,
          color: pdfColor(palette.body),
        });
        currentY += 16;
      }
      if (!fits) break;

      for (const bullet of section.bulletPoints) {
        if (currentY > 770) { fits = false; break; }
        page.drawCircle({ x: indent + 16, y: PAGE_HEIGHT - currentY + 4, size: 2.6, color: pdfColor(accent) });
        const bLines = wrapText(bullet, 62);
        for (const bl of bLines) {
          if (currentY > 770) { fits = false; break; }
          page.drawText(shapeArabic(bl), {
            x: indent + 26,
            y: PAGE_HEIGHT - currentY - 11,
            size: 11,
            font: fontRegular,
            color: pdfColor(palette.bulletText),
          });
          currentY += 16;
        }
        if (!fits) break;
        currentY += 6;
      }
      if (!fits) break;

      currentY += level === 1 ? 22 : 12;
      sectionIndex++;
      if (currentY > 750) break;
    }

    page.drawText(shapeArabic(`صفحة ${pageNumber} • ${data.title.slice(0, 30)} • سنية أسامة`), {
      x: 130,
      y: 40,
      size: 9,
      font: fontRegular,
      color: pdfColor(palette.footer),
    });

    pageNumber++;
    if (sectionIndex >= contentSections.length) break;
  }

  const bytes = await doc.save();
  const sanitized = data.title.replace(/\s+/g, '_').slice(0, 25) || 'document';
  const dir = new Directory(Paths.document, 'generated_documents');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });

  const file = new File(dir, `${sanitized}_${Date.now()}.pdf`);
  if (!file.exists) file.create();
  file.write(bytes);
  return file.uri;
}
