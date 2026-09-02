# تقرير دمج OpenCode داخل وكيل أسامة

## SOURCE

| الحقل | القيمة |
|---|---|
| Repository | [anomalyco/opencode](https://github.com/anomalyco/opencode) |
| Branch | `dev` |
| Commit | `8e0f1c253b6b7292b419505af849d06747c0e049` |
| Release | `v1.18.26` |
| License | MIT |
| Osamah commit | `59dbb02` |

تم فحص المصدر الرسمي، وجرى الاعتماد على بنية `provider/provider.ts` و`provider/auth.ts` و`provider/error.ts` و`session/llm/ai-sdk.ts` و`session/llm/native-request.ts`، مع التحقق من سجل [Models.dev](https://models.dev/api.json) المستخدم فعليًا من OpenCode.

## IMPLEMENTED

تم استبدال المسار الوهمي داخل `OpenCodeControlSubsystem.kt` بطبقة تشغيل حقيقية تحتوي على `ProviderRegistry` و`Model Registry` و`ProviderDefinition` و`ProviderModel` و`ProviderException`. السجل الحالي مبني على سجلات Models.dev الموثقة، ويشمل Google/Gemini وOpenAI وDeepSeek، مع بيانات المعرّف، النموذج، نافذة السياق، الوسائط، الاستدلال، استدعاء الأدوات، التدفق، والمخرجات المنظمة.

تم تنفيذ مهايئين حقيقيين باستخدام OkHttp: مهايئ Google Generative Language لنقطة `streamGenerateContent?alt=sse`، ومهايئ OpenAI-compatible لنقطة `chat/completions` مع Bearer authentication. كما أضيف تحليل SSE، وإيصال القطع النصية مباشرة إلى مسار تقدم الوكيل، وتحليل `functionCall` في Gemini و`tool_calls` في OpenAI-compatible عبر `ToolCallRequest`.

تمت إضافة معالجة صريحة للمصادقة المفقودة، النموذج غير الصحيح، أخطاء HTTP، أخطاء البروتوكول، وفشل الشبكة، مع إعادة محاولة محدودة وBackoff للحالات 408 و429 و5xx. أزيلت محركات OpenCode المحلية التجريبية غير المستخدمة، وأزيلت الاستجابة المحلية الثابتة من مسار الإنتاج؛ عند غياب الاعتماد يفشل المسار بوضوح بدل إرجاع رد مختلق.

تم ربط `AgentCore` بالتدفق الحي عبر `onChunk`. لم تُضف أي شاشة أو حقل أو Dialog يطلب API Key أو Token أو Base URL أو Endpoint. تبقى الاعتمادات ضمن آلية Gradle Secrets وحقول `BuildConfig` فقط.

## FILES

| النوع | الموقع |
|---|---|
| Provider/model registry and adapters | `app/src/main/java/com/example/agent/opencode/OpenCodeControlSubsystem.kt` |
| Streaming integration | `app/src/main/java/com/example/agent/AgentCore.kt` |
| Runtime credential contract | `.env.example` |
| Source traceability | `OPENCODE_INTEGRATION_SOURCE.md` |

## TEST STATUS

| الاختبار | النتيجة |
|---|---|
| Static whitespace validation | PASS |
| Fake production marker scan | PASS؛ لا توجد استجابة محلية ثابتة في مسار الوكيل |
| Credential UI scan | PASS؛ لا توجد واجهة لإدخال الاعتمادات أو العناوين |
| Real API request | NOT RUN؛ لا توجد قيمة اعتماد حقيقية متاحة في البيئة الحالية |
| Real model response | NOT RUN للسبب نفسه |
| Streaming against provider | NOT RUN للسبب نفسه، مع تنفيذ مسار SSE فعليًا |
| Tool-call end-to-end | NOT RUN؛ يحتاج اعتمادًا صالحًا وربط دورة متابعة بنتيجة الأداة |
| Clean build / unit tests / APK | BLOCKED؛ المستودع لا يحتوي `gradlew`، والبيئة الحالية لا تحتوي Android SDK أو Gradle |

## OPEN ISSUES

المشكلة الفعلية الوحيدة للتشغيل والتحقق النهائي هي غياب Android SDK/Gradle wrapper وغياب اعتماد مزود صالح. كذلك فإن طبقة النقل أصبحت تلتقط طلبات الأدوات الحقيقية، لكن دورة المتابعة الكاملة `tool call → execute tool → send tool result → final response` تحتاج استكمالًا قبل إعلان اختبار Tool Calling ناجحًا؛ لا أضع لها PASS ادعاءً.

تم دفع التغييرات إلى الفرع `main` في المستودع المطلوب تحت commit `59dbb02`.

## References

[1]: https://github.com/anomalyco/opencode "OpenCode official repository"
[2]: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/provider/provider.ts "OpenCode provider implementation"
[3]: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/provider/auth.ts "OpenCode authentication implementation"
[4]: https://models.dev/api.json "Models.dev provider and model registry"

## Master Prompt Validation Update

تم كذلك إزالة شاشة بيئة البرمجة ومحرك التنفيذ المحاكى غير المستخدم، وتنظيف نصوص واجهة الإعدادات من اسم OpenCode وLocal Core، واستبدال ظهورها الداخلي للمستخدم بعبارات مرتبطة بالوكيل والنماذج والاتصالات. أضيفت آلية fallback تلقائية بين المزودين الذين يملكون اعتمادًا صالحًا، وأصبح محرك الصوت يختار العربية أو الإنجليزية بحسب النص مع استخدام SpeechRecognizer وTextToSpeech الحقيقيين في Android.

## Android Build Update

تم تثبيت Android SDK وGradle 9.3.1 وOpenJDK 21، وإضافة Gradle Wrapper إلى المشروع. بعد إنشاء debug keystore محليًا، نجح الأمر `./gradlew clean assembleDebug`، ونتج الملف `app/build/outputs/apk/debug/app-debug.apk` بحجم يقارب 23 MB.

نجح تجميع اختبارات Kotlin، لكن `testDebugUnitTest` لم يكتمل بنجاح لأن اختبار Robolectric القديم `ExampleRobolectricTest` حاول جلب Maven artifact أثناء التشغيل وفشل في `MavenArtifactFetcher`؛ هذا فشل في اختبار البيئة/الجلب وليس فشل compile في التطبيق. تم تحديث اختبار اللقطة ليستخدم `OsamahAgentApp` الحالي بدل رموز القالب القديمة.

## Emulator Update

تم تثبيت Emulator وإنشاء AVDs لـ Android 36 وAndroid 35 وAndroid 30. المحاكي المضيف لا يملك `/dev/kvm`، لذلك فشل x86_64 في وضع التسريع، أما التشغيل البرمجي فقد ظهر عبر ADB لكنه لم يطلق Android Package Manager/Activity Manager بشكل مكتمل، وبقي تثبيت APK غير ممكن مع الخطأ `Can't find service: package`. تم توثيق ذلك كقيد بيئي صريح، لا كنجاح تشغيل وهمي.

آخر commit منشور: `0ef5e5a`.
