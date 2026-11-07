// REAL — K–2 foundations, rebuilt after a K–2 reading-specialist review (science of reading, early numeracy).
// These banks REPLACE the older early items for the same skills (K2_REPLACE), so giveaway items can't come back.
//  * Decoding items set `decode: true`: the answer is never spoken, options are never read aloud, the printed word is
//    never shown next to its picture. The child has to read.
//  * Phonological awareness (read.sounds) is listening-only, so reading it aloud is fair.
//  * Distractors are minimal pairs and real early errors (b/d/p/q, hat/hot/hit, counting on from the wrong number…).
//  * Every item has a worked `why`. Items carry `diff` (1 easiest … 6) so new learners start simple and grow.
// Pure data / functions only (no DOM): tests/curriculum.test.mjs validates every generator.

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
/** choice item; wrong answers are de-duplicated and never equal the key */
const ch = (skill, q, a, wrong, why, extra = {}) => ({ type: 'choice', skill, q, a, o: [a, ...[...new Set(wrong.map(String))].filter((w) => w !== String(a)).slice(0, 3)], why, ...extra });
const num = (skill, q, a, why, extra = {}) => ({ type: 'number', skill, q, a, why, ...extra });

// ------------------------------------------------------------------------------------------------ reading: letters
const FIRST = [['ball', '⚽', 'b'], ['dog', '🐶', 'd'], ['fish', '🐟', 'f'], ['goat', '🐐', 'g'], ['hat', '🎩', 'h'], ['jar', '🫙', 'j'], ['key', '🔑', 'k'], ['lion', '🦁', 'l'],
  ['moon', '🌙', 'm'], ['nut', '🥜', 'n'], ['pig', '🐷', 'p'], ['rain', '🌧️', 'r'], ['sun', '☀️', 's'], ['tiger', '🐯', 't'], ['van', '🚐', 'v'], ['web', '🕸️', 'w'], ['zebra', '🦓', 'z'],
  ['apple', '🍎', 'a'], ['egg', '🥚', 'e'], ['octopus', '🐙', 'o'], ['umbrella', '☂️', 'u'], ['yo-yo', '🪀', 'y'], ['bed', '🛏️', 'b'], ['map', '🗺️', 'm'], ['ten', '🔟', 't'], ['nest', '🪺', 'n']];
const CONFUSE = { b: 'dpv', d: 'bpt', p: 'bdq', q: 'pgd', m: 'nwh', n: 'mhu', f: 'vtl', v: 'fwb', t: 'dfl', s: 'zcx', z: 'sjv', g: 'jqk', j: 'gyz', k: 'gth', h: 'nkm', l: 'tif', r: 'wln', w: 'vmr', y: 'jwv', a: 'eou', e: 'aiu', o: 'aue', u: 'oai' };
const CASES = { B: 'bdpq', D: 'dbpq', P: 'pqbd', Q: 'qpgd', M: 'mnwu', N: 'nmuh', G: 'gqpj', E: 'eaoc', A: 'aoed', R: 'rnhf', T: 'tfli', H: 'hnbk', F: 'ftlk', L: 'litj', Y: 'yvjg' };
const letters = [
  () => { const [w, e, f] = pick(FIRST); const wrong = shuffle(CONFUSE[f].split('')).slice(0, 2).concat(pick('bdfghjlmnprstvwz'.split('').filter((x) => x !== f && !CONFUSE[f].includes(x))));
    return ch('read.letters', 'Look at the picture and listen. Which letter makes the first sound?', f, wrong, `“${w}” starts with the /${f === 'y' ? 'y' : f}/ sound. The letter ${f} makes that sound.`, { v: { big: e }, say: w, diff: 1 }); },
  () => { const U = pick(Object.keys(CASES)); const [l, ...w] = CASES[U].split('');
    return ch('read.letters', `Which lowercase letter matches the capital ${U}?`, l, w, `Capital ${U} and lowercase ${l} are the same letter. Watch out: ${w.slice(0, 2).join(' and ')} look a lot like it.`, { v: { big: U }, decode: true, diff: 2 }); },
];

