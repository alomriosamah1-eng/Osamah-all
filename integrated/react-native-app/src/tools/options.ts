// خيارات الأدوات المشتركة — تُستخدم لبناء مهمة الوكيل الحقيقية وواجهات الاختيار.
import { IconName } from '../components/primitives';

export type LanguageOption = 'ar' | 'en' | 'both';
export const LANGUAGE_OPTIONS: { key: LanguageOption; label: string; hint: string }[] = [
  { key: 'ar', label: 'العربية', hint: 'RTL' },
  { key: 'en', label: 'English', hint: 'LTR' },
  { key: 'both', label: 'العربية + English', hint: 'ثنائي اللغة' },
];

export const PDF_DESIGNS = [
  { key: 'academic', label: 'أكاديمي', icon: 'school' as IconName },
  { key: 'professional', label: 'احترافي', icon: 'work' as IconName },
  { key: 'technical', label: 'تقني', icon: 'code' as IconName },
  { key: 'modern', label: 'حديث', icon: 'bolt' as IconName },
  { key: 'minimal', label: 'بسيط', icon: 'crop-free' as IconName },
  { key: 'magazine', label: 'مجلة', icon: 'auto-stories' as IconName },
  { key: 'business', label: 'تقرير أعمال', icon: 'bar-chart' as IconName },
  { key: 'educational', label: 'تعليمي', icon: 'menu-book' as IconName },
];

export const PRESENTATION_TYPES = [
  { key: 'academic', label: 'أكاديمي', icon: 'school' as IconName },
  { key: 'educational', label: 'تعليمي', icon: 'menu-book' as IconName },
  { key: 'business', label: 'أعمال', icon: 'business' as IconName },
  { key: 'project', label: 'مشروع', icon: 'engineering' as IconName },
  { key: 'technical', label: 'تقني', icon: 'code' as IconName },
  { key: 'research', label: 'بحث علمي', icon: 'science' as IconName },
  { key: 'marketing', label: 'تسويقي', icon: 'campaign' as IconName },
  { key: 'general', label: 'عرض عام', icon: 'slideshow' as IconName },
];

export const PRESENTATION_DESIGNS = [
  { key: 'modern', label: 'Modern', icon: 'bolt' as IconName },
  { key: 'minimal', label: 'Minimal', icon: 'crop-free' as IconName },
  { key: 'professional', label: 'Professional', icon: 'work' as IconName },
  { key: 'academic', label: 'Academic', icon: 'school' as IconName },
  { key: 'corporate', label: 'Corporate', icon: 'apartment' as IconName },
  { key: 'creative', label: 'Creative', icon: 'palette' as IconName },
  { key: 'technical', label: 'Technical', icon: 'code' as IconName },
];

// أنواع المحتوى الداخلي (PDF) — Multi-Select
export const PDF_CONTENT_TYPES = [
  { key: 'paragraphs', label: 'فقرات', icon: 'notes' as IconName },
  { key: 'headings', label: 'عناوين', icon: 'title' as IconName },
  { key: 'images', label: 'صور', icon: 'image' as IconName },
  { key: 'tables', label: 'جداول', icon: 'table-chart' as IconName },
  { key: 'cards', label: 'بطاقات', icon: 'style' as IconName },
  { key: 'bullets', label: 'نقاط مختصرة', icon: 'format-list-bulleted' as IconName },
  { key: 'quotes', label: 'اقتباسات', icon: 'format-quote' as IconName },
  { key: 'charts', label: 'مخططات', icon: 'insights' as IconName },
  { key: 'illustrations', label: 'رسوم توضيحية', icon: 'brush' as IconName },
  { key: 'stats', label: 'أرقام وإحصائيات', icon: 'analytics' as IconName },
];

// تخطيط الشرائح (العروض) — Multi-Select
export const PRESENTATION_LAYOUTS = [
  { key: 'title', label: 'عنوان', icon: 'title' as IconName },
  { key: 'text', label: 'نص', icon: 'notes' as IconName },
  { key: 'images', label: 'صور', icon: 'image' as IconName },
  { key: 'tables', label: 'جداول', icon: 'table-chart' as IconName },
  { key: 'cards', label: 'بطاقات', icon: 'style' as IconName },
  { key: 'charts', label: 'مخططات', icon: 'insert-chart' as IconName },
  { key: 'graphics', label: 'رسوم بيانية', icon: 'bar-chart' as IconName },
  { key: 'quotes', label: 'اقتباسات', icon: 'format-quote' as IconName },
  { key: 'timeline', label: 'Timeline', icon: 'timeline' as IconName },
  { key: 'compare', label: 'مقارنة', icon: 'compare-arrows' as IconName },
  { key: 'stats', label: 'إحصائيات', icon: 'analytics' as IconName },
];

export const PAGE_PRESETS = [10, 20, 30, 40, 50];
export const SLIDE_PRESETS = [5, 10, 15, 20, 30];

export const PRESET_COLORS = [
  '#00F0FF',
  '#0070F3',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#7928CA',
  '#FF0080',
  '#38BDF8',
  '#22C55E',
  '#FACC15',
  '#FFFFFF',
  '#111827',
];

export const LIFE_AREAS = [
  { key: 'work', label: 'العمل', icon: 'work' as IconName },
  { key: 'learning', label: 'التعلم', icon: 'school' as IconName },
  { key: 'projects', label: 'المشاريع', icon: 'engineering' as IconName },
  { key: 'money', label: 'المال', icon: 'attach-money' as IconName },
  { key: 'family', label: 'العائلة', icon: 'family-restroom' as IconName },
  { key: 'health', label: 'الصحة', icon: 'favorite' as IconName },
  { key: 'self_dev', label: 'التطوير الشخصي', icon: 'trending-up' as IconName },
];

export interface ToolMeta {
  key: string;
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
}
