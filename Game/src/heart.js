// REAL — Heart, the reading voice, as a tutor. She cheers right answers, encourages after a miss and reads why,
// reads hints, talks through "Show me how", and answers questions ("Ask Heart") from what the game teaches: every
// skill's lesson, the word helper, and the question in front of you (with Claude for fuller answers where the game
// runs on claude.ai). Tutor talk is on by default and has an off switch (🗣️ button or Settings).
import { heartEl } from './art.js';
import { h, UI } from './ui.js';
import { SKILLS } from './edu.js';
import { lookup, GLOSSARY } from './glossary.js';
import { say, stopReading } from './readalong.js';
import { lang, skT } from './i18n.js';
import { Voice, sampler } from './voice.js';
export const KB = [];   // Heart's knowledge (heartkb.json), filled at start by learndata.js

const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const LINES = {
  right: ['You got it!', 'Yes! Great thinking.', 'That is right!', 'Nice work!', 'You figured it out!', 'Way to go!', 'Exactly right!', 'Super job!', 'I knew you could do it!', 'Wonderful!'],
  rightLate: ['You got it! Trying again is how we learn.', 'Yes! You kept going, and you found it.', 'There it is! Great job sticking with it.'],
  streak: ['Three in a row! You are on a roll.', 'Wow, another one! You really know this.', 'You are getting so good at this!'],
  miss: ['So close! Let us look again.', 'Good try! Let us think about it.', 'Not quite. You can do this.', 'Hmm, not that one. Here is why.', 'Almost! Here is a clue.'],
  hint: ['Here is a hint.', 'Let me help a little.'],
  show: ['Let us do one together.', 'Watch me, then you try.'],
  showNext: ['Next step.', 'Now this part.'],
  showDone: ['Now you try one!', 'Your turn. You can do it!'],
  welcome: ['Hi! I am Heart. I will read with you and help when you get stuck.'],
};
const ES = {
  right: ['¡Muy bien!', '¡Sí! Buen trabajo.', '¡Correcto!', '¡Lo lograste!', '¡Excelente!'], rightLate: ['¡Lo lograste! Intentar otra vez es como aprendemos.'],
  streak: ['¡Tres seguidas! Vas muy bien.'], miss: ['¡Casi! Veamos otra vez.', 'Buen intento. Pensemos juntos.', 'No es esa. Mira por qué.'],
  hint: ['Aquí tienes una pista.'], show: ['Hagamos uno juntos.'], showNext: ['Siguiente paso.'], showDone: ['¡Ahora te toca a ti!'], welcome: ['¡Hola! Soy Heart. Leo contigo y te ayudo.'],
};
const line = (k) => pick((lang() === 'es' ? ES : LINES)[k] || LINES[k]);
const settings = (G) => (G && G.state && G.state.settings) || {};
export const heartOn = (G) => settings(G).heart !== false && !window.__voiceOff;
export function setHeart(G, on) { G.state.settings = G.state.settings || {}; G.state.settings.heart = !!on; G.save && G.save(); }

// expressive pace: cheers a touch brighter and quicker, hints and reasons slower and calmer
const RATE = { right: 1.0, rightLate: 0.96, streak: 1.02, miss: 0.9, hint: 0.86, show: 0.9, showNext: 0.92, showDone: 0.98, welcome: 0.92 };
/** Heart reacts (and optionally reads a follow-up, like the reason or the worked explanation). */
export function heartSays(G, kind, follow = '') {
  if (!heartOn(G)) return;
  const t = line(kind) + (follow ? ' ' + follow : '');
  say(t, { rate: RATE[kind] || 0.92 });
}
let streak = 0;
/** called by the lesson screen after each answer */
export function heartAnswer(G, ok, { tries = 1, why = '', reason = '' } = {}) {
  if (!heartOn(G)) return;
  if (ok) { streak = tries === 1 ? streak + 1 : 0; heartSays(G, tries > 1 ? 'rightLate' : streak >= 3 && streak % 3 === 0 ? 'streak' : 'right', why); }
  else { streak = 0; heartSays(G, 'miss', reason); }
}