// ------------------------------------------------------------------------------------------------ reading: phonics (decoding)
// [word, picture, sounds, near-miss words (real or nonsense), diff]
const PHON = [
  // CVC, short vowels
  ['cat', '🐱', 'c-a-t', ['cot', 'cut', 'cap'], 1], ['hat', '🎩', 'h-a-t', ['hot', 'hit', 'ham'], 1], ['dog', '🐶', 'd-o-g', ['dig', 'dot', 'log'], 1], ['pig', '🐷', 'p-i-g', ['peg', 'big', 'pit'], 1],
  ['bus', '🚌', 'b-u-s', ['bat', 'bud', 'but'], 1], ['bed', '🛏️', 'b-e-d', ['bad', 'bud', 'red'], 1], ['map', '🗺️', 'm-a-p', ['mop', 'cap', 'mat'], 1], ['ten', '🔟', 't-e-n', ['tin', 'tan', 'hen'], 1],
  ['bug', '🐛', 'b-u-g', ['bag', 'big', 'rug'], 1], ['fox', '🦊', 'f-o-x', ['fix', 'box', 'fog'], 1], ['web', '🕸️', 'w-e-b', ['wet', 'wed', 'tab'], 1], ['sun', '☀️', 's-u-n', ['sat', 'run', 'sub'], 1],
  // digraphs (sh, ch, th, ck)
  ['ship', '🚢', 'sh-i-p', ['sip', 'chip', 'shop'], 2], ['fish', '🐟', 'f-i-sh', ['fist', 'dish', 'fin'], 2], ['chick', '🐤', 'ch-i-ck', ['check', 'chin', 'kick'], 2], ['bath', '🛁', 'b-a-th', ['bat', 'math', 'path'], 2],
  ['duck', '🦆', 'd-u-ck', ['dock', 'dug', 'luck'], 2], ['shell', '🐚', 'sh-e-ll', ['sell', 'spell', 'shall'], 2], ['sock', '🧦', 's-o-ck', ['sack', 'sick', 'rock'], 2],
  // blends
  ['frog', '🐸', 'f-r-o-g', ['fog', 'flag', 'from'], 3], ['crab', '🦀', 'c-r-a-b', ['cab', 'grab', 'crib'], 3], ['drum', '🥁', 'd-r-u-m', ['dum', 'drip', 'rum'], 3], ['flag', '🚩', 'f-l-a-g', ['flap', 'flat', 'glad'], 3],
  ['stop', '🛑', 's-t-o-p', ['top', 'step', 'spot'], 3], ['sled', '🛷', 's-l-e-d', ['led', 'slid', 'sped'], 3], ['plant', '🪴', 'p-l-a-n-t', ['pant', 'plan', 'slant'], 3], ['nest', '🪺', 'n-e-s-t', ['net', 'next', 'rest'], 3],
  // silent e (vowel-consonant-e)
  ['cake', '🎂', 'c-a-ke (long a)', ['cap', 'lake', 'cane'], 4], ['kite', '🪁', 'k-i-te (long i)', ['kit', 'bite', 'note'], 4], ['rose', '🌹', 'r-o-se (long o)', ['rod', 'nose', 'rise'], 4],
  ['bike', '🚲', 'b-i-ke (long i)', ['bite', 'like', 'bake'], 4], ['cube', '🧊', 'c-u-be (long u)', ['cub', 'tube', 'cute'], 4], ['bone', '🦴', 'b-o-ne (long o)', ['bun', 'cone', 'band'], 4],
  // vowel teams
  ['rain', '🌧️', 'r-ai-n', ['ran', 'train', 'rail'], 5], ['tree', '🌳', 't-r-ee', ['three', 'tea', 'free'], 5], ['boat', '⛵', 'b-oa-t', ['bat', 'coat', 'boot'], 5], ['moon', '🌙', 'm-oo-n', ['man', 'noon', 'mood'], 5],
  ['leaf', '🍃', 'l-ea-f', ['loaf', 'lean', 'left'], 5], ['snow', '❄️', 's-n-ow', ['now', 'slow', 'snap'], 5],
  // r-controlled
  ['car', '🚗', 'c-ar', ['cat', 'curl', 'jar'], 6], ['star', '⭐', 's-t-ar', ['stir', 'stop', 'tar'], 6], ['bird', '🐦', 'b-ir-d', ['bid', 'third', 'bud'], 6], ['corn', '🌽', 'c-or-n', ['cone', 'born', 'coin'], 6], ['shirt', '👕', 'sh-ir-t', ['short', 'shut', 'skirt'], 6],
];
const phonics = [() => { const [w, e, snd, near, d] = pick(PHON);
  return ch('read.phonics', 'Read each word. Which word names the picture?', w, near, `Say each sound, then blend them: ${snd} → “${w}”. ${near[0]} has a different sound, so it doesn’t match.`, { v: { big: e }, decode: true, diff: d }); },
  () => { const [w, e, snd, near, d] = pick(PHON);   // the other direction: read one word, find its picture
    const others = shuffle(PHON.filter((p) => p[0] !== w && p[4] <= Math.max(2, d) && p[0][0] !== w[0])).slice(0, 3);
    return ch('read.phonics', `Read the word: ${w}. Which picture is it?`, e, others.map((p) => p[1]), `${snd} → “${w}”, the ${e}.`, { decode: true, diff: d }); }];

