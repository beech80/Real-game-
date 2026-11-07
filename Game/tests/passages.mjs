// Reading passages: each reads at its stage (Flesch–Kincaid grade within range), sentences fit the band's limits,
// every question has a unique key, 2–3 distinct wrong choices, an explanation, and a skill that exists.
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { PASSAGES } = await import('../src/curriculum8.js');
const { SKILLS } = await import('../src/edu.js');
const { grade, syl } = await import('../src/readlevel.js');
const { explained } = await import('../src/glossary.js');
const GRADE = { 1: [0, 2.5], 2: [1, 4.5], 3: [3, 7], 4: [5, 9.5], 5: [6.5, 12], 6: [8, 16] };
const SENT = { 1: 10, 2: 20, 3: 28, 4: 34, 5: 42, 6: 48 }, SYLMAX = { 1: 3, 2: 4, 3: 5, 4: 5, 5: 9, 6: 9 };
const bad = []; let qn = 0;
for (const P of PASSAGES) {
  const text = P.text.join(' ').replace(/ \/ /g, ' ');
  const g = grade(text), [lo, hi] = GRADE[P.band];
  if (P.kind !== 'poem' && (g < lo || g > hi)) bad.push(`${P.id} (band ${P.band}) reads at grade ${g.toFixed(1)}, expected ${lo}–${hi}`);
  const longest = Math.max(...text.split(/(?<=[.?!”])\s+/).map((x) => x.split(/\s+/).length));
  if (longest > SENT[P.band]) bad.push(`${P.id}: a ${longest}-word sentence (band ${P.band} limit ${SENT[P.band]})`);
  const hard = text.split(/\s+/).map((w) => w.replace(/[^A-Za-z’'-]/g, '')).filter((w) => w && !/^[A-Z]/.test(w) && !w.includes('-') && syl(w) >= SYLMAX[P.band] && !explained(w));
  if (P.band <= 2 && hard.length) bad.push(`${P.id}: hard words for band ${P.band}: ${[...new Set(hard)].join(', ')}`);
  if (P.qs.length < 3) bad.push(`${P.id}: only ${P.qs.length} questions`);
  console.log(`${P.id.padEnd(14)} band ${P.band} · grade ${g.toFixed(1).padStart(4)} · ${text.split(/\s+/).length} words · ${P.qs.length} questions`);
  for (const Q of P.qs) {
    qn++;
    if (!SKILLS[Q.skill]) bad.push(`${P.id}: unknown skill ${Q.skill}`);
    if (!Q.why || Q.why.length < 15) bad.push(`${P.id}: no explanation for “${Q.q}”`);
    const all = [Q.a, ...Q.o];
    if (new Set(all).size !== all.length) bad.push(`${P.id}: duplicate options in “${Q.q}”`);
    if (Q.o.length < 2) bad.push(`${P.id}: too few wrong choices in “${Q.q}”`);
    for (const k of Object.keys(Q.ww || {})) if (!Q.o.includes(k)) bad.push(`${P.id}: whyWrong for an option that isn’t there: ${k}`);
  }
}
const bands = new Set(PASSAGES.map((P) => P.band));
for (let b = 1; b <= 6; b++) if (PASSAGES.filter((P) => P.band === b).length < 2) bad.push(`band ${b} has fewer than 2 passages`);
for (const b of bad) console.log('PROBLEM', b);
console.log(`${PASSAGES.length} passages · ${qn} questions · bands ${[...bands].sort().join(',')}`);
console.log(bad.length ? 'PASSAGES FAILED' : 'PASSAGES PASSED');
process.exit(bad.length ? 1 : 0);
