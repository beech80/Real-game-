// Content validation for the whole curriculum (node tests/curriculum.test.mjs).
// Runs every generator many times and checks: answers are valid and among the options, numbers are finite,
// explanations exist, sort/order items are well-formed, writing models pass their own rubric,
// budgets are solvable, every skill has practice, and prerequisites exist with no cycles.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {} };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { SKILLS } = await import('../src/edu.js');
const { GEN } = await import('../src/curriculum.js');
const { T, BY_SKILL } = await import('../src/careers.js');
const { PRACTICE } = await import('../src/activities.js');

const fails = []; let runs = 0;
const bad = (s) => /NaN|undefined|Infinity|\[object/.test(String(s));
function check(name, Q) {
  runs++;
  const f = (m) => fails.push(`${name}: ${m}`);
  if (!Q || !SKILLS[Q.skill]) return f(`unknown skill ${Q && Q.skill}`);
  const type = Q.type || 'choice';
  if (bad(Q.q) || !Q.q) f('bad question text: ' + Q.q);
  if (!['write', 'trace'].includes(type) && !Q.why && !name.startsWith('T.')) f('missing explanation (why)');
  if (Q.why && bad(Q.why)) f('bad explanation: ' + Q.why);
  if (type === 'choice') {
    const o = [...new Set(Q.o.map(String))];
    if (!o.includes(String(Q.a))) f('answer not in options');
    if (o.length < 2) f('fewer than 2 distinct options: ' + JSON.stringify(Q.o));
    if (o.some(bad)) f('bad option ' + JSON.stringify(Q.o));
  } else if (type === 'number') {
    if (!Number.isFinite(Q.a)) f('non-finite numeric answer');
    if (!Q.decimals && Math.abs(Q.a * 100 - Math.round(Q.a * 100)) > 1e-6) f('answer needs more than 2 decimals: ' + Q.a);
  } else if (type === 'order') {
    if (Q.items.length < 2 || new Set(Q.items).size !== Q.items.length) f('order items invalid');
  } else if (type === 'sort') {
    if (!Q.items.every((it) => Q.bins.includes(it[1]))) f('sort item with unknown bin');
  } else if (type === 'write') {
    const t = Q.model, words = t.split(/\s+/).length;
    if (words < Q.minWords) f('model answer shorter than minWords');
    for (const [label, test] of Q.rubric) if (!(typeof test === 'function' ? test(t) : test.test(t))) f('model fails rubric: ' + label);
  } else if (type === 'budget') {
    const min = Q.cats.reduce((a, c) => a + c.min, 0);
    if (min > Q.total || (Q.total - min) % 10) f('budget not solvable with $10 steps');
  } else if (type === 'trace') { if (!Q.word) f('trace without word'); }
  else f('unknown type ' + type);
}
for (const [sk, gens] of Object.entries(GEN)) gens.forEach((g, i) => { for (let k = 0; k < 300; k++) check(`GEN ${sk}#${i}`, g()); });
for (const [k, g] of Object.entries(T)) if (!k.includes('#')) for (let n = 0; n < 200; n++) check(`T.${k}`, g());
// coverage: every skill can be practised (curriculum, world tasks, learn app or cursive pad)
const cursivePad = ['curs.strokes', 'curs.signature', 'curs.reading'];
for (const id of Object.keys(SKILLS)) if (!GEN[id] && !BY_SKILL[id] && !PRACTICE[id] && !cursivePad.includes(id)) fails.push(`no practice for ${id}`);
// prerequisites exist, are at the same or a lower band, and contain no cycles
for (const s of Object.values(SKILLS)) for (const p of s.prereq) { if (!SKILLS[p]) fails.push(`${s.id}: missing prereq ${p}`); else if (SKILLS[p].band > s.band) fails.push(`${s.id}: prereq ${p} is a higher band`); }
const seen = {}; const visit = (id, stack) => { if (stack.includes(id)) return fails.push('prereq cycle: ' + [...stack, id].join(' → ')); if (seen[id]) return; seen[id] = 1; for (const p of (SKILLS[id] || { prereq: [] }).prereq) visit(p, [...stack, id]); };
Object.keys(SKILLS).forEach((id) => visit(id, []));
// every subject has all six bands
const subj = {}; for (const s of Object.values(SKILLS)) (subj[s.subj] = subj[s.subj] || new Set()).add(s.band);
for (const [k, b] of Object.entries(subj)) if (b.size !== 6) fails.push(`${k} covers bands ${[...b].sort().join(',')}`);

const uniq = [...new Set(fails)];
console.log(`${Object.keys(SKILLS).length} skills · ${Object.keys(GEN).length} curriculum skills with generators · ${Object.keys(T).length} task generators · ${runs} generated activities checked`);
if (uniq.length) { console.log('FAIL\n' + uniq.slice(0, 40).join('\n')); process.exit(1); }
console.log('CURRICULUM OK');
