// Gather every fixed English sentence the narrator may read: story/menu lines, skill lessons, every fixed question,
// and for the youngest learners (levels 1-2) the answer choices, worked explanations and why-not reasons.
// Output: sentences.json = [[key, spokenText], ...] (deduplicated), using the game's own speakable()/sentence split.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
import fs from 'fs';
const SP = new URL('./', import.meta.url).pathname;
const G = new URL('../../src/', import.meta.url).pathname;
const { speakable, speechSentences, voiceKey } = await import(G + 'readalong.js');
const { SKILLS } = await import(G + 'edu.js');
await import(G + 'careers.js');
const { PRACTICE } = await import(G + 'activities.js');
const WW = {}; for (const f of 'abcdefg') Object.assign(WW, JSON.parse(fs.readFileSync(G + 'ww/' + f + '.json')));
const texts = []; const mark = (n) => texts.push('@@' + n);
// story, menus, tips (English UI strings that read like sentences)
for (const t of JSON.parse(fs.readFileSync(SP + '/es_src.json'))) if (t.length >= 6 && /[a-z]/.test(t) && !/[{}<>=;]|^[a-z-]+ [a-z-]+$/.test(t)) texts.push(t);
mark('lessons');
// lessons
for (const s of Object.values(SKILLS)) texts.push(s.name, s.objective, s.explain, s.alt);
mark('questions');
// questions (sampled from every generator), plus choices / explanations / reasons for levels 1-2
for (const [id, g] of Object.entries(PRACTICE)) {
  const band = (SKILLS[id] || {}).band || 3, seen = new Set(), draws = [];
  for (let i = 0; i < 40; i++) { let Q; try { Q = g(); } catch (e) { continue; } if (Q) draws.push(Q); }
  const distinct = new Set(draws.map((Q) => Q.q)).size;
  for (const Q of draws) { if (seen.has(Q.q)) continue; seen.add(Q.q);
    if (distinct > 30 && draws.filter((x) => x.q === Q.q).length < 2) continue;   // a random-number template: skip one-off variants
    const b = Q.band || band;
    texts.push(b <= 2 ? '@@k2' : '@@older'); texts.push(Q.q); if (Q.say) texts.push(Q.say);
    if (b <= 2) { texts.push('@@k2'); for (const o of Q.o || []) texts.push(String(o)); if (Q.why) texts.push(Q.why); const w = Q.whyWrong || WW[Q.q] || {}; for (const r of Object.values(w)) texts.push(r); }
  }
}
const out = new Map(); let curCat = 'ui'; const by = {};
for (const t of texts) { if (!t) continue; if (String(t).startsWith('@@')) { curCat = t.slice(2); continue; } by[curCat] = (by[curCat] || 0) + 0; for (const s of speechSentences(speakable(t))) { const k = voiceKey(s); if (k && k.length >= 2 && !out.has(k)) { out.set(k, [s, curCat]); by[curCat] += s.length; } } }
console.log(by);
const ORDER = ['ui', 'lessons', 'k2', 'older', 'questions'];   // most useful first: the recorder works down this list
const arr = [...out.entries()].sort((a, b) => ORDER.indexOf(a[1][1]) - ORDER.indexOf(b[1][1])).map(([k, [s]]) => [k, s]);
fs.writeFileSync(SP + '/sentences.json', JSON.stringify(arr));
console.log(arr.length, 'sentences', arr.reduce((a, [, s]) => a + s.length, 0), 'chars');
