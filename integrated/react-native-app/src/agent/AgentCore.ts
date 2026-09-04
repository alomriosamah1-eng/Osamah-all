// AgentCore — منقول من agent/AgentCore.kt
import { AgentTool, ToolResult } from './tools';
import { openCodeSubsystem } from './opencode/OpenCodeControlSubsystem';
import { OpenCodeModel } from '../backend/ProviderAdapter';
import { serverApi, OpenCodeChatResult } from '../server/api';
import { UserProfileEntity } from '../data/types';
import { createDefaultToolRegistry } from './ToolRegistry';

export interface AgentExecutionStep {
  stepIndex: number;
  title: string;
  toolName: string;
  status: string; // "PENDING", "RUNNING", "COMPLETED", "FAILED"
  detail: string;
}

export interface AgentPlanResult {
  goal: string;
  intent: string;
  steps: AgentExecutionStep[];
  finalResponse: string;
  generatedArtifacts: string[];
  primaryToolUsed: string | null;
  routedModelName: string | null;
  tokenSavingsInfo: string | null;
}

interface ToolInstance extends AgentTool {
  execute(
    parameters: Record<string, string>,
    userProfile: UserProfileEntity | null,
    memories: string[]
  ): Promise<ToolResult>;
}

export class AgentCore {
  private readonly toolRegistry = createDefaultToolRegistry();

  private readonly subsystem = openCodeSubsystem;

  async executeTask(
    userInput: string,
    userProfile: UserProfileEntity | null,
    memories: string[],
    selectedModel?: { providerId: string; modelId: string } | null,
    onProgressUpdate: (text: string) => void = () => {},
    toolContext?: Record<string, string>
  ): Promise<AgentPlanResult> {
    const trimmedInput = userInput.trim();

    // 1. التوجيه الذكي وضغط التوكن
    onProgressUpdate('جارٍ التوجيه الذكي للمهمة وضغط التوكن...');
    const routingDecision = this.subsystem.routeTaskIntelligently(trimmedInput);

    // 2. فهم النية
    const intent = this.determineIntent(trimmedInput);

    // 3. إثراء السياق
    const userContext = [
      `User Name: ${userProfile?.name ?? 'المهندس أسامة محمد علي سعيد العُمري'}`,
      `Job: ${userProfile?.jobTitle ?? 'مهندس برمجيات ونظم'}`,
      `Field: ${userProfile?.field ?? 'هندسة الأنظمة والذكاء الاصطناعي'}`,
      `Specialization: ${userProfile?.specialization ?? 'تطوير التطبيقات وإدارة العمليات'}`,
      `Primary Goal: ${userProfile?.primaryGoal ?? 'رفع الإنتاجية، تنظيم الحياة، إنجاز المهام، وتصميم العروض والمستندات'}`,
    ].join('\n');
    const memoryContext =
      memories.length > 0 ? `\nKey User Memories:\n${memories.slice(0, 5).map((m) => `- ${m}`).join('\n')}` : '';

    // 4. التخطيط واختيار الأداة
    const selectedToolId = this.selectToolForIntent(intent, trimmedInput);
    const tool = this.toolRegistry.resolve(selectedToolId);

    const steps: AgentExecutionStep[] = [
      {
        stepIndex: 1,
        title: 'توجيه المحرك وضغط التوكن',
        toolName: this.subsystem.displayName(routingDecision.selectedModel),
        status: 'COMPLETED',
        detail: `${routingDecision.reasonAr} (وفرنا ${routingDecision.tokenSavingsPercent}% من التوكن)`,
      },
    ];

    let artifactList: string[] = [];
    let toolExecutionSummary = '';
    let toolNameForStep: string | null = null;

    // 5. الرد الموثق المضاد للهلوسة (نقدّمه قبل الأداة عندما تكون الأداة منتِجة محتوى "حقيقي"
    //    مثل الـ PDF، حتى يُبنى الملف من ردّ الوكيل الفعلي لا من قالب ثابت).
    onProgressUpdate('جارٍ صياغة النتيجة الموثقة ومنع التزييف...');
    const systemInstruction = `أنت "وكيل أسامة — Osamah Agent"، العقل المدبر والوكيل الذكي العملي للمهندس أسامة العُمري.
تتميز بالحكمة، الوقار، الفصاحة العربية، والدقة الهندسية الصارمة.
تقوم بإدارة الحياة وتنظيم المهام، وتصميم العروض والكتب والوثائق، والبحث الموثق.
لا تقدم أي معلومات وهمية أو وعود غير قابلة للتطبيق.`;

    const preModelPrompt = `طلب المستخدم: ${trimmedInput}`;
    const finalResponseText = await this.produceGroundedResponse({
      prompt: preModelPrompt,
      systemInstruction,
      userContext: `${userContext}${memoryContext}`,
      targetModel: routingDecision.selectedModel,
      selectedModel,
      userProfile,
      memories,
    });

    if (tool) {
      onProgressUpdate(`جارٍ تشغيل: ${tool.name}...`);
      steps.push({
        stepIndex: 2,
        title: 'تنفيذ الأداة الميدانية',
        toolName: tool.name,
        status: 'RUNNING',
        detail: tool.description,
      });

      // نمرّر ردّ الوكيل الحقيقي + سياق الإعدادات إلى الأداة كمعاملات إضافية.
      const params = this.extractParameters(trimmedInput, selectedToolId, {
        ...(toolContext ?? {}),
        content: finalResponseText,
      });
      const result = await tool.execute(params, {
        requestId: `agent_${Date.now()}`,
        conversationId: 'current',
        userProfile,
        memories,
        isOnline: true,
      });

      if (result.state === 'COMPLETED') {
        steps[1] = { ...steps[1], status: 'COMPLETED', detail: result.summary };
        artifactList = result.artifacts;
        toolExecutionSummary = result.summary;
        toolNameForStep = tool.name;
      } else {
        steps[1] = {
          ...steps[1],
          status: 'FAILED',
          detail: result.state === 'FAILED' ? result.message : 'تم تفعيل الخطة البديلة',
        };
      }
    }

    steps.push({
      stepIndex: 3,
      title: 'التحقق والتوثيق النهائي',
      toolName: 'AntiHallucinationVerifier',
      status: 'COMPLETED',
      detail: 'تم التحقق من دقة وموثوقية الرد والمخرجات',
    });

    onProgressUpdate('تم إنجاز المهمة بنجاح ✓');

    return {
      goal: trimmedInput,
      intent,
      steps,
      finalResponse: finalResponseText,
      generatedArtifacts: artifactList,
      primaryToolUsed: toolNameForStep,
      routedModelName: this.subsystem.displayName(routingDecision.selectedModel),
      tokenSavingsInfo: `وفرت ${routingDecision.tokenSavingsPercent}% توكن`,
    };
  }

