// REAL — the Classroom: a sit-down school day, taught the way great teachers teach.
//  * A real routine every day: the bell rings, you take your seat, the board shows today's schedule, and each class
//    follows the same three steps: I do (the teacher explains and works an example), we do (you try one with help),
//    you do (you try on your own). The day ends with an exit ticket and a report card, and tomorrow's homework is the
//    review the memory schedule says is due.
//  * A day for every age: Pre-K (getting ready for school: circle time, letters and sounds, story time, counting,
//    shapes, move and play, feelings, school routines), elementary (K–5), middle school (6–8), high school (9–12) and
//    college prep (SAT/ACT-style math and reading, essays, applications, financial aid, study skills).
//  * Every class teaches at the learner's own level in that subject, and moves up as they master skills.
//  * One school day per game day. You can leave and come back: the day remembers where you were.
// state.school = { band, days, streak, lastDay, today: { day, at, marks: [[title, right, total]] } }
import { h, UI, money } from './ui.js';
import { tr } from './i18n.js';
import { GEN } from './curriculum.js';
import { SKILLS, SUBJECTS } from './edu.js';
import { runActivity, showMeHow } from './learnkit.js';
import { celebrate } from './rewards.js';
import { PREK_DAY } from './curriculum14.js';
import { PRECOL_DAY } from './curriculum15.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const TEACHER = { prek: 'Ms. Rivera', elem: 'Ms. Rivera', middle: 'Mr. Banks', high: 'Mr. Banks', college: 'Mr. Banks' };
export const BAND_LABEL = { prek: 'Pre-K: getting ready for school', elem: 'Elementary school', middle: 'Middle school', high: 'High school', college: 'College prep' };

// the school day for each age, in a real order. A lesson period names its subject; the skill comes from the learner's level.
const ELEM = [
  { id: 'meet', icon: '🌞', title: 'Morning meeting', kind: 'meeting', teacher: 'Good morning, friends! Let’s check in and set a goal for today.' },
  { id: 'read', icon: '📖', title: 'Reading', kind: 'lesson', subj: 'reading', teacher: 'Readers, eyes up here. I will show you first, then we try it together.' },
  { id: 'math', icon: '➗', title: 'Math', kind: 'lesson', subj: 'math', teacher: 'Mathematicians! Watch how I solve one. Then it’s your turn.' },
  { id: 'recess', icon: '🏃', title: 'Recess', kind: 'move', teacher: 'Time to move! Stand up, stretch high, and do ten jumps.' },
  { id: 'write', icon: '✍️', title: 'Writing', kind: 'lesson', subj: 'writing', teacher: 'Writers, a good sentence starts with a capital and ends with a mark. Let’s write!' },
  { id: 'sci', icon: '🔬', title: 'Science and social studies', kind: 'lesson', subj: ['science', 'social'], teacher: 'Scientists and citizens: today we wonder, observe and explain.' },
  { id: 'exit', icon: '🎟️', title: 'Exit ticket', kind: 'exit', teacher: 'Before you go: three quick questions to show me what you learned today.' },
];
const MIDDLE = [
  { id: 'donow', icon: '⏱️', title: 'Do Now', kind: 'warmup', teacher: 'Take your seat. Do Now is on the board: two warm-up questions from earlier lessons.' },
  { id: 'ela', icon: '📖', title: 'English', kind: 'lesson', subj: ['reading', 'writing'], teacher: 'Notebooks out. Watch my thinking, then we do one together.' },
  { id: 'math', icon: '➗', title: 'Math', kind: 'lesson', subj: 'math', teacher: 'Every problem has steps. I model, we try, you own it.' },
  { id: 'sci', icon: '🔬', title: 'Science', kind: 'lesson', subj: 'science', teacher: 'Good science starts with a question and ends with evidence.' },
  { id: 'soc', icon: '🌍', title: 'Social studies', kind: 'lesson', subj: 'social', teacher: 'History and civics help you understand the world you live in.' },
  { id: 'life', icon: '💰', title: 'Money and life skills', kind: 'lesson', subj: ['finance', 'health'], teacher: 'This class pays off for the rest of your life. Literally.' },
  { id: 'exit', icon: '🎟️', title: 'Exit ticket', kind: 'exit', teacher: 'Exit ticket: show me what stuck today.' },
];
const HIGH = [
  { id: 'donow', icon: '⏱️', title: 'Do Now', kind: 'warmup', teacher: 'Bell work. You have two problems. Go.' },
  { id: 'ela', icon: '📖', title: 'English', kind: 'lesson', subj: ['reading', 'writing'], teacher: 'Strong readers make strong writers. Watch, then try.' },
  { id: 'math', icon: '📐', title: 'Math', kind: 'lesson', subj: 'math', teacher: 'Hard work beats talent when talent doesn’t work hard. Let’s solve.' },
  { id: 'sci', icon: '🧪', title: 'Science', kind: 'lesson', subj: 'science', teacher: 'Claim, evidence, reasoning. That’s how scientists talk.' },
  { id: 'soc', icon: '🏛️', title: 'Government and history', kind: 'lesson', subj: 'social', teacher: 'A good citizen knows how things work, and asks good questions.' },
  { id: 'fin', icon: '💰', title: 'Personal finance', kind: 'lesson', subj: 'finance', teacher: 'Money is a tool. Today you learn to use it well.' },
  { id: 'think', icon: '🧠', title: 'Critical thinking', kind: 'lesson', subj: ['thinking', 'tech'], teacher: 'Don’t just believe it. Check it.' },
  { id: 'exit', icon: '🎟️', title: 'Exit ticket', kind: 'exit', teacher: 'Exit ticket. Three questions. Show me what you own now.' },
];

