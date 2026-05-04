# Canopy agent starters

Pre-configured, use-case-focused agent starters built on [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript) and Canopy's [hosted MCP server](https://mcp.trycanopy.ai/mcp). Each starter is a self-contained TypeScript project you can fork.

**Per-use-case, not per-framework.** The sibling [`agent-examples/`](../agent-examples) directory documents how to plug Canopy into different agent frameworks (one chat REPL implemented in three stacks). This directory does the inverse: each starter is a use case (research, trading, lead-gen, etc.) with a system prompt, suggested policy preset, and demo prompts already wired.

## Get started

```bash
npx @canopy-ai/create-canopy-agent my-agent
```

The [`@canopy-ai/create-canopy-agent`](../create-canopy-agent) CLI walks you through:

1. Picking a starter
2. Connecting to your Canopy org in the browser and minting a scoped MCP token
3. Auto-creating the policy + agent in your Canopy DB (no copy-paste from the dashboard)
4. Scaffolding the project locally with `.env` filled in

Or hand-clone any starter and configure manually — `cd <slug> && cp .env.example .env && npm install && npm start`.

## The starters

| Starter | Use case | Suggested cap |
|---|---|---|
| [`trading-defi-agent`](./trading-defi-agent) | Quote → validate → execute via price feeds + DEXes | $50/24h |
| [`research-agent`](./research-agent) | Multi-source research; pays for gated data APIs | $5/24h |
| [`lead-gen-agent`](./lead-gen-agent) | Enrich/verify B2B contacts via per-lead paid APIs | $25/24h |
| [`content-creator-agent`](./content-creator-agent) | Pay for stock assets + AI image/voice/video generation | $20/24h |
| [`treasury-billpay-agent`](./treasury-billpay-agent) | Pay vendor invoices + recurring subs within budget | $200/24h |
| [`travel-agent`](./travel-agent) | Search flights/airport schedules; surface options before booking | $5/24h |

## Shared structure

Every starter has the same shape:

```
<starter>/
├── package.json                # name, description, deps
├── tsconfig.json
├── .env.example                # MCP token/API key fallback, agent id, Anthropic key
├── README.md                   # use case, demo prompts, policy preset
├── canopy-policy.suggested.json # paste-into-dashboard preset
└── src/
    ├── main.ts                 # entry — Claude Agent SDK + Canopy MCP wiring (shared)
    ├── system-prompt.ts        # use-case-tuned system prompt (the per-starter customization)
    └── log.ts                  # REPL/logging helpers (shared)
```

The only files that meaningfully differ across starters: `system-prompt.ts`, `canopy-policy.suggested.json`, `package.json` (name), `README.md`. Everything else is shared boilerplate forked from the canonical [Claude Agent SDK example](../agent-examples/claude-agent-sdk).

## How payments work

Each starter pays from your org treasury via Canopy's hosted MCP server. The agent calls Canopy MCP tools — `canopy_pay`, `canopy_discover_services`, `canopy_get_budget`, etc. — which evaluate your policy server-side and either sign on Base mainnet or surface `pending_approval` / `denied`.

**The dashboard policy is the only spend ceiling, by design.** Each starter ships a suggested preset in `canopy-policy.suggested.json`; the CLI applies it automatically, or you can paste the values manually into the dashboard.

No code-level spend caps — fork `system-prompt.ts` if you want behavior changes, but trust the policy for spend safety.
