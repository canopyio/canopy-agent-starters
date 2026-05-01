const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
};

export function printBanner(line: string): void {
  process.stdout.write(`${C.cyan}${line}${C.reset}\n`);
}

export function printInfo(line: string): void {
  process.stdout.write(`${C.dim}${line}${C.reset}\n`);
}

export function printPrompt(): void {
  process.stdout.write(`\n${C.bold}You:${C.reset} `);
}

export function printAgentText(text: string): void {
  process.stdout.write(`${C.bold}agent:${C.reset} ${text}`);
  if (!text.endsWith("\n")) process.stdout.write("\n");
}

export function printToolCall(name: string, args: unknown): void {
  const displayName = name.startsWith("mcp__canopy__")
    ? name.slice("mcp__canopy__".length)
    : name;
  process.stdout.write(
    `${C.magenta}🔧 ${displayName}(${formatJson(args)})${C.reset}\n`,
  );
}

export function printToolResult(name: string, result: unknown): void {
  const displayName = name.startsWith("mcp__canopy__")
    ? name.slice("mcp__canopy__".length)
    : name;
  const summary = summarizeToolResult(displayName, result);
  process.stdout.write(`${C.green}💰 → ${summary}${C.reset}\n`);
}

export function printError(err: unknown): void {
  if (err instanceof Error) {
    process.stdout.write(`${C.red}✗ ${err.name}: ${err.message}${C.reset}\n`);
    return;
  }
  process.stdout.write(`${C.red}✗ ${String(err)}${C.reset}\n`);
}

export function printResultSummary(line: string): void {
  process.stdout.write(`${C.dim}${line}${C.reset}\n`);
}

function summarizeToolResult(name: string, result: unknown): string {
  const r = unwrapMcp(result);

  if (r && typeof r === "object") {
    const obj = r as Record<string, unknown>;

    if (typeof obj.status === "string") {
      if (obj.status === "allowed") {
        const tx = obj.txHash as string | null | undefined;
        const cost = obj.costUsd as number | null | undefined;
        const link = tx ? ` https://basescan.org/tx/${tx}` : "";
        return `allowed${cost != null ? ` ($${cost})` : ""}${tx ? ` tx=${tx}${link}` : ""}`;
      }
      if (obj.status === "pending_approval") {
        const recipient =
          (obj.recipientName as string | null) ??
          (obj.recipientAddress as string | null) ??
          "?";
        const amount = obj.amountUsd as number | null | undefined;
        const id = obj.approvalId as string | undefined;
        return `pending_approval $${amount ?? "?"} → ${recipient} (id=${id})`;
      }
      if (obj.status === "denied") {
        return `denied — ${obj.reason ?? "(no reason)"}`;
      }
    }

    if (typeof obj.decision === "string") {
      const tx = obj.txHash as string | null | undefined;
      return `${obj.decision}${tx ? ` tx=${tx}` : ""}`;
    }
  }

  if (Array.isArray(r)) {
    if (r.length === 0) return "no items";
    return `${r.length} items: ${formatJson(r.slice(0, 3))}${r.length > 3 ? "…" : ""}`;
  }

  return formatJson(r);
}

function unwrapMcp(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const v = value as Record<string, unknown>;
  if (Array.isArray(v.content)) {
    const parts = (v.content as Array<Record<string, unknown>>)
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text as string);
    if (parts.length > 0) {
      const joined = parts.join("\n");
      try {
        return JSON.parse(joined);
      } catch {
        return joined;
      }
    }
  }
  return value;
}

function formatJson(value: unknown): string {
  try {
    const str = JSON.stringify(value);
    if (!str) return String(value);
    return str.length > 200 ? str.slice(0, 200) + "…" : str;
  } catch {
    return String(value);
  }
}
