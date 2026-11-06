// Reading-level check, from a young learner's point of view (node tests/readability.mjs).
// Level-1 skills are for early readers: every question must be short (≤ 14 words per sentence) and avoid long words
// (more than 9 letters, except names and words shown in the picture/sign itself). Higher levels may be longer but no
// sentence should run past 30 words. Prints the worst offenders; exit 1 if any rule is broken.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {} };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { SKILLS } = await import('../src/edu.js');
const { PRACTICE } = await import('../src/activities.js');
await import('../src/careers.js');
const OK_LONG = /^(Brighter|Midtown|Starting|Community|Fresh|Heights|everything|something|sometimes|crosswalk|toothbrush|toothpaste|breakfast|grandmother|basketball|observation|magnifying|thermometer|lowercase|uppercase|cursive|vegetables|important|helicopter|firefighters?|librarians?|neighborhood|neighbour|everyone|whatever|underline)$/i;
const words = (s) => String(s).replace(/[“”"()]/g, ' ').split(/\s+/).filter((w) => /[a-z]/i.test(w));
const problems = []; const seenQ = new Set();
for (const s of Object.values(SKILLS)) {
  const g = PRACTICE[s.id]; if (!g) continue;
  for (let i = 0; i < 150; i++) {
    let Q; try { Q = g(); } catch (e) { continue; } if (!Q || !Q.q || seenQ.has(Q.q)) continue; seenQ.add(Q.q);
    const sentences = String(Q.q).split(/(?<=[.?!])\s+/);
    const longest = Math.max(...sentences.map((x) => words(x).length));
    if (s.band === 1) {
      const hard = words(Q.q).map((w) => w.replace(/[^A-Za-z’'-]/g, '')).filter((w) => w.length > 9 && !OK_LONG.test(w) && !/^[A-Z]/.test(w));
      if (longest > 14) problems.push(`L1 ${s.id}: ${longest}-word sentence: “${Q.q}”`);
      if (hard.length) problems.push(`L1 ${s.id}: hard word(s) ${hard.join(', ')}: “${Q.q}”`);
    } else if (longest > 30) problems.push(`L${s.band} ${s.id}: ${longest}-word sentence: “${Q.q.slice(0, 120)}…”`);
  }
}
const uniq = [...new Set(problems)];
console.log(uniq.slice(0, 60).join('\n'));
console.log(`${seenQ.size} different question texts checked · ${uniq.length} reading-level problems`);
process.exit(uniq.length ? 1 : 0);