/** which school day fits this learner: a chosen band, or one from their starting grade */
export function schoolBand(G) {
  const s = G.state; if (s.school && s.school.band) return s.school.band;
  const st = G.edu.start || 1;
  return st <= 3 ? 'elem' : st === 4 ? 'middle' : 'high';
}
export function dayPlan(band) { return band === 'prek' ? PREK_DAY : band === 'college' ? PRECOL_DAY : band === 'middle' ? MIDDLE : band === 'high' ? HIGH : ELEM; }
const sch = (s) => (s.school = s.school || { days: 0, streak: 0, lastDay: 0 });

/** the skill to teach for a subject: the learner's level in it, something not mastered yet, that has questions */
export function lessonSkill(G, subj, list) {
  const ok = (id) => GEN[id] && GEN[id].length;
  if (list && list.length) { const c = list.filter(ok); const fresh = c.filter((id) => G.edu.state(id) < 4); return pick(fresh.length ? fresh : c) || null; }
  const subs = Array.isArray(subj) ? subj : [subj], sub = pick(subs), band = G.edu.band(sub);
  const all = Object.values(SKILLS).filter((k) => k.subj === sub && ok(k.id) && !/^(prek|col)\./.test(k.id));
  for (const d of [0, -1, 1, -2]) {
    const at = all.filter((k) => k.band === band + d), fresh = at.filter((k) => G.edu.state(k.id) < 4);
    if (fresh.length) return pick(fresh.filter((k) => G.edu.state(k.id) > 0).concat(fresh)).id;   // continue something started, or begin something new
    if (at.length && d === 0) return pick(at).id;
  }
  return all.length ? pick(all).id : null;
}
const gen = (id) => () => pick(GEN[id])();

/** the classroom backdrop: a chalkboard with today's schedule and the clock, rows of desks */
function room(G, plan, at, band) {
  let el = document.getElementById('classroom');
  if (!el) { el = h('div', { id: 'classroom', 'aria-hidden': 'true' }); document.body.appendChild(el); }
  el.replaceChildren(
    h('div', { class: 'cr-board' },
      h('div', { class: 'cr-board-h' }, h('b', {}, `${tr(TEACHER[band])}’s ${tr('class')}`), h('span', {}, tr(BAND_LABEL[band]))),
      h('ol', { class: 'cr-sched' }, ...plan.map((P, i) => h('li', { class: i < at ? 'done' : i === at ? 'now' : '' }, `${P.icon} ${tr(P.title)}`)))),
    h('div', { class: 'cr-desks' }, ...Array.from({ length: 8 }, (_, i) => h('span', { class: 'cr-desk' + (i === 5 ? ' you' : '') }, i === 5 ? '🧑‍🎓' : '🪑'))));
  el.hidden = false; document.body.classList.add('in-class');
}
function leaveRoom() { const el = document.getElementById('classroom'); if (el) el.hidden = true; document.body.classList.remove('in-class'); }

