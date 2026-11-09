// Ask Heart's own answers (node tests/heart.mjs): a word question gets its meaning, a skill question gets the lesson
// (and another way to think about it), the question on screen counts extra, and nonsense gets no made-up answer.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { localAnswer, LINES } = await import('../src/heart.js');
let bad = 0; const check = (q, ctx, re) => { const a = localAnswer(q, ctx) || ''; const ok = re.test(a); if (!ok) bad++; console.log(ok ? 'ok ' : 'BAD', JSON.stringify(q), '→', a.slice(0, 110)); };
check('What does budget mean?', {}, /budget means/i);
check('How do I add fractions?', {}, /fraction|bottom|denominator|same size/i);
check('How do I start?', { skill: 'math.add' }, /bigger number|count|add/i);
check('What is a complete sentence?', {}, /sentence|who|verb|capital/i);
check('zzqx blorf', {}, /^$/);
for (const [k, v] of Object.entries(LINES)) if (!v.length || v.some((l) => !/[.!?]$/.test(l))) { bad++; console.log('BAD line set', k); }
console.log(bad ? 'HEART FAILED' : 'HEART PASSED'); process.exit(bad ? 1 : 0);
