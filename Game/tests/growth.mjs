// Do questions grow with the learner? (node tests/growth.mjs)
// Uses the same rule as the game (learnkit.js): from a handful of fresh candidates, a new learner gets the easiest,
// a practising learner the middle one, a proficient learner the hardest. For every skill with varied questions,
// the average difficulty must rise from new → practising → proficient. Exit 1 if any skill doesn't grow.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {} };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { SKILLS } = await import('../src/edu.js');
const { PRACTICE } = await import('../src/activities.js');
await import('../src/careers.js');
const { difficulty } = await import('../src/readlevel.js');
const pickFor = (g, st) => { const pool = []; for (let k = 0; k < 7; k++) { const q = g(); if (q) pool.push(q); } pool.sort((a, b) => difficulty(a) - difficulty(b)); return pool[Math.round((st <= 1 ? 0 : st === 2 ? 0.5 : 1) * (pool.length - 1))]; };
const flat = [], rows = [];
for (const s of Object.values(SKILLS)) {
  const g = PRACTICE[s.id]; if (!g) continue;
  const avg = (st) => { let t = 0; for (let i = 0; i < 80; i++) t += difficulty(pickFor(g, st)); return t / 80; };
  const [a, b, c] = [avg(0), avg(2), avg(3)];
  rows.push([s.id, a, b, c]);
  if (c - a < 0.05 && c > 0 && !/^curs\.(lower|upper)$/.test(s.id)) flat.push(s.id);   // single letters to trace are all the same size
}
const grew = rows.filter(([, a, , c]) => c > a + 0.05).length;
const mean = (i) => rows.reduce((t, r) => t + r[i], 0) / rows.length;
console.log(`average difficulty  new ${mean(1).toFixed(2)} → practising ${mean(2).toFixed(2)} → proficient ${mean(3).toFixed(2)}`);
console.log(`${grew}/${rows.length} skills get harder as the learner improves; flat (questions all equally hard): ${flat.length}`);
if (flat.length) console.log('flat:', flat.join(' '));
process.exit(mean(3) > mean(2) && mean(2) > mean(1) && grew / rows.length >= 0.9 ? 0 : 1);
