// How the reading voice says things (node tests/speech.mjs): money, math, fractions, degrees, syllable dots and emoji
// are turned into words a voice reads naturally, in English and Spanish.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { speakable } = await import('../src/readalong.js');
const cases = [
  ['You have $12.50.', 'You have 12 dollars and 50 cents.'],
  ['It costs $1.', 'It costs 1 dollar.'],
  ['3 × 4 = ?', '3 times 4 equals what'],
  ['You eat 1/4 of it.', 'You eat one fourth of it.'],
  ['2 1/2 ft of wire', '2 and one half feet of wire'],
  ['It is -5°F at dawn.', 'It is minus 5 degrees at dawn.'],
  ['ap·ple', 'apple'],
  ['🍎 Apples are 25¢', 'Apples are 25 cents'],
  ['Save 20% now', 'Save 20 percent now'],
  ['Balance: −$15', 'Balance: minus 15 dollars'],
  ['Due 3/15', 'Due 3/15'],
];
let bad = 0;
for (const [i, want] of cases) { const got = speakable(i); if (got !== want) { bad++; console.log('BAD', JSON.stringify(i), '→', JSON.stringify(got), 'want', JSON.stringify(want)); } }
const es = speakable('Cuesta $12.50 y comes 3/4.', true);
if (es !== 'Cuesta 12 dólares con 50 centavos y comes 3 cuartos.') { bad++; console.log('BAD es', es); }
console.log(bad ? 'SPEECH FAILED' : 'SPEECH PASSED'); process.exit(bad ? 1 : 0);
