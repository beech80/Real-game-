// Toolbox calculator shows correct steps (node tests/toolbox.mjs): carrying, borrowing, groups, sharing with
// remainders, divide by zero, and decimals.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { steps } = await import('../src/toolbox.js');
let bad = 0; const t = (a, op, b, ans, re) => { const r = steps(a, op, b); const ok = r.ans === ans && (!re || re.test(r.steps.join(' | '))); if (!ok) bad++; console.log(ok ? 'ok ' : 'BAD', `${a} ${op} ${b} = ${r.ans}`, '·', r.steps.join(' | ').slice(0, 120)); };
t(47, '+', 38, 85, /write 5, carry 1/);
t(52, '−', 17, 35, /borrow/);
t(6, '×', 4, 24, /4 groups of 6/);
t(17, '÷', 5, 3.4, /3 with 2 left over/);
t(5, '÷', 0, null, /zero/);
t(2.5, '+', 1.25, 3.75, /decimal/);
t(3, '−', 8, -5, /below zero/);
console.log(bad ? 'TOOLBOX FAILED' : 'TOOLBOX PASSED'); process.exit(bad ? 1 : 0);