/** a teacher card with a title, the teacher's line, and buttons */
const card = (title, icon, lines, buttons) => UI.sheet(title, (close) => h('div', { class: 'act cr-card' },
  ...lines.map((l) => (typeof l === 'string' ? h('p', { class: 'readable' }, tr(l)) : l)),
  h('div', { class: 'row cr-btns' }, ...buttons.map(([label, val, primary, id]) => h('button', { class: primary ? 'primary' : 'ghost', id, onclick: () => close(val) }, tr(label))))), { icon });

/** one lesson: I do (explain + a worked example), we do (one with help), you do (two on your own) */
async function lesson(G, P, band, id) {
  const sk = SKILLS[id] || {}, T = TEACHER[band];
  const go = await card(`${P.icon} ${tr(P.title)}: ${tr(sk.name || '')}`, P.icon, [
    h('p', { class: 'cr-teacher' }, h('b', {}, `${tr(T)}: `), tr(P.teacher)),
    h('div', { class: 'cr-steps' }, h('span', { class: 'on' }, '👩‍🏫 ' + tr('I do')), h('span', {}, '🤝 ' + tr('We do')), h('span', {}, '🧑‍🎓 ' + tr('You do'))),
    h('p', { class: 'lead readable' }, `🎯 ${tr('Today we will')}: ${tr(sk.objective || sk.name || '')}`),
    sk.explain ? h('p', { class: 'readable cr-rule' }, `📌 ${tr(sk.explain)}`) : null,
  ], [['Show me an example', 'show', true, 'cr-show'], ['Leave for today', null, false, 'cr-leave']]);
  if (!go) return null;
  await showMeHow(G, id, gen(id), { title: tr('I do: watch me') });
  let right = 0, total = 0;
  const r1 = await runActivity(G, gen(id), 'school', `🤝 ${tr('We do')}: ${tr(sk.name || '')}`, P.icon, { gentle: true }); if (!r1) return null; total++; if (r1.ok) right++;
  for (let k = 0; k < 2; k++) { const r = await runActivity(G, gen(id), 'check', `🧑‍🎓 ${tr('You do')} ${k + 1}/2`, P.icon); if (!r) return null; total++; if (r.ok) right++; }
  return [right, total, id];
}

