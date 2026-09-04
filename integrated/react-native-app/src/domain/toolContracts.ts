import { UserProfileEntity } from '../data/types';

export type ToolId = string;
export type ToolScope = 'READ_ONLY' | 'LOCAL_WRITE' | 'NETWORK_SEARCH' | 'SENSITIVE_SYSTEM';

export interface ToolExecutionContext {
  requestId: string;
  conversationId: string;
  userProfile: UserProfileEntity | null;
  memories: string[];
  isOnline: boolean;
  signal?: AbortSignal;
}

export type ToolOutcome<T = unknown> =
  | { state: 'COMPLETED'; data: T | null; summary: string; artifacts: string[]; warnings: string[] }
  | { state: 'NEEDS_CONFIRMATION'; reason: string }
  | { state: 'OFFLINE'; retryable: boolean; message: string }
  | { state: 'FAILED'; code: string; message: string; retryable: boolean };

export interface RegisteredTool {
  id: ToolId;
  name: string;
  description: string;
  scope: ToolScope;
  requiresUserConfirmation: boolean;
  execute(parameters: Record<string, string>, context: ToolExecutionContext): Promise<ToolOutcome>;
}