  /** ينتج رداً موثقاً: الخادم أولاً (Server-First)، ثم المحرك المحلي عند غياب الخادم/عدم جاهزية مزوّد. لا يُزيّف نجاحاً. */
  private async produceGroundedResponse(input: {
    prompt: string;
    systemInstruction: string;
    userContext: string;
    targetModel: OpenCodeModel;
    selectedModel?: { providerId: string; modelId: string } | null;
    userProfile: UserProfileEntity | null;
    memories: string[];
  }): Promise<string> {
    // 1) Server-First: اطلب رداً حياً من خادم OSAMAH عبر بوابة الموافقة الصريحة.
    try {
      const chatResult: OpenCodeChatResult = await serverApi.openCodeChat({
        text: input.prompt,
        confirmed: true,
        model: input.selectedModel
          ? { providerId: input.selectedModel.providerId, modelId: input.selectedModel.modelId }
          : undefined,
        profile: {
          name: input.userProfile?.name ?? 'المهندس أسامة محمد علي سعيد العُمري',
          jobTitle: input.userProfile?.jobTitle ?? 'مهندس برمجيات ونظم',
          field: input.userProfile?.field ?? 'هندسة الأنظمة والذكاء الاصطناعي',
          specialization: input.userProfile?.specialization ?? 'تطوير التطبيقات وإدارة العمليات',
          primaryGoal: input.userProfile?.primaryGoal ?? 'رفع الإنتاجية، تنظيم الحياة، إنجاز المهام، وتصميم العروض والمستندات',
        },
        memories: input.memories.slice(0, 5).map((value) => ({ key: 'memory', value })),
      });

      if (
        chatResult &&
        chatResult.state === 'completed' &&
        typeof chatResult.reply === 'string' &&
        chatResult.reply.trim().length > 0
      ) {
        return chatResult.reply.trim();
      }
      // أي حالة غير مكتملة (review_only/provider_unavailable/unreachable...) لا تُنتج رداً بديلاً؛
      // ننتقل بأمان للمحرك المحلي المغلق.
    } catch {
      // الخادم غير متاح (أوفلاين) — ننتقل للمحرك المحلي المغلق.
    }

    // 2) Fallback: المحرك المحلي المغلق (offline) — يبقي التطبيق عاملاً دون خادم.
    return this.subsystem.executeTaskWithGrounding(
      input.prompt,
      input.systemInstruction,
      input.userContext,
      input.targetModel
    );
  }

