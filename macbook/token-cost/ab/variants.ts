// Shared pieces for the A/B runners: per-variant Claude Code settings and the headroom proxy.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const root = join(homedir(), ".cache/takashi-ab");
export const bin = join(root, "bin");
export const need = (p: string) => { if (!existsSync(p)) throw new Error(`missing ${p}`); return p; };

// Telemetry off so A/B runs stay out of the Grafana baseline.
export const baseEnv: Record<string, string> = { CLAUDE_CODE_ENABLE_TELEMETRY: "0" };

export type Variant = { args: string[]; env: Record<string, string>; prepare?: (cwd: string) => Promise<void> };

// A copy of the user settings with the RTK hook and the Caveman plugin switched on or off. Passed with
// --setting-sources project,local so the real ~/.claude/settings.json is not read; everything else stays equal.
export function derive(name: string, rtk: boolean, caveman: boolean): Variant {
  const s = JSON.parse(readFileSync(join(homedir(), ".claude/settings.json"), "utf8"));
  if (!rtk) s.hooks.PreToolUse = (s.hooks.PreToolUse ?? [])
    .map((g: any) => ({ ...g, hooks: g.hooks.filter((h: any) => !String(h.command).includes("rtk hook")) }))
    .filter((g: any) => g.hooks.length);
  s.enabledPlugins = { ...s.enabledPlugins, "caveman@caveman": caveman };
  s.env = { ...s.env, ...baseEnv };
  const file = join(root, `settings-${name}.json`);
  writeFileSync(file, JSON.stringify(s, null, 2));
  return { args: ["--setting-sources", "project,local", "--settings", file], env: {} };
}

// Headroom proxy in its default cache mode. --no-cache: its semantic cache would answer repeated prompts
// across reps and fake the savings. Returns the env and MCP server entry for the "on" variant, and a stop().
export async function startHeadroom(port = 28787) {
  const url = `http://127.0.0.1:${port}`;
  const off = { HEADROOM_TELEMETRY: "off", HEADROOM_BEACON: "off", DO_NOT_TRACK: "1" };
  const log = Bun.file(join(root, "proxy.log"));
  const proxy = Bun.spawn([need(join(bin, "headroom")), "proxy", "--port", String(port), "--no-cache"],
    { env: { ...process.env, ...off }, stdout: log, stderr: log });
  for (let i = 0; ; i++) {
    try { await fetch(url + "/health"); break; } catch { if (i > 60) throw new Error("headroom proxy did not start"); await Bun.sleep(1000); }
  }
  return {
    env: { ANTHROPIC_BASE_URL: url },
    mcp: { headroom: { command: join(bin, "headroom"), args: ["mcp", "serve", "--proxy-url", url], env: off } },
    stop: async () => { proxy.kill(); await proxy.exited; },
  };
}

export const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : NaN; };

// Whole-word, case-insensitive match, so "KompressCompressor" does not pass on "RemoteKompressCompressor".
export const has = (text: string, s: string) => new RegExp(`(?<!\\w)${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\w)`, "i").test(text);
