// عميل خادم OSAMAH — يعتمد على @trpc/client + httpBatchLink + superjson
// بنفس إعدادات عميل osamah-agent المرجعي (lib/trpc.ts) لضمان توافق السلك (wire) تماماً.
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { getTrpcUrl } from '../constants/oauth';

function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : String(input);
  return fetch(url, {
    ...init,
    credentials: 'include',
  });
}

/** إنشاء عميل tRPC. تُوصف الأنواع حول الإجراءات الفعلية في api.ts. */
export function createOsamahClient() {
  return createTRPCClient({
    links: [
      httpBatchLink({
        url: getTrpcUrl(),
        transformer: superjson,
        fetch: customFetch,
      }),
    ],
  });
}

export type OsamahClient = ReturnType<typeof createOsamahClient>;
