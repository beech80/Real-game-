// Spanish lines for Heart's Spanish voice: every translated game line, every skill lesson in Spanish, Heart's own
// Spanish reactions, and every Spanish word (for word-by-word reading). Output sentences_es.json / words_es.json.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
import fs from 'fs';
const G = new URL('../../src/', import.meta.url).pathname, OUT = new URL('./', import.meta.url).pathname;
const { speakable, speechSentences, voiceKey } = await import(G + 'readalong.js');
const texts = [];
for (const f of ['es_1', 'es_2', 'es_3', 'es_4']) texts.push(...Object.values(JSON.parse(fs.readFileSync(`${G}i18n/${f}.json`))));
for (const s of Object.values(JSON.parse(fs.readFileSync(`${G}i18n/es_skills.json`)))) texts.push(s.name, s.objective, s.explain, s.alt);
const heart = fs.readFileSync(G + 'heart.js', 'utf8').match(/const ES = \{[\s\S]*?\n\};/)[0];
for (const m of heart.matchAll(/'([^']+)'/g)) if (/\s|[¡¿]/.test(m[1])) texts.push(m[1]);
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ñ/g, 'n');
const out = new Map(), words = new Set();
for (const t of texts) { if (!t) continue; const sp = speakable(t, true); for (const s of speechSentences(sp)) { const k = 'es:' + voiceKey(fold(s)); if (k.length > 4 && !out.has(k)) out.set(k, s); }
  for (const w of sp.toLowerCase().match(/[a-záéíóúüñ]+/g) || []) words.add(w); }
for (const w of 'cero uno una dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte treinta cuarenta cincuenta sesenta setenta ochenta noventa cien ciento doscientos trescientos cuatrocientos quinientos seiscientos setecientos ochocientos novecientos mil millón millones punto menos más por entre igual dólar dólares centavos y'.split(' ')) words.add(w);
fs.writeFileSync(OUT + 'sentences_es.json', JSON.stringify([...out.entries()]));
fs.writeFileSync(OUT + 'words_es.json', JSON.stringify([...words].sort().map((w) => ['esw:' + fold(w), w])));
console.log(out.size, 'Spanish sentences,', words.size, 'words');
