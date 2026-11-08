// REAL — the writing workshop. Longer writing the way writers really work: pick a prompt at your level → plan it
// (an organizer) → draft → check it against a rubric that points at the exact sentence to fix → revise as many
// times as you like → publish it to your portfolio. Feedback is about the writing, never a grade on the writer.
import { h, UI } from './ui.js';
import { SKILLS } from './edu.js';
import { say } from './readalong.js';

// ------------------------------------------------------------------------------------------- prompts
// band: reading/writing level. plan: the organizer boxes. kind drives the rubric.
const PROMPTS = [
  { id: 'pet', band: 1, kind: 'tell', skill: 'write.sentences', title: 'My favorite animal', q: 'Tell about an animal you like. What does it look like? What does it do?', plan: ['The animal', 'What it looks like', 'What it does'], starters: ['I like', 'It has', 'It can'], min: 25, sents: 3 },
  { id: 'day', band: 1, kind: 'story', skill: 'write.sentences', title: 'A fun day', q: 'Tell about a fun day. What happened first, next and last?', plan: ['First', 'Next', 'Last'], starters: ['First, I', 'Next, we', 'Last, I felt'], min: 25, sents: 3 },
  { id: 'helper', band: 2, kind: 'tell', skill: 'write.paragraph', title: 'A community helper', q: 'Pick a helper in the city (a nurse, a bus driver, a grocer). Tell what they do and why it matters.', plan: ['The helper', 'What they do', 'Why it matters'], starters: ['A … helps people by', 'Every day, they', 'This matters because'], min: 45, sents: 4 },
  { id: 'howto', band: 2, kind: 'howto', skill: 'write.paragraph', title: 'How to make a sandwich', q: 'Teach someone how to make a sandwich, step by step.', plan: ['What you need', 'Steps', 'How it ends'], starters: ['First,', 'Next,', 'Then,', 'Last,'], min: 45, sents: 4 },
  { id: 'recess', band: 3, kind: 'opinion', skill: 'write.persuasive', title: 'Longer recess?', q: 'Should kids get a longer recess? Give your opinion, two reasons with examples, and an ending.', plan: ['My opinion', 'Reason 1 + example', 'Reason 2 + example', 'Ending'], starters: ['I think', 'One reason is', 'For example,', 'Another reason is', 'That is why'], min: 70, sents: 5 },
  { id: 'letter', band: 3, kind: 'letter', skill: 'write.email', title: 'A letter to Rosa', q: 'Write a letter to Rosa at Fresh Mart asking for more weekend shifts. Be polite and say why.', plan: ['Greeting', 'What you’re asking', 'Why (2 reasons)', 'Thank you + closing'], starters: ['Dear Rosa,', 'I am writing to ask', 'I would like this because', 'Thank you for', 'Sincerely,'], min: 70, sents: 5 },
  { id: 'park', band: 4, kind: 'opinion', skill: 'write.persuasive', title: 'Fix the park or build a skate park?', q: 'The city can afford one project: fix the old park or build a new skate park. Which should it choose? Use reasons and evidence, and answer the other side.', plan: ['Claim', 'Reason 1 + evidence', 'Reason 2 + evidence', 'The other side (and your answer)', 'Conclusion'], starters: ['The city should', 'First,', 'In addition,', 'Some people say', 'However,', 'In conclusion,'], min: 140, sents: 7, paras: 2 },
  { id: 'report', band: 4, kind: 'report', skill: 'write.report', title: 'Report: a job in the city', q: 'Write a short report on a job in REAL’s city: what the worker does, the skills they need, and the pay. Use headings or paragraphs.', plan: ['Introduction', 'What they do', 'Skills needed', 'Pay and training', 'Conclusion'], starters: ['A … is someone who', 'Each day,', 'To do this job, you need', 'Most … earn about', 'Overall,'], min: 140, sents: 7, paras: 3 },
  { id: 'phones', band: 5, kind: 'argument', skill: 'write.argument', title: 'Phones in class', q: 'Should phones be allowed in class? Write an argument essay: a clear claim, two reasons with evidence, a counterclaim with a rebuttal, and a conclusion.', plan: ['Claim (thesis)', 'Reason 1 + evidence', 'Reason 2 + evidence', 'Counterclaim + rebuttal', 'Conclusion'], starters: ['Phones should', 'The strongest reason is', 'For instance,', 'Opponents argue that', 'However,', 'Ultimately,'], min: 220, sents: 10, paras: 4 },
  { id: 'wage', band: 6, kind: 'argument', skill: 'write.analytical', title: 'Raising the minimum wage', q: 'Analyze one effect of raising the minimum wage on a small business like a coffee cart. Explain the trade-offs with numbers and reach a reasoned conclusion.', plan: ['Thesis', 'Effect on costs (numbers)', 'Effect on workers/customers', 'Trade-offs and other views', 'Conclusion'], starters: ['Raising the minimum wage would', 'If a cart pays', 'On the other hand,', 'Critics contend', 'Weighing these,'], min: 260, sents: 12, paras: 4 },
];
export const WRITING_PROMPTS = PROMPTS;

