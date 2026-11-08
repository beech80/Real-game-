// REAL — the family view: one page a parent or caregiver can read in a minute. What their child practised this
// week, what they learned, the words they collected, where they're stuck (and how to help), what comes back for
// review, and how they like to learn. Everything is computed on this device from the child's own save.
import { h, UI } from './ui.js';
import { SKILLS, SUBJECTS, STATES } from './edu.js';
import { STYLES, styles } from './learnstyle.js';

const DAY = 864e5;
const dkey = (t) => new Date(t).toISOString().slice(0, 10);

/** the last 7 calendar days of practice, from the edu engine's daily log */
export function weekStats(G, now = Date.now()) {
  const days = (G.edu.s.days || {}), keys = [...Array(7)].map((_, i) => dkey(now - i * DAY));
  const per = keys.map((k) => days[k] || [0, 0, {}]);
  const answered = per.reduce((a, d) => a + d[0], 0), firstTry = per.reduce((a, d) => a + d[1], 0);
  const skillsSeen = {}; per.forEach((d) => Object.entries(d[2] || {}).forEach(([id, n]) => { skillsSeen[id] = (skillsSeen[id] || 0) + n; }));
  const learned = (G.edu.s.journal || []).filter((j) => now - j.t < 7 * DAY && /Proficient|Mastered/.test(j.what) && SKILLS[j.id]);
  const stuck = Object.entries(G.edu.s.skills).filter(([id, k]) => SKILLS[id] && k.st >= 1 && k.st <= 2 && (k.miss || 0) >= 2 && k.lastSeenAt && now - k.lastSeenAt < 14 * DAY)
    .sort((a, b) => (b[1].miss || 0) - (a[1].miss || 0)).slice(0, 3).map(([id, k]) => ({ id, k }));
  return { keys, per, daysPlayed: per.filter((d) => d[0] > 0).length, answered, firstTry, skillsSeen, learned, stuck, due: G.edu.dueReviews(now) };
}
const ERR = { blank: 'leaving the answer blank', close: 'answers that are close but not exact (check the last step)', far: 'answers far from the right one (re-read what is asked)', order: 'putting steps in the wrong order', rubric: 'leaving out parts of the writing checklist', unbalanced: 'budgets that don’t add up', needs: 'skipping must-pay items' };

