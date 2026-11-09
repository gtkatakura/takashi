// Context size per call and tool-call counts.
import { load, ctxOf, pct } from "./lib";

const days = Number(process.env.TOKEN_COST_DAYS ?? 40);
const { calls, tools } = load({ sinceMs: Date.now() - days * 86400_000 });
const sorted = [...calls].sort((a, b) => ctxOf(a) - ctxOf(b));
const n = sorted.length;
const p = (q: number) => ctxOf(sorted[Math.floor(q * (n - 1))]);
console.log(`calls ${n} ctx p50 ${p(0.5)} p75 ${p(0.75)} p90 ${p(0.9)} p99 ${p(0.99)} max ${ctxOf(sorted[n - 1])}`);

const totalCr = calls.reduce((s, c) => s + c.cr, 0);
for (const th of [100_000, 200_000, 400_000, 600_000]) {
  const big = calls.filter((c) => ctxOf(c) > th);
  console.log(`>${th / 1000}k: calls ${pct(big.length, n).toFixed(1)}%  cache-read share ${pct(big.reduce((s, c) => s + c.cr, 0), totalCr).toFixed(1)}%`);
}
const avg = (xs: number[]) => Math.floor(xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length));
console.log("main avg ctx", avg(calls.filter((c) => !c.side).map(ctxOf)), "sub avg ctx", avg(calls.filter((c) => c.side).map(ctxOf)));
console.log("top tools (unique tool_use ids)", [...tools].sort((a, b) => b[1] - a[1]).slice(0, 12));