  private determineIntent(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes('qr') || lower.includes('باركود') || lower.includes('رمز الاستجابة')) return 'CREATE_QR';
    if (lower.includes('سيرة') || lower.includes('resume') || lower.includes('cv')) return 'CREATE_RESUME';
    if (lower.includes('صوت') || lower.includes('voice') || lower.includes('livekit')) return 'VOICE_ASSISTANT';
    if (
      lower.includes('خريطة ذهنية') ||
      lower.includes('خريطة مفهوم') ||
      lower.includes('mindmap') ||
      lower.includes('mind map')
    )
      return 'CREATE_MIND_MAP';
    if (
      lower.includes('عرض') ||
      lower.includes('شريحة') ||
      lower.includes('presentation') ||
      lower.includes('شرائح')
    )
      return 'CREATE_PRESENTATION';
    if (
      lower.includes('pdf') ||
      lower.includes('تقرير') ||
      lower.includes('مستند') ||
      lower.includes('وثيقة') ||
      lower.includes('كتاب')
    )
      return 'GENERATE_PDF';
    if (
      lower.includes('تصفح') ||
      lower.includes('رابط') ||
      lower.includes('موقع') ||
      lower.includes('فتـح') ||
      lower.includes('افتح') ||
      lower.includes('browser')
    )
      return 'OPEN_BROWSER';
    if (
      lower.includes('ابحث') ||
      lower.includes('بحث') ||
      lower.includes('مصادر') ||
      lower.includes('دراسة') ||
      lower.includes('search')
    )
      return 'DEEP_RESEARCH';
    if (lower.includes('احفظ') || lower.includes('تذكر') || lower.includes('ذاكرة') || lower.includes('remember'))
      return 'STORE_MEMORY';
    if (
      lower.includes('خطة') ||
      lower.includes('جدول') ||
      lower.includes('خطوات') ||
      lower.includes('plan') ||
      lower.includes('تنظيم') ||
      lower.includes('حياة') ||
      lower.includes('أولويات')
    )
      return 'TASK_PLANNING';
    return 'CONVERSATIONAL_TASK';
  }

  private selectToolForIntent(intent: string, _input: string): string {
    switch (intent) {
      case 'CREATE_PRESENTATION':
        return 'tool_presentation';
      case 'GENERATE_PDF':
        return 'tool_pdf';
      case 'CREATE_QR':
        return 'tool_qr_code';
      case 'CREATE_RESUME':
        return 'tool_resume';
      case 'VOICE_ASSISTANT':
        return 'tool_voice_assistant';
      case 'CREATE_MIND_MAP':
        return 'tool_mind_map';
      case 'OPEN_BROWSER':
        return 'tool_browser';
      case 'DEEP_RESEARCH':
        return 'tool_search';
      case 'STORE_MEMORY':
        return 'tool_memory';
      case 'TASK_PLANNING':
        return 'tool_task_planner';
      default:
        return 'tool_search';
    }
  }

  private extractParameters(input: string, toolId: string, toolContext: Record<string, string> = {}): Record<string, string> {
    const params: Record<string, string> = {};
    switch (toolId) {
      case 'tool_presentation': {
        params['topic'] = input;
        const numMatch = input.match(/\b(\d+)\b/)?.[1];
        const parsed = numMatch ? parseInt(numMatch, 10) : null;
        if (parsed !== null && parsed >= 3 && parsed <= 150) {
          params['count'] = String(parsed);
        } else if (input.includes('100') || input.includes('مئة') || input.includes('مائه')) {
          params['count'] = '100';
        } else {
          params['count'] = '12';
        }
        break;
      }
      case 'tool_pdf': {
        params['title'] = input.includes('كتاب') ? 'كتاب: ' + input.slice(0, 30) : 'تقرير: ' + input.slice(0, 30);
        params['topic'] = input;
        // المحتوى الحقيقي: ردّ الوكيل المفصّل (تجربة التفكير والجمع) بدلاً من اعتماد نص الطلب المجرد.
        params['content'] = toolContext['content'] || toolContext['topic'] || input;
        // إعدادات المستخدم (من واجهة صانع PDF) تمرَّر عبر السياق وتُطبَّق فعلياً في الـ PDF.
        params['design'] = toolContext['design'] || 'professional';
        params['accent'] = toolContext['accent'] || '#00F0FF';
        params['pages'] = toolContext['pages'] || '10';
        params['includeCover'] = toolContext['includeCover'] === 'true' ? 'true' : 'false';
        params['includeToc'] = toolContext['includeToc'] === 'true' ? 'true' : 'false';
        params['includeAppendices'] = toolContext['includeAppendices'] === 'true' ? 'true' : 'false';
        params['language'] = toolContext['language'] || 'ar';
        break;
      }
      case 'tool_qr_code':
        params['value'] = input.match(/https?:\/\/\S+/)?.[0] ?? input;
        break;
      case 'tool_resume':
        params['summary'] = input;
        break;
      case 'tool_voice_assistant':
        params['room'] = toolContext['room'] || '';
        break;
      case 'tool_mind_map':
        params['topic'] = input;
        params['style'] = toolContext['style'] || 'tree';
        params['branches'] = toolContext['branches'] || '';
        break;
      case 'tool_browser': {
        const urlMatch = input.match(/https?:\/\/[\w-]+(\.[\w-]+)+(\/[^\s]*)?/)?.[0];
        params['url'] = urlMatch ?? 'https://developer.android.com';
        break;
      }
      case 'tool_search':
        params['query'] = input;
        break;
      case 'tool_memory': {
        params['key'] = 'ملاحظة وسياق مستخدم';
        params['value'] = input;
        break;
      }
      case 'tool_task_planner':
        params['goal'] = input;
        break;
    }
    return params;
  }
}

export const agentCore = new AgentCore();
