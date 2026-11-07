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
let voice = null;
const pickVoice = () => { try { const v = speechSynthesis.getVoices().filter((x) => /^en/i.test(x.lang)); voice = v.find((x) => /Samantha|Google US English|Aria|Jenny|Karen/i.test(x.name)) || v.find((x) => /en-US/i.test(x.lang)) || v[0] || null; } catch (e) {} };
try { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) {}
const clean = (t) => String(t || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}★☆♛✓✕›‹•·]/gu, ' ').replace(/\$(\d+)\.(\d\d)\b/g, '$$$1 and $2 cents').replace(/\s+/g, ' ').trim();
export const canSpeak = () => 'speechSynthesis' in window && !window.__voiceOff;
let current = null;
export function stopReading() { try { speechSynthesis.cancel(); } catch (e) {} if (current) { current.done(); current = null; } }
/** Say text. onWord(charIndex) is called as each word starts (when the device reports it). */
export function say(text, { rate = 0.88, onWord, onEnd } = {}) {
  if (!canSpeak()) { if (onEnd) onEnd(); return false; }
  stopReading();
  const u = new SpeechSynthesisUtterance(clean(text));
  if (voice) u.voice = voice; u.lang = 'en-US'; u.rate = rate; u.pitch = 1.05;
  let fin = false; const done = () => { if (fin) return; fin = true; if (onEnd) onEnd(); };
  current = { done };
  if (onWord) u.onboundary = (e) => { if (e.name === 'word' || e.name === undefined) onWord(e.charIndex); };
  u.onend = done; u.onerror = done;
  try { speechSynthesis.speak(u); } catch (e) { done(); return false; }
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
    const text = spans.map((s) => s.textContent).join(' ');
    // map char offsets of the joined text to spans
    const starts = []; let k = 0; for (const s of spans) { starts.push(k); k += s.textContent.length + 1; }
    let lit = null; const light = (s) => { if (lit) lit.classList.remove('lit'); lit = s; if (s) s.classList.add('lit'); };
    await sayAsync(text, { rate, onWord: (ci) => { let i = starts.length - 1; while (i > 0 && starts[i] > ci) i--; light(spans[i]); } });
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
const sayPart = (p) => SOUND[p] || (/[^aeiou]e$/.test(p) && SOUND[p.slice(0, -1)]) || p.replace(/y$/, 'ee').replace(/le$/, 'ul');

/** The word card: big word, hear it, sound it out part by part, meaning, saved to My Words. */
export function wordCard(rawWord) {
  const word = String(rawWord).replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '');
  if (!word || !/[a-z]/i.test(word)) return;
  document.querySelectorAll('.wcard-wrap').forEach((x) => x.remove());
  const one = chunks(word).length === 1, parts = one && word.length <= 6 ? sounds(word) : chunks(word), e = lookup(word);   // one syllable: sound by sound (sh·i·p); longer: by syllable
  const s = getState(); if (s) { const words = s.words || (s.words = []); const lw = word.toLowerCase(); if (!words.includes(lw) && lw.length > 2) words.push(lw); }
  const partEls = parts.map((p) => h('span', { class: 'wc-part' }, p));
  const big = h('div', { class: 'wc-word', style: { fontSize: `min(${word.length > 9 ? 38 : word.length > 6 ? 48 : 64}px, ${Math.floor(150 / Math.max(4, word.length + parts.length))}vw)` } }, ...partEls.flatMap((p, i) => i ? [h('i', { class: 'wc-dot' }, '·'), p] : [p]));
  const sound = async () => {
    for (const [i, p] of parts.entries()) { partEls.forEach((x) => x.classList.remove('lit')); partEls[i].classList.add('lit'); await sayAsync(one ? sayPart(p) : p.replace(/y$/, 'ee'), { rate: 0.6 }); await sleep(one ? 260 : 180); }
    partEls.forEach((x) => x.classList.add('lit')); await sayAsync(word, { rate: 0.75 }); partEls.forEach((x) => x.classList.remove('lit'));
  };
  const wrap = h('div', { class: 'wcard-wrap', onclick: (ev) => { if (ev.target === wrap) close(); } },
    h('div', { class: 'wcard' },
      big,
      h('div', { class: 'row wc-btns' },
        h('button', { class: 'primary', onclick: () => say(word, { rate: 0.75 }) }, '🔊 Say it'),
        parts.length > 1 ? h('button', { class: 'ghost', onclick: sound }, '🧩 Sound it out') : null,
        h('button', { class: 'ghost sm', onclick: () => say(word.toUpperCase().split('').join(', ') + '. ' + word, { rate: 0.7 }) }, '🔤 Spell it')),
      e ? h('p', { class: 'wc-mean' }, h('b', {}, 'Means: '), e.meaning, ' ', h('button', { class: 'say-btn', onclick: () => say(`${word} means ${e.meaning}`) }, '🔊')) : null,
      h('p', { class: 'wc-note' }, '📖 Saved to My Words'),
      h('button', { class: 'ghost sm', onclick: () => close() }, 'Close')));
  const close = () => { stopReading(); wrap.remove(); };
  document.body.append(wrap);
  say(word, { rate: 0.75 });
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
  return w.length > 1 ? w : null;
}
let installed = false;
function installTaps() {
  if (installed) return; installed = true;
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest && ev.target.closest(READABLE);
    if (!el || ev.target.closest('button, a, input, textarea, .gloss')) return;
    if (el.classList.contains('d-text') && el.dataset.typing === '1') return;   // first tap finishes the typewriter
    const w = wordAt(ev.clientX, ev.clientY);
    if (w) { ev.stopPropagation(); wordCard(w); }
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
