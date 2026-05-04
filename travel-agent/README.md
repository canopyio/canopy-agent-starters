# Canopy starter: travel-agent

A terminal-driven travel-search agent built on [`@anthropic-ai/claude-agent-sdk`](https://github.com/anthropics/claude-agent-sdk-typescript), wired to Canopy's [remote MCP server](https://mcp.trycanopy.ai/mcp). It pays per-query for flight data (canonical demo: [FlightAPI](https://flightapi.mpp.tempo.xyz)) and surfaces options.

**v1 scope: search and surface, no booking.** Actual flight booking via Canopy requires the commerce rail (ACP), which isn't live yet. The agent presents top options and explicitly hands off booking to the user.

## How to run

```bash
npx @canopy-ai/create-canopy-agent my-travel-agent
# → pick `travel-agent`, authorize in your browser.
```

Or hand-clone: `cp .env.example .env` → fill creds → `npm install && npm start`.

## Suggested policy preset

| Field | Value |
|---|---|
| `spend_cap_usd` | `5` |
| `cap_period_hours` | `24` |
| `approval_required` | `true` |
| `approval_threshold_usd` | `0.5` |

Cap is intentionally tight because v1 only pays for flight data lookups. Once booking is supported (ACP), the preset will need a higher cap and an explicit allowlist of booking partners.

## Things to try

| Prompt | Expected | What it tests |
|---|---|---|
| `what's my budget?` | `canopy_get_budget` | Budget tool |
| `find me a flight from SFO to JFK on June 15 under $500` | discover + paid FlightAPI calls → top 3 options | Happy path |
| `what airlines fly LAX to LHR with one stop?` | filtered search + comparison table | Multi-criteria search |
| `book the cheapest one for me` | agent declines, explains booking is hand-off-only in v1 | Booking guard |

## Notes

- **FlightAPI** lives at `https://flightapi.mpp.tempo.xyz` and is registered under `category=data`. The system prompt prefers it as the canonical demo provider.
- **No auto-booking by design.** The agent surfaces options; the user books elsewhere. This is enforced by the system prompt, not the policy — but the policy's $5/24h cap also makes booking impossible.
- **No code-level spend caps.** The dashboard policy is the only ceiling.
