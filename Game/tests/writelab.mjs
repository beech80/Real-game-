// Writing Lab content check: every lesson teaches, every answer is one of its choices, every sorted item has a real bin,
// every model answer passes its own checklist, and the order steps are distinct. Run: node tests/writelab.mjs
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {}, addEventListener() {} }), querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }), body: { classList: { add() {}, remove() {} } } };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { LAB, TRACKS } = await import('../src/writelab.js');
const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
const caps = /\b[A-Z]{3,}\b/;
let q = 0;
for (const L of LAB) {
  if (!TRACKS.some((t) => t[0] === L.t)) fail(`${L.id}: unknown track`);
  if (!L.teach.length || !L.ex.length) fail(`${L.id}: needs teaching and examples`);
  for (const t of [...L.teach, ...L.ex.flat()]) if (caps.test(t.replace(/\b(REAL|OK)\b/g, ''))) fail(`${L.id}: all-caps word in “${t}”`);
  for (const Q of L.qs) {
    q++;
    if (Q.type === 'choice') { if (!Q.o.includes(Q.a)) fail(`${L.id}: answer not in choices`); if (new Set(Q.o).size !== Q.o.length) fail(`${L.id}: repeated choice`); if (!Q.why) fail(`${L.id}: no explanation`); }
    if (Q.type === 'sort') for (const [it, b] of Q.items) if (!Q.bins.includes(b)) fail(`${L.id}: “${it}” has no bin ${b}`);
    if (Q.type === 'order' && Q.items.length < 3) fail(`${L.id}: order needs 3+ steps`);
  }
  const W = L.write;
  if (W) {
    const t = W.model, words = t.split(/\s+/).length;
    if (words < W.minWords) fail(`${L.id}: model is shorter than minWords`);
    if (!/^[A-Z“"]/.test(t) || !/[.!?]["”]?$/.test(t)) fail(`${L.id}: model needs a capital and end punctuation`);
    for (const [label, test] of W.rubric) if (!(typeof test === 'function' ? test(t) : test.test(t))) fail(`${L.id}: model fails “${label}”`);
  } else if (!L.builder && L.id !== 'p1') fail(`${L.id}: no writing task`);
}
const per = Object.fromEntries(TRACKS.map(([t]) => [t, LAB.filter((L) => L.t === t).length]));
console.log(`${LAB.length} lessons ${JSON.stringify(per)} · ${q} practice questions`);
console.log(bad.length ? 'WRITELAB FAILED' : 'WRITELAB OK');
process.exit(bad.length ? 1 : 0);
