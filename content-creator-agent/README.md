# Canopy starter: content-creator-agent

A terminal-driven content-production agent built on [`@anthropic-ai/claude-agent-sdk`](https://github.com/anthropics/claude-agent-sdk-typescript), wired to Canopy's [remote MCP server](https://mcp.trycanopy.ai/mcp). Plans an asset list from a brief, discovers paid providers (stock + AI gen), pays incrementally with running cost surfaced.

**Zero Canopy code** — the agent reaches Canopy through MCP. The only per-starter customization lives in `src/system-prompt.ts`.

## How to run

```bash
npx create-canopy-agent my-content-agent
# → pick `content-creator-agent`, paste your org API key.
```

Or hand-clone: `cp .env.example .env` → fill creds → `npm install && npm start`.

## Suggested policy preset

| Field | Value |
|---|---|
| `spend_cap_usd` | `20` |
| `cap_period_hours` | `24` |
| `approval_required` | `true` |
| `approval_threshold_usd` | `3` |

Sized for a typical short-form video or post (3-5 paid assets). The $3 approval threshold catches anything pricier than a typical stock asset or single AI generation call.

## Things to try

| Prompt | Expected | What it tests |
|---|---|---|
| `what's my budget?` | `canopy_get_budget` | Budget tool |
| `produce assets for a 30s explainer about Canopy: 1 hero image, 3 b-roll clips, voice-over` | discover + per-asset paid calls + manifest | Multi-asset orchestration |
| `find me an AI music gen service` | `canopy_discover_services` (`category=service` + `category=compute`) | Discovery |
| `what stock-photo providers are paid via x402?` | filtered discover for stock | Single-category discovery |

## Notes

- **Stock first, generation second.** The system prompt prefers stock licenses when they fit because they're typically cheaper than AI generation. Override in `src/system-prompt.ts` if your use case is generation-only.
- **Running cost surfaced after every paid call.** Lets you pause before the cap. Cap-approaching is treated as a stop signal, not a fail.
- **No code-level spend caps.** The dashboard policy is the only ceiling.
