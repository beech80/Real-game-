// REAL — reading help for every player, including kids who can't read yet.
//  * 🔊 on dialogs, the goal bar, every sheet and phone messages reads the text out loud with a calm narrator voice,
//    highlighting each word as it is spoken (follow along = learn to read).
//  * "Read to me" mode reads new text automatically.
//  * Tap any word in readable text: a word card shows it big, says it, and "Sound it out" says it part by part
//    (ba · na · na) with the part lit up, then the whole word. If the word is in the glossary, its meaning is read too.
//    Every tapped word is saved to My Words, which has its own listening practice.
// Characters still never talk: this is the narrator reading what's on screen, only when the player asks for it.
import { h } from './ui.js';
import { lookup, splitWords } from './glossary.js';

let getState = () => null;
export function initReadAlong(stateFn) { getState = stateFn; installTaps(); }
const settings = () => { const s = getState(); return (s && s.settings) || {}; };
export const readToMe = () => !!settings().readAloud || (() => { try { return localStorage.getItem('real.readToMe') === '1'; } catch (e) { return false; } })();
export function setReadToMe(on) { try { localStorage.setItem('real.readToMe', on ? '1' : '0'); } catch (e) {} const s = getState(); if (s) { s.settings = s.settings || {}; s.settings.readAloud = !!on; } }

// ------------------------------------------------------------------------------------------- narrator voice
import { lang, isSpanish } from './i18n.js';
// The best voice the device has: natural/neural/enhanced voices first, novelty and robotic voices never.
// A player (or grown-up) can pick another in Settings › Reading voice, and choose slower / normal / faster.
const GOOD = /Natural|Neural|Online|Enhanced|Premium|Siri|Google US English|Google español|Samantha|Ava|Allison|Susan|Zoe|Nicky|Aria|Jenny|Guy|Libby|Sonia|Michelle|Paulina|Mónica|Monica|Dalia|Jorge|Elvira|Sabina|Juan/i;
const BAD = /eSpeak|Compact|Fred|Albert|Bad News|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Trinoids|Whisper|Zarvox|Superstar|Wobble|Junior|Ralph|Kathy|Grandpa|Grandma|Rocko|Shelley|Reed|Sandy|Flo|Eddy|Hysterical|Deranged/i;
const score = (v, want) => (new RegExp('^' + want, 'i').test(v.lang) ? 100 : 0) + (GOOD.test(v.name) ? 40 : 0) + (/Natural|Neural|Enhanced|Premium|Online/i.test(v.name) ? 25 : 0)
  + (want === 'en' && /en[-_]US/i.test(v.lang) ? 8 : 0) + (want === 'es' && /es[-_](US|MX|419)/i.test(v.lang) ? 8 : 0) + (v.localService ? 3 : 0) - (BAD.test(v.name) ? 200 : 0);
let voice = null, esVoice = null, allVoices = [];
const pref = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
const pickVoice = () => {
  try {
    allVoices = speechSynthesis.getVoices();
    const best = (want) => allVoices.filter((v) => new RegExp('^' + want, 'i').test(v.lang) && !BAD.test(v.name)).sort((a, b) => score(b, want) - score(a, want));
    const en = best('en'), es = best('es'), mine = '', mineEs = '';   // backup voices: always the device's best
    voice = en.find((v) => v.name === mine) || en[0] || null;
    esVoice = es.find((v) => v.name === mineEs) || es[0] || null;
  } catch (e) {}
};
try { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) {}
/** the device's English (or Spanish) voices, best first, for the Settings picker */
export function voiceChoices(want = 'en') { pickVoice(); return allVoices.filter((v) => new RegExp('^' + want, 'i').test(v.lang) && !BAD.test(v.name)).sort((a, b) => score(b, want) - score(a, want)).slice(0, 8); }
export function currentVoice(want = 'en') { pickVoice(); return want === 'es' ? esVoice : voice; }
export function setVoice(name, want = 'en') { try { localStorage.setItem(want === 'es' ? 'real.voiceEs' : 'real.voice', name); } catch (e) {} pickVoice(); }
const voiceVol = () => { try { const v = JSON.parse(localStorage.getItem('real.vol') || '{}').voice; return v == null ? 1 : Math.max(0, Math.min(1, v)); } catch (e) { return 1; } };
export const SPEEDS = [['slow', 'Slower', 0.78], ['normal', 'Normal', 0.92], ['fast', 'Faster', 1.08]];
export const speedName = () => pref('real.voiceSpeed', 'normal');
export function setSpeed(k) { try { localStorage.setItem('real.voiceSpeed', k); } catch (e) {} }
const speedMul = () => (SPEEDS.find((s) => s[0] === speedName()) || SPEEDS[1])[2] / 0.92;

