// Pre-K content check. Run: node tests/prek.mjs
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {}, addEventListener() {} }), querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }), body: { classList: { add() {}, remove() {} } } };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { PREK_SKILLS, PREK_GEN, PREK_DAY } = await import('../src/curriculum14.js');
const bad = new Set(); const fail = (m) => { if (!bad.has(m)) console.log('FAIL', m); bad.add(m); };
const caps = /\b[A-Z]{3,}\b/; const ids = new Set(PREK_SKILLS.map((s) => s[0]));
for (const s of PREK_SKILLS) { if (s.length !== 9 || s[2] !== 1 || !s[0].startsWith('prek.')) fail(`${s[0]}: bad skill row`); for (const t of [s[3], s[4], s[6], s[7]]) if (caps.test(t)) fail(`${s[0]}: caps`); }
const checkQ = (k, Q, tag) => {
  if (!ids.has(Q.skill) && !(tag && Q.skill === 'prek.colors')) fail(`${tag || k}: unknown skill ${Q.skill}`);
  if (!tag && Q.skill !== k) fail(`${k}: skill mismatch ${Q.skill}`);
  if (!Q.q || !Q.why) fail(`${tag || k}: missing q/why`);
  for (const t of [Q.q, Q.why]) if (caps.test(t)) fail(`${tag || k}: all-caps in “${t}”`);
  if (Q.type === 'choice') {
    if (!Q.o.includes(Q.a)) fail(`${k}: answer not in options “${Q.q}”`);
    if (new Set(Q.o).size !== Q.o.length) fail(`${k}: repeated option “${Q.q}” ${Q.o}`);
    if (Q.o.length < 2 || Q.o.length > 3) fail(`${k}: ${Q.o.length} options`);
    const wrong = Q.o.filter((x) => x !== Q.a), ww = Q.whyWrong || {};
    if (Object.keys(ww).length !== wrong.length || !wrong.every((w) => ww[w])) fail(`${k}: whyWrong mismatch “${Q.q}”`);
    if (Q.dok !== 1) fail(`${k}: dok`);
  } else if (Q.type === 'trace') { if (!Q.word || !/^[A-Z]$/.test(Q.word)) fail(`${k}: trace word ${Q.word}`); }
  else if (Q.type === 'order') { if (!(Q.items?.length >= 3) || new Set(Q.items).size !== Q.items.length) fail(`${k}: order items`); }
  else if (Q.type === 'sort') { if (!Q.bins || !Q.items?.every(([, b]) => Q.bins.includes(b))) fail(`${k}: sort bins`); }
  else fail(`${k}: unknown type ${Q.type}`);
};
let gens = 0, qs = 0;
for (const id of ids) if (!(PREK_GEN[id]?.length >= 6)) fail(`${id}: fewer than 6 generators`);
for (const [k, list] of Object.entries(PREK_GEN)) { if (!ids.has(k)) fail(`${k}: not in PREK_SKILLS`); for (const g of list) { gens++; for (let i = 0; i < 30; i++) { qs++; checkQ(k, g()); } } }
for (const P of PREK_DAY) {
  if (!P.id || !P.icon || !P.title || !P.teacher || !Array.isArray(P.skills)) fail(`day ${P.id}: fields`);
  if (caps.test(P.teacher) || caps.test(P.title)) fail(`day ${P.id}: caps`);
  for (const s of P.skills) if (!ids.has(s)) fail(`day ${P.id}: skill ${s}`);
  if (P.kind === 'story' && !(P.story?.length >= 4 && P.story.length <= 6 && P.questions?.length === 2)) fail('story period');
  for (const Q of P.questions || []) checkQ(Q.skill, Q, `day ${P.id}`);
}
console.log(`${ids.size} skills · ${gens} generators · ${qs} questions · ${PREK_DAY.length} periods`);
console.log(bad.size ? 'PREK FAILED' : 'PREK OK'); process.exit(bad.size ? 1 : 0);
