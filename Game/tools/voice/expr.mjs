// Lines Heart should say with more feeling: cheers a little brighter and quicker, comfort and hints a little slower and softer.
// Writes expr_up.json and expr_soft.json ([[key, text], ...]); record them with
//   FORCE=1 SPEED=1.02 LISTS=expr_up.json node gen2.mjs      and      FORCE=1 SPEED=0.88 LISTS=expr_soft.json node gen2.mjs
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
import fs from 'fs';
const DIR = new URL('./', import.meta.url).pathname, GAME = process.env.GAME || new URL('../../', import.meta.url).pathname;
const { speakable, speechSentences, voiceKey } = await import(GAME + 'src/readalong.js');
const { LINES } = await import(GAME + 'src/heart.js');
const up = new Map(), soft = new Map();
const add = (map, t) => { for (const s of speechSentences(speakable(t))) map.set(voiceKey(s), s); };
for (const k of ['right', 'rightLate', 'streak', 'showDone', 'welcome']) for (const t of [].concat(LINES[k] || [])) add(up, t);
for (const k of ['miss', 'hint', 'show']) for (const t of [].concat(LINES[k] || [])) add(soft, t);
const SOFT = /^(not quite|almost there|so close|oops|try again|that is okay|it is okay|no worries|do not worry|don.t worry|let us look again|let.s try|take your time|good try|nice try|you can do it|keep trying)\b/i;
const seen = new Set();
for (const f of 'sentences.json few_en.json new_en.json r2_en.json r3_en.json'.split(' ')) if (fs.existsSync(DIR + f)) for (const [k, t] of JSON.parse(fs.readFileSync(DIR + f))) {
  if (/^(esw?|w):/.test(k) || seen.has(k)) continue; seen.add(k);
  if (SOFT.test(t)) soft.set(k, t); else if (/!\s*$/.test(t) && t.split(/\s+/).length <= 9) up.set(k, t);
}
for (const k of soft.keys()) up.delete(k);
fs.writeFileSync(DIR + 'expr_up.json', JSON.stringify([...up])); fs.writeFileSync(DIR + 'expr_soft.json', JSON.stringify([...soft]));
console.log(up.size, 'cheers ·', soft.size, 'soft lines');
