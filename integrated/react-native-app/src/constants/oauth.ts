// حدود اتصال خادم OSAMAH (Thin Client) — الجهاز لا يتصل بأي مزوّد مباشرة.
// يعكس بدقة منطق osamah-agent المرجعي (lib/api-base-url.ts + constants/oauth.ts):
//   1) EXPO_PUBLIC_API_BASE_URL إن وُجد → يُستخدم كما هو.
//   2) على الويب → اشتقاق تلقائي للمضيف من window.location باستبدال المنفذ 8081 بـ 3000.
//   3) محلياً (Android/iOS) → اشتقاق من مضيف Metro ورفيقه على المنفذ 3000.
//   4) احتياط أخير → http://localhost:3000 (تطوير loopback فقط).
import * as ReactNative from "react-native";
import Constants from "expo-constants";

const envBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

function getExpoDevelopmentHost(): string | undefined {
  const manifest = Constants.manifest as { hostUri?: string } | null;
  return Constants.expoConfig?.hostUri ?? manifest?.hostUri;
}

/** يحوّل مضيف Expo إلى أصل خادم OSAMAH المقترن (منفذ 8081 ← 3000). */
function deriveFromExpoHost(hostUri?: string): string {
  if (!hostUri) return "";
  const normalized = hostUri.includes("://") ? hostUri : `http://${hostUri}`;
  try {
    const url = new URL(normalized);
    if (url.port === "8081") url.port = "3000";
    return url.origin;
  } catch {
    return "";
  }
}

export function getApiBaseUrl(): string {
  if (envBaseUrl) return envBaseUrl;

  // على الويب: اشتقاق من window.location (8081 → 3000) تماماً كما يفعل المرجع.
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    try {
      const { protocol, hostname, port } = window.location;
      let host = hostname;
      let originPort = port;
      if (port === "8081") {
        originPort = "3000";
      }
      const derived = `${protocol}//${host}${originPort ? `:${originPort}` : ""}`;
      if (derived) return derived;
    } catch {
      /* تجاهل، ننتقل للاحتياط */
    }
  }

  // محلياً: المضيف الذي قدّم Metro + منفذ الرفيق 3000.
  if (ReactNative.Platform.OS !== "web") {
    const expoDerived = deriveFromExpoHost(getExpoDevelopmentHost());
    if (expoDerived) return expoDerived;
  }

  return "http://localhost:3000";
}

export function getTrpcUrl(): string {
  return `${getApiBaseUrl()}/api/trpc`;
}