// ------------------------------------------------------------------------------------------- say it like a person
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const DEN = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['fourth', 'fourths'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'], 8: ['eighth', 'eighths'], 10: ['tenth', 'tenths'], 12: ['twelfth', 'twelfths'], 16: ['sixteenth', 'sixteenths'] };
const frac = (n, d) => { n = +n; d = +d; const w = DEN[d]; if (!w || n > 12) return `${n} over ${d}`; return `${ONES[n]} ${n === 1 ? w[0] : w[1]}`; };
const DEN_ES = { 2: ['medio', 'medios'], 3: ['tercio', 'tercios'], 4: ['cuarto', 'cuartos'], 5: ['quinto', 'quintos'], 6: ['sexto', 'sextos'], 8: ['octavo', 'octavos'], 10: ['décimo', 'décimos'] };
/** Turn screen text into words a voice reads naturally: money, math signs, fractions, degrees, syllable dots, emoji. */
export function speakable(t, es = false) {
  let s = String(t || '');
  s = s.replace(/(\p{L})·(?=\p{L})/gu, '$1');                                   // ap·ple → apple
  s = s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}★☆♛✓✕›‹•○◦▸▶]/gu, ' ');
  s = s.replace(/−/g, '-').replace(/–|—/g, ', ');
  if (es) {
    s = s.replace(/-?\$(\d[\d,]*)\.(\d\d)\b/g, (m, d, c) => `${m.startsWith('-') ? 'menos ' : ''}${d} dólares con ${+c} centavos`).replace(/-?\$(\d[\d,]*)\b/g, (m, d) => `${m.startsWith('-') ? 'menos ' : ''}${d} ${d === '1' ? 'dólar' : 'dólares'}`).replace(/(\d+)¢/g, '$1 centavos');
    s = s.replace(/\b(\d+)\s+(\d+)\/(\d+)\b/g, (m, w, n, d) => `${w} y ${n} ${(DEN_ES[d] || [`sobre ${d}`, `sobre ${d}`])[+n === 1 ? 0 : 1]}`).replace(/\b(\d+)\/(\d+)\b/g, (m, n, d) => DEN_ES[d] ? `${n} ${DEN_ES[d][+n === 1 ? 0 : 1]}` : m);
    s = s.replace(/\s×\s|\s[x*]\s(?=\d)/g, ' por ').replace(/÷/g, ' entre ').replace(/\s\+\s/g, ' más ').replace(/\s=\s/g, ' es igual a ').replace(/(\d)\s?%/g, '$1 por ciento').replace(/°\s?F\b/g, ' grados').replace(/°/g, ' grados').replace(/\s-\s?(?=\d)/g, ' menos ').replace(/(^|\s)-(?=\d)/g, '$1menos ').replace(/→/g, ', luego ').replace(/&/g, ' y ');
  } else {
    s = s.replace(/-?\$(\d[\d,]*)\.(\d\d)\b/g, (m, d, c) => `${m.startsWith('-') ? 'minus ' : ''}${d} dollar${d === '1' ? '' : 's'}${+c ? ` and ${+c} cent${+c === 1 ? '' : 's'}` : ''}`).replace(/-?\$(\d[\d,]*)\b/g, (m, d) => `${m.startsWith('-') ? 'minus ' : ''}${d} dollar${d === '1' ? '' : 's'}`).replace(/(\d+)¢/g, '$1 cents');
    s = s.replace(/\b(\d+)\s+(\d+)\/(\d+)\b/g, (m, w, n, d) => `${w} and ${frac(n, d)}`).replace(/(^|[^\d/:])(\d{1,2})\/(\d{1,2})(?![\d/])/g, (m, pre, n, d) => DEN[d] ? pre + frac(n, d) : m);   // 3/15 is a date: leave it
    s = s.replace(/\s×\s|\s[x*]\s(?=\d)/g, ' times ').replace(/÷/g, ' divided by ').replace(/\s\+\s/g, ' plus ').replace(/\s=\s\?/g, ' equals what').replace(/\s=\s/g, ' equals ').replace(/(\d)\s?%/g, '$1 percent').replace(/°\s?F\b/g, ' degrees').replace(/°\s?C\b/g, ' degrees Celsius').replace(/°/g, ' degrees')
      .replace(/\s-\s?(?=\d)/g, ' minus ').replace(/(^|\s)-(?=\d)/g, '$1minus ').replace(/→/g, ', then ').replace(/&/g, ' and ').replace(/\be\.g\./gi, 'for example').replace(/\bi\.e\./gi, 'that is').replace(/\bvs\.?\b/gi, 'versus').replace(/#(\d)/g, 'number $1')
      .replace(/(\d|half|halves|thirds?|fourths?|eighths?|tenths?)\s?(ft)\b/g, '$1 feet').replace(/\b1 feet\b/g, '1 foot').replace(/(\d|half|halves|thirds?|fourths?|eighths?|tenths?)\s?(lb|lbs)\b/g, '$1 pounds').replace(/(\d|half|halves|thirds?|fourths?|eighths?|tenths?)\s?(oz)\b/g, '$1 ounces').replace(/(\d|half|halves|thirds?|fourths?|eighths?|tenths?)\s?(mL|ml)\b/g, '$1 milliliters').replace(/(\d|half|halves|thirds?|fourths?|eighths?|tenths?)\s?(km)\b/g, '$1 kilometers').replace(/(\d|half|halves|thirds?|fourths?|eighths?|tenths?)\s?(mph)\b/g, '$1 miles per hour');
  }
  s = s.replace(/___+/g, ' blank ').replace(/…/g, '... ').replace(/\s*\n+\s*/g, '. ').replace(/["“”]/g, '').replace(/\s+/g, ' ').trim();
  return s;
}
/** one sentence per recorded clip, and the key it's stored under (shared by the recorder and the game) */
export const speechSentences = (s) => String(s).split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => /[a-z0-9]/i.test(x));
export const voiceKey = (s) => String(s).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
/** short id for a sentence key (cyrb53): the recorder names clips with it, the game looks them up with it */
export function voiceId(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// ------------------------------------------------------------------------------------------- the recorded narrator
// A natural voice (Kokoro, open source) recorded for every fixed English sentence in the game, in small packs that
// download only when needed. If any sentence of a text has no recording (random numbers, a player's own writing),
// the whole text uses the device voice instead, so one passage never switches voices halfway.
let NAT = null, natLoading = null; const PACKS = new Map();
export const naturalOn = () => true;   // Heart is the game's one voice
export function loadNatural() {
  if (NAT || natLoading || window.__REAL_OFFLINE) return natLoading;
  natLoading = fetch('voice/manifest.json').then((r) => (r.ok ? r : savedFile('voice/manifest.json'))).catch(() => savedFile('voice/manifest.json')).then((r) => (r && r.ok ? r.json() : null)).then((m) => { NAT = m && m.c ? m : null; return NAT; }).catch(() => null);
  return natLoading;
}
export const naturalReady = () => !!NAT;
// Heart's voice saved on this device (Settings › Reading voice › Save): the packs live in Cache Storage and are
// read from there first, so she keeps reading with no internet.
const VC = 'real-voice'; let SAVED = null;
const savedPacks = () => SAVED || (SAVED = (async () => { try { const ks = await (await caches.open(VC)).keys(); return new Set(ks.map((r) => +((/p(\d+)\.mp3/.exec(r.url) || [])[1])).filter((n) => n >= 0)); } catch (e) { return new Set(); } })());
async function savedFile(url) { try { return (await (await caches.open(VC)).match(url)) || null; } catch (e) { return null; } }
/** how much of Heart's voice is on this device: { have, total } packs */
export async function voiceSaved() {
  const m = await loadNatural(); const total = m ? 1 + Math.max(...Object.values(m.c).map((v) => v[0])) : 0;
  return { have: Math.min(total, (await savedPacks()).size), total };
}
/** download every voice pack into this device's storage; onProgress(done, total) */
export async function saveVoice(onProgress) {
  const m = await loadNatural(); if (!m) throw new Error('no voice list');
  const total = 1 + Math.max(...Object.values(m.c).map((v) => v[0])), c = await caches.open(VC);
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
  const mr = await fetch('voice/manifest.json'); if (mr.ok) await c.put('voice/manifest.json', mr);
  for (let i = 0; i < total; i++) {
    const url = `voice/p${i}.mp3`;
    if (!(await c.match(url))) { const r = await fetch(url); if (!r.ok) throw new Error('pack ' + i); await c.put(url, r); }
    if (onProgress) onProgress(i + 1, total);
  }
  SAVED = null; return total;
}
export async function forgetVoice() { try { await caches.delete(VC); } catch (e) {} SAVED = null; }
const CLIPS = new Map(); let noRanges = false;
function clip([p, off, len]) {
  const key = `${p}:${off}`;
  if (CLIPS.has(key)) return CLIPS.get(key);
  const whole = () => pack(p).then((buf) => buf.slice(off, off + len));
  const pr = savedPacks().then((saved) => (noRanges || PACKS.has(p) || saved.has(p) ? whole() : fetch(`voice/p${p}.mp3`, { headers: { Range: `bytes=${off}-${off + len - 1}` } }).then((r) => {
    if (r.status === 206) return r.arrayBuffer();
    noRanges = true;                                   // this server sends whole files: keep the pack we just got
    if (r.ok) { const ab = r.arrayBuffer(); PACKS.set(p, ab); return ab.then((buf) => buf.slice(off, off + len)); }
    return whole();
  }))).catch((e) => { CLIPS.delete(key); throw e; });
  CLIPS.set(key, pr); if (CLIPS.size > 600) CLIPS.delete(CLIPS.keys().next().value);
  return pr;
}
const pack = (n) => { if (!PACKS.has(n)) PACKS.set(n, savedFile(`voice/p${n}.mp3`).then((s) => s || fetch(`voice/p${n}.mp3`)).then((r) => { if (!r.ok) throw new Error('pack'); return r.arrayBuffer(); }).catch((e) => { PACKS.delete(n); throw e; })); return PACKS.get(n); };
let natAudio = null, natTimers = [];
function stopNatural() { natTimers.forEach(clearTimeout); natTimers = []; if (natAudio) { try { natAudio.pause(); } catch (e) {} natAudio = null; } }
// ---- Heart, word by word: for English lines with no whole-sentence recording (random numbers, a player's writing)
const ONEW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENW = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function numWords(n) {
  if (n < 20) return [ONEW[n]];
  if (n < 100) return [TENW[Math.floor(n / 10)], ...(n % 10 ? [ONEW[n % 10]] : [])];
  if (n < 1000) return [ONEW[Math.floor(n / 100)], 'hundred', ...(n % 100 ? numWords(n % 100) : [])];
  if (n < 1e6) return [...numWords(Math.floor(n / 1000)), 'thousand', ...(n % 1000 ? numWords(n % 1000) : [])];
  return [...numWords(Math.floor(n / 1e6)), 'million', ...(n % 1e6 ? numWords(n % 1e6) : [])];
}
const fold = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n');
const sentKey = (s, es) => (es ? 'es:' + voiceKey(fold(s)) : voiceKey(s));
const UNO = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DEC = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CEN = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
function numWordsEs(n) {
  if (n < 20) return [UNO[n]];
  if (n < 100) return [DEC[Math.floor(n / 10)], ...(n % 10 ? ['y', UNO[n % 10]] : [])];
  if (n === 100) return ['cien'];
  if (n < 1000) return [CEN[Math.floor(n / 100)], ...(n % 100 ? numWordsEs(n % 100) : [])];
  if (n < 1e6) return [...(n < 2000 ? [] : numWordsEs(Math.floor(n / 1000))), 'mil', ...(n % 1000 ? numWordsEs(n % 1000) : [])];
  return [...numWordsEs(Math.floor(n / 1e6)), n < 2e6 ? 'millón' : 'millones', ...(n % 1e6 ? numWordsEs(n % 1e6) : [])];
}
/** the words Heart says for a line, each with where it sits in the text (for highlighting) and the pause after it */
function heartWords(spoken, es = false) {
  const out = [];
  for (const m of String(spoken).matchAll(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:['’][A-Za-z]+)?|\d[\d,]*(?:\.\d+)?|[.!?;:]|,/g)) {
    const t = m[0];
    if (/^[.!?;:]$/.test(t)) { if (out.length) out[out.length - 1].pause = 380; continue; }
    if (t === ',') { if (out.length) out[out.length - 1].pause = 190; continue; }
    if (/^\d/.test(t)) { const [int, dec] = t.replace(/,/g, '').split('.'); const ws = es ? [...numWordsEs(Math.min(+int, 999999999)), ...(dec ? ['punto', ...dec.split('').map((d) => UNO[+d])] : [])] : [...numWords(Math.min(+int, 999999999)), ...(dec ? ['point', ...dec.split('').map((d) => ONEW[+d])] : [])]; ws.forEach((w) => out.push({ w, at: m.index, pause: 40 })); continue; }
    out.push({ w: t.toLowerCase().replace(/’/g, "'"), at: m.index, pause: 40 });
  }
  return out;
}
function playWords(spoken, { onWord, onEnd, rate, es = false }) {
  if (!NAT) return false;
  const items = heartWords(spoken, es).map((x) => ({ ...x, clip: NAT.c[voiceId(es ? 'esw:' + fold(x.w) : 'w:' + x.w)] })).filter((x) => x.clip);
  if (!items.length) return false;
  let fin = false; const done = () => { if (fin) return; fin = true; stopNatural(); if (onEnd) onEnd(); };
  current = { done };
  const speed = Math.max(0.55, Math.min(1.35, (rate || 0.92) / 0.92 * speedMul()));
  Promise.all(items.map((x) => clip(x.clip))).then(() => {
    const step = async (i) => {
      if (fin) return; if (i >= items.length) return done();
      const { at, pause } = items[i]; const bytes = await clip(items[i].clip); if (fin) return;
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
      const a = new Audio(url); natAudio = a; a.playbackRate = speed; a.preservesPitch = true; a.volume = voiceVol();
      const next = () => { URL.revokeObjectURL(url); natTimers.push(setTimeout(() => step(i + 1), pause / speed)); };
      a.onended = next; a.onerror = next;
      if (onWord && (i === 0 || items[i - 1].at !== at)) onWord(at);
      a.play().catch(() => done());
    };
    step(0);
  }).catch(() => done());
  return true;
}
/** play recorded clips for every sentence; resolves false if any is missing (caller falls back to Heart word by word) */
function playNatural(spoken, { onWord, onEnd, rate, fallback, es = false }) {
  if (!NAT) return false;
  const sents = speechSentences(spoken), clips = sents.map((s) => NAT.c[voiceId(sentKey(s, es))]);
  if (!sents.length || clips.some((c) => !c)) return false;
  let fin = false; const done = () => { if (fin) return; fin = true; stopNatural(); if (onEnd) onEnd(); };
  current = { done };
  const speed = Math.max(0.75, Math.min(1.35, (rate || 0.92) / 0.92 * speedMul()));
  let cursor = 0; const offs = sents.map((s) => { const i = spoken.indexOf(s, cursor); const o = i < 0 ? cursor : i; cursor = o + s.length; return o; });
  const playAt = async (i) => {
    if (fin) return; if (i >= clips.length) return done();
    const [p, off, len, ms] = clips[i];
    let bytes; try { bytes = await clip(clips[i]); } catch (e) { return done(); }
    if (fin) return;
    if (i + 1 < clips.length) clip(clips[i + 1]).catch(() => {});   // fetch the next sentence while this one plays
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
    const a = new Audio(url); natAudio = a; a.playbackRate = speed; a.preservesPitch = true; a.volume = voiceVol();
    a.onended = () => { URL.revokeObjectURL(url); playAt(i + 1); }; a.onerror = () => { URL.revokeObjectURL(url); playAt(i + 1); };
    if (onWord) {   // light each word in turn, spread over the clip by length
      const words = [...sents[i].matchAll(/\S+/g)], total = sents[i].length || 1, dur = (ms || 1500) / speed;
      words.forEach((w) => natTimers.push(setTimeout(() => { if (!fin) onWord(offs[i] + w.index); }, dur * w.index / total)));
    }
    a.play().catch(() => { if (i === 0 && fallback && !fin) { fin = true; stopNatural(); fallback(); } else done(); });   // audio blocked (no tap yet): use the device voice
  };
  playAt(0);
  return true;
}
// sentence-sized pieces: natural pauses, and no long-utterance cut-off on some browsers
function speechPieces(s) {
  const out = []; const parts = s.split(/(?<=[.!?:;])\s+/);
  let cur = '';
  for (const p of parts) {
    if ((cur + ' ' + p).length > 220 && cur) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p;
    while (cur.length > 260) { const cut = cur.lastIndexOf(', ', 240) > 60 ? cur.lastIndexOf(', ', 240) + 1 : cur.lastIndexOf(' ', 240); out.push(cur.slice(0, cut)); cur = cur.slice(cut).trim(); }
  }
  if (cur) out.push(cur);
  return out;
}
const clean = (t) => speakable(t);
export const canSpeak = () => ('speechSynthesis' in window || naturalReady()) && !window.__voiceOff;
let current = null, keep = null;
export function stopReading() { try { speechSynthesis.cancel(); } catch (e) {} stopNatural(); clearInterval(keep); if (current) { current.done(); current = null; } }
/** Say text, sentence by sentence, in the best voice. onWord(charIndex) is called as each word starts (charIndex in
 *  the text as given when raw, else in its spoken form). en: always English (sounding out English words). */
export function say(text, { rate = 0.92, onWord, onEnd, en = false, raw = false } = {}) {
  if (!canSpeak()) { if (onEnd) onEnd(); return false; }
  stopReading();
  const spanish = !en && lang() === 'es' && isSpanish(text);
  const spoken = raw ? String(text) : speakable(text, spanish);
  if (!spoken || !/[\p{L}\p{N}]/u.test(spoken)) { if (onEnd) onEnd(); return false; }
  try { if (navigator.webdriver && Array.isArray(window.__said) && !window.__deviceOnly) window.__said.push(spoken); } catch (e) {}   // automated tests: what the narrator said
  // English is always Heart: whole recorded sentences when they exist, otherwise Heart word by word. (Spanish uses the
  // device's Spanish voice: Heart speaks English only. The one-file offline copy has no recordings.)
  if (!window.__deviceOnly && !window.__REAL_OFFLINE) {
    const es = spanish;
    const go = () => playNatural(spoken, { onWord, onEnd, rate, es, fallback: () => { window.__deviceOnly = true; say(text, { rate, onWord, onEnd, en, raw }); window.__deviceOnly = false; } }) || playWords(spoken, { onWord, onEnd, rate, es });
    if (NAT) { if (go()) return true; }
    else { let fin2 = false; current = { done: () => { fin2 = true; } }; loadNatural().then(() => { if (fin2) return; current = null; if (!NAT || !go()) { window.__deviceOnly = true; say(text, { rate, onWord, onEnd, en, raw }); window.__deviceOnly = false; } }); return true; }
  }
  let fin = false; const done = () => { if (fin) return; fin = true; clearInterval(keep); if (onEnd) onEnd(); };
  current = { done };
  const pieces = speechPieces(spoken); let base = 0;
  pieces.forEach((piece, i) => {
    const u = new SpeechSynthesisUtterance(piece), off = base; base += piece.length + 1;
    if (spanish) { u.lang = (esVoice && esVoice.lang) || 'es-US'; if (esVoice) u.voice = esVoice; } else { u.lang = (voice && voice.lang) || 'en-US'; if (voice) u.voice = voice; }
    u.rate = Math.max(0.5, Math.min(1.6, rate * speedMul())); u.pitch = 1; u.volume = voiceVol();
    if (onWord) u.onboundary = (e) => { if (e.name === 'word' || e.name === undefined) onWord(off + e.charIndex); };
    if (i === pieces.length - 1) { u.onend = done; u.onerror = done; } else u.onerror = done;
    try { speechSynthesis.speak(u); } catch (e) { done(); }
  });
  // some browsers pause speech that runs long in the background; a gentle nudge keeps it going
  keep = setInterval(() => { try { if (!speechSynthesis.speaking) clearInterval(keep); else if (speechSynthesis.paused) speechSynthesis.resume(); } catch (e) {} }, 5000);
  return true;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sayAsync = (t, o = {}) => new Promise((r) => { if (!say(t, { ...o, onEnd: r })) r(); setTimeout(r, 400 + String(t).length * 140); });

// ------------------------------------------------------------------------------------------- read an element, word by word
const READABLE = '.d-text, .lead, .tip, .helpbox, .whybox, .msg p, #obj-text, .cap-line, .learn-card p, .doc-l, .readable';
/** Wrap the words of an element's text in spans (once) so they can light up while being read. */
function wordSpans(el) {
  const spans = [];
  const walk = (n) => {
    if (n.nodeType === 3) {
      const parts = n.textContent.split(/(\s+)/); if (parts.length < 2 && !/\S/.test(n.textContent)) return;
      const frag = document.createDocumentFragment();
      for (const p of parts) { if (!p) continue; if (/^\s+$/.test(p)) frag.append(p); else { const s = h('span', { class: 'rw' }, p); spans.push(s); frag.append(s); } }
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && !/^(BUTTON|INPUT|TEXTAREA|SELECT|svg|CANVAS)$/i.test(n.tagName) && !n.classList.contains('rw')) [...n.childNodes].forEach(walk);
    else if (n.nodeType === 1 && n.classList.contains('rw')) spans.push(n);
    else if (n.nodeType === 1 && n.classList.contains('gloss')) { /* glossary buttons keep their own tap */ spans.push(n); }
  };
  [...el.childNodes].forEach(walk);
  return spans;
}
/** Read one or more elements aloud, lighting each word as it's said. */
export async function readEls(els, { rate } = {}) {
  els = els.filter((e) => e && e.isConnected && clean(e.textContent));
  for (const el of els) {
    const spans = wordSpans(el);
    const es = lang() === 'es' && isSpanish(el.textContent);
    const said = spans.map((s) => speakable(s.textContent, es) || ' ');
    const text = said.join(' ');
    // map char offsets of the spoken text to spans
    const starts = []; let k = 0; for (const w of said) { starts.push(k); k += w.length + 1; }
    let lit = null; const light = (s) => { if (lit) lit.classList.remove('lit'); lit = s; if (s) s.classList.add('lit'); };
    await sayAsync(text, { rate, raw: true, en: !es, onWord: (ci) => { let i = starts.length - 1; while (i > 0 && starts[i] > ci) i--; light(spans[i]); } });
    light(null);
    if (!current && !el.isConnected) break;
  }
}
/** A 🔊 button that reads the given elements (a function so it finds the current text when tapped). */
export function speakerBtn(getEls, label = 'Read to me') {
  const b = h('button', { class: 'say-btn', type: 'button', 'aria-label': label, title: label, onclick: (e) => { e.stopPropagation(); if (b.classList.contains('on')) { stopReading(); b.classList.remove('on'); return; } b.classList.add('on'); readEls(getEls()).then(() => b.classList.remove('on')); } }, '🔊');
  return b;
}
/** Read text automatically if "Read to me" is on. */
export function autoRead(getEls) { if (readToMe() && canSpeak()) setTimeout(() => readEls(getEls()), 350); }

// ------------------------------------------------------------------------------------------- sounding words out
const DIGRAPH = /^(ch|sh|th|ph|wh|ck|ng|qu|gh|kn|wr)/;
/** Split a word into speakable parts, roughly by syllable (phonics rules: VC|CV, V|CV, consonant-le, silent e). */
// common early words whose syllables don't follow the simple rules (closed first syllable, vowel-vowel splits…)
const SYL = { seven: 'sev·en', camel: 'cam·el', lemon: 'lem·on', river: 'riv·er', visit: 'vis·it', planet: 'plan·et', mother: 'moth·er', father: 'fa·ther', brother: 'broth·er', money: 'mon·ey',
  family: 'fam·i·ly', animal: 'an·i·mal', wagon: 'wag·on', robin: 'rob·in', cabin: 'cab·in', limit: 'lim·it', woman: 'wom·an', present: 'pres·ent', salad: 'sal·ad', never: 'nev·er', ever: 'ev·er',
  very: 'ver·y', many: 'man·y', every: 'ev·er·y', water: 'wa·ter', over: 'o·ver', open: 'o·pen', paper: 'pa·per', tiger: 'ti·ger', baby: 'ba·by', lady: 'la·dy', pony: 'po·ny', music: 'mu·sic',
  lion: 'li·on', giant: 'gi·ant', quiet: 'qui·et', diet: 'di·et', poem: 'po·em', create: 'cre·ate', idea: 'i·de·a', radio: 'ra·di·o', video: 'vid·e·o', piano: 'pi·an·o', nickel: 'nick·el',
  pocket: 'pock·et', jacket: 'jack·et', rocket: 'rock·et', chicken: 'chick·en', hexagon: 'hex·a·gon', taxi: 'tax·i', exit: 'ex·it', oven: 'ov·en', cover: 'cov·er', shiver: 'shiv·er',
  dragon: 'drag·on', melon: 'mel·on', habit: 'hab·it', panic: 'pan·ic', finish: 'fin·ish', punish: 'pun·ish', city: 'cit·y', body: 'bod·y', study: 'stud·y', busy: 'bus·y', minute: 'min·ute',
  people: 'peo·ple', because: 'be·cause', little: 'lit·tle', table: 'ta·ble', apple: 'ap·ple', purple: 'pur·ple', banana: 'ba·nan·a', elephant: 'el·e·phant', butterfly: 'but·ter·fly',
  community: 'com·mu·ni·ty', apartment: 'a·part·ment', inventory: 'in·ven·to·ry', groceries: 'gro·cer·ies', customer: 'cus·tom·er', manager: 'man·a·ger', interest: 'in·ter·est', computer: 'com·put·er' };
/** Split a word into speakable parts, roughly by syllable (phonics rules: VC|CV, V|CV, consonant-le, silent e, suffixes). */
export function chunks(word) {
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (SYL[w]) return SYL[w].split('·');
  // peel common suffixes so the base splits cleanly: jump·ing, box·es (but “jumped” stays one part)
  const suf = w.match(/^(.{3,}?)(ing|es|ful|less|ness|ly)$/);
  if (suf && /[aeiouy]/.test(suf[1]) && !(suf[2] === 'es' && !/(s|x|z|sh|ch)$/.test(suf[1]))) {
    const base = chunks(suf[1]); return [...base, suf[2]];
  }
  if (/[td]ed$/.test(w) && w.length > 4) return [...chunks(w.slice(0, -2)), 'ed'];   // want·ed
  if (/[^aeiouy]ed$/.test(w) && !/[td]ed$/.test(w)) { const b = w.slice(0, -2); const base = chunks(b); base[base.length - 1] += 'ed'; return base; }   // -ed is not its own syllable: jumped, asked
  if (w.length <= 3) return [w];
  const isV = (c, i) => /[aeiou]/.test(c) || (c === 'y' && i > 0);
  const out = []; let cur = '';
  for (let i = 0; i < w.length; i++) {
    cur += w[i];
    const c = w[i], n1 = w[i + 1];
    if (!n1 || !isV(c, i) || isV(n1, i + 1)) continue;
    const rest = w.slice(i + 1);
    const cle = rest.match(/^([^aeiouy]?)[^aeiouy]le$/); if (cle && !/^(ck)/.test(rest)) { cur += cle[1]; i += cle[1].length; out.push(cur); cur = ''; continue; }   // “ta·ble”, “lit·tle”
    if (/^[^aeiouy]{1,2}(e|es)$/.test(rest) || /^(e|es)$/.test(rest)) continue;   // silent e: “make”, “prac·tice”
    let j = i + 1; while (j < w.length && !isV(w[j], j)) j++;
    if (j >= w.length) continue;                                                 // no more vowels: keep the rest
    const cons = w.slice(i + 1, j);
    if (cons === 'x' || cons === 'ck') { cur += cons; i += cons.length; out.push(cur); cur = ''; }   // x and ck stay with the vowel before: tax·i, pock·et
    else if (cons.length === 1) { out.push(cur); cur = ''; }                      // V|CV  “ba·by”
    else if (DIGRAPH.test(cons) && cons.length === 2) { out.push(cur); cur = ''; } // keep “sh”, “th” together
    else { const keep = cons.length >= 3 ? cons.length - (/(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr|tw|ch|sh|th)$/.test(cons) ? 2 : 1) : 1;
      cur += cons.slice(0, keep); i += keep; out.push(cur); cur = ''; }                    // VC|CV  “bas·ket”
  }
  if (cur) out.push(cur);
  return out.reduce((a, p) => { if (a.length && !/[aeiouy]/.test(p)) a[a.length - 1] += p; else a.push(p); return a; }, []);
}
/** Split a one-syllable word into its sounds (graphemes): sh·i·p, r·ai·n, c·a·ke. */
export function sounds(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  const out = []; let i = 0;
  const TEAMS = ['tch', 'igh', 'dge', 'sh', 'ch', 'th', 'wh', 'ph', 'ck', 'ng', 'qu', 'ai', 'ay', 'ee', 'ea', 'oa', 'oo', 'ow', 'ou', 'oi', 'oy', 'ar', 'or', 'er', 'ir', 'ur', 'ew', 'aw', 'au', 'll', 'ss', 'ff', 'zz'];
  while (i < w.length) {
    const t = TEAMS.find((x) => w.startsWith(x, i));
    if (t) { out.push(t); i += t.length; continue; }
    if (w[i] === 'e' && i === w.length - 1 && out.length > 1) { out[out.length - 1] += 'e'; i++; continue; }   // silent e rides on the consonant: c·a·ke
    out.push(w[i]); i++;
  }
  return out;
}
// how to make the device voice say a single sound (not the letter's name)
const SOUND = { a: 'ah', e: 'eh', i: 'ih', o: 'aw', u: 'uh', b: 'buh', c: 'kuh', d: 'duh', f: 'fff', g: 'guh', h: 'huh', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', p: 'puh', q: 'kwuh', r: 'rrr',
  s: 'sss', t: 'tuh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz', sh: 'shh', ch: 'chuh', th: 'thh', wh: 'wuh', ph: 'fff', ck: 'kuh', ng: 'ng', qu: 'kwuh', tch: 'chuh', dge: 'juh', igh: 'eye',
  ai: 'ay', ay: 'ay', ee: 'ee', ea: 'ee', oa: 'oh', oo: 'oo', ow: 'oh', ou: 'ow', oi: 'oy', oy: 'oy', ar: 'ar', or: 'or', er: 'er', ir: 'er', ur: 'er', ew: 'oo', aw: 'aw', au: 'aw', ll: 'lll', ss: 'sss', ff: 'fff', zz: 'zzz' };
export const soundSay = (p) => sayPart(p);
const sayPart = (p) => SOUND[p] || (/[^aeiou]e$/.test(p) && SOUND[p.slice(0, -1)]) || p.replace(/y$/, 'ee').replace(/le$/, 'ul');

/** the sentence with the chosen word in bold */
function sentenceWith(sentence, word) {
  const re = new RegExp(`\\b(${word.replace(/[^A-Za-z']/g, '')})\\b`, 'i'), m = sentence.match(re);
  if (!m) return [sentence];
  return [sentence.slice(0, m.index), h('b', { class: 'wc-hit' }, m[0]), sentence.slice(m.index + m[0].length)];
}
/** read a whole sentence aloud, slowly enough to follow */
export function readSentence(sentence) { stopReading(); return say(sentence, { rate: 0.85 }); }
/** the sentence (inside el's text) around a character offset */
export function sentenceAt(text, at) {
  const t = String(text); let a = at, b = at;
  while (a > 0 && !/[.!?…]/.test(t[a - 1])) a--;
  while (b < t.length && !/[.!?…]/.test(t[b])) b++;
  while (b < t.length && /[.!?…”"’)]/.test(t[b])) b++;
  return t.slice(a, b).replace(/\s+/g, ' ').trim();
}
/** The word card: big word, hear it, sound it out part by part, meaning, saved to My Words. */
export function wordCard(rawWord, sentence) {
  const word = String(rawWord).replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '');
  if (!word || !/[a-z]/i.test(word)) return;
  document.querySelectorAll('.wcard-wrap').forEach((x) => x.remove());
  const one = chunks(word).length === 1, parts = one && word.length <= 6 ? sounds(word) : chunks(word), e = lookup(word);   // one syllable: sound by sound (sh·i·p); longer: by syllable
  const s = getState(); if (s) { const words = s.words || (s.words = []); const lw = word.toLowerCase(); if (!words.includes(lw) && lw.length > 2) words.push(lw); }
  const partEls = parts.map((p) => h('span', { class: 'wc-part' }, p));
  const big = h('div', { class: 'wc-word', style: { fontSize: `min(${word.length > 9 ? 38 : word.length > 6 ? 48 : 64}px, ${Math.floor(150 / Math.max(4, word.length + parts.length))}vw)` } }, ...partEls.flatMap((p, i) => i ? [h('i', { class: 'wc-dot' }, '·'), p] : [p]));
  const sound = async () => {
    for (const [i, p] of parts.entries()) { partEls.forEach((x) => x.classList.remove('lit')); partEls[i].classList.add('lit'); await sayAsync(one ? sayPart(p) : p.replace(/y$/, 'ee'), { rate: 0.6, en: true }); await sleep(one ? 260 : 180); }
    partEls.forEach((x) => x.classList.add('lit')); await sayAsync(word, { rate: 0.75, en: true }); partEls.forEach((x) => x.classList.remove('lit'));
  };
  const wrap = h('div', { class: 'wcard-wrap', onclick: (ev) => { if (ev.target === wrap) close(); } },
    h('div', { class: 'wcard' },
      big,
      h('div', { class: 'row wc-btns' },
        h('button', { class: 'primary', onclick: () => say(word, { rate: 0.75, en: true }) }, '🔊 Say it'),
        parts.length > 1 ? h('button', { class: 'ghost', onclick: sound }, '🧩 Sound it out') : null,
        h('button', { class: 'ghost sm', onclick: () => say(word.toUpperCase().split('').join(', ') + '. ' + word, { rate: 0.7 }) }, '🔤 Spell it')),
      sentence ? h('div', { class: 'wc-sent' }, h('p', { class: 'wc-sline' }, ...sentenceWith(sentence, word)), h('button', { class: 'primary sm', onclick: () => readSentence(sentence, word) }, '🔊 Say the whole sentence')) : null,
      e ? h('p', { class: 'wc-mean' }, h('b', {}, 'Means: '), e.meaning, ' ', h('button', { class: 'say-btn', onclick: () => say(`${word} means ${e.meaning}`) }, '🔊')) : null,
      h('p', { class: 'wc-note' }, '📖 Saved to My Words'),
      h('button', { class: 'ghost sm', onclick: () => close() }, 'Close')));
  const close = () => { stopReading(); wrap.remove(); };
  document.body.append(wrap);
  say(word, { rate: 0.75, en: true });
}

/** Underline the words worth learning (from the glossary) inside an element's plain text, so kids know to tap them. */
export function markWords(el, band = 2) {
  if (!el || el.dataset.marked) return; el.dataset.marked = '1';
  const parts = splitWords(el.textContent, band);
  if (!parts.some((p) => typeof p !== 'string')) return;
  el.replaceChildren(...parts.map((p) => typeof p === 'string' ? p : h('span', { class: 'gloss-soft' }, p.word)));
}
// ------------------------------------------------------------------------------------------- tap any word
function wordAt(x, y) {
  let node, off;
  if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); if (!r) return null; node = r.startContainer; off = r.startOffset; }
  else if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); if (!p) return null; node = p.offsetNode; off = p.offset; }
  if (!node || node.nodeType !== 3) return null;
  const t = node.textContent; let a = off, b = off;
  while (a > 0 && /[A-Za-z']/.test(t[a - 1])) a--; while (b < t.length && /[A-Za-z']/.test(t[b])) b++;
  const w = t.slice(a, b);
  // make sure the tap was really on the word, not empty space next to it
  try { const r = document.createRange(); r.setStart(node, a); r.setEnd(node, b); const bb = r.getBoundingClientRect(); if (x < bb.left - 6 || x > bb.right + 6 || y < bb.top - 6 || y > bb.bottom + 6) return null; } catch (e) {}
  if (w.length <= 1) return null;
  // global offset of the tap inside the readable element, so we can find the whole sentence
  const host = node.parentElement && node.parentElement.closest(READABLE); let sent = null;
  if (host) { let off2 = 0; const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); for (let n = tw.nextNode(); n && n !== node; n = tw.nextNode()) off2 += n.textContent.length; sent = sentenceAt(host.textContent, off2 + a); }
  return { w, sent };
}
let installed = false;
function installTaps() {
  if (installed) return; installed = true;
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest && ev.target.closest(READABLE);
    if (!el || ev.target.closest('button, a, input, textarea, .gloss')) return;
    if (el.classList.contains('d-text') && el.dataset.typing === '1') return;   // first tap finishes the typewriter
    const w = wordAt(ev.clientX, ev.clientY);
    if (w) { ev.stopPropagation(); wordCard(w.w, w.sent && w.sent.split(/\s+/).length > 1 ? w.sent : null); }
  }, true);
}