// ------------------------------------------------------------------------------------------------ reading: phonological awareness (listening)
const RHYME = [['cat', '🐱', ['🦇 bat', '🎩 hat'], ['🐶 dog', '☀️ sun', '🐟 fish']], ['dog', '🐶', ['🪵 log', '🐸 frog'], ['🐱 cat', '🚌 bus', '🔑 key']], ['bee', '🐝', ['🌳 tree', '🔑 key'], ['🐱 cat', '🦊 fox', '☀️ sun']],
  ['cake', '🎂', ['🐍 snake', '🌊 lake'], ['🐶 dog', '🚌 bus', '⭐ star']], ['star', '⭐', ['🚗 car', '🫙 jar'], ['🌙 moon', '🐷 pig', '🐟 fish']], ['moon', '🌙', ['🥄 spoon', '🎈 balloon'], ['⭐ star', '🐱 cat', '🛏️ bed']],
  ['bed', '🛏️', ['🍞 bread', '🔴 red'], ['🐷 pig', '🐶 dog', '☀️ sun']], ['king', '👑', ['💍 ring', '🪽 wing'], ['🐶 dog', '🎂 cake', '🚌 bus']]];
const CLAP = [['cat', 1], ['dog', 1], ['sun', 1], ['apple', 2], ['tiger', 2], ['rabbit', 2], ['pencil', 2], ['banana', 3], ['elephant', 3], ['butterfly', 3], ['computer', 3], ['caterpillar', 4], ['watermelon', 4]];
const START = [['sun', '☀️', ['🧦 sock', '🐍 snake'], ['🎩 hat', '🐶 dog', '🌙 moon']], ['moon', '🌙', ['🗺️ map', '🐒 monkey'], ['☀️ sun', '🐟 fish', '🐱 cat']], ['fish', '🐟', ['🦊 fox', '🚩 flag'], ['🐷 pig', '🚌 bus', '🐶 dog']], ['bus', '🚌', ['⚽ ball', '🛏️ bed'], ['🐱 cat', '🦊 fox', '🌙 moon']]];
const SOUNDS = [
  () => { const [w, e, yes, no] = pick(RHYME); const a = pick(yes); return ch('read.sounds', `Listen: “${w}”. Which word rhymes with ${w}?`, a, shuffle(no).slice(0, 3), `Rhyming words sound the same at the end: ${w} – ${a.split(' ')[1]}.`, { v: { big: e }, listen: true, diff: 1 }); },
  () => { const [w, n] = pick(CLAP); return ch('read.sounds', `Clap the word: “${w}”. How many claps (syllables)?`, String(n), ['1', '2', '3', '4'].filter((x) => x !== String(n)), `Each clap is one syllable. “${w}” has ${n}.`, { listen: true, say: w, diff: 2 }); },
  () => { const [w, e, yes, no] = pick(START); const a = pick(yes); return ch('read.sounds', `Which word starts with the same sound as “${w}”?`, a, shuffle(no).slice(0, 3), `${w} and ${a.split(' ')[1]} both start with the /${w[0]}/ sound.`, { v: { big: e }, listen: true, diff: 2 }); },
  () => { const [whole, part, rest, w2] = pick([['cupcake', 'cup', 'cake', 'cap'], ['sunshine', 'sun', 'shine', 'sign'], ['rainbow', 'rain', 'bow', 'bay'], ['football', 'foot', 'ball', 'bell'], ['bedroom', 'bed', 'room', 'broom']]);
    return ch('read.sounds', `Say “${whole}”. Now say it without “${part}”. What word is left?`, rest, [part, w2, whole], `${whole} = ${part} + ${rest}. Take away ${part} and “${rest}” is left.`, { listen: true, diff: 3 }); },
  () => { const [w, e, mid, wrong] = pick([['cat', '🐱', 'a', ['i', 'o']], ['pig', '🐷', 'i', ['a', 'e']], ['sun', '☀️', 'u', ['o', 'a']], ['dog', '🐶', 'o', ['u', 'a']], ['bed', '🛏️', 'e', ['i', 'a']]]);
    return ch('read.sounds', `Listen: “${w}”. What is the middle sound?`, `/${mid}/`, wrong.map((x) => `/${x}/`), `${w.split('').join('-')}: the middle sound is /${mid}/.`, { v: { big: e }, listen: true, say: w, diff: 3 }); },
];

