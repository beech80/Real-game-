// Ask Heart's own answers (node tests/heart.mjs): a word question gets its meaning, a skill question gets the lesson
// (and another way to think about it), the question on screen counts extra, and nonsense gets no made-up answer.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { localAnswer, LINES } = await import('../src/heart.js');
{ const fs = await import('fs'); const ww = {}; for (const f of 'abcdefg') Object.assign(ww, JSON.parse(fs.readFileSync(new URL('../src/ww/' + f + '.json', import.meta.url)))); (await import('../src/learndata.js')).fillLearnData({ ww, kb: JSON.parse(fs.readFileSync(new URL('../src/heartkb.json', import.meta.url))) }); }
let bad = 0; const check = (q, ctx, re) => { const a = localAnswer(q, ctx) || ''; const ok = re.test(a); if (!ok) bad++; console.log(ok ? 'ok ' : 'BAD', JSON.stringify(q), '→', a.slice(0, 110)); };
check('What does budget mean?', {}, /budget/i);
check('How do I add fractions?', {}, /fraction|bottom|denominator|same size/i);
check('How do I start?', { skill: 'math.add' }, /bigger number|count|add/i);
check('What is a complete sentence?', {}, /sentence|who|verb|capital/i);
check('zzqx blorf', {}, /^$/);
check('What does the brain do?', {}, /brain/i);
check('Why do we have seasons?', {}, /tilt/i);
check('What is a credit score?', {}, /300|lenders/i);
for (const [k, v] of Object.entries(LINES)) if (!v.length || v.some((l) => !/[.!?]$/.test(l))) { bad++; console.log('BAD line set', k); }
console.log(bad ? 'HEART FAILED' : 'HEART PASSED'); process.exit(bad ? 1 : 0);
