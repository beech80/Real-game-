// Every word the narrator might need, so any English line can be read in Heart's voice: all words in the game's
// sentences, question banks and story, plus number words. Output words.json = [[key, word], ...]
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
import fs from 'fs';
const SP = new URL('./', import.meta.url).pathname;
const G = new URL('../../src/', import.meta.url).pathname;
const { speakable, chunks, sounds, soundSay } = await import(G + 'readalong.js');
await import(G + 'careers.js');
const { PRACTICE } = await import(G + 'activities.js');
const set = new Set();
const add = (t) => { for (const w of String(speakable(t)).toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []) set.add(w); };
for (const [, s] of JSON.parse(fs.readFileSync(SP + '/sentences.json'))) add(s);
for (const t of JSON.parse(fs.readFileSync(SP + '/es_src.json'))) add(t);
for (const g of Object.values(PRACTICE)) for (let i = 0; i < 60; i++) { try { const Q = g(); add(Q.q); (Q.o || []).forEach(add); add(Q.why || ''); } catch (e) {} }
for (const w of 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million billion point minus plus times equals percent dollar dollars cent cents and half halves third thirds fourth fourths fifth fifths sixth sixths eighth eighths tenth tenths degrees what blank first second'.split(' ')) set.add(w);
// sounding out: each word's syllables (ap·ple) and single sounds (buh, sss) the word card says
const parts = new Set();
for (const w of [...set]) { try { const ch = chunks(w); if (ch.length > 1) ch.forEach((c) => parts.add(c.replace(/y$/, 'ee').toLowerCase())); else if (w.length <= 6) sounds(w).forEach((p) => parts.add(soundSay(p))); } catch (e) {} }
for (const p of parts) if (/^[a-z]+$/.test(p)) set.add(p);
const arr = [...set].sort().map((w) => ['w:' + w, w]);
fs.writeFileSync(SP + '/words.json', JSON.stringify(arr));
console.log(arr.length, 'words');
