// From what align.mjs heard:
//   public/voice/times.json   { <voiceId>: [start of each word of the sentence, in hundredths of a second] }  (+ "t": 1 in the manifest)
//   suspects.json             words Heart may be saying wrong: what was heard differs from the text most times the word comes up
// node alignreport.mjs          (GAME=<path to Game/> when run from a copy outside the repo;  NOWRITE=1 for the report only)
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
import fs from 'fs';
const DIR = new URL('./', import.meta.url).pathname, GAME = process.env.GAME || new URL('../../', import.meta.url).pathname;
const { voiceId } = await import(GAME + 'src/readalong.js');
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = (n) => (n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? ONES[n % 10] : '') : String(n));
const norm = (w) => { let s = w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''); if (/^\d+$/.test(s) && +s < 100) s = num(+s); return s.replace(/(.)\1/g, '$1'); };
const times = {}, bad = new Map(), seenWord = new Map(); let n = 0, exact = 0, tok = 0, matched = 0;
for (const f of fs.readdirSync(DIR + 'align')) {
  if (!f.endsWith('.json')) continue;
  const { k, t, d, w } = JSON.parse(fs.readFileSync(DIR + 'align/' + f));
  const T = [...t.matchAll(/\S+/g)].map((m) => m[0]), A = T.map(norm), B = w.map((x) => norm(x[0]));
  // align the heard words to the text words (edit distance), so every text word gets a time even where the hearing differs
  const R = A.length, C = B.length, D = [...Array(R + 1)].map(() => new Int32Array(C + 1));
  for (let i = 0; i <= R; i++) D[i][0] = i; for (let j = 0; j <= C; j++) D[0][j] = j;
  for (let i = 1; i <= R; i++) for (let j = 1; j <= C; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1));
  const at = Array(R).fill(null), heard = Array(R).fill(null), ok = Array(R).fill(false);
  for (let i = R, j = C; i > 0 || j > 0;) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1)) { at[i - 1] = w[j - 1][1]; heard[i - 1] = w[j - 1][0]; ok[i - 1] = A[i - 1] === B[j - 1]; i--; j--; }
    else if (j > 0 && D[i][j] === D[i][j - 1] + 1) j--; else i--;
  }
  // fill the gaps evenly between known neighbours, and keep the times moving forward
  for (let i = 0; i < R; i++) if (at[i] == null) { let a = i - 1, b = i + 1; while (b < R && at[b] == null) b++; const ta = a >= 0 ? at[a] : 0, tb = b < R ? at[b] : d * 0.9; at[i] = ta + (tb - ta) * (i - a) / (b - a); }
  for (let i = 1; i < R; i++) if (at[i] < at[i - 1]) at[i] = at[i - 1];
  n++; tok += R; matched += ok.filter(Boolean).length; if (ok.every(Boolean) && R === C) exact++;
  if (R && ok.filter(Boolean).length >= R * 0.5) times[voiceId(k)] = at.map((x) => Math.round(x * 100));   // when less than half was recognised the times are not to be trusted: the game spreads the words evenly instead
  T.forEach((x, i) => { const key = x.toLowerCase().replace(/^[^a-z0-9áéíóúñ]+|[^a-z0-9áéíóúñ]+$/gi, ''); if (!key || /^\d/.test(key)) return; seenWord.set(key, (seenWord.get(key) || 0) + 1); if (!ok[i]) { const b = bad.get(key) || { n: 0, heard: {}, eg: t }; b.n++; const h = heard[i] || '(nothing)'; b.heard[h] = (b.heard[h] || 0) + 1; bad.set(key, b); } });
}
const suspects = [...bad].map(([word, b]) => ({ word, wrong: b.n, of: seenWord.get(word), heard: Object.entries(b.heard).sort((x, y) => y[1] - x[1]).slice(0, 4).map((x) => x.join('×')).join(' '), eg: b.eg })).filter((s) => s.wrong / s.of >= 0.6).sort((x, y) => y.wrong - x.wrong);
fs.writeFileSync(DIR + 'suspects.json', JSON.stringify(suspects, null, 0).replace(/\},\{/g, '},\n{'));
console.log(`${n} sentences heard · ${(100 * exact / n).toFixed(1)}% heard exactly as written · ${(100 * matched / tok).toFixed(1)}% of words matched · ${Object.keys(times).length} with word times · ${suspects.length} suspect words`);
if (!process.env.NOWRITE) {
  const OUT = GAME + 'public/voice/'; fs.writeFileSync(OUT + 'times.json', JSON.stringify(times));
  const man = JSON.parse(fs.readFileSync(OUT + 'manifest.json')); man.t = 1; fs.writeFileSync(OUT + 'manifest.json', JSON.stringify(man));
  console.log('times.json', (fs.statSync(OUT + 'times.json').size / 1024).toFixed(0), 'KB');
}