/** run the school day from where it stopped; resolves when the day ends or the learner leaves */
export async function schoolDay(G) {
  const s = G.state, S = sch(s), band = schoolBand(G), plan = dayPlan(band);
  if (G.busy) return;
  if (S.lastDay === s.day && !S.today) { UI.toast(tr('School is over for today. Come back tomorrow!'), 'info', 3200); return; }
  if (!S.today || S.today.day !== s.day) S.today = { day: s.day, at: 0, marks: [], taught: [] };
  const D = S.today; G.busy = true; G.sfx && G.sfx('level');
  try {
    if (D.at === 0) {
      room(G, plan, 0, band);
      const ok = await card(tr('The bell rings!'), '🔔', [h('p', { class: 'cr-teacher' }, h('b', {}, `${tr(TEACHER[band])}: `), tr(band === 'prek' ? 'Good morning, little learner! Come sit on the rug with me.' : 'Good morning! Take your seat. Here is our day.')),
        h('ol', { class: 'cr-agenda' }, ...plan.map((P) => h('li', {}, `${P.icon} ${tr(P.title)}`)))], [['Take my seat', true, true, 'cr-sit'], ['Not today', null, false, 'cr-leave']]);
      if (!ok) return;
    }
    for (; D.at < plan.length; D.at++) {
      const P = plan[D.at]; room(G, plan, D.at, band);
      let mark = null;
      if (P.kind === 'move') { const ok = await card(P.title, P.icon, [h('p', { class: 'cr-teacher' }, h('b', {}, `${tr(TEACHER[band])}: `), tr(P.teacher)), h('p', { class: 'cr-big' }, '🙆 🤸 🦘')], [['I did it!', true, true, 'cr-moved'], ['Leave for today', null, false, 'cr-leave']]); if (!ok) return; continue; }
      if (P.kind === 'calm') { await card(P.title, P.icon, [h('p', { class: 'cr-teacher' }, h('b', {}, `${tr(TEACHER[band])}: `), tr(P.teacher))], [['Goodbye!', true, true, 'cr-bye']]); continue; }
      if (P.kind === 'meeting' || P.kind === 'circle') {
        const f = await UI.say(tr(TEACHER[band]), tr(P.teacher) + ' ' + tr('How are you feeling today?'), ['😀 ' + tr('Happy'), '😐 ' + tr('Okay'), '😟 ' + tr('Worried'), '😴 ' + tr('Tired')]);
        await UI.say(tr(TEACHER[band]), tr(['I love that! Let’s use that energy.', 'Okay is okay. Let’s have a good day together.', 'Thank you for telling me. You can always ask me for help.', 'Let’s take a deep breath together. In… and out. You’ve got this.'][f] || 'Thank you for sharing.'));
        if (P.questions && P.questions.length) {
          let right = 0, total = 0;
          for (const Q of P.questions) { const r = await runActivity(G, () => ({ ...Q }), 'school', P.title, P.icon, { gentle: true }); if (!r) return; total++; if (r.ok) right++; }
          D.marks.push([P.title, right, total, P.icon]); G.save(); continue;
        }
        if (!(P.skills && P.skills.length)) continue;
      }
      if (P.kind === 'story' && P.story) {
        const ok = await card(P.title, P.icon, [h('p', { class: 'cr-teacher' }, h('b', {}, `${tr(TEACHER[band])}: `), tr(P.teacher)), ...P.story.map((l) => h('p', { class: 'readable cr-story' }, tr(l)))], [['The end! Ask me', true, true, 'cr-story-done'], ['Leave for today', null, false, 'cr-leave']]);
        if (!ok) return;
        let right = 0, total = 0;
        for (const Q of P.questions || []) { const r = await runActivity(G, () => ({ ...Q }), 'school', P.title, P.icon, { gentle: true }); if (!r) return; total++; if (r.ok) right++; }
        mark = [right, total];
      } else if (P.kind === 'warmup' || P.kind === 'exit') {
        const pool = (P.kind === 'exit' ? D.taught : G.edu.dueReviews().map((x) => (typeof x === 'string' ? x : x.id))).filter((id) => GEN[id] && GEN[id].length);
        const ids = pool.length ? pool : [lessonSkill(G, ['reading', 'math'])].filter(Boolean);
        const n = P.kind === 'exit' ? 3 : 2;
        const ok = await card(P.title, P.icon, [h('p', { class: 'cr-teacher' }, h('b', {}, `${tr(TEACHER[band])}: `), tr(P.teacher))], [['Start', true, true, 'cr-start'], ['Leave for today', null, false, 'cr-leave']]);
        if (!ok) return;
        let right = 0, total = 0;
        for (let k = 0; k < n && ids.length; k++) { const id = ids[k % ids.length]; const r = await runActivity(G, gen(id), 'check', `${P.icon} ${tr(P.title)} ${k + 1}/${n}`, P.icon); if (!r) return; total++; if (r.ok) right++; }
        mark = [right, total];
      } else {
        const id = lessonSkill(G, P.subj, P.skills);
        if (!id) continue;
        const res = await lesson(G, P, band, id);
        if (!res) return;
        mark = [res[0], res[1]]; D.taught.push(id);
      }
      if (mark && mark[1]) D.marks.push([P.title, mark[0], mark[1], P.icon]);
      G.save();
    }
    // the end of the day: the report card
    leaveRoom();
    S.days = (S.days || 0) + 1; S.streak = S.lastDay === s.day - 1 ? (S.streak || 0) + 1 : 1; S.lastDay = s.day;
    const right = D.marks.reduce((a, m) => a + m[1], 0), total = D.marks.reduce((a, m) => a + m[2], 0), pct = total ? right / total : 1;
    const pay = 20 + Math.round(pct * 20);
    G.earn && G.earn(pay, 'School day');
    G.advance && G.advance(4);
    s.stats.schoolDays = (s.stats.schoolDays || 0) + 1;
    const marks = D.marks.slice(); S.today = null; G.save();
    await reportCard(G, band, marks, pct, pay, S);
    if (S.days === 1) celebrate(G, '🎒 ' + tr('First day of school!'), tr('You finished a whole school day. See you tomorrow!'), { big: true });
  } finally { G.busy = false; leaveRoom(); }
}