// ------------------------------------------------------------------------------------------------ reading: decodable sentences
const SUBJ = [['cat', '🐱'], ['dog', '🐶'], ['fox', '🦊'], ['pig', '🐷'], ['hen', '🐔']], OBJ = [['hat', '🎩'], ['bag', '👜'], ['box', '📦'], ['sock', '🧦'], ['cup', '☕']];
const sentences = [() => { const [s, se] = pick(SUBJ), [o, oe] = pick(OBJ); const s2 = pick(SUBJ.filter((x) => x[0] !== s)), o2 = pick(OBJ.filter((x) => x[0] !== o));
  const verb = pick(['has a', 'sits on a', 'naps in a']);
  return ch('read.sentences', `Read the sentence: “The ${s} ${verb} ${o}.” Which picture shows it?`, `${se} ${oe}`, [`${s2[1]} ${oe}`, `${se} ${o2[1]}`, `${s2[1]} ${o2[1]}`], `The sentence names the ${s} ${se} and the ${o} ${oe}. Read both words to find the match.`, { decode: true, diff: 2 }); }];

// ------------------------------------------------------------------------------------------------ spelling (band 1): heart words and CVC
const SPELL = [['the', ['teh', 'th', 'thu']], ['said', ['sed', 'siad', 'sayd']], ['was', ['wuz', 'waz', 'wsa']], ['you', ['yu', 'yuo', 'yoo']], ['have', ['hav', 'haev', 'havv']], ['they', ['thay', 'tehy', 'thei']],
  ['play', ['pley', 'plai', 'paly']], ['cat', ['kat', 'cta', 'catt']], ['dog', ['dawg', 'dgo', 'doog']], ['ship', ['shp', 'shipp', 'sihp']], ['what', ['wut', 'whut', 'wath']], ['come', ['cum', 'kom', 'coem']]];
const spelling = [() => { const [w, bad] = pick(SPELL); return ch('write.letters', `Listen: “${w}”. Which is the right spelling?`, w, bad, `“${w}” is spelled ${w.split('').join('-')}.${['the', 'said', 'was', 'you', 'have', 'they', 'what', 'come'].includes(w) ? ' It’s a heart word: part of it doesn’t follow the usual sounds, so learn it by heart.' : ''}`, { say: w, decode: true, diff: w.length <= 3 ? 1 : 2 }); }];

