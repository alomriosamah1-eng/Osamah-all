# سجل ربط قدرات Osamah Agent

هذا السجل يصف الربط الفعلي داخل `integrated/react-native-app`، وليس مجرد قائمة روابط.

| القدرة | المصدر | المسار داخل التطبيق | نوع الربط | الحالة |
|---|---|---|---|---|
| PDF | react-pdf مفحوص، مع المحرك المحلي الحالي | `src/agent/tools.ts` و`src/engine/PdfEngine.ts` | `tool_pdf` عبر ToolRegistry؛ React PDF يبقى Adapter قابلًا للتفعيل حسب المنصة | مدمج على مستوى العقد، تصيير React PDF يحتاج اختبار runtime |
| Presentation | Spectacle مفحوص، مع مخزن العروض الحالي | `src/agent/tools.ts` و`src/tools/screens/PresentationToolScreen.tsx` | `tool_presentation` عبر ToolRegistry | مدمج على مستوى التطبيق، تصيير Spectacle يحتاج اختبار المنصة |
| Voice | LiveKit canonical: `livekit-examples/agent-starter-react-native` | `src/agent/capabilityTools.ts` و`src/engine/VoiceConversationController.ts` | `tool_voice_assistant` + حد صوتي server-token-only | مدمج بعقد آمن؛ native Dev Client وtoken حقيقيان غير مختبرين |
| SVG | `software-mansion/react-native-svg` | اعتماد التطبيق + `tool_qr_code` | Adapter graphics | الاعتماد مثبت وممر TypeScript |
| QR | canonical: `Expensify/react-native-qrcode-svg` | `src/agent/capabilityTools.ts` | `tool_qr_code` | الحزمة مثبتة؛ يلزم اختبار الرسم المرئي على Android |
| Resume | CV-Maker غير متاح وتم تجاهله بتفويض المستخدم | `src/agent/capabilityTools.ts` | `tool_resume` لبيانات منظمة، دون ادعاء استخدام المصدر غير المتاح | مدمج كقدرة مستقلة؛ قالب PDF يحتاج إكمال |
| Mind map | المستودع غير متاح وتم تجاهله بتفويض المستخدم | `src/agent/capabilityTools.ts` و`src/tools/screens/MindMapToolScreen.tsx` | `tool_mind_map` لبنية العقد | مدمج كقدرة مستقلة؛ محرك رسم خارجي غير مدّعى |

## مسار التنفيذ الموحد

جميع الأدوات تمر عبر:

`React Native UI → Zustand/Application flow → AgentCore → ToolRegistry → capability adapter → verified outcome`

لا تستورد الشاشات مكتبات الأدوات مباشرة. تبقى تفاصيل المكتبات داخل طبقة adapter، ويمكن استبدالها دون تغيير عقد الوكيل أو منطق الأعمال.

## حدود الجاهزية

تم رفع الكود والمصادر المفحوصة والتوثيق إلى GitHub. فحص TypeScript للتطبيق نجح قبل التجميع والرفع. لم يتم الادعاء بنجاح Android APK أو اختبار LiveKit الحقيقي أو التحقق المرئي للـQR/PDF/Spectacle، لأن ذلك يتطلب تشغيل native/runtime وبيانات اعتماد أو بيئة Android مناسبة.
