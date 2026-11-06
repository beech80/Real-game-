// Variety report: how many genuinely different questions each skill can give (node tests/variety.mjs [min]).
// A skill is "thin" when practising it 300 times yields fewer than `min` distinct question+answer pairs.
// Exit code 1 if any skill is thin, so the suite keeps every skill worth practising.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {} };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { SKILLS } = await import('../src/edu.js');
const { PRACTICE } = await import('../src/activities.js');
await import('../src/careers.js');   // folds world-task generators into PRACTICE
const MIN = +(process.argv[2] || 8);
const rows = [];
for (const id of Object.keys(SKILLS)) {
  const g = PRACTICE[id];
  if (!g) { rows.push([id, 0, 'no practice']); continue; }
  const seen = new Set();
  for (let i = 0; i < 300; i++) { let Q; try { Q = g(); } catch (e) { continue; } if (!Q) continue; seen.add(JSON.stringify([Q.q, Q.a, Q.word, Q.items, Q.v && Q.v.lines, Q.total])); }
  rows.push([id, seen.size, '']);
}
const thin = rows.filter((r) => r[1] < MIN && r[0] !== 'curs.signature');
rows.sort((a, b) => a[1] - b[1]);
for (const r of rows.slice(0, process.env.ALL ? rows.length : 60)) console.log(String(r[1]).padStart(4), r[0], r[2]);
console.log(`\n${rows.length} skills · ${thin.length} with fewer than ${MIN} different questions`);
process.exit(thin.length ? 1 : 0);