// ------------------------------------------------------------------------------------------------ math (K–2)
const ITEMS = ['🍎', '⭐', '🐟', '🌸', '🍪', '🚗'];
const row = (e, n) => Array(n).fill(e).join('');
const add = [
  () => { const a = ri(1, 5), b = ri(1, 5), e = pick(ITEMS); return num('math.add', `${a} + ${b} = ?`, a + b, `Count all of them: ${row(e, a)} and ${row(e, b)}. Start at ${a} and count on ${b}: ${Array.from({ length: b }, (_, i) => a + i + 1).join(', ')}. So ${a} + ${b} = ${a + b}.`, { v: { big: `${row(e, a)} + ${row(e, b)}` }, diff: 1 }); },
  () => { const a = ri(6, 9), b = ri(10 - a + 1, 9); const to10 = 10 - a; return num('math.add', `${a} + ${b} = ?`, a + b, `Make a ten: ${a} + ${to10} = 10. You still have ${b - to10} more. 10 + ${b - to10} = ${a + b}.`, { diff: 2 }); },
  () => { const t = ri(11, 18), a = ri(t - 9, 9); return num('math.add', `${a} + ? = ${t}`, t - a, `Count up from ${a} to ${t}: that’s ${t - a} more. Check: ${a} + ${t - a} = ${t}.`, { diff: 3 }); },
  () => { const [n, thing] = pick([['Mia', 'stickers'], ['Leo', 'shells'], ['Ava', 'blocks'], ['Sam', 'marbles']]), a = ri(4, 9), b = ri(3, 9); return num('math.add', `${n} has ${a} ${thing}. ${n} gets ${b} more. How many ${thing} now?`, a + b, `“Gets more” means add: ${a} + ${b} = ${a + b}.`, { diff: 3 }); },
];
const sub = [
  () => { const a = ri(3, 10), b = ri(1, a - 1), e = pick(ITEMS); return num('math.sub', `${a} − ${b} = ?`, a - b, `Start with ${a} ${e}. Take away ${b}. Count what’s left: ${a - b}.`, { v: { big: row(e, a - b) + ' ' + row('✖️', b) }, diff: 1 }); },
  () => { const a = ri(11, 18), b = ri(a - 9, 9); return num('math.sub', `${a} − ${b} = ?`, a - b, `Count up from ${b} to ${a}: ${b} → 10 is ${10 - b}, 10 → ${a} is ${a - 10}. ${10 - b} + ${a - 10} = ${a - b}.`, { diff: 2 }); },
  () => { const a = ri(12, 19), r = ri(3, 9); return num('math.sub', `${a} − ? = ${r}`, a - r, `What do you take from ${a} to leave ${r}? Count up from ${r} to ${a}: ${a - r}. Check: ${a} − ${a - r} = ${r}.`, { diff: 3 }); },
  () => { const [n, thing] = pick([['Mia', 'apples'], ['Leo', 'balloons'], ['Ava', 'crayons']]), a = ri(8, 15), b = ri(2, 7); return num('math.sub', `${n} had ${a} ${thing}. ${n} gave away ${b}. How many are left?`, a - b, `“Gave away” means take away: ${a} − ${b} = ${a - b}.`, { diff: 3 }); },
];
const count = [
  () => { const n = ri(4, 12), e = pick(ITEMS); return num('math.count', `How many ${e}?`, n, `Touch each one and count: 1, 2, 3… ${n}. The last number you say is how many.`, { v: { big: row(e, n) }, diff: 1 }); },
  () => { const tens = ri(1, 3), ones = ri(1, 9), e = pick(ITEMS); return num('math.count', `Each box has 10 ${e}. How many in all?`, tens * 10 + ones, `Count the tens: ${Array.from({ length: tens }, (_, i) => (i + 1) * 10).join(', ')}. Then count on the ones: ${tens * 10 + ones}.`, { v: { big: Array(tens).fill('[10]').join(' ') + ' ' + row(e, ones) }, diff: 2 }); },
  () => { const n = ri(12, 98); return num('math.count', `What number comes right after ${n}?`, n + 1, `Counting up by one: ${n}, ${n + 1}.${(n + 1) % 10 === 0 ? ' When the ones reach 10, the tens go up by one.' : ''}`, { diff: 2 }); },
  () => { const by = pick([2, 5, 10]), s = by * ri(1, 4); return num('math.count', `Count by ${by}s: ${s}, ${s + by}, ${s + 2 * by}, ?`, s + 3 * by, `Each number is ${by} more than the one before: ${s + 2 * by} + ${by} = ${s + 3 * by}.`, { diff: 3 }); },
];
const SHAPES = ['🔴', '🔵', '🟡', '🟢', '⭐', '🔺'];
const patterns = [
  () => { const [a, b] = shuffle(SHAPES).slice(0, 2); const unit = pick([[a, b], [a, b, b], [a, a, b]]); const seq = Array.from({ length: unit.length * 2 + 1 }, (_, i) => unit[i % unit.length]); const next = unit[seq.length % unit.length];
    return ch('math.patterns', `What comes next? ${seq.join(' ')} ?`, next, [next === a ? b : a, pick(SHAPES.filter((x) => x !== a && x !== b))], `The part that repeats is ${unit.join(' ')}. After ${seq.slice(-1)} comes ${next}.`, { diff: 1 }); },
  () => { const st = ri(1, 10), step = pick([1, 2, 5, 10]); const seq = [0, 1, 2, 3].map((i) => st + i * step); return num('math.patterns', `What comes next? ${seq.join(', ')}, ?`, st + 4 * step, `Each number goes up by ${step}: ${seq[3]} + ${step} = ${st + 4 * step}.`, { diff: 2 }); },
];
const COINS = [['penny', 1], ['nickel', 5], ['dime', 10], ['quarter', 25]];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : (w === 'penny' ? '' : 's')}`.replace(/(\d+) penny$/, (m, k) => (k === '1' ? '1 penny' : `${k} pennies`));
const money = [
  () => { const [nm, v] = pick(COINS); return ch('fin.money', `Which coin is worth ${v}¢?`, `🪙 ${nm}`, COINS.filter((c) => c[0] !== nm).map((c) => `🪙 ${c[0]}`), `A penny is 1¢, a nickel 5¢, a dime 10¢ and a quarter 25¢. The dime is the smallest coin but worth more than a nickel.`, { diff: 1 }); },
  () => { const q = ri(0, 2), d = ri(0, 3), n = ri(0, 2), p = ri(0, 4); if (q + d + n + p === 0) return money[1](); const v = q * 25 + d * 10 + n * 5 + p;
    const parts = [[q, 'quarter', 25], [d, 'dime', 10], [n, 'nickel', 5], [p, 'penny', 1]].filter((x) => x[0]);
    return num('fin.money', `How much money? ${parts.map(([k, w, c]) => `${plural(k, w)} (${c}¢${k > 1 ? ' each' : ''})`).join(', ')}.`, v, `Start with the biggest coins and count on: ${parts.map(([k, w, c]) => Array(k).fill(c).join(' + ')).join(' + ')} = ${v}¢.`, { suffix: '¢', diff: 2 }); },
  () => { const a = ri(2, 4), b = ri(1, 2); return ch('fin.money', `Which is more money: ${a} dimes or ${b} quarter${b > 1 ? 's' : ''}?`, a * 10 > b * 25 ? `${a} dimes` : a * 10 < b * 25 ? `${b} quarter${b > 1 ? 's' : ''}` : 'They are the same', [`${a} dimes`, `${b} quarter${b > 1 ? 's' : ''}`, 'They are the same'], `${a} dimes = ${a * 10}¢. ${b} quarter${b > 1 ? 's' : ''} = ${b * 25}¢. More coins doesn’t always mean more money.`, { diff: 3 }); },
];
const place = [
  () => { const t = ri(2, 9), o = ri(1, 9); return ch('math.place', `In ${t}${o}, what does the ${t} mean?`, `${t} tens (${t * 10})`, [`${t} ones`, `${t} hundreds`, `${t + o}`], `${t}${o} = ${t} tens and ${o} ones = ${t * 10} + ${o}.`, { diff: 1 }); },
  () => { const t = ri(1, 9), o = ri(0, 9); return num('math.place', `What number is ${t} tens and ${o} ones?`, t * 10 + o, `${t} tens = ${t * 10}. Add ${o} ones: ${t * 10 + o}.`, { diff: 1 }); },
  () => { const h = ri(1, 9), t = ri(0, 9), o = ri(0, 9), n = h * 100 + t * 10 + o, which = pick(['hundreds', 'tens', 'ones']); const a = { hundreds: h, tens: t, ones: o }[which];
    return num('math.place', `In ${n}, which digit is in the ${which} place?`, a, `${n} = ${h} hundreds, ${t} tens, ${o} ones. The ${which} digit is ${a}.`, { diff: 2 }); },
  () => { const a = ri(21, 89), b = ri(21, 89); if (a === b) return place[0](); return ch('math.place', `Which number is greater: ${a} or ${b}?`, String(Math.max(a, b)), [String(Math.min(a, b)), 'They are equal'], `Compare the tens first: ${Math.floor(a / 10)} tens vs ${Math.floor(b / 10)} tens${Math.floor(a / 10) === Math.floor(b / 10) ? `. Same tens, so compare the ones: ${a % 10} vs ${b % 10}` : ''}. ${Math.max(a, b)} > ${Math.min(a, b)}.`, { diff: 2 }); },
];
const tm = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
const time = [
  () => { const h = ri(1, 12), m = pick([0, 30]); const wrong = [tm(h, m === 0 ? 30 : 0), tm(h % 12 + 1, m), tm(m === 30 ? 6 : 12, h * 5 % 60)]; return ch('math.time', 'What time does the clock show?', tm(h, m), wrong, m === 0 ? `The long hand points to 12, so it’s exactly ${h} o’clock: ${tm(h, 0)}.` : `The long hand points to 6 (half an hour). The short hand is just past ${h}: ${tm(h, 30)}.`, { v: { clock: [h, m] }, diff: 1 }); },
  () => { const h = ri(1, 12), m = pick([15, 45, 5, 20, 40, 50]); return ch('math.time', 'What time does the clock show?', tm(h, m), [tm(h, (60 - m) % 60), tm(h % 12 + 1, m), tm(m / 5, h * 5 % 60)], `The long hand points to ${m / 5}: count by fives, ${m / 5} × 5 = ${m} minutes. The short hand is past ${h}. So ${tm(h, m)}.`, { v: { clock: [h, m] }, diff: 2 }); },
  () => { const h = ri(1, 10), m = pick([0, 30]), d = pick([1, 2]); return ch('math.time', `It is ${tm(h, m)}. Soccer starts in ${d} hour${d > 1 ? 's' : ''}. What time does it start?`, tm(h + d, m), [tm(h + d, m === 0 ? 30 : 0), tm(h + d + 1, m), tm(h - 1 || 12, m)], `Move the hour hand forward ${d}: ${h} → ${h + d}. The minutes stay the same: ${tm(h + d, m)}.`, { v: { clock: [h, m] }, diff: 3 }); },
];
const change = [
  () => { const c = pick([35, 45, 55, 65, 70, 85, 90]); return num('math.change', `A pencil costs ${c}¢. You pay with $1 (100¢). How much change?`, 100 - c, `Count up from ${c}¢ to 100¢: ${c} → ${Math.ceil(c / 10) * 10 === c ? c : Math.ceil(c / 10) * 10}${Math.ceil(c / 10) * 10 === c ? '' : ` (+${Math.ceil(c / 10) * 10 - c})`}, then to 100 (+${100 - Math.ceil(c / 10) * 10}). Change: ${100 - c}¢.`, { suffix: '¢', diff: 1 }); },
  () => { const p = ri(2, 8); return num('math.change', `A book costs $${p}. You pay with a $10 bill. How much change?`, 10 - p, `Count up from $${p} to $10: ${10 - p} dollars. Check: $${p} + $${10 - p} = $10.`, { prefix: '$', diff: 2 }); },
];

// ------------------------------------------------------------------------------------------------ print handwriting (manuscript)
const FAMILIES = [
  ['l t', 'Tall letters: start at the top line. Pull straight down. Cross the t last.'],
  ['i j', 'Dot letters: start at the dashed line. Pull down. Lift your pencil. Add the dot last.'],
  ['c o a d g q', 'Magic c letters: start at the dashed line. Make a c. Then finish the letter.'],
  ['n m r p', 'Tunnel letters: start at the dashed line. Pull down. Go back up and over.'],
  ['h b', 'Tall tunnel letters: start at the top line. Pull down. Go back up and over.'],
  ['u y', 'Cup letters: start at the dashed line. Pull down, curve up, then pull down.'],
  ['f', 'Hook letter: start below the top line. Curve up and over. Pull down. Cross it.'],
  ['v w x', 'Slant letters: start at the dashed line. Slant down, then slant up.'],
  ['k', 'Start at the top line. Pull down. Then slant in and slant out.'],
  ['z', 'Zigzag: go across the dashed line. Slant down. Go across the bottom.'],
  ['e s', 'Curvy letters: e goes across, then around. s curves one way, then back.'],
];
const printing = [
  () => { const [ls, tip] = pick(FAMILIES); const l = pick(ls.split(' ')); return { type: 'trace', skill: 'write.print', style: 'print', word: l, q: `Trace the letter “${l}” in print. ${tip}`, why: tip, diff: 1 }; },
  () => { const U = pick('BDEFHILMNPRTCGOQ'.split('')); return { type: 'trace', skill: 'write.print', style: 'print', word: U, q: `Trace the capital “${U}”. Start at the top line. Touch the bottom line.`, why: 'Capital letters are tall. They go from the top line to the bottom line.', diff: 2 }; },
  () => { const w = pick(['cat', 'dog', 'sun', 'map', 'pig', 'hat', 'bed', 'fox']); return { type: 'trace', skill: 'write.print', style: 'print', word: w, q: `Trace the word “${w}” in print. Keep the letters close together.`, why: 'Keep the letters in a word close together. Most letters sit on the bottom line.', diff: 2 }; },
  () => { const w = pick(['I can run.', 'The cat sat.', 'We go up.']); return { type: 'trace', skill: 'write.print', style: 'print', word: w, q: `Trace the sentence in print: “${w}”`, why: 'Start with a capital. Leave finger spaces. End with a period.', diff: 3 }; },
];
export const K2_SKILLS = [
  ['write.print', 'writing', 1, 'Printing letters', 'Form print letters neatly on the lines, then words and sentences.', [], 'Tall letters touch the top line. Small letters reach the dashed line. Letters sit on the bottom line. g, j, p, q and y go below it.', 'Say the steps as you write: top, pull down, back up and around.', ['Learn app']],
  ['read.sounds', 'reading', 1, 'Hearing sounds', 'Hear rhymes, syllables and the sounds inside words.', [], 'Words are made of sounds. Listen for the beginning, middle and end, and clap the parts (syllables).', 'Say the word slowly, like stretching a rubber band: sssuuunnn. Then say it fast again.', ['Library', 'Learn app']],
];
// skills whose old items are replaced entirely by these banks (also in the Learn app)
export const K2_REPLACE = {
  'write.print': printing,
  'read.letters': letters, 'read.phonics': phonics, 'read.sounds': SOUNDS, 'read.sentences': sentences, 'write.letters': spelling,
  'math.add': add, 'math.sub': sub, 'math.count': count, 'math.patterns': patterns, 'fin.money': money, 'math.place': place, 'math.time': time, 'math.change': change,
};
