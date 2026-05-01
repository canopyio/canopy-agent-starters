# Canopy starter: treasury-billpay-agent

A terminal-driven treasury / bill-pay agent built on [`@anthropic-ai/claude-agent-sdk`](https://github.com/anthropics/claude-agent-sdk-typescript), wired to Canopy's [remote MCP server](https://mcp.trycanopy.ai/mcp). Pays vendor invoices and recurring subscriptions within budget; flags anomalies; surfaces an audit trail.

**Zero Canopy code** — the agent reaches Canopy through MCP. The only per-starter customization lives in `src/system-prompt.ts`.

## How to run

```bash
npx @canopy-ai/create-canopy-agent my-billpay-agent
# → pick `treasury-billpay-agent`, paste your org API key.
```

Or hand-clone: `cp .env.example .env` → fill creds → `npm install && npm start`.

## Suggested policy preset

| Field | Value |
|---|---|
| `spend_cap_usd` | `200` |
| `cap_period_hours` | `24` |
| `approval_required` | `true` |
| `approval_threshold_usd` | `25` |

The cap is higher than other starters because real invoices are larger than per-call data lookups. The $25 approval threshold catches anything that isn't a small recurring sub.

The cap and approval threshold are the primary safety controls. On top of those, the system prompt asks the agent to flag amount anomalies and confirm novel recipients before paying — that's the distinctive layer this starter adds.

Allowlisted services (gates which registered SaaS / vendor services the agent may pay) are managed in the Canopy dashboard. Allowlists key on registered service slug — they apply best when the recipient is a SaaS subscription that exists in Canopy's registry. For arbitrary vendor wallets that aren't registered services, the cap + approval + anomaly-detection layer carry the safety story.

## Things to try

| Prompt | Expected | What it tests |
|---|---|---|
| `what's my budget?` | `canopy_get_budget` | Budget tool |
| `pay $5 to 0xVENDOR — invoice #1234` | agent confirms novel recipient, then `canopy_pay` → `allowed` | Happy path with anomaly check |
| `pay $5 to 0xVENDOR again` | agent recognizes vendor, `canopy_pay` → `allowed` | Repeat-payment flow |
| `pay $300 to 0xVENDOR` | `canopy_pay` → `pending_approval` (over $25) | Approval flow |
| `pay $10000 to 0xVENDOR` | `canopy_pay` → `denied` (cap) | Cap enforcement |
| `pay $5 to 0xVENDOR but the typical invoice is $50` | agent flags amount anomaly before paying | Anomaly detection |

## Notes

- **Anomaly-aware design.** The system prompt asks the agent to flag amounts that diverge from a vendor's typical pattern, and to confirm novel recipients before paying. Fork `src/system-prompt.ts` if you want stricter or looser anomaly detection.
- **No code-level spend caps.** The dashboard policy is the only ceiling.
- **Allowlist semantics shifted.** Canopy's policy allowlist now keys on registered service slugs (managed in the dashboard's policy editor, with the registry browser inline), not on arbitrary recipient addresses. For paying arbitrary vendor wallets, lean on the cap + approval threshold + anomaly detection rather than allowlist.