// ------------------------------------------------------------------------------------------- My Words practice
const SIGHT = [
  ['the', 'and', 'you', 'can', 'see', 'go', 'is', 'it', 'my', 'we', 'he', 'she', 'to', 'up', 'look', 'like', 'come', 'here', 'play', 'said'],
  ['what', 'want', 'were', 'they', 'there', 'this', 'that', 'with', 'have', 'from', 'work', 'money', 'store', 'food', 'home', 'help', 'friend', 'school', 'pay', 'save'],
  ['because', 'people', 'about', 'could', 'would', 'should', 'answer', 'again', 'every', 'their', 'once', 'water', 'where', 'many', 'some', 'friend', 'there', 'thought', 'write', 'learn'],
];
/** Listen-and-find: hear a word, tap the one that matches. Grows from sight words to the player's own words. */
export function wordPractice(level = 1) {
  const s = getState() || {};
  const own = (s.words || []).filter((w) => /^[a-z']+$/.test(w));
  const pool = [...new Set([...SIGHT.slice(0, Math.min(3, level)).flat(), ...own])];
  let score = 0, round = 0;
  const box = h('div', { class: 'act wp' });
  const next = () => {
    if (round >= 8) { box.replaceChildren(h('p', { class: 'lead' }, `You found ${score} of 8 words on the first try!`), h('button', { class: 'primary', onclick: () => { round = 0; score = 0; next(); } }, 'Play again')); say(`You found ${score} of 8 words on the first try!`); return; }
    round++;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const near = pool.filter((w) => w !== target).sort((a, b) => (Math.abs(a.length - target.length) + (a[0] === target[0] ? -2 : 0)) - (Math.abs(b.length - target.length) + (b[0] === target[0] ? -2 : 0)) || Math.random() - 0.5).slice(0, 6);
    const opts = [target, ...near.sort(() => Math.random() - 0.5).slice(0, 2)].sort(() => Math.random() - 0.5);
    const hear = () => say(target, { rate: 0.75 }); let missed = false;
    box.replaceChildren(
      h('p', { class: 'lead' }, `Word ${round} of 8: listen, then tap the word you hear.`),
      h('button', { class: 'primary big-say', onclick: hear }, '🔊 Hear the word'),
      h('div', { class: 'opts' }, opts.map((o) => h('button', { class: 'opt wp-opt', onclick: (e) => {
        if (o === target) { if (!missed) score++; e.currentTarget.classList.add('right'); say('Yes! ' + target); setTimeout(next, 1100); }
        else { missed = true; e.currentTarget.classList.add('wrong'); e.currentTarget.disabled = true; say(`That says ${o}. Listen again.`); setTimeout(hear, 1400); }
      } }, o))));
    setTimeout(hear, 300);
  };
  next();
  return box;
}

// ------------------------------------------------------------------------------------------- Talk log
/** Every conversation line so far (what people said, and what you said). Pick any word to learn it, or hear any
 *  whole sentence. Find a word: tap a word chip or type one, and see every line it was used in. */
export function talkLog() {
  const s = getState() || {}, log = (s.talk || []).slice().reverse();
  const box = h('div', { class: 'act talklog' });
  if (!log.length) { box.append(h('p', { class: 'lead' }, 'Your conversations will show up here. Talk to people around the city!')); return box; }
  // word chips: the longer words people used most, so a learner can choose one without typing
  const count = {};
  for (const l of log) for (const w of l.t.toLowerCase().match(/[a-z']{4,}/g) || []) if (!/^(that|this|with|have|your|you're|what|they|them|then|than|there|here|from|will|just|like|when|were|been|it's|i'm|don't|about|into|some|more|very|even)$/.test(w)) count[w] = (count[w] || 0) + 1;
  const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 18).map(([w]) => w).sort();
  const find = h('input', { class: 'writebox', type: 'search', placeholder: 'Find a word…', 'aria-label': 'Find a word in your conversations' });
  const list = h('div', { class: 'talk-list' });
  const render = () => {
    const q = find.value.trim().toLowerCase().replace(/[^a-z']/g, '');
    const rows = q ? log.filter((l) => new RegExp(`\\b${q}`, 'i').test(l.t)) : log.slice(0, 120);
    list.replaceChildren(...(rows.length ? rows.map((l) => {
      const p = h('p', { class: 'readable talk-t' }, ...(q ? sentenceWith(l.t, (l.t.match(new RegExp(`\\b${q}[a-z']*`, 'i')) || [q])[0]) : [l.t]));
      if (!q) markWords(p);
      return h('div', { class: 'talk-line' + (l.w === 'You' ? ' me' : '') }, h('div', { class: 'talk-who' }, h('b', {}, l.w), h('small', {}, l.d ? ` · Day ${l.d}` : '')), p,
        h('button', { class: 'ghost sm', 'aria-label': 'Say the whole sentence', onclick: () => readSentence(l.t) }, '🔊 Say it all'));
    }) : [h('p', { class: 'tip' }, `Nobody has said “${q}” yet.`)]));
  };
  find.oninput = render;
  box.append(h('p', { class: 'lead' }, 'Tap any word to learn it. Tap 🔊 to hear the whole sentence.'), find,
    h('div', { class: 'chips' }, top.map((w) => h('button', { class: 'chip', onclick: () => { find.value = w; render(); } }, w))), list);
  render();
  return box;
}
/** remember a conversation line (called for every line shown in a dialog) */
export function logLine(who, text) {
  const s = getState(); if (!s || !text) return;
  const t = s.talk || (s.talk = []);
  const w = who === s.name ? 'You' : who;
  if (t.length && t[t.length - 1].t === text && t[t.length - 1].w === w) return;
  t.push({ w, t: String(text), d: s.day });
  if (t.length > 300) t.splice(0, t.length - 300);
}
