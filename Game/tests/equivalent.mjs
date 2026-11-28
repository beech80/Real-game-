// No "wrong" choice may equal the right answer written another way (3/9 and 1/3, 50% and 1/2, 0.5 and 1/2).
// Run: node tests/equivalent.mjs
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {}, addEventListener() {} }), querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }), body: { classList: { add() {}, remove() {} } } };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { GEN } = await import('../src/curriculum.js');
const val = (x) => {
  x = String(x).trim().replace(/^\$/, '').replace(/,/g, '');
  let m = x.match(/^(-?\d+)\s*\/\s*(\d+)$/); if (m) return +m[1] / +m[2];
  m = x.match(/^(-?[\d.]+)\s*%$/); if (m) return +m[1] / 100;
  m = x.match(/^-?\d*\.?\d+$/); if (m) return +x;
  return null;
};
let bad = 0, n = 0;
for (const [k, gs] of Object.entries(GEN)) for (const g of gs) for (let i = 0; i < 40; i++) {
  let Q; try { Q = g(); } catch (e) { continue; }
  if (!Q || Q.type !== 'choice' || !Q.o) continue; n++;
  const a = val(Q.a); if (a == null) continue;
  const aPct = /%$/.test(String(Q.a).trim());
  for (const o of Q.o) {
    if (o === Q.a) continue; const v = val(o); if (v == null) continue;
    if (/%$/.test(String(o).trim()) !== aPct && !/\//.test(String(o) + String(Q.a))) continue;   // 25 and 25% are different answers
    if (Math.abs(v - a) < 1e-9) { bad++; if (bad < 10) console.log('SAME VALUE', k, '|', String(Q.q).slice(0, 80), '|', Q.a, '=', o); }
  }
}
console.log(`${n} choice items checked · ${bad} with a wrong choice equal to the answer`);
console.log(bad ? 'EQUIVALENT FAILED' : 'EQUIVALENT OK');
process.exit(bad ? 1 : 0);
