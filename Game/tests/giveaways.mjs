// Answer-length giveaways: in multiple-choice items, the correct answer shouldn't usually be the obviously longest
// choice (a test-wise student would just pick it). Flags items where the key is 1.6× longer than every wrong choice.
// Fails if more than 15% of a skill's sampled items (or 12% overall) are giveaways.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {} };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { GEN } = await import('../src/curriculum.js');
const LIMIT = 1.6, rows = [], per = {};
for (const [k, gens] of Object.entries(GEN)) for (const g of gens) {
  const seen = new Set();
  for (let i = 0; i < 6; i++) { let Q; try { Q = g(); } catch (e) { continue; } if (!Q || Q.type && Q.type !== 'choice' || !Q.o || Q.o.length < 3) continue;
    const key = JSON.stringify([Q.q, Q.a]); if (seen.has(key)) continue; seen.add(key);
    const a = String(Q.a).length, wrong = Q.o.filter((o) => o !== Q.a).map((o) => String(o).length);
    const give = a >= 18 && wrong.every((w) => a >= w * LIMIT);
    per[k] = per[k] || [0, 0]; per[k][1]++; if (give) { per[k][0]++; rows.push([k, Q.q, Q.a, Q.o.filter((o) => o !== Q.a)]); }
  }
}
const total = Object.values(per).reduce((a, v) => a + v[1], 0), flagged = rows.length;
const worst = Object.entries(per).filter(([, v]) => v[1] >= 4 && v[0] / v[1] > 0.15).sort((a, b) => b[1][0] / b[1][1] - a[1][0] / a[1][1]);
if (process.env.LIST) for (const r of rows.filter((r) => !process.env.SKILL || r[0].startsWith(process.env.SKILL))) console.log(`${r[0]} | ${r[1].slice(0, 70)} | KEY: ${r[2]} | ${r[3].join(' / ')}`);
console.log(`${flagged} of ${total} choice items (${(flagged / total * 100).toFixed(1)}%) have the key much longer than every wrong choice`);
console.log('skills over 15%:', worst.map(([k, v]) => `${k} ${v[0]}/${v[1]}`).join('  ') || 'none');
const ok = flagged / total <= 0.12 && !worst.length;
console.log(ok ? 'GIVEAWAYS OK' : 'GIVEAWAYS FAILED');
process.exit(ok ? 0 : 1);
