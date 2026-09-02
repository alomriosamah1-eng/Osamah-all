# External Findings for Master Prompt

## OpenCode Zen

Source: https://opencode.ai/docs/zen/

The official OpenCode Zen documentation states that Zen is an AI gateway and works like another provider. It requires signing in at OpenCode Zen, adding billing details, copying an API key, and connecting it through the OpenCode client. It is charged per request. The source does not establish a free, automatic, unlimited connection suitable for embedding in an Android APK. Therefore the application must not claim Zen is free or silently use it without a supported credential flow.

## OpenCode official source

Source: https://github.com/anomalyco/opencode

The official repository inspected earlier is `anomalyco/opencode`, branch `dev`, commit `8e0f1c253b6b7292b419505af849d06747c0e049`, release `v1.18.26`, MIT licensed. Relevant provider/auth/LLM source paths are documented in `OPENCODE_INTEGRATION_SOURCE.md`.

## Models.dev

Source: https://models.dev/api.json

The official registry endpoint used by OpenCode exposes provider IDs, model IDs, endpoints, environment variable names, capabilities, modalities, and context/output limits. The current project mapping was recorded in `OPENCODE_INTEGRATION_SOURCE.md`; records are not to be represented as an invented universal JSON registry.

## Important implementation consequence

The master prompt requires checking whether a service is fully free versus merely free-tier. Zen is documented as pay-per-request and API-key based, so it cannot be presented as a free automatic provider. Any provider requiring credentials must remain behind runtime secret configuration, not a Settings field.