/** the report card: how each class went, in kind words, the streak, and tomorrow's homework */
function reportCard(G, band, marks, pct, pay, S) {
  const due = G.edu.dueReviews().slice(0, 3).map((x) => SKILLS[typeof x === 'string' ? x : x.id]).filter(Boolean);
  const word = (r, t) => (r === t ? ['⭐⭐⭐', 'Excellent'] : r / t >= 0.5 ? ['⭐⭐', 'Good work'] : ['⭐', 'Keep practicing']);
  return UI.sheet('Report card', (close) => h('div', { class: 'act cr-report' },
    h('p', { class: 'lead' }, `${tr(TEACHER[band])}: ${tr(pct >= 0.8 ? 'What a day! I am so proud of how hard you worked.' : pct >= 0.5 ? 'Good work today. Every day you get a little stronger.' : 'Today was hard, and you kept going. That is what learners do.')}`),
    h('ul', { class: 'cr-marks' }, ...marks.map(([t, r, n, ic]) => { const [st, w] = word(r, n); return h('li', {}, h('span', {}, `${ic} ${tr(t)}`), h('b', {}, st), h('small', {}, `${tr(w)} · ${r}/${n}`)); })),
    h('p', { class: 'tip' }, `🔥 ${tr('School days in a row')}: ${S.streak} · 🎒 ${tr('Days of school')}: ${S.days} · +${money(pay)}`),
    due.length ? h('p', { class: 'tip' }, `📝 ${tr('Homework: tomorrow we review')} ${due.map((k) => tr(k.name)).join(', ')}.`) : h('p', { class: 'tip' }, '📝 ' + tr('Homework: read something you like for 15 minutes.')),
    h('button', { class: 'primary', id: 'cr-done', onclick: () => close(true) }, tr('See you tomorrow!'))), { icon: '📋', noClose: true });
}

/** the School Day card in the School app */
export function schoolDayCard(G, close) {
  const s = G.state, S = sch(s), band = schoolBand(G), doneToday = S.lastDay === s.day && !S.today;
  return h('div', { class: 'cr-entry' },
    h('div', {}, h('b', {}, `🔔 ${tr('School day')} · ${tr(BAND_LABEL[band])}`), h('small', {}, doneToday ? tr('Done for today. Come back tomorrow!') : S.today && S.today.day === s.day ? tr('Pick up where you left off.') : tr('Sit down for a full day of class: learn, practice, and an exit ticket.'))),
    h('div', { class: 'row' },
      h('button', { class: 'primary sm', id: 'school-day', disabled: doneToday, onclick: () => { close && close(); schoolDay(G); } }, doneToday ? '✓ ' + tr('Done') : tr('Go to class')),
      h('select', { class: 'cr-band', 'aria-label': tr('Which school'), onchange: (e) => { S.band = e.target.value; S.today = null; G.save(); } },
        ...Object.entries(BAND_LABEL).map(([k, l]) => h('option', { value: k, selected: k === band }, tr(l))))));
}
