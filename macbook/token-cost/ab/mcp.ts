// Minimal stdio MCP server for the long-session A/B: tools that return large JSON arrays, the case
// headroom and context-mode say they compress best. Deterministic data (see long.ts for the answers).
// Usage: bun mcp.ts
import { orders, incidents } from "./long-data";

const tools = [
  { name: "list_orders", description: "List orders with a given status (pending, shipped, failed, refunded).",
    inputSchema: { type: "object", properties: { status: { type: "string" } }, required: ["status"] } },
  { name: "list_incidents", description: "List production incidents of the last 90 days.",
    inputSchema: { type: "object", properties: {} } },
];

const send = (msg: unknown) => process.stdout.write(JSON.stringify(msg) + "\n");
let buf = "";
for await (const chunk of Bun.stdin.stream()) {
  buf += new TextDecoder().decode(chunk);
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    const m = JSON.parse(line);
    if (m.id === undefined) continue; // notifications
    if (m.method === "initialize")
      send({ jsonrpc: "2.0", id: m.id, result: { protocolVersion: m.params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: {} }, serverInfo: { name: "shop", version: "1.0.0" } } });
    else if (m.method === "tools/list") send({ jsonrpc: "2.0", id: m.id, result: { tools } });
    else if (m.method === "tools/call") {
      const { name, arguments: a } = m.params;
      const data = name === "list_orders" ? orders.filter((o) => o.status === a?.status) : name === "list_incidents" ? incidents : null;
      send({ jsonrpc: "2.0", id: m.id, result: data
        ? { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
        : { content: [{ type: "text", text: `unknown tool ${name}` }], isError: true } });
    } else send({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: "method not found" } });
  }
}
