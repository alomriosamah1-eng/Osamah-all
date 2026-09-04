// مزوّد OpenCode المستقبلي — هيكل جاهز للربط اللاحق عبر OpenCode
// (نماذج/مزوّدات/اتصال). حالياً غير موصول ويُرجع null ليحافظ النظام على
// سلوك الأصل: الرد الموثّق عبر Gemini مباشرة أو المحرك المحلي.

import { OpenCodeModel, ProviderAdapter, ProviderRequest } from './ProviderAdapter';

export interface OpenCodeBackendConnection {
  baseUrl: string;
  token: string;
  connectedAt: number;
}

export class OpenCodeProviderAdapter implements ProviderAdapter {
  readonly providerId = 'opencode-backend';

  private connection: OpenCodeBackendConnection | null = null;

  /** يُستدعى لاحقاً لربط OpenCode — الخطوة القادمة حسب الخطة */
  connect(baseUrl: string, token: string): void {
    this.connection = { baseUrl, token, connectedAt: Date.now() };
  }

  disconnect(): void {
    this.connection = null;
  }

  getConnection(): OpenCodeBackendConnection | null {
    return this.connection;
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  async generateResponse(request: ProviderRequest): Promise<string | null> {
    if (!this.connection) return null;
    // TODO(المستقبل): تنفيذ طلب فعلي إلى OpenCode (نماذج/مزوّدات/اتصال).
    // حتى ذلك الحين، يعود النظام للرد الموثّق عبر Gemini أو المحرك المحلي.
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private unused(_model: OpenCodeModel): void {}
}