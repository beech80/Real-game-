// Every wrong pick gets a real reason (node tests/whywrong.mjs): for each multiple-choice question, each wrong option
// must have its own reason (item, written bank or skill rule), not the general “read it again” fallback, and the reason
// must be readable at the question's level. Exit 1 on any problem.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {} };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { GEN } = await import('../src/curriculum.js');
const { SKILLS } = await import('../src/edu.js');
const { reasonFor } = await import('../src/learnkit.js');
const { syl } = await import('../src/readlevel.js');
const { explained } = await import('../src/glossary.js');
const EVERYDAY = /^(everything|everybody|everyone|carefully|vegetables?|remembering|information|especially|regularly|celebrations?|exercising|activit(y|ies)|elevators?|firefighters?|watermelons?|televisions?|caterpillars?)$/i;
const MAXW = { 1: 14, 2: 18, 3: 26, 4: 26, 5: 32, 6: 32 }, MAXS = { 1: 4, 2: 4, 3: 5, 4: 5, 5: 9, 6: 9 };
const wordsOf = (s) => String(s).replace(/[“”"()…]/g, ' ').split(/\s+/).map((w) => w.replace(/[^A-Za-z’'-]/g, '')).filter((w) => /[a-z]/i.test(w));
let options = 0, generic = 0, numeric = 0; const probs = [], seen = new Set();
for (const [k, gens] of Object.entries(GEN)) for (const g of gens) for (let i = 0; i < 8; i++) {
  let Q; try { Q = g(); } catch (e) { continue; } if (!Q || Q.type && Q.type !== 'choice' || !Q.o) continue;
  Q.skill = Q.skill || k; const sk = SKILLS[Q.skill] || {}, band = Q.band || sk.band || 3;
  for (const o of Q.o) { if (String(o) === String(Q.a)) continue; const key = Q.q + '|' + o; if (seen.has(key)) continue; seen.add(key); options++;
    const r = reasonFor(Q, o, sk);
    if (/doesn’t fit what the question asks/.test(r)) { generic++; if (generic <= 400) probs.push(`GENERIC ${Q.skill} | ${Q.q.slice(0, 60)} | ${o}`); continue; }
    if (/ is too (big|small|high|low)\./.test(r)) { numeric++; continue; }
    const longest = Math.max(...r.split(/(?<=[.?!])\s+/).map((x) => wordsOf(x).length));
    if (longest > MAXW[band]) probs.push(`LONG L${band} ${Q.skill} | ${r}`);
    const hard = wordsOf(r).filter((x) => !/^[A-Z]/.test(x) && !x.includes('-') && syl(x) >= MAXS[band] && !explained(x) && !EVERYDAY.test(x));
    if (hard.length) probs.push(`HARD L${band} ${Q.skill} ${hard.join(',')} | ${r}`);
  }
}
console.log(probs.slice(0, process.env.ALL ? 9999 : 40).join('\n'));
console.log(`${options} wrong options checked · ${options - generic - numeric} with their own reason · ${numeric} worked out from the numbers · ${generic} general`);
const ok = !probs.length;
console.log(ok ? 'WHYWRONG PASSED' : 'WHYWRONG FAILED');
process.exit(ok ? 0 : 1);
