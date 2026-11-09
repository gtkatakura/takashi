// JSON edits of ~/.claude/settings.json for setup.sh. Usage: bun settings.ts check|telemetry <settings.json> [endpoint|off]
import { readFileSync, writeFileSync } from "node:fs";

const [cmd, path, endpoint] = process.argv.slice(2);
const d = JSON.parse(readFileSync(path, "utf8"));

if (cmd === "check") {
  const pre: string[] = (d.hooks?.PreToolUse ?? []).flatMap((g: any) => g.hooks.map((h: any) => h.command));
  console.log(pre.some((c) => c.includes("rtk hook")) ? "ok       rtk hook" : "missing  rtk hook (PreToolUse)");
  for (const p of ["caveman@caveman", "ponytail@ponytail"]) console.log(`${d.enabledPlugins?.[p] ? "ok      " : "missing "} plugin ${p}`);
  const env = d.env ?? {};
  console.log(env.CLAUDE_CODE_ENABLE_TELEMETRY === "1" ? `ok       telemetry -> ${env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "?"}` : "off      telemetry");
} else if (cmd === "telemetry") {
  const keys = ["CLAUDE_CODE_ENABLE_TELEMETRY", "OTEL_METRICS_EXPORTER", "OTEL_LOGS_EXPORTER",
    "OTEL_EXPORTER_OTLP_PROTOCOL", "OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_RESOURCE_ATTRIBUTES"];
  const env = (d.env ??= {});
  if (endpoint === "off") for (const k of keys) delete env[k];
  else Object.assign(env, {
    CLAUDE_CODE_ENABLE_TELEMETRY: "1", OTEL_METRICS_EXPORTER: "otlp", OTEL_LOGS_EXPORTER: "otlp",
    OTEL_EXPORTER_OTLP_PROTOCOL: "grpc", OTEL_EXPORTER_OTLP_ENDPOINT: endpoint,
    OTEL_RESOURCE_ATTRIBUTES: "arm=rtk_on,caveman=on",
  });
  if (Object.keys(env).length === 0) delete d.env;
  writeFileSync(path, JSON.stringify(d, null, 2) + "\n");
} else {
  console.error("usage: settings.ts check|telemetry <settings.json> [endpoint|off]");
  process.exit(1);
}
