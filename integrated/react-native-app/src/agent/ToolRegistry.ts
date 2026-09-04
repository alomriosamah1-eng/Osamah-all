import { RegisteredTool, ToolId, ToolOutcome } from '../domain/toolContracts';
import { ALL_TOOLS, AgentTool } from './tools';
import { CAPABILITY_TOOLS } from './capabilityTools';

export class ToolRegistry {
  private readonly tools = new Map<ToolId, RegisteredTool>();

  register(tool: RegisteredTool): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Duplicate tool id: ${tool.id}`);
    }
    this.tools.set(tool.id, tool);
  }

  resolve(id: ToolId): RegisteredTool | undefined {
    return this.tools.get(id);
  }

  list(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }
}

function adaptLegacyTool(tool: AgentTool): RegisteredTool {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    scope: tool.scope,
    requiresUserConfirmation: tool.requiresUserConfirmation,
    async execute(parameters, context): Promise<ToolOutcome> {
      const result = await tool.execute(parameters, context.userProfile, context.memories);
      if (!result.success) {
        return {
          state: 'FAILED',
          code: 'LEGACY_TOOL_FAILED',
          message: result.summary,
          retryable: false,
        };
      }
      return {
        state: 'COMPLETED',
        data: result.data,
        summary: result.summary,
        artifacts: result.artifacts,
        warnings: [],
      };
    },
  };
}

export function createDefaultToolRegistry(tools?: AgentTool[]): ToolRegistry {
  const registry = new ToolRegistry();
  [...(tools ?? ALL_TOOLS), ...(tools ? [] : CAPABILITY_TOOLS)].forEach((tool) => registry.register(adaptLegacyTool(tool)));
  return registry;
}