// ------------------------------------------------------------------------------------------- Ask Heart
const STOP = new Set('a an the is are was were be to of and or in on at for with what why how who when where which do does did can could should would you your i me my it this that these those there their about please tell explain mean means'.split(' '));
const words = (s) => (String(s).toLowerCase().match(/[a-z]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w));
/** Heart's own answer from what the game teaches (always available, offline too) */
/** Heart's knowledge base: the questions learners ask most, every subject (keywords match at the start of a word) */
export function kbAnswer(question, band = 3) {
  const q = ' ' + String(question).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ') + ' ';
  let best = null, bs = 0;
  for (const e of KB) {
    const hit = e.k.filter((k) => q.includes(' ' + k)).length; if (!hit) continue;
    const sc = hit + (hit === e.k.length ? 0.5 : 0) - Math.abs((e.band || 3) - band) * 0.05;
    if (sc > bs) { bs = sc; best = e; }
  }
  return best && bs >= 0.75 ? best.a : null;
}
export function localAnswer(question, ctx = {}) {
  const qw = words(question); if (!qw.length) return null;
  if (lang() !== 'es') { const kb = kbAnswer(question, ctx.band || (ctx.skill && SKILLS[ctx.skill] && SKILLS[ctx.skill].band) || 3); if (kb && !/^how do i start|hint/i.test(question)) return kb; }
  // a word they want explained
  for (const w of String(question).match(/[A-Za-z]+/g) || []) { const e = w.length > 3 && lookup(w); if (e && /mean|what is|what's|define|word/i.test(question)) return `${w} means ${e.meaning}.`; }
  // the best-matching lesson (the current skill counts extra)
  let best = null, bs = 0;
  for (const s of Object.values(SKILLS)) {
    const text = `${s.name} ${s.objective} ${s.explain} ${s.alt}`.toLowerCase();
    const stems = qw.map((w) => w.replace(/(ing|es|s)$/, '')).filter((w) => w.length > 2), nm = s.name.toLowerCase();
    const wt = (w) => Math.min(2, w.length / 4);   // longer, more specific words count more (fractions > add)
    let sc = stems.filter((w) => text.includes(w)).reduce((a, w) => a + wt(w), 0) + (ctx.skill === s.id ? 1.5 : 0) + 2 * stems.filter((w) => nm.includes(w)).reduce((a, w) => a + wt(w), 0);
    if (sc > bs) { bs = sc; best = s; }
  }
  if (best && bs >= 1.5) return `${skT(best, 'explain')} ${lang() === 'es' ? 'Otra forma de verlo:' : 'A new way to think about it:'} ${skT(best, 'alt')}`;
  for (const w of qw) { const e = lookup(w); if (e) return `${w} means ${e.meaning}.`; }
  return null;
}
async function smartAnswer(question, ctx, band) {
  const S = await sampler(); if (!S) return null;
  const prompt = `You are Heart, the warm, encouraging reading voice and tutor in REAL, a learning game for kids and teens. A learner (reading level ${band} of 6: 1 = kindergarten, 6 = high school) asks: "${question}".
${ctx.q ? `They are working on this question: "${ctx.q}" (skill: ${ctx.skillName || ''}). Do NOT give them the answer to it; help them think: point to the clue, the rule or the first step.` : ''}
${ctx.explain ? `What the game teaches about this skill: ${ctx.explain}` : ''}
Rules: answer in ${lang() === 'es' ? 'simple Spanish' : 'simple English'} at their reading level, 1 to 3 short sentences, kind and accurate. Only school subjects, life skills and the game. Never ask for or repeat personal information. If the question is unsafe or not for kids, gently change the subject. Never say you are an AI.`;
  try { const r = await Promise.race([new Promise((res) => setTimeout(() => res(null), 12000)), S([{ role: 'user', content: prompt }], { modelTier: 'quick' })]); return r && r.text ? r.text.trim().slice(0, 400) : null; } catch (e) { return null; }
}
/** the Ask Heart sheet. ctx: { q, skill } for the question on screen */
export function askHeart(G, ctx = {}) {
  const sk = ctx.skill && SKILLS[ctx.skill], band = (sk && sk.band) || Math.max(1, Math.min(6, G.edu.band('reading')));
  const c = { ...ctx, skillName: sk && sk.name, explain: sk && sk.explain };
  return UI.sheet('Ask Heart', () => {
    const inp = h('textarea', { class: 'writebox', rows: 2, placeholder: lang() === 'es' ? 'Escribe tu pregunta…' : 'Type your question… (What does “budget” mean? How do I add fractions?)' });
    const out = h('div', { class: 'heart-ans' });
    const ask = async (qText) => {
      const q = (qText || inp.value).trim(); if (!q) return;
      out.replaceChildren(h('div', { class: 'heart-row' }, heartEl('think'), h('p', { class: 'tip' }, '💭 …')));
      const smart = await smartAnswer(q, c, band), local = localAnswer(q, c);
      const ans = smart || local || (lang() === 'es' ? 'Buena pregunta. Abre 📚 Aprender y busca esa habilidad: ahí tienes la lección, un ejemplo paso a paso y práctica.' : 'Good question! Open 📚 Learn and find that skill. It has the lesson, each step shown, and practice.');
      out.replaceChildren(h('div', { class: 'heart-row' }, heartEl('talk'), h('div', { class: 'heart-bubble readable' }, h('b', {}, 'Heart: '), ans)), h('button', { class: 'ghost sm', onclick: () => say(ans) }, '🔊 Again'));
      say(ans);
      G.state.stats.askedHeart = (G.state.stats.askedHeart || 0) + 1;
    };
    const ideas = sk ? [lang() === 'es' ? `¿Cómo empiezo?` : 'How do I start?', lang() === 'es' ? `¿Qué es ${skT(sk, 'name').toLowerCase()}?` : `What is ${sk.name.toLowerCase()}?`, lang() === 'es' ? 'Dame una pista' : 'Can you give me a hint?'] : [lang() === 'es' ? '¿Qué es un presupuesto?' : 'What is a budget?', lang() === 'es' ? '¿Cómo sumo fracciones?' : 'How do I add fractions?', lang() === 'es' ? '¿Qué es una oración?' : 'What is a sentence?'];
    return h('div', { class: 'act' },
      h('div', { class: 'heart-hello' }, heartEl('happy')),
      h('p', { class: 'lead' }, lang() === 'es' ? 'Pregúntale a Heart lo que quieras de tus lecciones.' : 'Ask Heart anything about your lessons. She will help you think it through.'),
      h('div', { class: 'chips' }, ...ideas.map((t) => h('button', { class: 'chip style', onclick: () => { inp.value = t; ask(t); } }, t))),
      inp,
      h('div', { class: 'row' }, h('button', { class: 'ghost sm mic', onclick: async () => { const said = await Voice.ask({ prompt: lang() === 'es' ? 'Haz tu pregunta' : 'Ask your question' }); if (said) { inp.value = said; ask(said); } } }, '🎤 Say it'), h('button', { class: 'primary', onclick: () => ask() }, lang() === 'es' ? 'Preguntar' : 'Ask')),
      out);
  }, { icon: '✨' }).finally(() => stopReading());
}
export { GLOSSARY };
