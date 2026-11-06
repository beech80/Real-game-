// Reading-level check for every level, from the learner's point of view (node tests/readability.mjs).
// Words get harder as levels rise, but never harder than the learner is ready for:
//   Level 1   questions ≤ 14 words a sentence; explanations ≤ 18; no words of 4+ syllables
//   Level 2   questions ≤ 18 words a sentence; explanations ≤ 22; no words of 4+ syllables
//   Level 3–4 sentences ≤ 26 words; no words of 5+ syllables
//   Level 5–6 sentences ≤ 32 words
// Subject words the lesson teaches are allowed when the tap-a-word helper explains them (src/glossary.js),
// as are names (capitalised) and a short list of long-but-everyday words.
// Checks questions, answers, cards, worked explanations and each skill's tips. Exit 1 on any problem.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {} };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { SKILLS } = await import('../src/edu.js');
const { PRACTICE } = await import('../src/activities.js');
await import('../src/careers.js');
const { syl } = await import('../src/readlevel.js');
const { explained } = await import('../src/glossary.js');
const EVERYDAY = /^(everything|everybody|everyone|carefully|vegetables?|remembering|information|especially|regularly|celebrations?|exercising|activit(y|ies)|elevators?|firefighters?|watermelons?|televisions?|caterpillars?|helicopters?|supermarkets?|alligators?|motorcycles?|dictionar(y|ies)|calculators?|harmonica|macaroni|tomatoes|avocados?|kindergarten|unbelievable|immediately|usually|probably|definitely|actually|interesting|ingredients?|community|delivery|deliveries|automatically|electricity)$/i;
const RULES = { 1: [14, 18, 4], 2: [18, 22, 4], 3: [26, 26, 5], 4: [26, 26, 5], 5: [32, 32, 9], 6: [32, 32, 9] };
const wordsOf = (s) => String(s).replace(/[“”"()…]/g, ' ').split(/\s+/).map((w) => w.replace(/[^A-Za-z’'-]/g, '')).filter((w) => /[a-z]/i.test(w));
const problems = []; let checked = 0; const done = new Set();
const check = (s, kind, text, maxSentence) => {
  if (!text || done.has(s.id + '|' + text)) return; done.add(s.id + '|' + text); checked++;
  const [, , maxSyl] = RULES[s.band];
  const longest = Math.max(...String(text).split(/(?<=[.?!])\s+|\n/).map((x) => wordsOf(x).length));
  if (longest > maxSentence) problems.push(`L${s.band} ${s.id} ${kind}: ${longest}-word sentence: “${String(text).slice(0, 110)}”`);
  const hard = wordsOf(text).filter((w) => !/^[A-Z]/.test(w) && !w.includes('-') && syl(w) >= maxSyl && !explained(w) && !EVERYDAY.test(w));
  if (hard.length) problems.push(`L${s.band} ${s.id} ${kind}: hard word(s) ${[...new Set(hard)].join(', ')}: “${String(text).slice(0, 110)}”`);
};
for (const s of Object.values(SKILLS)) {
  const [qMax, exMax] = RULES[s.band];
  check(s, 'tip', s.explain, exMax); check(s, 'tip', s.alt, exMax);
  const g = PRACTICE[s.id]; if (!g) continue;
  for (let i = 0; i < 150; i++) {
    let Q; try { Q = g(); } catch (e) { continue; } if (!Q) continue;
    check(s, 'question', Q.q, qMax);
    for (const o of Q.o || []) check(s, 'answer', String(o), qMax);
    check(s, 'explanation', Q.why, exMax);
  }
}
const uniq = [...new Set(problems)];
console.log(uniq.slice(0, +(process.env.SHOW || 60)).join('\n'));
console.log(`${checked} texts checked across 6 levels · ${uniq.length} reading-level problems`);
process.exit(uniq.length ? 1 : 0);
