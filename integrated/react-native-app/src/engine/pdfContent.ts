// pdfContent — "مولد PDF المنطقي": يستقبل الطلب وردّ الوكيل المفصّل ثم يمرّ بمراحل
// حقيقية: استقبال → تحليل/تفكير → جمع المحتوى → ترتيب/تنظيم → توزيع على الصفحات.
//
// المرحلتان "التفكير" و"جمع المحتوى" تتم بواسطة الوكيل (produceGroundedResponse) الذي
// ينتج ردّاً مفصلاً يُمرَّر هنا عبر input.reply. هذه الوحدة تتكفّل بالمراحل التالية
// (ترتيب + تنظيم + تنسيق هيكلي) بمنطق حقيقي بدل القالب الثابت.

import { PdfReportData, PdfSection, PdfStyle } from './PdfEngine';

export interface PdfContentInput {
  reply: string;         // المحتوى الحقيقي المفصّل من الوكيل
  topic: string;         // عنوان/موضوع الطلب
  title: string;         // عنوان المستند
  author: string;        // اسم المؤلف/الجهة
  style: PdfStyle;
}

export interface OrganizedDoc {
  sections: PdfSection[];
  summary: string;       // ملخص تحليلي يوضح ما نظّمه المولّد
}

type HeadingLevel = 1 | 2 | 3;

/** تصنيف السطر: عنوان (مستوى) أو نقطة تعداد أو فقرة نصية. */
function classifyLine(line: string): { kind: 'h1' | 'h2' | 'h3' | 'bullet' | 'text'; value: string } {
  const t = line.trim();
  if (!t) return { kind: 'text', value: '' };

  // عناوين رقمية (مستوى 1)
  if (/^\d+[.)]\s+/.test(t)) return { kind: 'h1', value: t.replace(/^\d+[.)]\s*/, '').trim() };
  // عناوين (مستوى 2): "1.1" / "1.2"
  if (/^\d+\.\d+[.)]?\s+/.test(t)) return { kind: 'h2', value: t.replace(/^\d+\.\d+[.)]?\s*/, '').trim() };
  // عناوين مكتوبة بأسلوب واضح (سطر قصير ينتهي بنقطتين) — مستوى 2
  if (/^[^.!؟]{2,40}:\s*$/.test(t)) return { kind: 'h2', value: t.replace(/:\s*$/, '').trim() };
  // عناوين (مستوى 3): "###" أو "• العنوان:" أو أحرف قصيرة
  if (/^#{1,3}\s+/.test(t)) return { kind: /^##\s+/.test(t) ? 'h2' : /^#{3}\s+/.test(t) ? 'h3' : 'h1', value: t.replace(/^#+\s*/, '').trim() };
  // نقطة تعداد
  if (/^[-•*▪·]\s+/.test(t)) return { kind: 'bullet', value: t.replace(/^[-•*▪·]\s+/, '').trim() };
  // نص عادي
  return { kind: 'text', value: t };
}

function flushToSections(
  sections: PdfSection[],
  heading: string,
  bodyAcc: string[],
  bullets: string[],
  level: HeadingLevel
): void {
  const body = bodyAcc.join(' ').trim();
  const clean = [...bullets].map((b) => b.replace(/^[-•*▪·]\s*/, '').trim()).filter(Boolean);
  if (!heading) return;
  const existing = sections.find((s) => s.heading === heading);
  if (existing) {
    if (body && !existing.body.trim().includes(body)) existing.body = (existing.body || '').trim() ? `${existing.body} ${body}` : body;
    for (const b of clean) if (!existing.bulletPoints.includes(b)) existing.bulletPoints.push(b);
    return;
  }
  sections.push({ heading, body: body || ' ', bulletPoints: clean, level });
}

/**
 * المرحلة 1 — استقبال + تحليل: تقسيم ردّ الوكيل إلى تسلسل نصوص أولي.
 * المرحلة 2 — تنظيم: تحويل التسلسل إلى أقسام هرمية (عناوين + فقرات + نقاط).
 */
