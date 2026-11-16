// JSON edits of ~/.claude/settings.json for setup.sh. Usage: bun settings.ts check|telemetry|arm <settings.json> [endpoint|off]
import { readFileSync, writeFileSync } from "node:fs";

const [cmd, path, endpoint] = process.argv.slice(2);
const d = JSON.parse(readFileSync(path, "utf8"));

const pre: string[] = (d.hooks?.PreToolUse ?? []).flatMap((g: any) => g.hooks.map((h: any) => h.command));
const rtkOn = pre.some((c) => c.includes("rtk hook"));
const plugin = (p: string) => Boolean(d.enabledPlugins?.[p]);

// Arm label for Grafana's "cost by arm": RTK hook state, plus context-mode when that plugin is on.
function resourceAttributes(): string {
  const arm = (rtkOn ? "rtk_on" : "rtk_off") + (plugin("context-mode@context-mode") ? "_context_mode" : "");
  return `arm=${arm},caveman=${plugin("caveman@caveman") ? "on" : "off"}`;
}

if (cmd === "check") {
  console.log(rtkOn ? "ok       rtk hook" : "missing  rtk hook (PreToolUse)");
  for (const p of ["caveman@caveman", "ponytail@ponytail", "context-mode@context-mode"]) console.log(`${plugin(p) ? "ok      " : "missing "} plugin ${p}`);
  const env = d.env ?? {};
  console.log(env.CLAUDE_CODE_ENABLE_TELEMETRY === "1"
    ? `ok       telemetry -> ${env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "?"} (${env.OTEL_RESOURCE_ATTRIBUTES ?? "no attributes"})`
    : "off      telemetry");
} else if (cmd === "telemetry") {
  const keys = ["CLAUDE_CODE_ENABLE_TELEMETRY", "OTEL_METRICS_EXPORTER", "OTEL_LOGS_EXPORTER",
    "OTEL_EXPORTER_OTLP_PROTOCOL", "OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_RESOURCE_ATTRIBUTES"];
  const env = (d.env ??= {});
  if (endpoint === "off") for (const k of keys) delete env[k];
  else Object.assign(env, {
    CLAUDE_CODE_ENABLE_TELEMETRY: "1", OTEL_METRICS_EXPORTER: "otlp", OTEL_LOGS_EXPORTER: "otlp",
    OTEL_EXPORTER_OTLP_PROTOCOL: "grpc", OTEL_EXPORTER_OTLP_ENDPOINT: endpoint,
    OTEL_RESOURCE_ATTRIBUTES: resourceAttributes(),
  });
  if (Object.keys(env).length === 0) delete d.env;
  writeFileSync(path, JSON.stringify(d, null, 2) + "\n");
} else if (cmd === "arm") {
  // Refresh only the arm label, and only when telemetry is already on.
  if (d.env?.CLAUDE_CODE_ENABLE_TELEMETRY !== "1") process.exit(0);
  d.env.OTEL_RESOURCE_ATTRIBUTES = resourceAttributes();
  writeFileSync(path, JSON.stringify(d, null, 2) + "\n");
  console.log(`telemetry ${d.env.OTEL_RESOURCE_ATTRIBUTES}`);
} else {
  console.error("usage: settings.ts check|telemetry|arm <settings.json> [endpoint|off]");
  process.exit(1);
}
