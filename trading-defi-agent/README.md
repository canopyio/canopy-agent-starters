# Canopy starter: trading-defi-agent

A terminal-driven trading + DeFi agent built on [`@anthropic-ai/claude-agent-sdk`](https://github.com/anthropics/claude-agent-sdk-typescript), wired to Canopy's [remote MCP server](https://mcp.trycanopy.ai/mcp). It quotes price feeds, validates spread/slippage, and executes via DEXes through policy-gated USDC payments on Base.

**Zero Canopy code** — the agent reaches Canopy through MCP. The only per-starter customization lives in `src/system-prompt.ts`.

## How to run

> **Real money.** This starter signs USDC transactions on Base mainnet. The suggested policy preset (`canopy-policy.suggested.json`) caps you at $50/24h with $5 single-payment approval; tighten further before pushing past testing.

**Prerequisites:** Node 18+ and a Canopy account at <https://trycanopy.ai>.

```bash
# Scaffold via the CLI (preferred — auto-creates the agent + policy):
npx @canopy-ai/create-canopy-agent my-trading-bot
# → pick `trading-defi-agent`, authorize in your browser.

# Or hand-clone:
cp .env.example .env
#   Edit .env: fill in CANOPY_MCP_TOKEN or CANOPY_API_KEY, plus CANOPY_AGENT_ID and ANTHROPIC_API_KEY.
npm install
npm start
```

## Suggested policy preset

`canopy-policy.suggested.json` documents the policy this starter expects. The CLI scaffolder applies these values automatically. If you cloned by hand, paste them into the dashboard:

| Field | Value |
|---|---|
| `spend_cap_usd` | `50` |
| `cap_period_hours` | `24` |
| `approval_required` | `true` |
| `approval_threshold_usd` | `5` |

Allowlisted services are managed in the Canopy dashboard — pick which registered DEX + price-feed providers this agent is allowed to pay. With no allowlist set, the agent can pay any registered service the registry knows about, subject to the cap and approval threshold.

## What the agent does

The system prompt steers a quote → validate → execute loop:

1. **Discover** — `canopy_discover_services` with `category=api` for price feeds, `category=dex` for execution.
2. **Quote** — pulls a price + depth quote from a discovered provider before sizing.
3. **Validate** — rejects the trade if spread or slippage exceeds the operator's tolerance.
4. **Execute** — calls `canopy_pay` with the smallest viable amount.

Conservative by default: ambiguous requests get a clarifying question, not a guess. Pending approvals route through chat or `canopy_wait_for_approval` (dashboard).

## Things to try

| Prompt | Expected | What it tests |
|---|---|---|
| `what's my budget?` | `canopy_get_budget` snapshot | Budget tool |
| `find me a price feed for ETH/USDC on Base` | `canopy_discover_services` (`category=api`) | Discovery for price feeds |
| `pull the orderbook depth at the top venue` | discover + paid call | Quote step |
| `swap 5 cents USDC → ETH on the cheapest venue` | discover dex + `canopy_pay` → `allowed` | Happy path |
| `swap $10 USDC → ETH` | `canopy_pay` → `pending_approval` | Approval threshold ($5) |
| `swap $999 USDC → ETH` | `canopy_pay` → `denied` | Spend cap ($50) |

## Slash commands

- `/help` — list commands
- `/clear` — exit (restart for a fresh conversation)
- `/quit` — exit

## Notes

- **No code-level spend caps.** The dashboard policy is the only ceiling, by design. If you want a tighter blast radius for testing, lower the cap there.
- **Allowlist is by registered service slug, not by on-chain address.** Canopy's registry is the trust boundary — only services with a registered slug (e.g. a Uniswap routing service that's catalogued in the registry) can be added to a policy's allowlist. Configure in the dashboard's policy editor; the registry browser is right there.
- **System prompt at `src/system-prompt.ts`** — fork it freely. The rest of `src/` is shared boilerplate copied from the canonical Canopy + Claude Agent SDK pattern.
