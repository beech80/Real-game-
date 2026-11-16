// REAL — City School (the 🏫 School app on the phone). You learn to grow in the city: a class teaches two skills at the
// player's own level in one subject (each skill is explained first, then practised), and finished classes are what open
// the next districts on the bus, together with Life Level. Classes also raise the Education part of Life Level.
// state.classes = { n: classes passed, by: { subject: n } }
import { h, UI } from './ui.js';
import { tr } from './i18n.js';
import { runActivity } from './learnkit.js';
import { GEN } from './curriculum.js';
import { SKILLS, SUBJECTS } from './edu.js';
import { DISTRICTS } from './districts.js';

// classes needed before the bus takes you there (as well as the district's Life Level)
export const CLASS_GATES = { midtown: 3, opportunity: 8, heights: 14 };
export const classesDone = (s) => (s.classes && s.classes.n) || 0;
/** has this player learned enough to ride to a district? (Places already visited stay open. Test bots skip the rule unless they ask for it.) */
export const gateOpen = (s, id) => !CLASS_GATES[id] || !!(s.visited && s.visited[id]) || classesDone(s) >= CLASS_GATES[id] || (navigator.webdriver && !window.__learnGate);
export const nextGate = (s) => Object.entries(CLASS_GATES).find(([id, n]) => !(s.visited && s.visited[id]) && classesDone(s) < n) || null;

const QUESTIONS = 4;
/** One class: two skills near the player's level in this subject, two questions each. Passing (2 or more right) earns a class star. */
export async function takeClass(G, subj) {
  const s = G.state, b = G.edu.band(subj), C = s.classes = s.classes || { n: 0, by: {} }, last = (s.flags.lastClass || {})[subj] || [];
  const forced = (window.__classSkills || []).map((id) => SKILLS[id]).filter((k) => k && GEN[k.id]);
  const pool = Object.values(SKILLS).filter((k) => k.subj === subj && GEN[k.id]).sort((x, y) => Math.abs(x.band - b) - Math.abs(y.band - b) || (last.includes(x.id) ? 1 : 0) - (last.includes(y.id) ? 1 : 0) || G.edu.state(x.id) - G.edu.state(y.id));
  const two = (forced.length ? forced : pool).slice(0, 2); if (!two.length) return null;
  const title = `${tr('City School')}: ${tr(SUBJECTS[subj].name)}`; let right = 0, asked = 0;
  for (const k of two) for (let i = 0; i < QUESTIONS / two.length; i++) {
    const r = await runActivity(G, () => ({ skill: k.id, ...GEN[k.id][Math.floor(Math.random() * GEN[k.id].length)]() }), 'school', title, SUBJECTS[subj].icon);
    asked++; if (r && r.ok) right++;
  }
  (s.flags.lastClass = s.flags.lastClass || {})[subj] = two.map((k) => k.id);
  const passed = right >= Math.ceil(asked / 2), before = nextGate(s);
  if (passed) { C.n++; C.by[subj] = (C.by[subj] || 0) + 1; s.stats.lessons = (s.stats.lessons || 0) + 1; }
  G.advance(0.5); G.save();
  if (!passed) UI.toast(tr('Class finished. Take it again to earn the star. Heart can help.'), 'info', 3600);
  else {
    G.sfx('good'); UI.toast(`⭐ ${tr('Class passed!')} ${right} / ${asked}`, 'gold', 3000);
    if (before && classesDone(s) >= before[1]) setTimeout(() => UI.toast(`🚌 ${tr('You learned enough to ride to')} ${tr(DISTRICTS[before[0]].name)}.`, 'good', 4200), 3200);
  }
  return { right, asked, passed };
}

/** the app: stars so far, what they open next, and a class in every subject */
export function citySchool(G, close) {
  const s = G.state, n = classesDone(s), g = nextGate(s), by = (s.classes && s.classes.by) || {};
  return h('div', { class: 'act city-school' },
    h('p', { class: 'lead' }, 'Learn to grow in the city. Each class teaches two skills at your level. Classes open new parts of the city.'),
    h('div', { class: 'school-stars' }, h('b', {}, `⭐ ${n}`), h('span', {}, n === 1 ? tr('class passed') : tr('classes passed'))),
    g ? h('div', { class: 'school-next' }, h('small', {}, `🚌 ${tr(DISTRICTS[g[0]].name)}: ${Math.min(n, g[1])} / ${g[1]}`), h('div', { class: 'bar' }, h('i', { style: { width: Math.round(100 * Math.min(n, g[1]) / g[1]) + '%' } })))
      : h('p', { class: 'tip' }, 'You have learned enough to ride anywhere in the city. Keep learning to grow your Life Level.'),
    h('div', { class: 'school-list' }, ...Object.entries(SUBJECTS).filter(([k]) => k !== 'cursive').map(([k, S]) => h('button', { class: 'skillrow', 'data-subject': k, onclick: async () => { close(); await takeClass(G, k); } },
      h('div', {}, h('b', {}, `${S.icon} ${tr(S.name)}`), h('small', {}, `${tr('Level')} ${G.edu.band(k)}${by[k] ? ` · ⭐ ${by[k]}` : ''}`)), h('span', {}, '›')))),
    h('p', { class: 'tip' }, 'Cursive has its own class: open ✍️ Cursive on your phone.'));
}
