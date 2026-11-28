// Little Learners (Pre-K, ages 3–5): getting ready for school. Picture-first items; the narrator reads every question aloud.
// Choice items carry at most three options and a kind line for each wrong pick (whyWrong: { option: line }).

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const pickN = (a, n) => { const c = a.slice(), out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]); return out; };
const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
// choice item: wrong[i] pairs with ww[i]
const C = (skill, q, a, wrong, why, ww) => ({ type: 'choice', skill, q, a, o: [a, ...wrong], why, whyWrong: Object.fromEntries(wrong.map((w, i) => [w, ww[i]])), dok: 1 });

// [id, subject, band, name, objective, prereqs, explanation, alternate explanation, places]
export const PREK_SKILLS = [
  ['prek.colors', 'thinking', 1, 'Colors', 'Name and match the colors around you.', [], 'Every thing has a color. A banana is yellow. Grass is green. Look, then say the color.', 'Find something red in the room. Now find something blue. Colors are all around us!', ['Learn app']],
  ['prek.shapes', 'math', 1, 'Shapes', 'Name circles, squares, triangles and rectangles.', [], 'A circle is round. A square has four sides that match. A triangle has three sides and three points.', 'Draw the shape in the air with your finger. Count the sides as you go.', ['Learn app']],
  ['prek.count', 'math', 1, 'Counting to 10', 'Count up to ten things, one number for each thing.', [], 'Touch each thing one time and say one number. The last number you say tells how many.', 'Line the things up, then count them like steps: one, two, three.', ['Learn app']],
  ['prek.numbers', 'math', 1, 'Numbers 1 to 10', 'Know the numerals 1 to 10 and match them to groups.', ['prek.count'], 'A number is a picture of how many. 3 means three things.', 'Hold up your fingers to show the number. 5 is one whole hand!', ['Learn app']],
  ['prek.compare', 'math', 1, 'More, less, same', 'Tell which group has more, less or the same.', ['prek.count'], 'Count both groups. The bigger number has more. If the numbers match, they are the same.', 'Pair the things up, one from each group. The group with things left over has more.', ['Learn app']],
  ['prek.patterns', 'thinking', 1, 'Patterns', 'Find what comes next in a pattern.', [], 'A pattern repeats, like apple, banana, apple, banana. Say it out loud and you can hear what comes next.', 'Clap the pattern: clap, stomp, clap, stomp. Your body remembers it.', ['Learn app']],
  ['prek.letters', 'reading', 1, 'Letters', 'Know big and small letters.', [], 'Every letter has a big shape and a small shape. Big A and small a are the same letter.', 'Look for the letters in your name. They are your letter friends.', ['Learn app']],
  ['prek.sounds', 'reading', 1, 'First sounds', 'Hear the first sound in a word.', ['prek.letters'], 'Say the word slowly. Listen to the very first sound. Ball starts with /b/.', 'Feel your mouth. For /b/ your lips pop. For /s/ you hiss like a snake.', ['Learn app']],
  ['prek.rhyme', 'reading', 1, 'Rhyming words', 'Hear words that rhyme.', [], 'Rhyming words sound the same at the end. Cat and hat both end with -at.', 'Sing it: cat, hat, bat! Words that rhyme sound like a song.', ['Learn app']],
  ['prek.name', 'writing', 1, 'Writing letters', 'Trace big letters, like the ones in your name.', ['prek.letters'], 'Start at the top. Pull down. Go slowly, you can do it.', 'Trace the letter in the air first, then with your finger on the screen.', ['Learn app']],
  ['prek.feelings', 'health', 1, 'Feelings', 'Name feelings and know what helps when you are upset.', [], 'Happy, sad, mad and scared are all feelings. All feelings are allowed. We can use words and calm breaths.', 'Smell the flower, blow out the candle. Slow breaths help big feelings get smaller.', ['Learn app']],
  ['prek.routines', 'health', 1, 'School routines', 'Know what to do at school: listen, share, line up, wash hands.', [], 'School has helpful habits. We raise a hand to talk, take turns and wash our hands.', 'Pretend you are at school. Show me how you line up. Show me quiet hands.', ['Learn app']],
  ['prek.sizes', 'math', 1, 'Big and small', 'Tell big from small, and tall from short.', [], 'An elephant is big. A mouse is small. Look at both, then pick.', 'Make your body big like a bear. Now small like a bug!', ['Learn app']],
  ['prek.opposites', 'thinking', 1, 'Opposites', 'Know pairs like up and down, hot and cold.', [], 'Opposites are as different as can be. Up is the opposite of down.', 'Act it out: reach up high, then crouch down low.', ['Learn app']],
  ['prek.safety', 'health', 1, 'Staying safe', 'Know simple safety rules: stop at red, hold a hand, get a grown-up.', [], 'Red means stop. We hold a grown-up’s hand near cars. In an emergency a grown-up calls 9-1-1.', 'Play red light, green light. Red: freeze! Green: walk.', ['Learn app']],
];

