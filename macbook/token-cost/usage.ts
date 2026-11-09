// Cost split by token type, subagent share, per-model share, cache misses, last 14 days.
import { W, type Kind, type Call, load, wcost, pct, fmt } from "./lib";

const days = Number(process.env.TOKEN_COST_DAYS ?? 40);
const { calls } = load({ sinceMs: Date.now() - days * 86400_000 });
const kinds = Object.keys(W) as Kind[];
const zero = () => Object.fromEntries(kinds.map((k) => [k, 0])) as Record<Kind, number>;
const add = (acc: Record<Kind, number>, c: Call) => { for (const k of kinds) acc[k] += c[k === "in" ? "inp" : k]; };
const cost = (acc: Record<Kind, number>) => kinds.reduce((s, k) => s + acc[k] * W[k], 0);

function show(name: string, acc: Record<Kind, number>) {
  const T = cost(acc), N = kinds.reduce((s, k) => s + acc[k], 0) || 1;
  console.log(`${name}: tokens=${fmt(N)} relcost=${fmt(T)}`);
  for (const k of kinds) console.log(`   ${k.padEnd(5)} tok%=${pct(acc[k], N).toFixed(1).padStart(5)}  cost%=${pct(acc[k] * W[k], T).toFixed(1).padStart(5)}`);
}

const all = zero(), side = zero();
const byModel = new Map<string, Record<Kind, number>>();
const byDay = new Map<string, Record<Kind, number>>();
const sessions = new Map<string, Call[]>();
for (const c of calls) {
  add(all, c);
  if (c.side) add(side, c);
  if (!byModel.has(c.model)) byModel.set(c.model, zero());
  add(byModel.get(c.model)!, c);
  const day = c.ts.slice(0, 10);
  if (!byDay.has(day)) byDay.set(day, zero());
  add(byDay.get(day)!, c);
  if (!sessions.has(c.sid)) sessions.set(c.sid, []);
  sessions.get(c.sid)!.push(c);
}
show("ALL", all);
show("SUBAGENTS(sidechain)", side);
const allCost = cost(all);
console.log(`subagent share of cost ${pct(cost(side), allCost).toFixed(1)}%`);

console.log("\nby model (cost share):");
[...byModel].sort((a, b) => cost(b[1]) - cost(a[1])).slice(0, 8).forEach(([m, c]) =>
  console.log(`  ${m.padEnd(30)} ${pct(cost(c), allCost).toFixed(1).padStart(5)}%  out%cost=${pct(c.out * W.out, cost(c)).toFixed(1)}`));

let miss = 0, n = 0;
for (const rows of sessions.values()) {
  rows.sort((a, b) => a.ts.localeCompare(b.ts));
  rows.forEach((r, i) => { n++; if (i > 0 && r.cw5 + r.cw1h > 20000 && r.cr < r.cw5 + r.cw1h) miss++; });
}
console.log(`\nsessions=${sessions.size} calls=${n} likely full cache misses (cw>20k & cr<cw, not first call)=${miss}`);

console.log("\nlast 14 days cost% cache-write / output / cache-read:");
[...byDay.keys()].sort().slice(-14).forEach((day) => {
  const c = byDay.get(day)!, T = cost(c) || 1;
  console.log(`  ${day} relcost=${fmt(cost(c)).padStart(14)} cw%=${pct(c.cw5 * W.cw5 + c.cw1h * W.cw1h, T).toFixed(1).padStart(5)} out%=${pct(c.out * W.out, T).toFixed(1).padStart(5)} cr%=${pct(c.cr * W.cr, T).toFixed(1).padStart(5)}`);
});
