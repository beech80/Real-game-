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
  { title: 'Standing on my own', open: [['Mr. Okafor', 'You have a job and a key. That is a real start.'], ['Mr. Okafor', 'Now comes the part nobody claps for: paying your way, feeding yourself, saving a little.'], ['Heart', 'I will be right here. One small step at a time.']], close: [['Mr. Okafor', 'Bills paid. Food you made yourself. Money put away.'], ['Mr. Okafor', 'That is what standing on your own looks like. I am proud of you.']], who: 'Mr. Okafor', intro: 'You have a job and a key. Now the real work starts: paying your way, feeding yourself, and saving a little.',
    goals: [
      ['Pay a bill on time (🧾 Bills app)', (s) => (s.stats.billsOnTime || 0) >= 1, null],
      ['Cook a meal at home (fridge)', (s) => (s.stats.mealsCooked || 0) >= 1, 'Door_ApartmentLobby'],
      ['Save $150', (s) => saved(s) >= 150, null],
    ], reward: 30, outro: 'You paid your way and fed yourself. That is what standing on your own looks like.' },
  { title: 'Learning the city', open: [['Heart', 'The bus goes to new places. But a city is easier when you know how it works.'], ['Heart', 'City School is on your phone. Pass three classes, and Midtown will open for you.']], close: [['Heart', 'Midtown! More shops, more jobs, more people.'], ['Jax', 'Huh. You made it to Midtown. Not bad… for someone from the old road.'], ['Heart', 'I think that was a compliment.']], who: 'Heart', intro: 'The bus can take you to new places, but first you need to know how the city works. City School is on your phone.',
    goals: [
      ['Pass 3 classes at City School (🏫 on your phone)', (s) => ((s.classes && s.classes.n) || 0) >= 3, null],
      ['Take the bus to Midtown', (s) => !!(s.visited && s.visited.midtown), 'Interact_BusStop'],
    ], reward: 40, outro: 'Midtown! More jobs, more people, more to learn. You earned this ride.' },
  { title: 'People who help', open: [['Dee', 'Hey, I see you every morning. You always look like you are carrying the whole city.'], ['Dee', 'Nobody makes it alone. Help somebody. Let people get to know you.']], close: [['Dee', 'People know your name now. Do you know how rare that is?'], ['Dee', 'That is worth more than money. Coffee is on me today.']], who: 'Dee', intro: 'Nobody makes it alone. Help someone in the city, and let people get to know you.',
    goals: [
      ['Help someone in the city (🧭 Discover on your phone shows who)', (s) => advDone(s) >= 1, null],
      ['Make a friend: visit Dee at the Daily Grind', (s) => ((s.friends || {}).Dee || 0) >= 0.8, 'Door_CoffeeShop'],
      ['Go for a jog in Brighter Park', (s) => (s.stats.jogs || 0) >= 1 || (s.stats.workouts || 0) >= 1, 'Interact_ParkJog'],
    ], reward: 40, outro: 'People know your name now. That is worth more than money.' },
  { title: 'A better job', open: [['Rosa', 'You show up. Every day. On time.'], ['Rosa', 'That is how a better job starts. Learn more, and reach for the next step.']], close: [['Rosa', 'A better job, and money in the bank.'], ['Rosa', 'When you walked in here you did not even know where the time clock was. Look at you now.']], who: 'Rosa', intro: 'You have shown up every day. Time to grow: learn more, and reach for a better job.',
    goals: [
      ['Work 5 shifts', (s) => (s.stats.shifts || 0) >= 5, 'Interact_TimeClock'],
      ['Get a promotion or a second job (Career board)', (s) => (s.stats.promotions || 0) >= 1 || (s.jobs || []).length >= 2, 'Door_CareerCenter'],
      ['Save $300', (s) => saved(s) >= 300, null],
    ], reward: 60, outro: 'A better job, and money in the bank. Look how far you have come.' },
  { title: 'The big city', open: [['Heart', 'The Opportunity District is where careers grow: offices, workshops, big ideas.'], ['Jax', 'Everybody wants to get there. Most people never learn enough to stay.'], ['Heart', 'Then let us learn enough.']], close: [['Heart', 'Offices, workshops, people building the future. And you belong here too.'], ['Jax', '…Okay. You are doing it the real way. Maybe I should try that.']], who: 'Heart', intro: 'The Opportunity District is where careers grow. Learn enough to get there, and help more people on the way.',
    goals: [
      ['Pass 8 classes at City School', (s) => ((s.classes && s.classes.n) || 0) >= 8, null],
      ['Take the bus to the Opportunity District', (s) => !!(s.visited && s.visited.opportunity), 'Interact_BusStop'],
      ['Finish 3 parts of people’s stories', (s) => advDone(s) >= 3, null],
    ], reward: 80, outro: 'Offices, workshops, big ideas. The city is opening up to you.' },
  { title: 'Reaching higher', open: [['Heart', 'The Heights is the top of the city. People there started somewhere too.'], ['Heart', 'Keep growing, and you will see it from the inside.']], close: [['Heart', 'From the old road to The Heights.'], ['Heart', 'Do you remember the first sign you read, alone in the fields? Look how far you have come.'], ['Heart', 'Someone is watching… and I think they are about to call.']], who: 'Heart', intro: 'The Heights is the top of the city. Keep growing, and you will see it from the inside.',
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
/** a chapter opens like a TV episode: a title card, then the people in it talk */
async function openScene(G, i, C) {
  G.sfx && G.sfx('level');
  await UI.caption([`${tr('Chapter')} ${i + 1}`, tr(C.title)], 1700);
  for (const [who, line] of C.open || [[C.who, C.intro]]) await UI.say(tr(who), tr(line));
}
/** after time away: Heart reminds you where the story is (once per return) */
export async function storyRecap(G, lastSeen) {
  const s = G.state; if (!storyActive(s) || G.busy || !lastSeen) return;
  const S = st(s), away = Date.now() - lastSeen;
  if (away < 3 * 3600e3) return;
  const g = storyGoal(G); const C = CHAPTERS[S.ch];
  await UI.say('Heart', `${tr('Welcome back!')} ${tr('We are in')} ${tr('Chapter')} ${S.ch + 1}: ${tr(C.title)}.${g ? ' ' + tr('Next') + ': ' + g.text.replace(/^📖 [^:]+: /, '') : ''}`);
}
/** call often: finishes a chapter when all its goals are met (quietly for chapters an older save had already done) */
let busyStory = false;
export async function storyCheck(G, { quiet = false } = {}) {
  const s = G.state; if (busyStory || !storyActive(s)) return;
  const S = st(s), C = CHAPTERS[S.ch]; if (!quiet) S.seen = Date.now();
  if (!C.goals.every(([, done]) => done(s, G))) {
    if (!S.met) { S.met = 1; if (!quiet && !G.busy && (!navigator.webdriver || window.__storyScenes)) { busyStory = true; try { await openScene(G, S.ch, C); } finally { busyStory = false; } } }
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
      for (const [who, line] of C.close || [[C.who, C.outro]]) await UI.say(tr(who), tr(line));
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
      i <= cur ? h('ul', {}, ...C.goals.map(([t, done]) => h('li', { class: i < cur || done(s, G) ? 'ok' : '' }, `${i < cur || done(s, G) ? '✓' : '○'} ${tr(t)}`))) : h('small', {}, tr('Finish the chapter before this one to open it.')))));
}