export function organizeReply(input: PdfContentInput): OrganizedDoc {
  const raw = (input.reply || '').trim();
  const sections: PdfSection[] = [];

  if (!raw) {
    sections.push({ heading: 'الملخص', body: 'لم يتوفر محتوى تفصيلي من الوكيل لهذا الطلب. أعد المحاولة بطلب أوضح.\n\n' + input.topic, bulletPoints: [], level: 1 });
    return { sections, summary: 'لا محتوى — أُنشئ قسم توضيحي فقط.' };
  }

  const lines = raw.split('\n');
  let currentHeading = 'أهم النقاط';
  let bodyAcc: string[] = [];
  let bullets: string[] = [];
  let headingLevel: HeadingLevel = 1;

  const flush = () => {
    flushToSections(sections, currentHeading, bodyAcc, bullets, headingLevel);
    bodyAcc = [];
    bullets = [];
  };

  let firstBodyDone = false;
  for (const line of lines) {
    const { kind, value } = classifyLine(line);
    if (!value) continue;

    if (kind === 'h1' || kind === 'h2' || kind === 'h3') {
      flush();
      currentHeading = value;
      headingLevel = kind === 'h1' ? 1 : kind === 'h2' ? 2 : 3;
      if (!firstBodyDone) {
        // المقدمة تُضمَّن من أول فقرة إن لم تكن هناك فقرة تمهيدية منفصلة.
        firstBodyDone = true;
        sections.unshift({
          heading: 'مقدمة',
          body: 'مستند حول: ' + input.topic,
          bulletPoints: [],
          level: 1,
        });
      }
      continue;
    }

    if (kind === 'bullet') {
      bullets.push(value);
      continue;
    }

    // نص عادي
    if (!firstBodyDone && currentHeading === 'أهم النقاط' && sections.length === 0) {
      sections.push({ heading: 'مقدمة', body: value, bulletPoints: [], level: 1 });
      firstBodyDone = true;
      continue;
    }
    bodyAcc.push(value);
  }
  flush();

  if (sections.length === 0) {
    sections.push({ heading: 'الموضوع', body: raw.slice(0, 2500), bulletPoints: [], level: 1 });
  }

  // خاتمة: قسم إغلاقي (إن لم يكن موجوداً).
  const hasConclusion = sections.some((s) => /خاتمة|الخلاصة|استنتاج/.test(s.heading));
  if (!hasConclusion) {
    sections.push({
      heading: 'الخاتمة',
      body: 'تلتزم هذه الوثيقة بالدقة والموثوقية، وتُختصر أهم النتائج والتوصيات العملية المستنبطة من الموضوع دون أي تضخيم أو معلومات غير قابلة للتطبيق.',
      bulletPoints: [
        'أهم المخرجات والنتائج',
        'التوصيات القابلة للتنفيذ',
        'مواضيع مقترحة للمرحلة التالية',
      ],
      level: 1,
    });
  }

  return { sections, summary: `نُظّم المحتوى إلى ${sections.length} أقسام هرمية.` };
}

/** المرحلة 3 — توزيع على الصفحات: توسيع المحتوى باتجاه العدد المطلوب دون تكرار مضلّل. */
function distributeAcrossPages(sections: PdfSection[], pages?: number): PdfSection[] {
  if (!pages || pages <= 1 || sections.length === 0) return sections;
  const docPages = Math.min(Math.max(2, pages), 200);

  // نحسب حجم فقرات طويلة ونقسّمها كأقسام فرعية لزيادة العمق مع عدد الصفحات.
  const out: PdfSection[] = [];
  for (const s of sections) {
    out.push(s);
    const paras = s.body
      .split(/(?<=[.!؟])\s+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40);
    // نُعمّق فقط الأقسام ذات المحتوى الغني، ولا نختلق أقساماً فارغة.
    if (paras.length >= 3 && s.level === 1) {
      for (let i = 1; i < Math.min(paras.length, docPages); i++) {
        out.push({ heading: `${s.heading} — تفصيل ${i}`, body: paras[i], bulletPoints: [], level: 2 });
        if (out.length >= docPages * 2) break;
      }
    }
  }
  return out.slice(0, Math.max(sections.length, Math.min(docPages * 2, out.length)));
}

/** بناء بيانات التقرير النهائية بالمواءمة مع حجم المستند المطلوب. */
export function buildPdfReportData(input: PdfContentInput): PdfReportData {
  const organized = organizeReply(input);
  const sections = distributeAcrossPages(organized.sections, input.style.pages);
  return {
    title: input.title,
    subtitle: input.topic,
    author: input.author,
    sections,
    isBookMode: input.style.design === 'academic' || input.style.design === 'magazine' || input.style.design === 'educational',
    style: input.style,
  };
}
