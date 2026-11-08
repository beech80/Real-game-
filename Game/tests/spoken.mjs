// Spoken answers: numbers said out loud (English and Spanish, dollars and cents) and matching a spoken choice.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {} };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { parseSpokenNumber: p, matchOption } = await import('../src/voice.js');
const cases = [['42', 42], ['$12.50', 12.5], ['twenty five', 25], ['three hundred and six', 306], ['four point five', 4.5], ['minus three', -3], ['twelve dollars and fifty cents', 12.5], ['veinticinco', 25], ['one thousand two hundred', 1200], ['It is 7', 7], ['seventy', 70], ['nine', 9], ['hello', null], ['-15', -15], ['fifty cents', 0.5]];
let bad = 0; for (const [i, e] of cases) { const v = p(i); if (v !== e) { bad++; console.log('BAD', i, v, e); } }
console.log(matchOption(['cat', 'dog', 'fish'], 'dog'), matchOption(['$5', '$12', '$7'], 'twelve dollars'));
console.log(bad ? 'SPOKEN FAILED' : 'SPOKEN PASSED'); process.exit(bad ? 1 : 0);
