// Spend reconstruction (calibrated on ccusage) and savings simulations. Usage: bun sim.ts <ccusage-monthly.json>
import { readFileSync } from "node:fs";
import { W, type Call, load, wcost, ctxOf, pct, fmt } from "./lib";

const START = process.env.TOKEN_COST_START ?? "2026-10-01";
const cm = JSON.parse(readFileSync(process.argv[2], "utf8"));
const { calls } = load({ sinceTs: START, onlyClaude: true });

// $ per weighted token by model: ccusage dollars / weighted tokens.
const usd = new Map<string, number>(), wt = new Map<string, number>();
for (const mo of cm.monthly) for (const b of mo.modelBreakdowns) usd.set(b.modelName, (usd.get(b.modelName) ?? 0) + b.cost);
for (const c of calls) wt.set(c.model, (wt.get(c.model) ?? 0) + wcost(c));
const P = new Map<string, number>();
for (const [m, w] of wt) if (w && usd.get(m)) P.set(m, usd.get(m)! / w);
const opus = P.get("claude-opus-5-5")!;
const price = (c: Call) => P.get(c.model) ?? opus;
const total = calls.reduce((s, c) => s + wcost(c) * price(c), 0);
const usdTotal = [...usd.values()].reduce((s, x) => s + x, 0);
console.log("ccusage $", usdTotal.toFixed(2));
console.log(`calls ${calls.length}  reconstructed $ ${fmt(total, 2)}`);
console.log("rel price vs opus:", Object.fromEntries([...P].map(([m, v]) => [m, +(v / opus).toFixed(3)])));
const byMonth = new Map<string, number>();
for (const c of calls) byMonth.set(c.ts.slice(0, 7), (byMonth.get(c.ts.slice(0, 7)) ?? 0) + wcost(c) * price(c));
console.log("by month $", Object.fromEntries([...byMonth].sort().map(([k, v]) => [k, +v.toFixed(2)])));

const threads = new Map<string, Call[]>();
for (const c of calls) {
  const k = `${c.sid}|${c.side}|${c.agent}`;
  if (!threads.has(k)) threads.set(k, []);
  threads.get(k)!.push(c);
}
for (const t of threads.values()) t.sort((a, b) => a.ts.localeCompare(b.ts));

// 1) /clear at a threshold on main threads
function simClear(T: number, penalty: number) {
  let saved = 0, clears = 0;
  for (const rows of threads.values()) {
    if (rows[0].side) continue;
    const base = ctxOf(rows[0]);
    let anchor = base, prev = 0;
    for (const r of rows) {
      const c = ctxOf(r);
      if (c < prev * 0.7) anchor = c; // real compaction: re-anchor
      prev = c;
      let sim = base + (c - anchor);
      if (sim > T) {
        clears++; anchor = c; sim = base;
        saved -= (base + penalty) * W.cw1h * price(r);
      }
      const newCr = Math.max(0, sim - r.inp - r.cw5 - r.cw1h);
      if (newCr < r.cr) saved += (r.cr - newCr) * W.cr * price(r);
    }
  }
  return { saved, clears };
}
for (const T of [150_000, 200_000, 300_000]) for (const pen of [20_000, 60_000]) {
  const { saved, clears } = simClear(T, pen);
  console.log(`/clear at ${T / 1000}k (penalty ${pen / 1000}k re-read per clear): saved $${fmt(saved)} (${pct(saved, total).toFixed(1)}%), clears ${clears}`);
}

// 2) avoidable cache misses: big cache write mid-thread without a compaction drop
let missCost = 0, idleCost = 0, nm = 0, ni = 0;
for (const rows of threads.values()) {
  const ttl = rows[0].side ? 300 : 3600;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i], cw = b.cw5 + b.cw1h;
    if (cw > 20000 && b.cr < cw && ctxOf(b) >= 0.9 * ctxOf(a)) {
      const gap = (Date.parse(b.ts) - Date.parse(a.ts)) / 1000;
      const w = (b.cw5 * W.cw5 + b.cw1h * W.cw1h - cw * W.cr) * price(b);
      if (gap > ttl) { idleCost += w; ni++; } else { missCost += w; nm++; }
    }
  }
}
console.log(`cache misses within TTL: ${nm}, excess $${fmt(missCost)} (${pct(missCost, total).toFixed(1)}%)`);
console.log(`misses after idle > TTL: ${ni}, excess $${fmt(idleCost)} (${pct(idleCost, total).toFixed(1)}%)`);

// 3) Caveman: -8.5% output
const cav = calls.reduce((s, c) => s + c.out * 0.085 * W.out * price(c), 0);
console.log(`caveman -8.5% output: $${fmt(cav)} (${pct(cav, total).toFixed(1)}%)`);

// 4) subagents on a cheaper model, using relative prices from the data
const subOpus = calls.filter((c) => c.side && c.model === "claude-opus-5-5").reduce((s, c) => s + wcost(c) * price(c), 0);
for (const alt of ["claude-sonnet-5-5", "claude-haiku-5-5"]) if (P.has(alt)) {
  const s = subOpus * (1 - P.get(alt)! / opus);
  console.log(`opus subagents -> ${alt}: $${fmt(s)} (${pct(s, total).toFixed(1)}%) [sub opus cost $${fmt(subOpus)}]`);
}

// 5) Ponytail -10.3% cost (JetBrains result on Sonnet 5; may not transfer)
console.log(`ponytail -10.3% (if transfers): $${fmt(total * 0.103)}`);