// ---------- data ----------
const COLORS = [['red', '🍎', 'an apple'], ['yellow', '🍌', 'a banana'], ['green', '🐸', 'a frog'], ['blue', '🫐', 'blueberries'], ['orange', '🥕', 'a carrot'], ['purple', '🍇', 'grapes'], ['pink', '🌸', 'a flower'], ['brown', '🐻', 'a bear']];
const DOTS = { red: '🔴', yellow: '🟡', green: '🟢', blue: '🔵', orange: '🟠', purple: '🟣', brown: '🟤' };
const SHAPES = [['circle', '⚪', 'is round, with no corners'], ['square', '🟥', 'has four sides that match'], ['triangle', '🔺', 'has three sides and three points'], ['rectangle', '▬', 'has four sides, two long and two short']];
const THINGS = ['🍎', '🐶', '⭐', '🚗', '🎈', '🐟', '🌼', '🦆', '🍪', '⚽'];
const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const FIRST = [['ball', '⚽', 'b'], ['sun', '☀️', 's'], ['moon', '🌙', 'm'], ['dog', '🐶', 'd'], ['fish', '🐟', 'f'], ['tiger', '🐯', 't'], ['pig', '🐷', 'p'], ['cat', '🐱', 'c'], ['hat', '🎩', 'h'], ['lion', '🦁', 'l'], ['rabbit', '🐰', 'r'], ['goat', '🐐', 'g']];
const RHYMES = [['cat', '🐱', 'hat', '🎩'], ['bee', '🐝', 'tree', '🌳'], ['frog', '🐸', 'log', '🪵'], ['cake', '🎂', 'snake', '🐍'], ['moon', '🌙', 'spoon', '🥄'], ['star', '⭐', 'car', '🚗'], ['bear', '🐻', 'chair', '🪑'], ['goat', '🐐', 'boat', '⛵'], ['mouse', '🐭', 'house', '🏠'], ['fox', '🦊', 'box', '📦']];
const KIDS = ['Amara', 'Leo', 'Mei', 'Diego', 'Priya', 'Kofi', 'Sofia', 'Noah', 'Aiyana', 'Yusuf', 'Hana', 'Mateo'];
const FEEL = [['happy', '😊'], ['sad', '😢'], ['mad', '😠'], ['scared', '😨'], ['sleepy', '😴'], ['surprised', '😮']];
const SIT = [['gets a birthday hug', 'happy'], ['drops an ice cream cone', 'sad'], ['hears a loud thunder boom', 'scared'], ['has a block tower knocked down', 'mad'], ['finds a big gift box', 'surprised'], ['stays up very late', 'sleepy']];
const OPP = [['up', '⬆️', 'down', '⬇️'], ['hot', '🔥', 'cold', '🧊'], ['big', '🐘', 'small', '🐭'], ['day', '☀️', 'night', '🌙'], ['happy', '😊', 'sad', '😢'], ['fast', '🐆', 'slow', '🐢'], ['wet', '💧', 'dry', '🏜️'], ['open', '📖', 'closed', '📕']];
const BIG = [['🐘', 'elephant'], ['🐋', 'whale'], ['🦒', 'giraffe'], ['🌳', 'tree'], ['🏠', 'house'], ['🚌', 'bus']];
const SMALL = [['🐭', 'mouse'], ['🐜', 'ant'], ['🐞', 'ladybug'], ['🪶', 'feather'], ['🍓', 'strawberry'], ['🔑', 'key']];
const MID = [['🐶', 'dog'], ['🐱', 'cat'], ['🐔', 'chicken'], ['⚽', 'ball']];
const row = (e, n) => Array(n).fill(e).join('');
const wrongNums = (n, lo = 1, hi = 10) => { const s = new Set(); for (const d of pickN([-2, -1, 1, 2, 3], 5)) { const v = n + d; if (v >= lo && v <= hi && s.size < 2) s.add(v); } let v = lo; while (s.size < 2) { if (v !== n) s.add(v); v++; } return [...s]; };

