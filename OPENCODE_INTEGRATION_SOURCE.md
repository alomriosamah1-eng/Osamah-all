# OpenCode Integration Source Traceability

## Verified source

- Repository: https://github.com/anomalyco/opencode
- Branch inspected: `dev`
- Commit inspected: `8e0f1c253b6b7292b419505af849d06747c0e049`
- Release visible at inspection time: `v1.18.26`
- License: MIT (`LICENSE` in the official repository)
- Osamah baseline commit: `c20f52bb9ec41a77600e155e70411281ce1e9677`

## Initial findings

OpenCode’s current implementation is a TypeScript/Bun monorepo. Provider orchestration is concentrated in `packages/opencode/src/provider/provider.ts`, authentication in `packages/opencode/src/provider/auth.ts`, provider error normalization in `packages/opencode/src/provider/error.ts`, request/stream execution in `packages/opencode/src/session/llm/ai-sdk.ts`, `packages/opencode/src/session/llm/native-request.ts`, and model/provider metadata is obtained through the `@opencode-ai/core/models-dev` integration rather than a single local JSON registry. Bundled adapters include Anthropic, OpenAI, OpenAI-compatible, Google, Google Vertex, Azure, Bedrock, xAI, Mistral, Groq, Cohere, TogetherAI, Perplexity, Vercel, Alibaba, OpenRouter, GitLab AI, Venice, and GitHub Copilot, subject to the actual model metadata and installed provider packages.

The Osamah project is an Android Kotlin/Jetpack Compose application. It already has `AgentCore`, `OsamahAgentViewModel`, Room persistence, OkHttp, Retrofit, Moshi, coroutines, and a package named `com.example.agent.opencode`. The current OpenCode subsystem contains simulated planning/subagent responses and must be inspected and replaced or isolated from the production path. The repository currently contains only an Android app; no separate backend service was found at the top level during initial inventory.

## Constraints carried forward

Credentials must not be committed or requested through Settings UI. Runtime credentials must come from the existing secret/environment mechanism or a secure backend boundary. No fabricated provider/model registry, fake response, or full OpenCode runtime may be introduced.

## Registry records used

The current Models.dev response was fetched from `https://models.dev/api.json` during this task. The integrated records are:

| Provider | Model ID | Context | Input | Output | Reasoning | Tool calling | Streaming |
|---|---|---:|---|---|---|---|---|
| google | `gemini-2.5-flash` | 1,048,576 | text, image, audio, video, pdf | text | yes | yes | yes |
| openai | `gpt-4o` | 128,000 | text, image | text | no | yes | yes |
| deepseek | `deepseek-chat` | 128,000 | text | text | no | yes | yes |

The Android implementation uses the official Google Generative Language streaming endpoint for Google and the OpenAI Chat Completions SSE contract for OpenAI-compatible providers. It does not embed the Models.dev response or invent a universal local JSON file; the registry entries are explicit, traceable records selected from the fetched source and are intended to be refreshed when the source changes.

## Implementation mapping

- `ProviderRegistry`, `ProviderModel`, and `ProviderDefinition`: integrated in `app/src/main/java/com/example/agent/opencode/OpenCodeControlSubsystem.kt`.
- Runtime credential lookup: Gradle Secrets-generated `BuildConfig` fields; no credential UI was added.
- Request and response transport: OkHttp with provider-specific adapters in the same subsystem.
- Streaming: Google `streamGenerateContent?alt=sse` and OpenAI-compatible `chat/completions` SSE.
- Tool-call parsing: Google `functionCall` parts and OpenAI-compatible `tool_calls` deltas are surfaced through `ToolCallRequest`.
- Error handling: explicit missing credential, invalid model, protocol, HTTP errors, network failure, and bounded retries for 408, 429, and 5xx responses.

## Validation status at this checkpoint

The requested repository has no Gradle wrapper script and the sandbox has no installed Android SDK/Gradle toolchain, so a local APK build could not yet be executed. Static whitespace validation passes. A real API request cannot be honestly marked PASS without a valid runtime credential being supplied through the project’s existing secret mechanism; the implementation now fails explicitly instead of silently returning a fabricated offline response.
