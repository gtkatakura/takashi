import { Glob } from "bun";
import { homedir } from "node:os";
import { statSync, readFileSync } from "node:fs";

// Relative price weights over the input price (standard Anthropic ratios).
export const W = { in: 1, cw5: 1.25, cw1h: 2, cr: 0.1, out: 5 } as const;
export type Kind = keyof typeof W;

export interface Call {
  ts: string;
  sid: string;
  side: boolean;
  agent: string;
  model: string;
  inp: number;
  cw5: number;
  cw1h: number;
  cr: number;
  out: number;
}

export const ctxOf = (c: Call) => c.inp + c.cw5 + c.cw1h + c.cr;
export const wcost = (c: Call) => c.inp * W.in + c.cw5 * W.cw5 + c.cw1h * W.cw1h + c.cr * W.cr + c.out * W.out;

export interface Loaded {
  calls: Call[];
  tools: Map<string, number>; // tool name -> unique tool_use ids
}

/** Reads every assistant line in ~/.claude/projects, deduplicated by requestId. */
export function load(opts: { sinceMs?: number; sinceTs?: string; onlyClaude?: boolean } = {}): Loaded {
  const root = `${homedir()}/.claude/projects`;
  const seen = new Set<string>();
  const toolIds = new Set<string>();
  const tools = new Map<string, number>();
  const calls: Call[] = [];
  for (const rel of new Glob("**/*.jsonl").scanSync({ cwd: root })) {
    const file = `${root}/${rel}`;
    if (opts.sinceMs && statSync(file).mtimeMs < opts.sinceMs) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (!line) continue;
      let d: any;
      try { d = JSON.parse(line); } catch { continue; }
      if (d.type !== "assistant") continue;
      const m = d.message ?? {};
      for (const b of Array.isArray(m.content) ? m.content : []) {
        if (b?.type === "tool_use" && b.id && !toolIds.has(b.id)) {
          toolIds.add(b.id);
          tools.set(b.name, (tools.get(b.name) ?? 0) + 1);
        }
      }
      const u = m.usage;
      const rid = d.requestId ?? m.id;
      const ts: string = d.timestamp ?? "";
      if (!u || !rid || seen.has(rid)) continue;
      if (opts.sinceTs && ts < opts.sinceTs) continue;
      const model: string = m.model ?? "?";
      if (model.startsWith("<")) continue; // <synthetic>
      if (opts.onlyClaude && !model.startsWith("claude-")) continue;
      seen.add(rid);
      const cw1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
      const total = u.cache_creation_input_tokens ?? 0;
      const cw5 = u.cache_creation?.ephemeral_5m_input_tokens ?? total - cw1h;
      calls.push({
        ts, sid: d.sessionId ?? "", side: !!d.isSidechain, agent: d.agentId ?? "", model,
        inp: u.input_tokens ?? 0, cw5, cw1h, cr: u.cache_read_input_tokens ?? 0, out: u.output_tokens ?? 0,
      });
    }
  }
  return { calls, tools };
}

export const pct = (a: number, b: number) => (b ? (100 * a) / b : 0);
export const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
