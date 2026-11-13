// Deterministic data shared by the MCP server (mcp.ts) and the long-session answers (long.ts).
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(7);
const pick = <T>(a: T[]) => a[Math.floor(r() * a.length)];

export const orders = Array.from({ length: 1600 }, (_, i) => ({
  id: `ord_${String(100000 + i)}`, status: pick(["pending", "shipped", "shipped", "failed", "refunded"]),
  amount: Math.round(r() * 100000) / 100, currency: "USD", customer: { id: `cus_${Math.floor(r() * 5000)}`, tier: pick(["free", "pro", "team"]) },
  items: Array.from({ length: 1 + Math.floor(r() * 3) }, () => ({ sku: `sku_${Math.floor(r() * 900)}`, qty: 1 + Math.floor(r() * 4) })),
  created_at: new Date(Date.UTC(2026, 8, 1) + Math.floor(r() * 6e9)).toISOString(), region: pick(["eu-west", "us-east", "ap-south"]),
}));

const services = ["auth", "billing", "search", "catalog", "orders", "notify"];
export const incidents = Array.from({ length: 300 }, (_, i) => {
  const service = i % 23 === 0 ? "billing" : pick(services);
  return {
    id: `INC-${4000 + i}`, service, severity: i % 23 === 0 ? "sev1" : pick(["sev2", "sev3", "sev3", "sev4", "sev1"]),
    opened_at: new Date(Date.UTC(2026, 7, 1) + i * 25_000_000).toISOString(), duration_min: Math.floor(r() * 300),
    title: `${pick(["Elevated latency", "Error spike", "Partial outage", "Degraded writes"])} in ${service}`, oncall: pick(["ana", "bruno", "chen", "dara"]),
  };
});
