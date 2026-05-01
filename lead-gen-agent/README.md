# Canopy starter: lead-gen-agent

A terminal-driven lead-enrichment agent built on [`@anthropic-ai/claude-agent-sdk`](https://github.com/anthropics/claude-agent-sdk-typescript), wired to Canopy's [remote MCP server](https://mcp.trycanopy.ai/mcp). It enriches B2B contacts via per-lead paid APIs (Clearbit-style x402 services), with cost transparency on every run.

**Zero Canopy code** — the agent reaches Canopy through MCP. The only per-starter customization lives in `src/system-prompt.ts`.

## How to run

```bash
npx create-canopy-agent my-lead-gen-agent
# → pick `lead-gen-agent`, paste your org API key.
```

Or hand-clone: `cp .env.example .env` → fill creds → `npm install && npm start`.

## Suggested policy preset

| Field | Value |
|---|---|
| `spend_cap_usd` | `25` |
| `cap_period_hours` | `24` |
| `approval_required` | `true` |
| `approval_threshold_usd` | `2` |

The $2 approval threshold catches batches and bulk-priced providers — single per-lead lookups should auto-approve. The $25/24h cap sizes for ~250 enrichment calls/day at typical pricing.

## Things to try

| Prompt | Expected | What it tests |
|---|---|---|
| `what's my budget?` | `canopy_get_budget` | Budget tool |
| `what lead enrichment APIs are available?` | `canopy_discover_services` (`category=data`) | Discovery |
| `enrich these 5 emails: a@x.com, b@y.com, c@z.com — get title + company size` | per-lead paid calls → enriched table + cost summary | Happy path |
| `estimate cost to enrich 200 leads` | discover + cost reasoning, no paid calls until confirmed | Pre-flight cost guard |

## Notes

- **Per-lead, not per-batch.** The system prompt steers the agent toward one paid call per record so the policy can gate at the right granularity.
- **Cost transparency by default.** Every run ends with $ spent, $/lead, sample row. Fork `src/system-prompt.ts` if you want different reporting.
- **No code-level spend caps.** The dashboard policy is the only ceiling.
