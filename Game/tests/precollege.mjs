// Pre-college pack check: every generator, 40 times. Run: node tests/precollege.mjs
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {}, addEventListener() {} }), querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }), body: { classList: { add() {}, remove() {} } } };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { PRECOL_SKILLS, PRECOL_GEN, PRECOL_DAY } = await import('../src/curriculum15.js');
const { SUBJECTS } = await import('../src/edu.js');
const bad = new Set(); const fail = (m) => bad.add(m);
const ALLOW = new Set(['SAT', 'ACT', 'FAFSA', 'GPA', 'APR', 'PLUS', 'REAL', 'OK']);
const capsCheck = (where, t) => { for (const w of String(t).match(/\b[A-Z]{3,}\b/g) || []) if (!ALLOW.has(w)) fail(`${where}: all-caps “${w}”`); if (/'/.test(String(t))) fail(`${where}: straight apostrophe in “${t}”`); };
const ids = new Set(PRECOL_SKILLS.map((s) => s[0]));
for (const s of PRECOL_SKILLS) { if (s.length !== 8 || s[2] !== 6 || !SUBJECTS[s[1]] || !Array.isArray(s[5])) fail(`${s[0]}: bad skill row`); s.forEach((x, i) => typeof x === 'string' && i > 2 && capsCheck(s[0], x)); }
const MATH = ['col.algebra', 'col.data', 'col.geometry', 'col.functions'];
const counts = {}; let n = 0;
for (const id of ids) { if (!(PRECOL_GEN[id] || []).length) fail(`${id}: no generators`); if ((PRECOL_GEN[id] || []).length < 8) fail(`${id}: fewer than 8 generators`); }
for (const [id, gens] of Object.entries(PRECOL_GEN)) {
  if (!ids.has(id)) fail(`${id}: not in PRECOL_SKILLS`); counts[id] = gens.length;
  gens.forEach((g, gi) => { for (let k = 0; k < 40; k++) { n++; const Q = g(), W = `${id}#${gi}`;
    if (Q.skill !== id) fail(`${W}: skill mismatch ${Q.skill}`); if (![2, 3].includes(Q.dok)) fail(`${W}: dok ${Q.dok}`); if (!Q.why) fail(`${W}: no why`);
    [Q.q, Q.why, ...(Q.o || []), ...Object.values(Q.whyWrong || {}), ...((Q.v && Q.v.lines) || [])].forEach((t) => capsCheck(W, t));
    if (Q.type === 'choice') { if (Q.o.length !== 4) fail(`${W}: ${Q.o.length} options`); if (new Set(Q.o).size !== Q.o.length) fail(`${W}: repeated option ${Q.o}`); if (!Q.o.includes(Q.a)) fail(`${W}: answer not in options`);
      const wrong = Q.o.filter((o) => o !== Q.a); if (!Q.whyWrong || Object.keys(Q.whyWrong).length !== wrong.length || wrong.some((w) => !Q.whyWrong[w])) fail(`${W}: whyWrong mismatch`);
      if (Q.passage) { const words = Q.v.lines.join(' ').split(/\s+/).length; if (words < 80 || words > 140) fail(`${W}: passage ${words} words`); } }
    else if (Q.type === 'number') { if (typeof Q.a !== 'number' || !Number.isFinite(Q.a)) fail(`${W}: bad number ${Q.a}`); if (!Number.isInteger(Q.a)) fail(`${W}: non-integer ${Q.a}`); }
    else if (Q.type === 'write') { const t = Q.model; if (t.split(/\s+/).length < Q.minWords) fail(`${W}: model short`); if (!/^[A-Z“"]/.test(t) || !/[.!?]["”]?$/.test(t)) fail(`${W}: model caps/punct`);
      for (const [label, test] of Q.rubric) if (!(typeof test === 'function' ? test(t) : test.test(t))) fail(`${W}: model fails ${label}`); }
    else fail(`${W}: unknown type ${Q.type}`);
  } });
}
for (const id of MATH) if (!PRECOL_GEN[id].some((g) => g().type === 'number')) fail(`${id}: no number items`);
if (!PRECOL_GEN['col.essay'].some((g) => g().type === 'write')) fail('col.essay: no write item');
for (const P of PRECOL_DAY) { for (const s of P.skills) if (!ids.has(s)) fail(`${P.id}: unknown skill ${s}`); capsCheck(P.id, P.teacher); capsCheck(P.id, P.title); if (P.kind !== 'lesson') fail(`${P.id}: kind`); }
console.log(`${ids.size} skills · ${n} items checked · ${PRECOL_DAY.length} periods · ${JSON.stringify(counts)}`);
for (const m of bad) console.log('FAIL', m);
console.log(bad.size ? 'PRECOLLEGE FAILED' : 'PRECOLLEGE OK');
process.exit(bad.size ? 1 : 0);