export const PREK_GEN = {
  'prek.colors': [
    () => { const [c, e, t] = pick(COLORS), w = pickN(COLORS.filter((x) => x[0] !== c), 2); return C('prek.colors', `${e} What color is ${t}?`, c, w.map((x) => x[0]), `Yes! ${t[0].toUpperCase() + t.slice(1)} is ${c}.`, w.map((x) => `${x[0][0].toUpperCase() + x[0].slice(1)} is a pretty color, but look again. ${x[1]} is ${x[0]}.`)); },
    () => { const [c, , ] = pick(COLORS.filter((x) => DOTS[x[0]])), w = pickN(Object.keys(DOTS).filter((x) => x !== c), 2); return C('prek.colors', `Tap the ${c} circle.`, DOTS[c], w.map((x) => DOTS[x]), `You found ${c}! Great looking.`, w.map((x) => `That one is ${x}. Find ${c}.`)); },
    () => { const [c, e, t] = pick(COLORS), w = pickN(COLORS.filter((x) => x[0] !== c), 2); return C('prek.colors', `Which one is ${c}?`, e, w.map((x) => x[1]), `Yes! ${t[0].toUpperCase() + t.slice(1)} is ${c}.`, w.map((x) => `That is ${x[0]}. Look for ${c}.`)); },
    () => C('prek.colors', '☀️ What color is the sun in a picture?', 'yellow', ['blue', 'purple'], 'Yes! We color the sun yellow and bright.', ['The sky is blue. The sun is yellow.', 'Grapes are purple. The sun is yellow.']),
    () => C('prek.colors', '🌿 Grass is…', 'green', ['pink', 'orange'], 'Yes! Grass is green.', ['Some flowers are pink. Grass is green.', 'Carrots are orange. Grass is green.']),
    () => C('prek.colors', 'Mix 🔵 blue and 🟡 yellow. What do you get?', 'green', ['red', 'brown'], 'Wow! Blue and yellow make green.', ['Red is not made from blue and yellow. Try green.', 'Not brown this time. Blue and yellow make green.']),
    () => C('prek.colors', '🚒 What color is a fire truck?', 'red', ['green', 'blue'], 'Yes! Most fire trucks are red.', ['A frog is green. A fire truck is red.', 'Blueberries are blue. A fire truck is red.']),
  ],
  'prek.shapes': [
    () => { const [s, e, d] = pick(SHAPES), w = pickN(SHAPES.filter((x) => x[0] !== s), 2); return C('prek.shapes', `Which one is a ${s}?`, e, w.map((x) => x[1]), `Yes! A ${s} ${d}.`, w.map((x) => `That is a ${x[0]}. A ${s} ${d}.`)); },
    () => { const [s, e, d] = pick(SHAPES), w = pickN(SHAPES.filter((x) => x[0] !== s), 2); return C('prek.shapes', `${e} What shape is this?`, s, w.map((x) => x[0]), `Yes! It is a ${s}. It ${d}.`, w.map((x) => `Good try. A ${x[0]} ${x[2]}. Look again.`)); },
    () => C('prek.shapes', '⚽ A ball is round. What shape is it like?', 'circle', ['square', 'triangle'], 'Yes! A ball is round like a circle.', ['A square has corners. A ball is round.', 'A triangle has points. A ball is round.']),
    () => C('prek.shapes', '🍕 A slice of pizza looks like a…', 'triangle', ['circle', 'square'], 'Yes! A pizza slice has three sides, like a triangle.', ['The whole pizza is a circle. One slice is a triangle.', 'A square has four sides. Count the slice’s sides: three.']),
    () => C('prek.shapes', 'Which shape has three sides?', '🔺', ['⚪', '🟥'], 'Yes! A triangle has three sides. One, two, three!', ['A circle has no sides. It is round.', 'A square has four sides. Find the one with three.']),
    () => C('prek.shapes', '🚪 A door is shaped like a…', 'rectangle', ['circle', 'triangle'], 'Yes! A door is a rectangle, two long sides and two short.', ['A circle is round. A door has straight sides.', 'A triangle has three sides. A door has four.']),
    () => C('prek.shapes', 'Which shape is round?', '⚪', ['🟥', '🔺'], 'Yes! A circle is round, with no corners.', ['A square has corners.', 'A triangle has points.']),
  ],
  'prek.count': [
    () => { const n = rnd(1, 5), e = pick(THINGS), w = wrongNums(n, 1, 6); return C('prek.count', `${row(e, n)} How many?`, String(n), w.map(String), `Yes! ${n}. You touched each one.`, w.map((x) => x > n ? 'That is too many. Touch each one and count.' : 'Oops, one got skipped. Count each one.')); },
    () => { const n = rnd(5, 10), e = pick(THINGS), w = wrongNums(n, 3, 10); return C('prek.count', `${row(e, n)} Count them. How many?`, String(n), w.map(String), `Great counting! There are ${n}.`, w.map((x) => x > n ? 'Close! Count slowly, one number for each.' : 'Close! Did one get missed? Count again.')); },
    () => { const n = rnd(2, 6), e = pick(THINGS); const w = [n + 1, n - 1]; return C('prek.count', `Which one has ${n}?`, row(e, n), w.map((x) => row(e, x)), `Yes! That group has ${n}.`, w.map((x) => `That group has ${x}. Look for ${n}.`)); },
    () => { const n = rnd(1, 5), w = wrongNums(n, 1, 6); return C('prek.count', `${row('☝️', n)} How many fingers?`, String(n), w.map(String), `Yes! ${n} fingers.`, w.map(() => 'Count the fingers one by one.')); },
    () => { const n = rnd(2, 8); return C('prek.count', `What comes after ${n}?`, String(n + 1), [String(n - 1), String(n + 2)], `Yes! ${n}, ${n + 1}. Counting goes up by one.`, [`${n - 1} comes before ${n}.`, `${n + 2} is two steps up. Just one more.`]); },
    () => { const a = rnd(1, 3), b = rnd(1, 3), e = pick(THINGS), n = a + b, w = wrongNums(n, 1, 7); return C('prek.count', `${row(e, a)} and ${row(e, b)}. How many in all?`, String(n), w.map(String), `Yes! ${n} in all.`, w.map(() => 'Count all of them, both groups.')); },
  ],
  'prek.numbers': [
    () => { const n = rnd(1, 10), w = wrongNums(n); return C('prek.numbers', `Find the number ${NUMW[n]}.`, String(n), w.map(String), `Yes! That is ${n}.`, w.map((x) => `That is ${NUMW[x]}. Find ${NUMW[n]}.`)); },
    () => { const n = rnd(1, 6), e = pick(THINGS), w = wrongNums(n, 1, 8); return C('prek.numbers', `${row(e, n)} Which number tells how many?`, String(n), w.map(String), `Yes! ${n} tells how many.`, w.map((x) => `${x} is a different number. Count, then find it.`)); },
    () => C('prek.numbers', 'Which one is a number?', '7', ['B', '🐶'], 'Yes! 7 is a number.', ['B is a letter.', 'That is a puppy picture.']),
    () => C('prek.numbers', '✋ One whole hand. How many fingers?', '5', ['3', '10'], 'Yes! One hand has 5 fingers.', ['Count again: one hand has 5.', '10 is two hands. One hand is 5.']),
    () => { const n = rnd(2, 9); return C('prek.numbers', `What comes before ${n}?`, String(n - 1), [String(n + 1), String(n)], `Yes! ${n - 1}, then ${n}.`, [`${n + 1} comes after ${n}.`, `That is ${n} again. Go one back.`]); },
    () => C('prek.numbers', 'Which number is ten?', '10', ['1', '0'], 'Yes! 10 has a 1 and a 0.', ['That is one. Ten has two parts: 1 and 0.', 'That is zero. Ten is 1 and 0 together.']),
  ],
  'prek.compare': [
    () => { const e = pick(THINGS), a = rnd(4, 7), b = rnd(1, a - 2); return C('prek.compare', 'Which group has more?', row(e, a), [row(e, b)], `Yes! ${a} is more than ${b}.`, [`That group has ${b}. It has less.`]); },
    () => { const e = pick(THINGS), a = rnd(4, 7), b = rnd(1, a - 2); return C('prek.compare', 'Which group has less?', row(e, b), [row(e, a)], `Yes! ${b} is less than ${a}.`, [`That group has ${a}. It has more.`]); },
    () => { const n = rnd(2, 4), a = pick(THINGS), b = pick(THINGS.filter((x) => x !== a)); return C('prek.compare', `${row(a, n)} and ${row(b, n)}. More, less, or same?`, 'same', ['more', 'less'], `Yes! ${n} and ${n} are the same.`, ['Count both. They match.', 'Count both. They match.']); },
    () => C('prek.compare', 'Which is bigger?', '🐘', ['🐭'], 'Yes! The elephant is bigger.', ['A mouse is tiny. The elephant is bigger.']),
    () => { const a = rnd(1, 4), b = a + rnd(2, 5); return C('prek.compare', `Which number is more: ${a} or ${b}?`, String(b), [String(a)], `Yes! ${b} is more than ${a}.`, [`${a} is less. Count up: ${b} comes later.`]); },
    () => C('prek.compare', '🍪🍪🍪 for Mei. 🍪 for Leo. Who has more?', 'Mei', ['Leo', 'same'], 'Yes! Mei has 3. Leo has 1.', ['Leo has 1. Mei has 3.', 'Count: 3 and 1 are not the same.']),
  ],
  'prek.patterns': [
    () => { const [a, b] = pickN(['🍎', '🍌', '⭐', '🔵', '🐶', '🌼'], 2), c = pick(['🚗', '🎈', '🐟']); return C('prek.patterns', `${a}${b}${a}${b}${a} What comes next?`, b, [a, c], `Yes! ${a} ${b}, ${a} ${b}. Next is ${b}.`, ['Say it out loud. After this one comes the other.', 'That one is not in the pattern.']); },
    () => { const [a, b] = pickN(['🔴', '🔵', '🟡', '🟢'], 2); return C('prek.patterns', `${a}${b}${b}${a}${b}${b}${a} What comes next?`, b, [a, '⭐'], `Yes! ${a} ${b} ${b}, then ${a} ${b} ${b}.`, ['Say it: one, then two of the other.', 'The star is not in the pattern.']); },
    () => { const [a, b] = pickN(['🐱', '🐶', '🐸', '🐷'], 2); return C('prek.patterns', `${a}${b}${a}${b}${a}${b} What comes next?`, a, [b, '🍎'], `Yes! The pattern starts again with ${a}.`, ['That one just came. Now the other.', 'The apple is not in the pattern.']); },
    () => C('prek.patterns', '👏🦶👏🦶👏 Clap, stomp, clap, stomp, clap. What comes next?', '🦶', ['👏', '🙌'], 'Yes! Stomp! You can feel the pattern.', ['We just clapped. Next is stomp.', 'Hands up is not in the pattern.']),
    () => C('prek.patterns', 'Which one is a pattern?', '🔴🔵🔴🔵', ['🔴🔵🔵🟡', '🟢🔴🟡🔵'], 'Yes! Red, blue, red, blue repeats.', ['That one does not repeat.', 'That one is all mixed up.']),
    () => { const [a, b] = pickN(['☀️', '🌙', '⭐', '☁️'], 2); return C('prek.patterns', `${a}${a}${b}${a}${a}${b}${a}${a} What comes next?`, b, [a, '🍌'], `Yes! Two ${a}, then one ${b}.`, ['We had two already. Now the other one.', 'The banana is not in the pattern.']); },
  ],
  'prek.letters': [
    () => { const L = pick('ABDEGHMRST'.split('')), w = pickN('ABDEGHMRST'.split('').filter((x) => x !== L), 2); return C('prek.letters', `Find big ${L}.`, L, w, `Yes! That is ${L}.`, w.map((x) => `That is ${x}. Look for ${L}.`)); },
    () => { const l = pick('abdegmrst'.split('')), w = pickN('abdegmrst'.split('').filter((x) => x !== l), 2); return C('prek.letters', `Find small ${l}.`, l, w, `Yes! That is small ${l}.`, w.map((x) => `That is ${x}. Look for ${l}.`)); },
    () => { const l = pick('abdefghmrst'.split('')), w = pickN('abdefghmrst'.split('').filter((x) => x !== l), 2); return C('prek.letters', `Big ${l.toUpperCase()}. Find its small letter.`, l, w, `Yes! Big ${l.toUpperCase()} and small ${l} are the same letter.`, w.map((x) => `That is small ${x}. It matches big ${x.toUpperCase()}.`)); },
    () => C('prek.letters', 'Which one is a letter?', 'K', ['4', '🌙'], 'Yes! K is a letter.', ['4 is a number.', 'That is a moon picture.']),
    () => C('prek.letters', 'Which letter comes first in the alphabet song?', 'A', ['Z', 'M'], 'Yes! A, B, C… A comes first.', ['Z comes at the very end.', 'M is in the middle.']),
    () => { const n = pick(KIDS), w = pickN('ABCDEFGHJKLMNOPRSTWY'.split('').filter((x) => x !== n[0]), 2); return C('prek.letters', `${n} starts with which letter?`, n[0], w, `Yes! ${n} starts with ${n[0]}.`, w.map(() => `Say ${n} slowly. Listen to the start.`)); },
  ],
  'prek.sounds': [
    () => { const [t, e, s] = pick(FIRST), w = pickN(FIRST.filter((x) => x[2] !== s), 2); return C('prek.sounds', `Which one starts with /${s}/?`, e, w.map((x) => x[1]), `Yes! ${t[0].toUpperCase() + t.slice(1)} starts with /${s}/.`, w.map((x) => `${x[0][0].toUpperCase() + x[0].slice(1)} starts with /${x[2]}/.`)); },
    () => { const [t, e, s] = pick(FIRST), w = pickN([...new Set(FIRST.map((x) => x[2]))].filter((x) => x !== s), 2); return C('prek.sounds', `${e} ${t}. What letter does it start with?`, s, w, `Yes! ${t} starts with ${s}.`, w.map(() => `Say ${t} slowly. What sound comes first?`)); },
    () => C('prek.sounds', 'Sss like a snake 🐍. Which starts with /s/?', '☀️', ['🐶', '🎩'], 'Yes! Sun starts with /s/.', ['Dog starts with /d/.', 'Hat starts with /h/.']),
    () => C('prek.sounds', 'Mmm, yummy! Which starts with /m/?', '🌙', ['🐟', '🐷'], 'Yes! Moon starts with /m/.', ['Fish starts with /f/.', 'Pig starts with /p/.']),
    () => C('prek.sounds', 'Do ball ⚽ and bear 🐻 start the same?', 'yes', ['no'], 'Yes! Ball and bear both start with /b/.', ['Listen: b-ball, b-bear. Same start!']),
    () => C('prek.sounds', 'Do sun ☀️ and dog 🐶 start the same?', 'no', ['yes'], 'Right! Sun starts with /s/. Dog starts with /d/.', ['Listen: s-sun, d-dog. They are different.']),
  ],
  'prek.rhyme': [
    () => { const [a, ae, b, be] = pick(RHYMES), w = pickN(RHYMES.filter((x) => x[0] !== a), 2); return C('prek.rhyme', `What rhymes with ${a} ${ae}?`, be, w.map((x) => x[1]), `Yes! ${a}, ${b}. They rhyme!`, w.map((x) => `${x[0][0].toUpperCase() + x[0].slice(1)} does not sound like ${a} at the end.`)); },
    () => { const [a, , b] = pick(RHYMES), w = pickN(RHYMES.filter((x) => x[0] !== a), 2); return C('prek.rhyme', `What rhymes with ${a}?`, b, w.map((x) => x[0]), `Yes! ${a} and ${b} rhyme.`, w.map((x) => `Say ${a}, ${x[0]}. The ends sound different.`)); },
    () => C('prek.rhyme', 'Do cat and hat rhyme?', 'yes', ['no'], 'Yes! Cat, hat. Both end with -at.', ['Listen: c-at, h-at. Same ending!']),
    () => C('prek.rhyme', 'Do dog and sun rhyme?', 'no', ['yes'], 'Right! Dog and sun do not sound the same at the end.', ['Listen: d-og, s-un. The ends are different.']),
    () => C('prek.rhyme', 'Twinkle, twinkle, little star. How I wonder what you…', 'are', ['see', 'go'], 'Yes! Star and are rhyme.', ['See does not rhyme with star.', 'Go does not rhyme with star.']),
    () => C('prek.rhyme', 'Which two rhyme?', '🐝 🌳', ['🐝 🐶', '🌳 🍎'], 'Yes! Bee and tree rhyme.', ['Bee and dog do not rhyme.', 'Tree and apple do not rhyme.']),
  ],
  'prek.name': [
    () => { const L = pick('ABCDEHILMNOPST'.split('')); return { type: 'trace', skill: 'prek.name', style: 'print', word: L, q: `Trace the big letter ${L}. Start at the top.`, why: `You made ${L}! Great work.`, dok: 1 }; },
    () => { const n = pick(KIDS); return { type: 'trace', skill: 'prek.name', style: 'print', word: n[0], q: `${n} starts with ${n[0]}. Trace ${n[0]}.`, why: `You wrote ${n[0]}, like ${n}!`, dok: 1 }; },
    () => { const L = pick(['I', 'L', 'T', 'E', 'H', 'F']); return { type: 'trace', skill: 'prek.name', style: 'print', word: L, q: `${L} has straight lines. Trace ${L}.`, why: 'Straight lines, nice and slow. Well done!', dok: 1 }; },
    () => { const L = pick(['O', 'C', 'S', 'G']); return { type: 'trace', skill: 'prek.name', style: 'print', word: L, q: `${L} has a curve. Trace ${L}.`, why: 'Round and round. Beautiful curve!', dok: 1 }; },
    () => C('prek.name', 'Where do we start a letter?', '⬆️ top', ['⬇️ bottom', '↔️ side'], 'Yes! We start at the top and pull down.', ['Most letters start at the top.', 'Start at the top, then go down.']),
    () => C('prek.name', 'What do we use to write?', '✏️', ['🥄', '🧦'], 'Yes! A pencil or crayon helps us write.', ['A spoon is for eating.', 'A sock is for your foot.']),
    () => C('prek.name', 'Your name starts with a…', 'big letter', ['small letter', 'number'], 'Yes! Names start with a big letter.', ['The first letter is big. The rest are small.', 'Names use letters, not numbers.']),
  ],
  'prek.feelings': [
    () => { const [f, e] = pick(FEEL), w = pickN(FEEL.filter((x) => x[0] !== f), 2); return C('prek.feelings', `${e} How does this face feel?`, f, w.map((x) => x[0]), `Yes! That face looks ${f}.`, w.map((x) => `A ${x[0]} face looks like ${x[1]}. Look again.`)); },
    () => { const [f, e] = pick(FEEL), w = pickN(FEEL.filter((x) => x[0] !== f), 2); return C('prek.feelings', `Which face is ${f}?`, e, w.map((x) => x[1]), `Yes! That face is ${f}.`, w.map((x) => `That face is ${x[0]}.`)); },
    () => { const [s, f] = pick(SIT), n = pick(KIDS), w = pickN(FEEL.map((x) => x[0]).filter((x) => x !== f), 2); return C('prek.feelings', `${n} ${s}. How might ${n} feel?`, f, w, `Yes! ${n} might feel ${f}. That makes sense.`, w.map(() => 'Hmm, think about it. How would you feel?')); },
    () => C('prek.feelings', 'You feel mad. What can you do?', '🌬️ take slow breaths', ['👊 hit', '😱 yell at a friend'], 'Yes! Slow breaths help mad feelings get smaller.', ['Hitting hurts. Let’s breathe instead.', 'Yelling can hurt feelings. Use calm words.']),
    () => C('prek.feelings', 'Your friend is sad 😢. What can you do?', '🤗 ask if they want a hug', ['🙈 walk away', '😂 laugh'], 'Yes! That is so kind.', ['Your friend needs a kind friend right now.', 'Laughing may make them feel worse.']),
    () => C('prek.feelings', 'You feel scared. Who can help?', '🧑‍🏫 a grown-up', ['🧸 nobody', '🐶 the dog'], 'Yes! Tell a grown-up you trust.', ['Someone can always help. Tell a grown-up.', 'A dog is a nice friend, but a grown-up can help.']),
    () => C('prek.feelings', 'Is it okay to feel sad sometimes?', 'yes', ['no'], 'Yes! All feelings are okay. We can talk about them.', ['Everyone feels sad sometimes. It is okay.']),
  ],
  'prek.routines': [
    () => C('prek.routines', 'You want to talk at circle time. What do you do?', '✋ raise your hand', ['📢 shout', '🏃 run around'], 'Yes! Raise your hand and wait your turn.', ['Shouting is hard for friends to hear. Raise your hand.', 'At circle time we sit. Raise your hand.']),
    () => C('prek.routines', 'Before snack, what do we do?', '🧼 wash hands', ['🛌 nap', '🎨 paint'], 'Yes! Clean hands keep germs away.', ['Nap comes later. First we wash.', 'Paint comes later. Wash hands first.']),
    () => C('prek.routines', `${pick(KIDS)} wants your toy 🚂. What can you do?`, '🤝 share and take turns', ['😠 grab it back', '🙅 hide it'], 'Yes! Taking turns makes play fun for all.', ['Grabbing can hurt. Let’s take turns.', 'Hiding means no one plays. Let’s share.']),
    () => C('prek.routines', 'Teacher is reading. What do we do?', '👂 listen', ['🗣️ talk loudly', '🤸 do flips'], 'Yes! Quiet bodies and listening ears.', ['We can talk after the story.', 'Flips are for outside time.']),
    () => C('prek.routines', 'Time to go outside. How do we line up?', '🚶 one behind the other', ['🏃 push to be first', '🛋️ lie down'], 'Yes! One friend behind the other, nice and calm.', ['Pushing can hurt. Everyone gets a turn.', 'We stand up to line up.']),
    () => ({ type: 'order', skill: 'prek.routines', q: 'Get ready for school. What comes first?', items: ['😴 Wake up', '👕 Get dressed', '🥣 Eat breakfast', '🪥 Brush teeth', '🎒 Grab your backpack'], why: 'Yes! Wake up, get dressed, eat, brush, then go!', dok: 1 }),
    () => ({ type: 'order', skill: 'prek.routines', q: 'Wash your hands. Put the steps in order.', items: ['💧 Wet your hands', '🧼 Add soap', '👐 Scrub and sing', '🚿 Rinse', '🧻 Dry'], why: 'Yes! Sparkly clean hands!', dok: 1 }),
    () => ({ type: 'sort', skill: 'prek.routines', q: 'Kind or not kind at school?', bins: ['😊 kind', '😟 not kind'], items: [['🤝 sharing', '😊 kind'], ['✋ raising a hand', '😊 kind'], ['👊 hitting', '😟 not kind'], ['🗑️ cleaning up', '😊 kind'], ['😠 grabbing toys', '😟 not kind']], why: 'Yes! Kind choices make school feel good.', dok: 1 }),
  ],
  'prek.sizes': [
    () => { const b = pick(BIG), s = pick(SMALL); return C('prek.sizes', 'Which one is big?', b[0], [s[0]], `Yes! A ${b[1]} is big.`, [`A ${s[1]} is small.`]); },
    () => { const b = pick(BIG), s = pick(SMALL), m = pick(MID); return C('prek.sizes', 'Which one is the smallest?', s[0], [b[0], m[0]], `Yes! A ${s[1]} is the smallest.`, [`A ${b[1]} is very big.`, `A ${m[1]} is bigger than a ${s[1]}.`]); },
    () => { const b = pick(BIG), s = pick(SMALL), m = pick(MID); return C('prek.sizes', 'Which one is the biggest?', b[0], [s[0], m[0]], `Yes! A ${b[1]} is the biggest.`, [`A ${s[1]} is tiny.`, `A ${m[1]} is smaller than a ${b[1]}.`]); },
    () => C('prek.sizes', '🦒 or 🐢. Which is tall?', '🦒', ['🐢'], 'Yes! A giraffe is very tall.', ['A turtle is short and low.']),
    () => C('prek.sizes', 'A baby’s shoe 👶 is…', 'small', ['big'], 'Yes! Baby feet are small, so baby shoes are small.', ['A grown-up’s shoe is big. A baby’s shoe is small.']),
    () => C('prek.sizes', 'Which can fit in your pocket?', '🔑', ['🚌', '🐘'], 'Yes! A key is small enough for a pocket.', ['A bus is much too big!', 'An elephant is much too big!']),
  ],
  'prek.opposites': [
    () => { const [a, ae, b, be] = pick(OPP), w = pickN(OPP.filter((x) => x[0] !== a), 2); return C('prek.opposites', `${ae} ${a}. What is the opposite?`, `${be} ${b}`, w.map((x) => `${x[3]} ${x[2]}`), `Yes! ${a[0].toUpperCase() + a.slice(1)} and ${b} are opposites.`, w.map((x) => `${x[2][0].toUpperCase() + x[2].slice(1)} is the opposite of ${x[0]}.`)); },
    () => { const [a, ae, b, be] = pick(OPP), w = pickN(OPP.filter((x) => x[0] !== a), 2); return C('prek.opposites', `${be} ${b}. What is the opposite?`, `${ae} ${a}`, w.map((x) => `${x[1]} ${x[0]}`), `Yes! ${b[0].toUpperCase() + b.slice(1)} and ${a} are opposites.`, w.map((x) => `${x[0][0].toUpperCase() + x[0].slice(1)} goes with ${x[2]}.`)); },
    () => C('prek.opposites', 'The opposite of hot 🔥 is…', 'cold', ['warm', 'red'], 'Yes! Hot and cold are opposites. Brr!', ['Warm is a little hot. The opposite is cold.', 'Fire can be red, but the opposite of hot is cold.']),
    () => C('prek.opposites', 'The sun is out ☀️. It is day. The opposite is…', 'night', ['lunch', 'sun'], 'Yes! Day and night are opposites.', ['Lunch happens in the day. The opposite of day is night.', 'The sun is in the day. Night has the moon.']),
    () => C('prek.opposites', 'A turtle 🐢 is slow. A cheetah 🐆 is…', 'fast', ['slow', 'sleepy'], 'Yes! Fast is the opposite of slow. Zoom!', ['The turtle is slow. The cheetah is the opposite.', 'Not sleepy. A cheetah runs fast!']),
    () => C('prek.opposites', 'Is up the opposite of down?', 'yes', ['no'], 'Yes! Reach up high, then go down low.', ['Try it: up high, down low. They are opposites.']),
  ],
  'prek.safety': [
    () => C('prek.safety', '🔥 Something is hot on the stove. What do we do?', '🙅 do not touch', ['✋ touch it', '👅 lick it'], 'Yes! Hot things can hurt. We stay away and tell a grown-up.', ['Hot things can burn your hand. Do not touch.', 'Never put hot things in your mouth. Ask a grown-up.']),
    () => C('prek.safety', '🚦 The light is red 🔴. What do we do?', '🛑 stop', ['🏃 run', '🚶 walk'], 'Yes! Red means stop.', ['Never run at a red light. Red means stop.', 'Red means stop. Green means go.']),
    () => C('prek.safety', 'Crossing the street. What do you do?', '🤝 hold a grown-up’s hand', ['🏃 run ahead', '⚽ chase your ball'], 'Yes! Hold a grown-up’s hand near cars.', ['Stay close. Cars can be fast.', 'Let the ball go. A grown-up can get it.']),
    () => C('prek.safety', 'Someone is badly hurt. A grown-up calls…', '📞 9-1-1', ['📞 a pizza place', '📺 the TV'], 'Yes! 9-1-1 sends helpers fast.', ['Pizza can’t help. 9-1-1 sends helpers.', 'The TV can’t help. 9-1-1 sends helpers.']),
    () => C('prek.safety', 'You find pills 💊 on the floor. What do you do?', '🧑‍🏫 tell a grown-up', ['👄 taste them', '🎒 put them in your bag'], 'Yes! Don’t touch. Tell a grown-up.', ['Never taste pills. They can make you sick.', 'Leave them and tell a grown-up.']),
    () => C('prek.safety', 'You get lost in the store. Who can help?', '🧑‍💼 a worker or a mom with kids', ['🚗 a car', '🐶 a dog'], 'Yes! Ask a store worker or a mom with kids for help.', ['A car can’t help. Ask a worker.', 'A dog can’t help. Ask a worker.']),
    () => C('prek.safety', '🔥 The stove is hot. What do you do?', '🙅 don’t touch', ['✋ touch it', '🧸 put a toy on it'], 'Yes! Hot things can burn. Stay back.', ['Ouch! It can burn. Don’t touch.', 'Toys can burn too. Keep them away.']),
    () => C('prek.safety', 'In the car, we wear…', '🪢 a seat belt', ['🎩 a hat', '🧤 mittens'], 'Yes! Buckle up every time.', ['A hat is fun, but a seat belt keeps you safe.', 'Mittens keep hands warm. A seat belt keeps you safe.']),
  ],
};
// slanted-line letters too
PREK_GEN['prek.name'].unshift(() => { const L = pick('MNVWXYZK'.split('')); return { type: 'trace', skill: 'prek.name', style: 'print', word: L, q: `${L} has slanted lines. Trace ${L}.`, why: 'Slant, slant. You did it!', dok: 1 }; });

