# Canopy starter: research-agent

A terminal-driven research agent built on [`@anthropic-ai/claude-agent-sdk`](https://github.com/anthropics/claude-agent-sdk-typescript), wired to Canopy's [remote MCP server](https://mcp.trycanopy.ai/mcp). It discovers paid data providers, pays per-call, cites sources, and tracks running spend.

**Zero Canopy code** — the agent reaches Canopy through MCP. The only per-starter customization lives in `src/system-prompt.ts`.

## How to run

```bash
npx create-canopy-agent my-research-agent
# → pick `research-agent`, paste your org API key.
```

Or hand-clone: `cp .env.example .env` → fill creds → `npm install && npm start`.

## Suggested policy preset

| Field | Value |
|---|---|
| `spend_cap_usd` | `5` |
| `cap_period_hours` | `24` |
| `approval_required` | `true` |
| `approval_threshold_usd` | `0.5` |

A tight $5/24h cap is intentional — research-agent makes many small per-call payments and should never come close to the cap on a normal session. The $0.50 threshold catches any bulk-priced provider that would burn through the cap in one shot.

## Things to try

| Prompt | Expected | What it tests |
|---|---|---|
| `what's my budget?` | `canopy_get_budget` snapshot | Budget tool |
| `what data APIs are available about company revenue?` | `canopy_discover_services` (`category=data`) | Discovery |
| `pull recent SEC filings for AAPL` | discover + per-call paid lookups → cited summary | Happy path |
| `give me 3 sources on recent x402 protocol developments` | multiple discover + paid calls + citations | Multi-source aggregation |

## Notes

- **System prompt steers citation discipline.** The default prompt requires source + cost on every fact. Fork `src/system-prompt.ts` if your use case wants different rigor.
- **No code-level spend caps.** The dashboard policy is the only ceiling, by design.
