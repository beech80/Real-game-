// Put Heart's own lines first in the recording list: her reactions, Ask Heart's knowledge-base answers, and
// "<word> means …" from the word helper.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
import fs from 'fs';
const DIR = new URL('./', import.meta.url).pathname, G = new URL('../../src/', import.meta.url).pathname;
const { speakable, speechSentences, voiceKey } = await import(G + 'readalong.js');
const { LINES } = await import(G + 'heart.js');
const { GLOSSARY } = await import(G + 'glossary.js');
const KB = JSON.parse(fs.readFileSync(G + 'heartkb.json'));
const texts = [...Object.values(LINES).flat(), 'Let us do one together.', 'Now you try one!', 'Another way to think about it:', ...KB.map((e) => e.a)];
for (const [, forms, meaning] of GLOSSARY) { const w = String(forms).replace(/\(.*?\)\??|\?|\[.*?\]|\\b/g, '').split('|')[0]; if (/^[a-z ]+$/i.test(w)) texts.push(`${w} means ${meaning}.`); }
const list = JSON.parse(fs.readFileSync(DIR + 'sentences.json')), have = new Set(list.map(([k]) => k)), front = [];
for (const t of texts) for (const s of speechSentences(speakable(t))) { const k = voiceKey(s); if (k && !have.has(k)) { have.add(k); front.push([k, s]); } }
fs.writeFileSync(DIR + 'sentences.json', JSON.stringify([...front, ...list]));
console.log(front.length, 'new lines added at the front; total', front.length + list.length);
