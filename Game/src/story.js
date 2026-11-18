// REAL — the story path after your first paycheck. Chapters, each with two or three clear goals; when every goal is met the
// chapter ends with a short scene and a reward, and the next one begins. The goal you have not reached yet becomes the main
// goal at the top of the screen (after today's shift and any bill that is due), so there is always a next step in the story.
// Chapters already finished in an older save are marked done quietly. state.story = { ch: index of the current chapter }
import { h, UI, money } from './ui.js';
import { tr } from './i18n.js';
import { celebrate } from './rewards.js';

const advDone = (s) => Object.values(s.adv || {}).reduce((a, x) => a + (x.stage || 0), 0);
const saved = (s) => s.money + (s.savings || 0);
// [goal text, is it done, where the arrow points (or null), short label for the Story list]
export const CHAPTERS = [
  { title: 'Standing on my own', who: 'Mr. Okafor', intro: 'You have a job and a key. Now the real work starts: paying your way, feeding yourself, and saving a little.',
    goals: [
      ['Pay a bill on time (🧾 Bills app)', (s) => (s.stats.billsOnTime || 0) >= 1, null],
      ['Cook a meal at home (fridge)', (s) => (s.stats.mealsCooked || 0) >= 1, 'Door_ApartmentLobby'],
      ['Save $150', (s) => saved(s) >= 150, null],
    ], reward: 30, outro: 'You paid your way and fed yourself. That is what standing on your own looks like.' },
  { title: 'Learning the city', who: 'Heart', intro: 'The bus can take you to new places, but first you need to know how the city works. City School is on your phone.',
    goals: [
      ['Pass 3 classes at City School (🏫 on your phone)', (s) => ((s.classes && s.classes.n) || 0) >= 3, null],
      ['Take the bus to Midtown', (s) => !!(s.visited && s.visited.midtown), 'Interact_BusStop'],
    ], reward: 40, outro: 'Midtown! More jobs, more people, more to learn. You earned this ride.' },
  { title: 'People who help', who: 'Dee', intro: 'Nobody makes it alone. Help someone in the city, and let people get to know you.',
    goals: [
      ['Help someone in the city (🧭 Discover on your phone shows who)', (s) => advDone(s) >= 1, null],
      ['Make a friend: visit Dee at the Daily Grind', (s) => ((s.friends || {}).Dee || 0) >= 0.8, 'Door_CoffeeShop'],
      ['Go for a jog in Brighter Park', (s) => (s.stats.jogs || 0) >= 1 || (s.stats.workouts || 0) >= 1, 'Interact_ParkJog'],
    ], reward: 40, outro: 'People know your name now. That is worth more than money.' },
  { title: 'A better job', who: 'Rosa', intro: 'You have shown up every day. Time to grow: learn more, and reach for a better job.',
    goals: [
      ['Work 5 shifts', (s) => (s.stats.shifts || 0) >= 5, 'Interact_TimeClock'],
      ['Get a promotion or a second job (Career board)', (s) => (s.stats.promotions || 0) >= 1 || (s.jobs || []).length >= 2, 'Door_CareerCenter'],
      ['Save $300', (s) => saved(s) >= 300, null],
    ], reward: 60, outro: 'A better job, and money in the bank. Look how far you have come.' },
  { title: 'The big city', who: 'Heart', intro: 'The Opportunity District is where careers grow. Learn enough to get there, and help more people on the way.',
    goals: [
      ['Pass 8 classes at City School', (s) => ((s.classes && s.classes.n) || 0) >= 8, null],
      ['Take the bus to the Opportunity District', (s) => !!(s.visited && s.visited.opportunity), 'Interact_BusStop'],
      ['Finish 3 parts of people’s stories', (s) => advDone(s) >= 3, null],
    ], reward: 80, outro: 'Offices, workshops, big ideas. The city is opening up to you.' },
  { title: 'Reaching higher', who: 'Heart', intro: 'The Heights is the top of the city. Keep growing, and you will see it from the inside.',
    goals: [
      ['Reach Life Level 8', (s, G) => G.life().level >= 8, null],
      ['Pass 14 classes at City School', (s) => ((s.classes && s.classes.n) || 0) >= 14, null],
      ['Take the bus to The Heights', (s) => !!(s.visited && s.visited.heights), 'Interact_BusStop'],
    ], reward: 100, outro: 'From the old road to The Heights. Someone is watching how far you have come…' },
];
const st = (s) => (s.story = s.story || { ch: 0 });
export const storyActive = (s) => s.chapter === 'city' && s.flags && s.flags.hired && s.quest === 'free' && st(s).ch < CHAPTERS.length;
/** the next goal in the story, or null */
export function storyGoal(G) {
  const s = G.state; if (!storyActive(s)) return null;
  const C = CHAPTERS[st(s).ch], n = st(s).ch + 1;
  const left = C.goals.find(([, done]) => !done(s, G));
  return left ? { text: `📖 ${tr('Chapter')} ${n}: ${tr(left[0])}`, target: left[2] } : null;
}
/** call often: finishes a chapter when all its goals are met (quietly for chapters an older save had already done) */
let busyStory = false;
export async function storyCheck(G, { quiet = false } = {}) {
  const s = G.state; if (busyStory || !storyActive(s)) return;
  const S = st(s), C = CHAPTERS[S.ch];
  if (!C.goals.every(([, done]) => done(s, G))) {
    if (!S.met) { S.met = 1; if (!quiet && !G.busy) { busyStory = true; try { await UI.say(tr(C.who), `${tr('Chapter')} ${S.ch + 1}: ${tr(C.title)}. ${tr(C.intro)}`); } finally { busyStory = false; } } }
    return;
  }
  if (G.busy && !quiet) return;
  busyStory = true;
  try {
    S.ch++; S.met = 0;
    if (!quiet) {
      G.earn(C.reward, `${tr('Chapter')} ${S.ch}: ${tr(C.title)}`);
      celebrate(G, `📖 ${tr('Chapter')} ${S.ch} ${tr('done')}!`, `${tr(C.title)} · +${money(C.reward)}`, { big: true });
      await new Promise((r) => setTimeout(r, 2800));
      await UI.say(tr(C.who), tr(C.outro));
    }
    G.save();
  } finally { busyStory = false; }
  if (quiet) return storyCheck(G, { quiet: true });   // an older save may have finished several
}
/** the Story app: every chapter, its goals and what is done */
export function storyApp(G) {
  const s = G.state, cur = st(s).ch;
  return h('div', { class: 'act story-app' },
    h('p', { class: 'lead' }, cur >= CHAPTERS.length ? 'You finished every chapter. The Club is waiting for you.' : 'Your story, one chapter at a time. Finish every goal to start the next chapter.'),
    ...CHAPTERS.map((C, i) => h('div', { class: 'story-ch' + (i < cur ? ' done' : i === cur ? ' now' : ' later') },
      h('b', {}, `${i < cur ? '✓' : i === cur ? '▶' : '🔒'} ${tr('Chapter')} ${i + 1}: ${tr(C.title)}`),
      i <= cur ? h('ul', {}, ...C.goals.map(([t, done]) => h('li', { class: i < cur || done(s, G) ? 'ok' : '' }, `${i < cur || done(s, G) ? '✓' : '○'} ${tr(t)}`))) : h('small', {}, tr('Finish the chapter before to open this one.')))));
}