export function familyView(G) {
  const s = G.state, W = weekStats(G), name = s.name || 'Your child';
  const pct = W.answered ? Math.round(100 * W.firstTry / W.answered) : 0;
  const bars = h('div', { class: 'fam-bars', 'aria-label': 'Questions answered each day this week' }, ...W.keys.slice().reverse().map((k, i) => {
    const d = W.per[6 - i], max = Math.max(1, ...W.per.map((x) => x[0]));
    return h('div', { class: 'fam-bar' }, h('i', { style: { height: `${Math.round(100 * d[0] / max)}%` } }), h('small', {}, new Date(k + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'narrow' })));
  }));
  const topSkills = Object.entries(W.skillsSeen).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => SKILLS[id]);
  const recentWords = (s.words || []).slice(-12);
  const st = styles(G);
  const summary = () => [
    `${name}'s week in REAL`,
    `Practised on ${W.daysPlayed} of 7 days · ${W.answered} questions · ${pct}% right on the first try`,
    W.learned.length ? `Learned: ${[...new Set(W.learned.map((j) => SKILLS[j.id].name))].join(', ')}` : '',
    W.stuck.length ? `Working on: ${W.stuck.map((x) => SKILLS[x.id].name).join(', ')}` : '',
    `Words collected: ${(s.words || []).length}`,
    W.due.length ? `Ready for review: ${W.due.length} skills` : '',
  ].filter(Boolean).join('\n');
  return h('div', { class: 'act family' },
    h('p', { class: 'lead' }, `📅 ${name}’s week`),
    h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'DAYS PLAYED'), h('b', {}, `${W.daysPlayed}/7`)), h('div', {}, h('small', {}, 'QUESTIONS'), h('b', {}, W.answered)), h('div', {}, h('small', {}, 'FIRST TRY'), h('b', {}, `${pct}%`))),
    bars,
    h('div', { class: 'tier-h' }, '🌱 Learned this week'),
    W.learned.length ? h('ul', { class: 'list' }, ...[...new Map(W.learned.map((j) => [j.id, j])).values()].map((j) => h('li', {}, h('b', {}, SKILLS[j.id].name), ` · ${STATES.indexOf(j.what) >= 4 ? 'mastered' : 'can do it on their own'} — ${SKILLS[j.id].objective}`)))
      : h('p', { class: 'tip' }, 'No new skills finished this week yet. Practice still counts: skills grow over several days.'),
    topSkills.length ? h('p', { class: 'tip' }, 'Practised most: ' + topSkills.map((k) => `${SUBJECTS[k.subj].icon} ${k.name}`).join(' · ')) : null,
    h('div', { class: 'tier-h' }, '🧗 Where they’re stuck, and how to help'),
    W.stuck.length ? h('div', {}, ...W.stuck.map(({ id, k }) => { const sk = SKILLS[id], top = Object.entries(k.errs || {}).sort((a, b) => b[1] - a[1])[0];
      return h('div', { class: 'bill' }, h('div', {}, h('b', {}, sk.name), h('small', {}, `${sk.objective}${top && ERR[top[0]] ? ` Most misses: ${ERR[top[0]]}.` : ''}`),
        h('small', { class: 'fam-help' }, `How to help: open 📚 Learn › ${SUBJECTS[sk.subj].name} › ${sk.name} together and tap “Watch one done”. Then ask: “${sk.explain.split(/(?<=[.!?])\s/)[0]} Can you show me?”`))); }))
      : h('p', { class: 'tip' }, 'Nothing stuck right now. 🎉'),
    h('div', { class: 'tier-h' }, '🔁 Coming back for review'),
    h('p', { class: 'tip' }, W.due.length ? `${W.due.length} skill${W.due.length > 1 ? 's are' : ' is'} ready for a quick review: ${W.due.slice(0, 4).map((id) => SKILLS[id].name).join(', ')}. Reviews space out over days and weeks so learning sticks.` : 'No reviews due. Known skills come back on their own, spaced further apart each time.'),
    h('div', { class: 'tier-h' }, `📖 Words (${(s.words || []).length})`),
    recentWords.length ? h('div', { class: 'chips' }, ...recentWords.map((w) => h('span', { class: 'chip' }, w))) : h('p', { class: 'tip' }, 'Tapping any word in the game saves it here.'),
    h('div', { class: 'tier-h' }, '🧠 How they like to learn'),
    h('p', { class: 'tip' }, st.length ? STYLES.filter(([k]) => st.includes(k)).map(([, ic, l]) => `${ic} ${l}`).join(' · ') : 'Not chosen yet. They can pick in 📚 Learn › “How I learn best”. Every way is always available.'),
    h('div', { class: 'tier-h' }, '💬 Talk about it at dinner'),
    h('ul', { class: 'list' }, ...(topSkills.length ? topSkills.slice(0, 3) : Object.values(SKILLS).filter((k) => k.band === 1).slice(0, 3)).map((k) => h('li', {}, `“Can you teach me about ${k.name.toLowerCase()}?” (${k.objective})`))),
    h('div', { class: 'row' }, h('button', { class: 'primary sm', onclick: async () => { try { await navigator.clipboard.writeText(summary()); UI.toast('Copied. Paste it into a text or email.', 'good'); } catch (e) { UI.toast(summary(), 'info', 8000); } } }, '📋 Copy this summary')),
    h('p', { class: 'tip' }, 'Private: this page is made on this device from this save. Nothing is sent anywhere.'));
}
