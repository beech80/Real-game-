// REAL — languages. English or Español for everything a player reads around the lessons: buttons, menus, the story,
// tips, and every skill's lesson (name, goal, explanation, another way). Questions stay in English by default (many
// players are learning English), with a 🌎 button that shows them in Spanish. Read-aloud uses a Spanish voice for
// Spanish text and an English voice for English words, so sounding out English still sounds English.
import es1 from './i18n/es_1.json' with { type: 'json' };
import es2 from './i18n/es_2.json' with { type: 'json' };
import es3 from './i18n/es_3.json' with { type: 'json' };
import es4 from './i18n/es_4.json' with { type: 'json' };
import esSkills from './i18n/es_skills.json' with { type: 'json' };

const ES = Object.assign({}, es1, es2, es3, es4);
const VALUES = new Set(Object.values(ES));
let LANG = (() => { try { return localStorage.getItem('real.lang') || 'en'; } catch (e) { return 'en'; } })();
export const lang = () => LANG;
export const LANGS = [['en', 'English'], ['es', 'Español']];

/** the Spanish for an English string the game shows (exact match, keeping surrounding spaces) */
export function tr(t) {
  if (LANG !== 'es' || typeof t !== 'string') return t;
  const k = t.trim(); if (!k) return t;
  const v = ES[k]; return v ? t.replace(k, v) : t;
}
/** a skill's lesson field in the current language */
export function skT(sk, field) { return LANG === 'es' && sk && esSkills[sk.id] && esSkills[sk.id][field] ? esSkills[sk.id][field] : sk && sk[field]; }
/** is this text Spanish? (for picking the read-aloud voice) */
export function isSpanish(t) {
  const s = String(t || ''); if (VALUES.has(s.trim())) return true;
  if (/[¿¡ñ]/.test(s)) return true;
  const es = (s.match(/\b(el|la|los|las|que|de|del|y|es|tu|tú|para|con|una|un|por|muy|al|lo|se|su|como|más|pero|está|son)\b/gi) || []).length;
  const en = (s.match(/\b(the|and|is|you|your|to|of|a|it|for|with|that|this|are|on|in)\b/gi) || []).length;
  return es >= 2 && es > en || /[áéíóú]/.test(s) && es >= en;
}

// static page text (title screen etc.): swap in place, remember the English to switch back
const ORIG = new WeakMap();
export function translateStatic(root = document.body) {
  if (!root) return;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const en = ORIG.get(n) || n.textContent;
    if (LANG === 'es') { const v = tr(en); if (v !== en) { ORIG.set(n, en); n.textContent = v; } }
    else if (ORIG.has(n)) { n.textContent = ORIG.get(n); ORIG.delete(n); }
  }
  root.querySelectorAll('[placeholder],[aria-label],[title]').forEach((el) => {
    for (const a of ['placeholder', 'aria-label', 'title']) { if (!el.hasAttribute(a)) continue; const key = 'en' + a.replace(/-(\w)/g, (m, c) => c.toUpperCase()); const en = el.dataset[key] || el.getAttribute(a); if (LANG === 'es') { const v = tr(en); if (v !== en) { el.dataset[key] = en; el.setAttribute(a, v); } } else if (el.dataset[key]) { el.setAttribute(a, el.dataset[key]); delete el.dataset[key]; } }
  });
}
export function setLang(l) {
  LANG = l === 'es' ? 'es' : 'en';
  try { localStorage.setItem('real.lang', LANG); } catch (e) {}
  document.documentElement.lang = LANG;
  translateStatic(document.getElementById('title') || document.body);
  translateStatic(document.getElementById('hud') || document.body);
}
export function initLang() { document.documentElement.lang = LANG; if (LANG === 'es') { translateStatic(); } }

/** “🌎 En español”: a question and its choices in Spanish. Uses Claude where the game runs on claude.ai (the same
 *  helper as the smart character replies); otherwise shows the skill's Spanish lesson so the learner still has help. */
const cache = {};
export async function translateQuestion(Q, sampler) {
  const key = JSON.stringify([Q.q, Q.o]);
  if (cache[key]) return cache[key];
  try { const k = localStorage.getItem('real.tq.' + key.length + '.' + key.slice(0, 60)); if (k) return (cache[key] = JSON.parse(k)); } catch (e) {}
  const S = sampler ? await sampler() : null;
  if (!S) return null;
  try {
    const prompt = `Translate this school question for a child into simple neutral Latin American Spanish. Keep numbers, $ amounts, names and emoji. If the question is about English letters, sounds or spelling, keep those English words in English. Reply as JSON {"q": "...", "o": ["...", ...]} with the options in the same order.\nQuestion: ${Q.q}\nOptions: ${JSON.stringify(Q.o || [])}`;
    const r = await Promise.race([new Promise((res) => setTimeout(() => res(null), 9000)), S.json(prompt)]);
    if (r && r.q) { cache[key] = { q: String(r.q), o: Array.isArray(r.o) ? r.o.map(String) : [] }; try { localStorage.setItem('real.tq.' + key.length + '.' + key.slice(0, 60), JSON.stringify(cache[key])); } catch (e) {} return cache[key]; }
  } catch (e) {}
  return null;
}
