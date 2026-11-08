// Writing workshop rubric (node tests/writing.mjs): a strong draft meets every check; a weak draft gets specific,
// kid-readable notes that point at the sentence to fix; every prompt has a plan, starters and a sensible length.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {} };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { checkWriting, WRITING_PROMPTS } = await import('../src/writing.js');
const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
const P = (id) => WRITING_PROMPTS.find((p) => p.id === id);
// band 1: a short, correct piece about an animal
const pet = checkWriting(P('pet'), 'I like dogs. My dog has soft brown fur and a long tail. It can run fast and catch a ball. I love my dog because it is fun.', ['dog', 'brown fur', 'runs']);
console.log('pet:', pet.map((r) => (r.ok ? '✓' : '○') + r.trait).join(' '));
if (!pet.every((r) => r.ok)) fail('a good band-1 piece did not meet every check');
// band 3 opinion: good
const good = checkWriting(P('recess'), `I think kids should get a longer recess. One reason is that kids need to move. For example, after running at recess, I can focus better in math. Another reason is that recess helps kids make friends. For instance, my class made a soccer team, and now we all play together. Also, a longer break gives everyone time to eat and rest. That is why recess should be longer, so kids can learn and grow.`, ['longer recess', 'move focus', 'friends soccer', 'learn grow']);
console.log('recess (good):', good.map((r) => (r.ok ? '✓' : '○') + r.trait).join(' '));
if (!good.every((r) => r.ok)) fail('a strong opinion piece did not meet every check');
// band 3 opinion: weak
const weak = checkWriting(P('recess'), 'recess is good. recess is fun. recess is long', []);
console.log('recess (weak):', weak.filter((r) => !r.ok).map((r) => `${r.trait}: ${r.note}`).join(' | '));
for (const t of ['Length', 'Capitals and end marks', 'Clear opinion', 'Different sentence starts']) if (weak.find((r) => r.trait === t).ok) fail(`weak draft passed “${t}”`);
if (!/Sentence 1 should start with a capital/.test(weak.find((r) => r.trait === 'Capitals and end marks').note)) fail('capital note does not point at the sentence');
// band 5 argument needs paragraphs and the other side
const arg = checkWriting(P('phones'), 'Phones should be allowed in class for learning. '.repeat(30), []);
for (const t of ['Paragraphs', 'The other side']) if (arg.find((r) => r.trait === t).ok) fail(`one-paragraph argument passed “${t}”`);
for (const p of WRITING_PROMPTS) if (!p.plan.length || !p.starters.length || !(p.min > 0) || !p.skill) fail(`prompt ${p.id} is incomplete`);
const bands = new Set(WRITING_PROMPTS.map((p) => p.band)); for (const b of [1, 2, 3, 4, 5, 6]) if (!bands.has(b)) fail(`no writing prompt for level ${b}`);
console.log(bad.length ? 'WRITING FAILED' : 'WRITING PASSED');
process.exit(bad.length ? 1 : 0);