// ------------------------------------------------------------------------------------------- the rubric
const sentencesOf = (t) => String(t).replace(/\s+/g, ' ').split(/(?<=[.!?]["”]?)\s+/).map((x) => x.trim()).filter(Boolean);
const LINK = /\b(because|first|next|then|also|for example|for instance|finally|however|in addition|another|so|that is why|as a result|in conclusion|overall|although|therefore|on the other hand|ultimately)\b/i;
const END = /\b(that is why|that's why|in conclusion|overall|so|finally|ultimately|in the end|to sum up|weighing these|last)\b/i;
const OTHER = /\b(some people|others|opponents|critics|people who disagree|the other side|on the other hand|however)\b/i;
const EVID = /\d|\b(for example|for instance|according to|studies|survey|data|percent|evidence)\b/i;
const words = (t) => (String(t).match(/[A-Za-z’']+/g) || []);

/** Check a draft. Each trait: ok, a kid-readable note, and (when we can) the sentence to look at. */
export function checkWriting(P, text, plan = []) {
  const t = String(text).trim(), S = sentencesOf(t), W = words(t), paras = t.split(/\n\s*\n|\n(?=\s*\S)/).filter((p) => words(p).length >= 8);
  const out = [];
  const add = (trait, ok, note, at) => out.push({ trait, ok, note, at });
  add('Length', W.length >= P.min, W.length >= P.min ? `${W.length} words. Enough to explain your ideas.` : `${W.length} of about ${P.min} words. Add more detail: who, what, why, an example.`);
  const noCap = S.findIndex((x) => /^["“]?[a-z]/.test(x)), noEnd = S.findIndex((x) => !/[.!?]["”]?$/.test(x));
  add('Capitals and end marks', noCap < 0 && noEnd < 0 && !/\bi\b/.test(t), noCap >= 0 ? `Sentence ${noCap + 1} should start with a capital letter.` : noEnd >= 0 ? `Sentence ${noEnd + 1} needs an end mark (. ! ?).` : /\bi\b/.test(t) ? 'When “I” means you, it is always a capital letter.' : 'Every sentence starts with a capital and ends with a mark.', noCap >= 0 ? noCap : noEnd >= 0 ? noEnd : null);
  add('Complete sentences', S.length >= P.sents, S.length >= P.sents ? `${S.length} sentences.` : `${S.length} of about ${P.sents} sentences. Each idea gets its own sentence.`);
  const planWords = [...new Set(plan.flatMap((p) => words(p).filter((w) => w.length >= 3).map((w) => w.toLowerCase().slice(0, 4))))], need = Math.min(2, planWords.length);
  if (plan.some((p) => p.trim())) { const used = planWords.filter((w) => t.toLowerCase().includes(w)).length; add('Uses your plan', used >= need, used >= need ? 'Your draft follows your plan.' : 'Look at your plan: some of those ideas aren’t in the draft yet.'); }
  const links = S.filter((x) => LINK.test(x)).length;
  const needLinks = P.band <= 1 ? 1 : Math.min(3, Math.ceil(P.sents / 2));
  add('Linking words', links >= needLinks, links >= needLinks ? 'Your ideas are joined with linking words.' : 'Join ideas with words like because, for example, next, also, however.');
  const firsts = S.map((x) => (words(x)[0] || '').toLowerCase()), same = firsts.find((f, i) => f && firsts.indexOf(f) !== i && firsts.filter((g) => g === f).length >= 3);
  add('Different sentence starts', !same, same ? `Three or more sentences start with “${same}”. Try starting one a different way.` : 'Your sentences start in different ways.', same ? firsts.indexOf(same) : null);
  if (['opinion', 'argument'].includes(P.kind)) {
    const claim = /\b(i think|i believe|should|must|in my opinion|the best|ought)\b/i.test(S.slice(0, 2).join(' '));
    add('Clear opinion', claim, claim ? 'Your opinion is clear at the start.' : 'Say your opinion in the first or second sentence (I think… / The city should…).', claim ? null : 0);
    add('Reasons with examples', EVID.test(t) && /\b(because|reason)\b/i.test(t), EVID.test(t) && /\b(because|reason)\b/i.test(t) ? 'You give reasons and back them up.' : 'Give a reason (because…) and back it up with an example, a fact or a number.');
    if (P.band >= 4) add('The other side', OTHER.test(t), OTHER.test(t) ? 'You answer the other side. That makes your argument stronger.' : 'Add what someone who disagrees might say, then answer it (Some people say… However…).');
  }
  if (P.kind === 'letter') { const ok = /^dear\b/i.test(t) && /\b(sincerely|thank you|best|from|regards)\b/i.test(t.slice(-80)); add('Letter parts', ok, ok ? 'It has a greeting and a closing.' : 'A letter starts with “Dear …,” and ends with a closing like “Sincerely, your name”.'); }
  if (P.kind === 'howto' || P.kind === 'story') { const seq = (t.match(/\b(first|next|then|after that|last|finally)\b/gi) || []).length; add('Order words', seq >= 2, seq >= 2 ? 'Order words show what happens when.' : 'Use first, next, then, last so readers can follow.'); }
  if (P.paras) add('Paragraphs', paras.length >= P.paras, paras.length >= P.paras ? `${paras.length} paragraphs.` : `Split it into about ${P.paras + 1} paragraphs: one for each part of your plan. Press Enter twice between them.`);
  if (P.band >= 2) { const last = S[S.length - 1] || '', endOk = S.length >= 3 && (END.test(last) || words(last).length >= 6); add('Strong ending', endOk, endOk ? 'Your ending wraps it up.' : 'End with a sentence that sums it up (That is why… / In the end…).', S.length - 1); }
  return out;
}

// ------------------------------------------------------------------------------------------- the workshop
export function writingWorkshop(G) {
  const s = G.state, folio = s.portfolio || (s.portfolio = []);
  return UI.sheet('Writing workshop', (close, body) => {
    const level = Math.max(1, Math.min(6, G.edu.band('writing')));
    const menu = () => body.replaceChildren(h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'Writers plan, draft, check and revise. Pick something to write.'),
      h('div', { class: 'bill-list' }, ...PROMPTS.filter((p) => Math.abs(p.band - level) <= 1 || p.band <= 1 && level <= 2).map((p) => h('button', { class: 'skillrow', onclick: () => plan(p) }, h('div', {}, h('b', {}, p.title), h('small', {}, p.q)), h('span', { class: 'chipst' }, `Level ${p.band}`)))),
      h('details', {}, h('summary', {}, 'More prompts (other levels)'), h('div', { class: 'bill-list' }, ...PROMPTS.filter((p) => !(Math.abs(p.band - level) <= 1 || p.band <= 1 && level <= 2)).map((p) => h('button', { class: 'skillrow', onclick: () => plan(p) }, h('div', {}, h('b', {}, p.title), h('small', {}, p.q)), h('span', { class: 'chipst' }, `Level ${p.band}`))))),
      h('div', { class: 'tier-h' }, `📁 My portfolio (${folio.length})`),
      folio.length ? h('div', { class: 'bill-list' }, ...folio.slice().reverse().map((f) => h('button', { class: 'skillrow', onclick: () => view(f) }, h('div', {}, h('b', {}, f.title), h('small', {}, `${f.date} · ${f.words} words · ${f.rounds} revision${f.rounds === 1 ? '' : 's'} · ${f.met}/${f.of} checks`))))) : h('p', { class: 'tip' }, 'Pieces you finish are saved here, so you can see your writing grow.')));
    const plan = (P) => {
      const boxes = P.plan.map((label) => h('textarea', { class: 'writebox plan-box', rows: 2, placeholder: label, 'aria-label': label }));
      body.replaceChildren(h('div', { class: 'act' }, h('div', { class: 'lc-subj' }, `✍️ Step 1 of 3 · Plan`), h('h3', {}, P.title), h('p', { class: 'lead readable' }, P.q),
        h('button', { class: 'ghost sm', onclick: () => say(P.q) }, '🔊 Read the prompt'),
        h('p', { class: 'tip' }, 'Jot a few words in each box. It doesn’t need to be full sentences.'),
        h('div', { class: 'plan-grid' }, ...P.plan.map((label, i) => h('label', { class: 'plan-cell' }, h('b', {}, label), boxes[i]))),
        h('div', { class: 'row' }, h('button', { class: 'ghost', onclick: menu }, '‹ Prompts'), h('button', { class: 'primary', onclick: () => draft(P, boxes.map((b) => b.value)) }, 'Start my draft ›'))));
    };
    const draft = (P, planTxt, text = '', rounds = 0, history = []) => {
      const ta = h('textarea', { class: 'writebox draft-box', rows: P.band >= 4 ? 14 : 8, placeholder: 'Write here. Press Enter twice to start a new paragraph.' }); ta.value = text;
      const count = h('small', { class: 'tip' }), fb = h('div', { class: 'rubric' });
      const upd = () => { count.textContent = `${words(ta.value).length} words · aim for about ${P.min}`; }; ta.oninput = upd; upd();
      const starters = h('div', { class: 'chips' }, ...P.starters.map((st) => h('button', { class: 'chip style', onclick: () => { ta.value += (ta.value && !/\s$/.test(ta.value) ? ' ' : '') + st + ' '; ta.focus(); upd(); } }, st)));
      const check = () => {
        const res = checkWriting(P, ta.value, planTxt), met = res.filter((r) => r.ok).length;
        history.push(met); rounds++;
        const S = sentencesOf(ta.value);
        fb.replaceChildren(h('div', { class: 'tier-h' }, `✓ ${met} of ${res.length} checks` + (history.length > 1 ? ` (last time ${history[history.length - 2]})` : '')),
          ...res.map((r) => h('div', { class: 'rub-row ' + (r.ok ? 'ok' : 'todo') }, h('b', {}, (r.ok ? '✓ ' : '○ ') + r.trait), h('span', {}, ' ' + r.note), r.at != null && S[r.at] && !r.ok ? h('q', { class: 'rub-at' }, S[r.at]) : null)),
          met === res.length ? h('p', { class: 'tip good' }, '🎉 Every check is met. Read it aloud once more, then publish it.') : h('p', { class: 'tip' }, 'Pick one ○ to fix, change your draft, then check again. Writers revise many times.'));
        pub.hidden = met < Math.ceil(res.length * 0.6); pub.textContent = met === res.length ? '📁 Publish to my portfolio' : '📁 Publish it anyway';
        fb.scrollIntoView && fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return { res, met };
      };
      const pub = h('button', { class: 'primary', hidden: true, onclick: () => {
        const { res, met } = check();
        const f = { id: P.id, title: P.title, text: ta.value, plan: planTxt, words: words(ta.value).length, rounds: rounds - 1, met, of: res.length, date: new Date().toISOString().slice(0, 10), t: Date.now(), history: history.slice() };
        folio.push(f); if (folio.length > 30) folio.shift();
        G.edu.record(P.skill, met === res.length, { ctx: 'workshop', hinted: met < res.length });
        if (met === res.length && rounds > 1) G.edu.record('write.sentences', true, { ctx: 'workshop' });
        G.state.stats.pieces = (G.state.stats.pieces || 0) + 1; G.sfx && G.sfx('level'); G.save();
        UI.toast(`📁 “${P.title}” is in your portfolio. ${f.rounds ? `You revised it ${f.rounds} time${f.rounds > 1 ? 's' : ''}.` : ''}`, 'good', 4200); view(f);
      } }, '📁 Publish');
      body.replaceChildren(h('div', { class: 'act' }, h('div', { class: 'lc-subj' }, `✍️ Step 2 of 3 · Draft and revise`), h('h3', {}, P.title), h('p', { class: 'tip readable' }, P.q),
        planTxt.some((p) => p.trim()) ? h('details', { open: true }, h('summary', {}, 'My plan'), h('ul', { class: 'list' }, ...P.plan.map((l, i) => planTxt[i] ? h('li', {}, h('b', {}, l + ': '), planTxt[i]) : null))) : null,
        h('p', { class: 'tip' }, 'Sentence starters (tap to add):'), starters, ta, count,
        h('div', { class: 'row' }, h('button', { class: 'ghost sm', onclick: () => say(ta.value || 'Your draft is empty.') }, '🔊 Read my draft to me'), h('button', { class: 'primary', onclick: check }, '✅ Check my writing'), pub),
        fb, h('button', { class: 'ghost sm', onclick: () => plan(P) }, '‹ Back to my plan')));
    };
    const view = (f) => body.replaceChildren(h('div', { class: 'act' }, h('div', { class: 'lc-subj' }, `📁 Portfolio · ${f.date}`), h('h3', {}, f.title),
      h('div', { class: 'published readable' }, ...f.text.split(/\n\s*\n/).map((p) => h('p', {}, p))),
      h('p', { class: 'tip' }, `${f.words} words · ${f.met} of ${f.of} checks · revised ${f.rounds} time${f.rounds === 1 ? '' : 's'}${f.history && f.history.length > 1 ? ` · checks met each round: ${f.history.join(' → ')}` : ''}`),
      h('div', { class: 'row' }, h('button', { class: 'ghost sm', onclick: () => say(f.text) }, '🔊 Read it to me'), h('button', { class: 'ghost', onclick: menu }, '‹ Workshop'))));
    menu();
    return h('div');
  }, { icon: '✍️', cls: 'wide' });
}