export const PREK_DAY = [
  { id: 'circle', icon: '🌞', title: 'Circle time', kind: 'circle', teacher: 'Good morning, friends! Come sit on the rug. Let’s see the weather and how we feel today.', skills: ['prek.feelings', 'prek.numbers'],
    questions: [C('prek.feelings', 'How do you feel today?', '😊', ['😢', '😠'], 'Thank you for telling me! All feelings are okay.', ['Thank you for telling me. Sad is okay too.', 'Thank you for telling me. We can take slow breaths.']),
      C('prek.colors', '☀️ It is sunny! What do we wear on a sunny day?', '🕶️ sunglasses', ['🧤 mittens', '☔ a raincoat'], 'Yes! Sunglasses for sunny days.', ['Mittens are for snowy days.', 'A raincoat is for rainy days.'])] },
  { id: 'letters', icon: '🔤', title: 'Letters & sounds', kind: 'lesson', teacher: 'Let’s meet our letters and listen for their sounds.', skills: ['prek.letters', 'prek.sounds', 'prek.rhyme', 'prek.name'] },
  { id: 'story', icon: '📚', title: 'Story time', kind: 'story', teacher: 'Criss-cross, listening ears on. Here is our story.', skills: ['prek.feelings', 'prek.colors'],
    story: ['Kofi had a red ball. 🔴', 'He took it to the park with Grandma.', 'The ball rolled away, and Kofi felt sad. 😢', 'His friend Hana found it under a tree. 🌳', 'Kofi said, “Thank you!” Then they played together. 😊'],
    questions: [C('prek.colors', 'What color was Kofi’s ball?', 'red', ['blue', 'green'], 'Yes! Kofi’s ball was red.', ['Listen again: it was a red ball.', 'The tree was green. The ball was red.']),
      C('prek.feelings', 'How did Kofi feel when the ball rolled away?', '😢 sad', ['😊 happy', '😴 sleepy'], 'Yes! Kofi felt sad. Then Hana helped.', ['He felt happy at the end, after Hana helped.', 'He was not sleepy. He was sad.'])] },
  { id: 'numbers', icon: '🔢', title: 'Numbers & counting', kind: 'lesson', teacher: 'Get your counting fingers ready! Let’s count together.', skills: ['prek.count', 'prek.numbers', 'prek.compare'] },
  { id: 'shapes', icon: '🔺', title: 'Shapes, colors & patterns', kind: 'lesson', teacher: 'Let’s go on a shape and color hunt!', skills: ['prek.shapes', 'prek.colors', 'prek.patterns', 'prek.sizes', 'prek.opposites'] },
  { id: 'move', icon: '🤸', title: 'Move & play', kind: 'move', teacher: 'Stand up, wiggle-worms! Let’s do 5 big jumps together: 1, 2, 3, 4, 5!', skills: [] },
  { id: 'friends', icon: '💛', title: 'Feelings & friends', kind: 'lesson', teacher: 'Let’s talk about feelings and how to be a good friend.', skills: ['prek.feelings'] },
  { id: 'ready', icon: '🎒', title: 'Getting ready for school', kind: 'lesson', teacher: 'Big kids know school habits and how to stay safe. Let’s practice!', skills: ['prek.routines', 'prek.safety'] },
  { id: 'goodbye', icon: '👋', title: 'Goodbye song', kind: 'calm', teacher: 'Goodbye, friends, goodbye! You worked so hard today. See you next time!', skills: [] },
];
