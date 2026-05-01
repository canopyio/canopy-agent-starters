import readline from "node:readline";
import { config as loadEnv } from "dotenv";
import { query, type SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { banner, helpExtra, systemPrompt } from "./system-prompt.js";
import {
  printAgentText,
  printBanner,
  printError,
  printInfo,
  printPrompt,
  printResultSummary,
  printToolCall,
  printToolResult,
} from "./log.js";

loadEnv();

const SESSION_ID = `canopy-starter-${Date.now()}`;

const HELP =
  `Slash commands:
  /clear                  — exit and start fresh (full conversation reset)
  /help                   — show this list
  /quit (or Ctrl+D)       — exit

This starter connects to the Canopy MCP server (zero Canopy code). The agent
has access to all Canopy MCP tools (canopy_pay, canopy_discover_services,
canopy_approve, canopy_deny, canopy_get_budget, canopy_ping,
canopy_wait_for_approval, etc.).` + helpExtra;

async function main(): Promise<void> {
  const apiKey = process.env.CANOPY_API_KEY;
  const agentId = process.env.CANOPY_AGENT_ID;
  if (!apiKey || !agentId) {
    printError(
      new Error(
        "CANOPY_API_KEY and CANOPY_AGENT_ID must be set. Copy .env.example to .env and fill in values.",
      ),
    );
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    printError(
      new Error(
        "ANTHROPIC_API_KEY must be set — Claude Agent SDK uses Anthropic's API.",
      ),
    );
    process.exit(1);
  }

  const mcpUrl = process.env.CANOPY_MCP_URL ?? "https://mcp.trycanopy.ai/mcp";
  printBanner(banner);
  printInfo(`MCP: ${mcpUrl} (override with CANOPY_MCP_URL)`);
  printInfo(HELP);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const userInputs = createUserInputStream(rl);

  printPrompt();

  try {
    for await (const msg of query({
      prompt: userInputs.iter(),
      options: {
        systemPrompt,
        mcpServers: {
          canopy: {
            type: "http",
            url: mcpUrl,
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "X-Canopy-Agent-Id": agentId,
            },
          },
        },
        allowedTools: ["mcp__canopy__*"],
        tools: [],
      },
    })) {
      handleMessage(msg);
    }
  } catch (err) {
    printError(err);
  }

  rl.close();
}

function handleMessage(msg: unknown): void {
  if (!msg || typeof msg !== "object") return;
  const m = msg as { type?: string };

  switch (m.type) {
    case "assistant": {
      const am = msg as {
        message?: {
          content?: Array<{ type: string; text?: string; name?: string; input?: unknown }>;
        };
      };
      for (const block of am.message?.content ?? []) {
        if (block.type === "text" && typeof block.text === "string") {
          printAgentText(block.text);
        } else if (block.type === "tool_use" && block.name) {
          printToolCall(block.name, block.input);
        }
      }
      break;
    }
    case "user": {
      const um = msg as {
        message?: {
          content?: Array<{ type: string; tool_use_id?: string; content?: unknown }>;
        };
        tool_use_result?: unknown;
      };
      for (const block of um.message?.content ?? []) {
        if (block.type === "tool_result") {
          printToolResult("(canopy)", um.tool_use_result ?? block.content);
        }
      }
      break;
    }
    case "result": {
      const r = msg as {
        subtype?: string;
        is_error?: boolean;
        result?: string;
        total_cost_usd?: number;
        num_turns?: number;
      };
      if (r.is_error) {
        printError(new Error(`agent ${r.subtype ?? "error"}`));
      } else {
        printResultSummary(
          `(turn done — ${r.num_turns ?? "?"} sub-turns, $${(r.total_cost_usd ?? 0).toFixed(4)} model cost)`,
        );
      }
      printPrompt();
      break;
    }
    case "system":
    case "stream_event":
    default:
      break;
  }
}

interface UserInputStream {
  iter(): AsyncIterable<SDKUserMessage>;
}

function createUserInputStream(rl: readline.Interface): UserInputStream {
  const queue: SDKUserMessage[] = [];
  const waiters: Array<(m: IteratorResult<SDKUserMessage>) => void> = [];
  let closed = false;

  const push = (m: SDKUserMessage): void => {
    if (waiters.length > 0) {
      waiters.shift()!({ value: m, done: false });
    } else {
      queue.push(m);
    }
  };

  const close = (): void => {
    closed = true;
    while (waiters.length > 0) {
      waiters.shift()!({ value: undefined as unknown as SDKUserMessage, done: true });
    }
  };

  rl.on("line", (raw) => {
    const line = raw.trim();
    if (!line) {
      printPrompt();
      return;
    }
    if (line.startsWith("/")) {
      const stop = handleSlash(line);
      if (stop) {
        close();
      } else {
        printPrompt();
      }
      return;
    }
    push({
      type: "user",
      message: { role: "user", content: line },
      parent_tool_use_id: null,
      session_id: SESSION_ID,
    });
  });

  rl.on("close", () => {
    close();
  });

  return {
    iter(): AsyncIterable<SDKUserMessage> {
      return {
        [Symbol.asyncIterator](): AsyncIterator<SDKUserMessage> {
          return {
            next(): Promise<IteratorResult<SDKUserMessage>> {
              if (queue.length > 0) {
                return Promise.resolve({ value: queue.shift()!, done: false });
              }
              if (closed) {
                return Promise.resolve({
                  value: undefined as unknown as SDKUserMessage,
                  done: true,
                });
              }
              return new Promise((resolve) => waiters.push(resolve));
            },
          };
        },
      };
    },
  };
}

function handleSlash(line: string): boolean {
  const cmd = line.slice(1).trim().split(/\s+/)[0];
  switch (cmd) {
    case "help":
      printInfo(HELP);
      return false;
    case "clear":
      printInfo("clearing conversation by exiting; restart the process to begin fresh");
      return true;
    case "quit":
    case "exit":
      printInfo("bye");
      return true;
    default:
      printError(new Error(`unknown command: /${cmd}. Try /help.`));
      return false;
  }
}

main().catch((err) => {
  printError(err);
  process.exit(1);
});
