// REAL — pre-college pack (band 6, grades 11–12 and college-bound learners): SAT/ACT-style math, evidence-based reading,
// grammar and the essay, plus the practical side of getting to college: applying, paying, studying and choosing a path.
// Math items use fresh numbers every time; every choice question explains why each wrong answer is tempting but wrong.
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const num = (skill, q, a, why, dok = 2, extra = {}) => ({ type: 'number', skill, q, a, why, dok, ...extra });
// choice with computed distractors: w = [[wrong, reason], ...]
const ch = (skill, q, a, w, why, dok = 2, extra = {}) => ({ type: 'choice', skill, q, a: String(a), o: [String(a), ...w.map((x) => String(x[0]))], why, dok,
  whyWrong: Object.fromEntries(w.map(([x, r]) => [String(x), r])), ...extra });
// fixed banks: [question, answer, [wrong], why, dok, [whyWrong]]
const bank = (skill, rows) => rows.map(([q, a, w, why, dok, ww]) => () => ({ type: 'choice', skill, q, a, o: [a, ...w], why, dok, whyWrong: Object.fromEntries(w.map((x, i) => [x, ww[i]])) }));

export const PRECOL_SKILLS = [
  ['col.algebra', 'math', 6, 'College-prep algebra', 'Solve linear equations, systems and inequalities, and work with slope.', ['math.algebra'],
    'Do the same thing to both sides until the variable stands alone. For slope, it is rise over run: change in y divided by change in x.',
    'Think of an equation as a balance. Undo the last thing that happened to x first, then work backwards.'],
  ['col.data', 'math', 6, 'Data & probability', 'Find percent change, ratios, mean and median, read tables and find simple probabilities.', ['math.percent'],
    'Percent change is (new − old) ÷ old × 100. Probability is favorable outcomes ÷ total outcomes.',
    'Always ask “percent of what?” The starting value is the base for percent change.'],
  ['col.geometry', 'math', 6, 'College-prep geometry', 'Find area and volume, use the Pythagorean theorem and angle facts.', ['math.geometry'],
    'Area counts squares, volume counts cubes. In a right triangle, a² + b² = c², where c is the side across from the right angle.',
    'Sketch it first. Label what you know, then pick the formula that links the known parts to the unknown.'],
  ['col.functions', 'math', 6, 'Functions & growth', 'Use function notation, compare linear and exponential growth, and interpret graphs.', ['col.algebra'],
    'f(3) means “put 3 in for x.” Linear growth adds the same amount each step; exponential growth multiplies by the same factor.',
    'Make a small table of values. If the differences are equal, it is linear; if the ratios are equal, it is exponential.'],
  ['col.reading', 'reading', 6, 'Evidence-based reading', 'Find main idea, evidence, word meaning in context and author’s purpose in short passages.', ['read.research'],
    'Answer from the passage, not from what you already believe. The right answer can be pointed to in the text.',
    'Before looking at the choices, say the answer in your own words. Then pick the choice closest to it.'],
  ['col.grammar', 'writing', 6, 'Standard English conventions', 'Apply subject-verb agreement, punctuation, concision and transitions.', ['write.commas'],
    'Find the true subject, ignore the phrases in between, and match the verb. Shorter is usually better when meaning stays the same.',
    'Read the sentence aloud without the extra phrase. Your ear often catches the error.'],
  ['col.essay', 'writing', 6, 'Essay writing', 'Write an argumentative or personal essay with a thesis, evidence, a counterargument and a conclusion.', ['write.argument'],
    'Claim, evidence, explanation. Name the other side fairly, then show why your view still holds.',
    'Write your thesis as one sentence a stranger could disagree with. Every paragraph should prove part of it.'],
  ['col.apply', 'social', 6, 'Applying to college', 'Understand deadlines, early and regular decision, recommendations, the personal statement, transfer and trade paths.', [],
    'Make a calendar of deadlines, ask for letters early, and apply to a balanced list. Community college and apprenticeships are real routes, not back-ups.',
    'Work backwards from each deadline. Anything that needs another person, like a letter, needs the most lead time.'],
  ['col.aid', 'finance', 6, 'Paying for college', 'Use the FAFSA, compare grants, loans, scholarships and work-study, and read an aid letter.', [],
    'Grants and scholarships are free money; loans must be paid back with interest. Compare net price, not sticker price.',
    'Ask of every line in an aid letter: do I have to pay this back? If yes, it is a loan.'],
  ['col.study', 'health', 6, 'Study skills', 'Use spaced and retrieval practice, good notes, time blocking, office hours and stress tools.', [],
    'Testing yourself and spreading practice out beat rereading and cramming. Plan your week in blocks.',
    'Close the book and try to explain it. What you cannot recall is what you study next.'],
  ['col.path', 'thinking', 6, 'Choosing a path', 'Weigh majors, careers, earnings and costs across college, trade school, the military and work.', [],
    'Compare the full cost, the time, and the likely earnings of each path, then check it fits what you enjoy and are good at.',
    'Talk to people doing the job. Their day is the job, not the job title.'],
];

// ---------------- math generators ----------------
const algebra = [
  () => { const x = ri(-6, 12), a = ri(2, 9), b = ri(-15, 15), c = a * x + b; return num('col.algebra', `Solve for x: ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${c}`, x, `Undo the ${b < 0 ? 'subtraction' : 'addition'} first: ${a}x = ${c - b}. Then divide by ${a}: x = ${x}.`); },
  () => { const x = ri(1, 10), a = ri(5, 9), c = ri(1, 4), b = ri(1, 20), d = (a - c) * x + b; return num('col.algebra', `Solve for x: ${a}x + ${b} = ${c}x + ${d}`, x, `Collect x on one side: ${a - c}x = ${d - b}, so x = ${x}.`, 2); },
  () => { const x = ri(1, 9), y = ri(1, 9), s = x + y, d = x - y; return num('col.algebra', `x + y = ${s} and x − y = ${d}. What is x?`, x, `Add the equations: 2x = ${s + d}, so x = ${x}.`, 2); },
  () => { const x = ri(1, 8), y = ri(1, 8), a = ri(2, 4), e1 = a * x + y, e2 = x + y; return num('col.algebra', `${a}x + y = ${e1} and x + y = ${e2}. What is y?`, y, `Subtract: ${a - 1}x = ${e1 - e2}, so x = ${x}. Then y = ${e2} − ${x} = ${y}.`, 3); },
  () => { const x1 = ri(-5, 3), y1 = ri(-5, 5), m = pick([-3, -2, 2, 3, 4]), dx = ri(1, 5), x2 = x1 + dx, y2 = y1 + m * dx;
    return ch('col.algebra', `What is the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2})?`, m,
      [[-m, 'This flips the sign. Subtract in the same order on top and bottom.'], [m === 2 || m === -2 ? m * 3 : m * 2, 'This doubles the rise or miscounts the run. Slope is (y₂ − y₁) ÷ (x₂ − x₁).'], [`1/${m}`.replace('1/-', '−1/'), 'This is run over rise, upside down. Slope is rise over run.']],
      `Slope = (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${m * dx} ÷ ${dx} = ${m}.`, 2); },
  () => { const a = ri(2, 6), x = ri(2, 9), b = ri(1, 10), c = a * x + b; return ch('col.algebra', `Solve: ${a}x + ${b} < ${c}`, `x < ${x}`,
      [[`x > ${x}`, 'The sign only flips when you multiply or divide by a negative number. Here you divide by a positive.'], [`x < ${c - b}`, 'You subtracted but forgot to divide by the coefficient.'], [`x < ${c + b}`, 'You added the constant instead of subtracting it from both sides.']],
      `Subtract ${b}: ${a}x < ${c - b}. Divide by ${a}: x < ${x}.`, 2); },
  () => { const a = ri(2, 5), x = ri(1, 6), c = -a * x; return ch('col.algebra', `Solve: −${a}x ≥ ${c}`, `x ≤ ${x}`,
      [[`x ≥ ${x}`, 'Dividing by a negative number flips the inequality. This forgot to flip it.'], [`x ≤ −${x}`, 'A negative divided by a negative is positive.'], [`x ≥ −${x}`, 'Both the sign of the answer and the direction are off.']],
      `Divide both sides by −${a} and flip the sign: x ≤ ${x}.`, 2); },
  () => { const fee = ri(2, 6) * 5, rate = ri(8, 15), h = ri(2, 8), tot = fee + rate * h; return num('col.algebra', `A plumber charges a $${fee} visit fee plus $${rate} per hour. A bill is $${tot}. How many hours did the job take? (Hypothetical prices.)`, h,
      `${fee} + ${rate}h = ${tot}, so ${rate}h = ${tot - fee} and h = ${h}.`, 2, { suffix: 'hours' }); },
  () => { const m = ri(2, 7), b = ri(-9, 9), x = ri(-4, 6); return num('col.algebra', `The line y = ${m}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}. What is y when x = ${x}?`, m * x + b, `${m} × ${x} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${m * x + b}.`, 2); },
];
const data = [
  () => { const old = ri(4, 20) * 10, p = pick([10, 20, 25, 30, 40, 50]), nw = old + old * p / 100; return num('col.data', `A price rose from $${old} to $${nw}. What is the percent increase?`, p, `(${nw} − ${old}) ÷ ${old} = ${nw - old} ÷ ${old} = ${p / 100}, so ${p}%.`, 2, { suffix: '%' }); },
  () => { const old = ri(4, 20) * 10, p = pick([10, 20, 25, 50]), nw = old - old * p / 100;
    return ch('col.data', `Attendance fell from ${old} to ${nw}. What is the percent decrease?`, `${p}%`,
      [[`${Math.round((old - nw) / nw * 1000) / 10}%`, 'This divides by the new value. Percent change uses the starting value as the base.'], [`${old - nw}%`, 'This is the raw change, not a percent of the start.'], [`${100 - p}%`, 'This is the percent that remains, not the percent lost.']],
      `(${old} − ${nw}) ÷ ${old} = ${p / 100}, a ${p}% decrease.`, 2); },
  () => { const a = ri(2, 5), b = ri(2, 7), k = ri(3, 9); if (a === b) return num('col.data', `A recipe uses flour and sugar in a ratio of ${a + 1}:${b + 3}. With ${(a + 1) * k} cups of flour, how many cups of sugar?`, (b + 3) * k, `Scale by ${k}: ${b + 3} × ${k} = ${(b + 3) * k}.`);
    return num('col.data', `Boys to girls in a club is ${a}:${b}. There are ${a * k} boys. How many girls?`, b * k, `${a * k} ÷ ${a} = ${k} groups, and ${b} × ${k} = ${b * k} girls.`, 2); },
  () => { const v = Array.from({ length: 5 }, () => ri(60, 100)), s = v.reduce((x, y) => x + y, 0), extra = 5 - (s % 5); v[0] += extra % 5; const t = v.reduce((x, y) => x + y, 0);
    return num('col.data', `Test scores: ${v.join(', ')}. What is the mean?`, t / 5, `Add them: ${t}. Divide by 5: ${t / 5}.`, 2); },
  () => { const v = Array.from({ length: 5 }, () => ri(10, 60)); const s = [...v].sort((x, y) => x - y);
    return num('col.data', `Commute times in minutes: ${v.join(', ')}. What is the median?`, s[2], `Sort them: ${s.join(', ')}. The middle value is ${s[2]}.`, 2); },
  () => { const r = ri(2, 6), b = ri(2, 6), g = ri(1, 6), t = r + b + g;
    return ch('col.data', `A bag has ${r} red, ${b} blue and ${g} green marbles. What is the probability of drawing a red one?`, `${r}/${t}`,
      [[`${r}/${b + g}`, 'This compares red to non-red (odds), not red to the total.'], [`1/3`, 'Three colors does not mean each is equally likely; count the marbles.'], [`${r}/${t + 1}`, 'The total is miscounted. Add all the marbles: ' + t + '.']].filter((x, i, A) => A.findIndex((y) => y[0] === x[0]) === i && x[0] !== `${r}/${t}`).concat([[`${t}/${r}`, 'This is upside down. Probability is favorable over total and is never more than 1.']]).slice(0, 3),
      `${r} red out of ${t} marbles: ${r}/${t}.`, 2); },
  () => { const a = ri(20, 60), b = ri(20, 60), c = ri(20, 60), d = ri(20, 60);
    return num('col.data', `Survey (students): Juniors who drive ${a}, juniors who do not ${b}; seniors who drive ${c}, seniors who do not ${d}. How many seniors were surveyed?`, c + d, `Seniors row: ${c} + ${d} = ${c + d}.`, 2); },
  () => { const a = ri(10, 40), b = ri(10, 40), c = ri(10, 40), d = ri(10, 40), tot = a + b + c + d;
    return ch('col.data', `A table: Morning shift, likes job ${a}, does not ${b}. Evening shift, likes job ${c}, does not ${d}. What fraction of all workers are evening workers who like the job?`, `${c}/${tot}`,
      [[`${c}/${c + d}`, 'This is the share of evening workers, not of all workers. Check the question’s base.'], [`${c}/${a + c}`, 'This is the share of job-likers who work evenings, a different base.'], [`${c + d}/${tot}`, 'This includes evening workers who do not like the job.']],
      `Evening and likes it: ${c}. All workers: ${tot}. So ${c}/${tot}.`, 3); },
  () => { const p = pick([2, 4, 5, 10]), q = pick([2, 3, 6]); return ch('col.data', `A fair coin is flipped and a fair ${q === 2 ? '4' : q === 3 ? '3' : '6'}-sided die is rolled. What is the probability of heads and a 1?`, `1/${2 * (q === 2 ? 4 : q)}`,
      [[`1/${2 + (q === 2 ? 4 : q)}`, 'For independent events you multiply probabilities, not add the denominators.'], [`2/${2 * (q === 2 ? 4 : q)}`, 'There is only one way to get heads and a 1.'], [`1/2`, 'This is only the coin. Both events must happen.']],
      `Multiply: 1/2 × 1/${q === 2 ? 4 : q} = 1/${2 * (q === 2 ? 4 : q)}.`, 2); },
];
const geometry = [
  () => { const t = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), k = ri(1, 3); return num('col.geometry', `A right triangle has legs ${t[0] * k} and ${t[1] * k}. How long is the hypotenuse?`, t[2] * k, `${t[0] * k}² + ${t[1] * k}² = ${(t[2] * k) ** 2}, and √${(t[2] * k) ** 2} = ${t[2] * k}.`, 2); },
  () => { const t = pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [9, 12, 15]]); return num('col.geometry', `A ladder ${t[2]} ft long leans on a wall. Its foot is ${t[0]} ft from the wall. How high up the wall does it reach?`, t[1], `${t[2]}² − ${t[0]}² = ${t[2] ** 2 - t[0] ** 2}, and the square root is ${t[1]}.`, 3, { suffix: 'ft' }); },
  () => { const l = ri(3, 15), w = ri(2, 12); return num('col.geometry', `A rectangular room is ${l} m by ${w} m. What is its area in square meters?`, l * w, `${l} × ${w} = ${l * w} m².`, 2); },
  () => { const b = ri(2, 10) * 2, h = ri(3, 12); return ch('col.geometry', `A triangle has base ${b} cm and height ${h} cm. What is its area?`, `${b * h / 2} cm²`,
      [[`${b * h} cm²`, 'This forgot the ½. A triangle is half of a rectangle.'], [`${b + h} cm²`, 'Area multiplies; it does not add.'], [`${(b * h) / 4} cm²`, 'This halves twice.']], `½ × ${b} × ${h} = ${b * h / 2} cm².`, 2); },
  () => { const l = ri(2, 9), w = ri(2, 9), h = ri(2, 9); return num('col.geometry', `A box is ${l} by ${w} by ${h} inches. What is its volume in cubic inches?`, l * w * h, `${l} × ${w} × ${h} = ${l * w * h}.`, 2); },
  () => { const r = ri(2, 6), h = ri(2, 10); return ch('col.geometry', `A cylinder has radius ${r} and height ${h}. What is its volume?`, `${r * r * h}π`,
      [[`${2 * r * h}π`, 'This uses 2r instead of r². Volume of a cylinder is πr²h.'], [`${r * h}π`, 'The radius must be squared.'], [`${2 * r * r * h}π`, 'This doubles the volume, maybe by using the diameter in one place.']], `V = π × ${r}² × ${h} = ${r * r * h}π.`, 2); },
  () => { const a = ri(25, 80), b = ri(25, 80); return num('col.geometry', `Two angles of a triangle are ${a}° and ${b}°. What is the third angle?`, 180 - a - b, `Angles in a triangle add to 180°: 180 − ${a} − ${b} = ${180 - a - b}.`, 2, { suffix: '°' }); },
  () => { const a = ri(20, 160); return ch('col.geometry', `Two angles form a straight line. One is ${a}°. What is the other?`, `${180 - a}°`,
      [[`${90 - a < 0 ? a - 90 : 90 - a}°`.replace(/^0°$/, '1°'), 'That uses 90°. Angles on a straight line add to 180°.'], [`${a}°`, 'Vertical angles are equal; supplementary ones are not (unless both are 90°).'], [`${360 - a}°`, 'Angles all the way around a point add to 360°, but a line is only 180°.']].filter((x) => x[0] !== `${180 - a}°`),
      `Supplementary angles add to 180°: 180 − ${a} = ${180 - a}.`, 2); },
  () => { const r = ri(2, 10); return ch('col.geometry', `A circle has radius ${r}. What is its area?`, `${r * r}π`,
      [[`${2 * r}π`, 'That is the circumference, 2πr, not the area.'], [`${4 * r * r}π`, 'This squares the diameter instead of the radius.'], [`${r * r + 1}π`, 'Recheck the square: area is π times r².']], `A = πr² = ${r * r}π.`, 2); },
];
const functions = [
  () => { const a = ri(2, 6), b = ri(-8, 8), x = ri(-3, 6); return num('col.functions', `f(x) = ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}. What is f(${x})?`, a * x + b, `Replace x with ${x}: ${a}(${x}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${a * x + b}.`, 2); },
  () => { const x = ri(-4, 4), c = ri(1, 9); return num('col.functions', `g(x) = x² + ${c}. What is g(${x})?`, x * x + c, `(${x})² = ${x * x}, plus ${c} is ${x * x + c}. A negative number squared is positive.`, 2); },
  () => { const a = ri(2, 5), b = ri(1, 9), y = ri(3, 9) * a + b; return num('col.functions', `h(x) = ${a}x + ${b}. For what x is h(x) = ${y}?`, (y - b) / a, `${a}x + ${b} = ${y}, so x = ${(y - b) / a}.`, 2); },
  () => { const s = ri(1, 5) * 100, n = ri(2, 4); return num('col.functions', `A video’s views double every day. It starts with ${s} views. How many after ${n} days?`, s * 2 ** n, `${s} × 2^${n} = ${s * 2 ** n}. Doubling is exponential: multiply each day.`, 2); },
  () => { const s = ri(1, 5) * 100, d = ri(2, 5) * 50; return ch('col.functions', `A savings account starts at $${s} and grows by $${d} every month. What kind of growth is this?`, 'Linear',
      [['Exponential', 'Exponential growth multiplies by the same factor. This adds the same amount.'], ['Quadratic', 'Quadratic change has changes that grow steadily; here the change stays the same.'], ['No growth', 'The balance rises every month.']], 'Adding the same amount each step makes a straight line: linear growth.', 2); },
  () => bank('col.functions', [['Plan A pays $500 a week. Plan B starts at $1 and doubles every week. Over a long time, which grows bigger?', 'Plan B, because exponential growth eventually passes any linear growth', ['Plan A, because a big starting amount always stays ahead of doubling', 'They end up about equal, because both plans keep adding money each week', 'Plan A, because doubling only works for the first few weeks'], 'Doubling starts slow but overtakes any constant addition eventually.', 3,
    ['A high start helps only at first. Doubling catches up and passes it.', 'One adds, the other multiplies. They cannot stay equal.', 'Both plans change every week.']]])[0](),
  () => bank('col.functions', [['A graph of a car’s distance from home is flat from minute 10 to minute 15. What happened?', 'The car was stopped', ['The car was going fastest', 'The car was driving home', 'The car went backwards in time'], 'A flat distance-time graph means distance is not changing.', 2,
    ['Fast driving makes the graph steep, not flat.', 'Driving home would make the distance go down.', 'Time always moves forward on the x-axis.']]])[0](),
  () => { const x = ri(1, 4), b = pick([2, 3]); return num('col.functions', `f(x) = ${b}^x. What is f(${x})?`, b ** x, `${b} multiplied by itself ${x} time${x > 1 ? 's' : ''} is ${b ** x}.`, 2); },
  () => bank('col.functions', [['A table: x = 0, 1, 2, 3 and y = 5, 10, 20, 40. Which describes it?', 'Exponential: y doubles each time x goes up by 1', ['Linear: y goes up by 5 each step', 'Linear: y goes up by 10 each step', 'Constant: y does not change'], 'The ratios are equal (×2), so it is exponential.', 3,
    ['Only the first step adds 5. The next steps add 10, then 20.', 'The differences are 5, 10, 20, not a steady 10.', 'The y values clearly change.']]])[0](),
];

// ---------------- reading: short passages ----------------
const PASS = [
  { id: 'col-sleep', title: 'The Teenage Clock', icon: '🌙', text: [
    'During adolescence, the body’s internal clock shifts later. Many teenagers do not feel sleepy until well after ten at night, yet most high schools start early in the morning.',
    'Researchers who studied districts that moved start times later found that students slept longer, attended class more often and, in some cases, earned slightly higher grades. Car crashes involving teen drivers also tended to fall.',
    'Later starts are not free. Districts must rearrange bus routes, sports schedules and parents’ work plans. Still, many sleep scientists argue that the benefits to health and learning outweigh these logistical costs.'],
    qs: [
      ['What is the main idea of the passage?', 'Later school start times may help teens, though they bring practical costs', ['Teenagers are lazy and should go to bed earlier', 'Bus routes are the biggest problem schools face', 'Grades depend only on sleep'], 'The passage presents evidence for later starts and then names the costs.', 2,
        ['The passage blames biology, not laziness.', 'Buses are one cost mentioned, not the main idea.', '“Only” is too strong; grades rose “slightly” and “in some cases.”']],
      ['Which detail best supports the claim that later starts help students?', 'Students slept longer and attended class more often', ['Districts must rearrange bus routes', 'Teens do not feel sleepy until after ten', 'Parents have work plans'], 'This is the direct result researchers found after the change.', 2,
        ['That is a cost, not a benefit.', 'That explains the problem, not the result of the fix.', 'That is a challenge, not evidence of benefit.']],
      ['As used in paragraph 3, “logistical” most nearly means', 'related to planning and organizing', ['related to logic puzzles', 'medical', 'imaginary'], 'Bus routes and schedules are planning problems.', 2,
        ['It sounds like “logic,” but the context is schedules.', 'Health is a separate benefit in the sentence.', 'The costs are real, not imaginary.']],
    ] },
  { id: 'col-bees', title: 'Rented Pollinators', icon: '🐝', text: [
    'Each spring, beekeepers load hives onto trucks and drive them to orchards, where the bees pollinate crops such as almonds. Without this service, many orchards would produce far less fruit.',
    'The practice has drawbacks. Moving hives stresses colonies, and crowding bees from many places together can spread disease. Some farmers are now planting wildflowers between rows to support wild bees as well.',
    'The author of one farm report put it simply: relying on a single solution is risky, and a healthy farm, like a healthy investment portfolio, depends on variety.'],
    qs: [
      ['What is the author’s main purpose?', 'To explain a farming practice and its risks, and suggest variety as a safeguard', ['To persuade readers to stop buying almonds because of what bees go through', 'To give step-by-step instructions for moving and caring for honeybee hives', 'To tell a personal story about a beekeeper'], 'The passage describes the practice, its drawbacks and the value of variety.', 2,
        ['The passage never tells readers to stop eating almonds.', 'There are no step-by-step instructions.', 'No single person’s story is told.']],
      ['Why does the author compare a farm to an investment portfolio?', 'To show that depending on one source is risky', ['To prove that farms make more money than stocks', 'To suggest farmers should sell their land', 'To explain how bees are bought and sold'], 'Both are safer when spread across many sources.', 3,
        ['The comparison is about risk, not profit.', 'Nothing suggests selling land.', 'The analogy is about variety, not trading bees.']],
      ['Which choice gives the best evidence that moving hives has costs?', 'Moving hives stresses colonies, and crowding can spread disease', ['Bees pollinate many crops, such as almonds, apples and blueberries', 'Beekeepers load hives onto trucks and drive them to orchards each spring', 'Without bees, many orchards would produce much less fruit each year'], 'This sentence directly names the harms.', 2,
        ['That is a benefit of the practice.', 'That describes the process, not a cost.', 'That shows why the practice exists.']],
    ] },
  { id: 'col-library', title: 'The Quiet Revolution', icon: '📚', text: [
    'Public libraries were once judged mainly by the size of their book collections. Today many measure success differently: by how many people use their computers, attend job workshops or borrow tools and laptops.',
    'Critics sometimes claim that libraries are fading in the internet age. Yet in many towns the library is the only free indoor space where anyone can stay without buying something.',
    'For a student without home internet or a worker updating a résumé, that access is not a luxury. It is the difference between being connected and being left out.'],
    qs: [
      ['The author would most likely agree that', 'libraries remain important because they provide free access', ['libraries should only lend books', 'the internet has made libraries useless', 'libraries should charge for workshops'], 'The final paragraph stresses that access matters.', 3,
        ['The author praises services beyond books.', 'The author argues against this claim.', 'The author values the space being free.']],
      ['How does paragraph 2 function in the passage?', 'It states a criticism and then answers it', ['It lists the library’s opening hours', 'It agrees that libraries are fading', 'It describes the history of book collecting'], '“Critics claim… Yet…” is a counterargument and rebuttal.', 3,
        ['No hours are mentioned.', '“Yet” signals the author disagrees.', 'History is in paragraph 1, briefly.']],
      ['As used in paragraph 3, “luxury” most nearly means', 'something nice but not needed', ['something expensive and shiny', 'a type of hotel', 'a reward for good work'], 'The author says access is a need, not an extra.', 2,
        ['Price is not the point here; necessity is.', 'That is an unrelated meaning.', 'Nothing in the context is about rewards.']],
    ] },
];
const reading = PASS.flatMap((P) => P.qs.map(([q, a, w, why, dok, ww]) => () => ({ type: 'choice', skill: 'col.reading', q, a, o: [a, ...w], why, dok, whyWrong: Object.fromEntries(w.map((x, i) => [x, ww[i]])),
  band: 6, passage: P.id, v: { title: `${P.icon} ${P.title}`, lines: P.text } })));
export const PRECOL_PASSAGES = PASS;

// ---------------- grammar ----------------
const grammar = bank('col.grammar', [
  ['Choose the correct verb: “The list of required documents ___ on the website.”', 'is', ['are', 'were', 'be'], 'The subject is “list,” which is singular. “Of required documents” is just a phrase in between.', 2,
    ['“Documents” is inside a phrase; it is not the subject.', '“Were” is plural and also the wrong tense.', '“Be” is not a complete verb here.']],
  ['Choose the correct verb: “Neither the coach nor the players ___ ready.”', 'were', ['was', 'is', 'been'], 'With neither/nor, the verb agrees with the closer subject, “players.”', 3,
    ['“Was” would match “coach,” but “players” is closer.', '“Is” is singular and the wrong tense.', '“Been” needs a helping verb.']],
  ['Which is punctuated correctly?', 'I applied to three schools; two have replied.', ['I applied to three schools, two have replied.', 'I applied to three schools two have replied.', 'I applied; to three schools two have replied.'], 'A semicolon can join two complete sentences.', 2,
    ['A comma alone cannot join two sentences (a comma splice).', 'Two sentences with no punctuation is a run-on.', 'A semicolon must sit between two complete clauses.']],
  ['Which is the most concise version?', 'She decided to apply early.', ['She made the decision that she would apply early in advance.', 'She decided, after deciding, to apply early.', 'She decided to apply early, which was ahead of time.'], 'Cut words that repeat meaning.', 2,
    ['“Early” and “in advance” repeat each other.', 'Saying “decided” twice adds nothing.', '“Early” already means “ahead of time.”']],
  ['Choose the best transition: “Tuition rose this year. ___, the school expanded its grant program.”', 'However', ['Therefore', 'For example', 'Similarly'], 'The second sentence offers a contrast: costs rose, but help grew.', 2,
    ['“Therefore” signals a result, but grants are not caused by tuition rising here.', 'The second sentence is not an example of the first.', 'The ideas contrast; they are not similar.']],
  ['Which uses the apostrophe correctly?', 'The students’ essays were due Friday.', ['The student’s essays were due Friday by all of them.', 'The students essay’s were due Friday.', 'The students’s essays were due Friday.'], 'Plural possessive: add the apostrophe after the s.', 2,
    ['“Student’s” is one student, but “all of them” means many.', 'The apostrophe belongs on the owner, not the thing owned.', 'Plural nouns ending in s just take an apostrophe.']],
  ['Which sentence avoids a dangling modifier?', 'Walking to class, I saw the new library.', ['Walking to class, the new library came into view.', 'The new library, walking to class, was seen.', 'Walking to class, the library was new.'], 'The opening phrase must describe the word right after the comma.', 3,
    ['The library was not walking to class.', 'This still makes the library do the walking.', 'Again the library is the one walking.']],
  ['Choose the correct pronoun: “Each applicant must submit ___ transcript.”', 'their', ['they’re', 'there', 'its'], '“Their” is the possessive; singular “their” is accepted in standard English for a person of unknown gender.', 2,
    ['“They’re” means “they are.”', '“There” is a place.', '“Its” is for things, not people.']],
  ['Which is punctuated correctly?', 'My sister, who studies nursing, works nights.', ['My sister who studies nursing, works nights.', 'My sister, who studies nursing works nights.', 'My sister who, studies nursing, works nights.'], 'An extra-information clause needs commas on both sides.', 2,
    ['A comma is missing before “who.”', 'The closing comma after “nursing” is missing.', 'The commas are in the wrong places.']],
]);

// ---------------- essay ----------------
const thesis = (t) => /\b(should|must|because|believe|argue|best|need)\b/i.test(t);
const evidence = (t) => /\b(for example|for instance|research|study|data|according to|when I|percent|\d)/i.test(t);
const counter = (t) => /\b(some (people )?(argue|say|believe)|critics|opponents|on the other hand|although|while it is true|others)\b/i.test(t);
const concl = (t) => /\b(in the end|in conclusion|ultimately|that is why|for these reasons|overall)\b/i.test(t);
const RUBRIC = [['Clear thesis (a claim someone could disagree with)', thesis, 'I believe … because …'], ['Evidence or a specific example', evidence, 'For example, …'],
  ['Names the other side (counterargument)', counter, 'Some people argue … However, …'], ['A conclusion that ties it together', concl, 'In the end, …']];
const essayW = (q, model) => () => ({ type: 'write', skill: 'col.essay', q, minWords: 80, rubric: RUBRIC, model, why: 'Strong essays make a claim, prove it with evidence, answer the other side and land the point.', dok: 3 });
const essay = [
  essayW('Should high schools require a personal finance course to graduate? Write an argument of at least 80 words.', 'I believe every high school should require a personal finance course because money decisions start early. For example, many students sign their first loan papers at seventeen or eighteen, often without knowing how interest works. A semester course could teach budgeting, credit and loans before those choices are made. Some people argue that families should teach money at home. However, not every family has the time or knowledge, and a class makes sure everyone gets the same start. In the end, a required course is a small cost for a lifetime of better choices.'),
  essayW('Write a short personal essay (80+ words) about a challenge that changed how you work. Argue what it taught you.', 'I believe the hardest class I ever took taught me more than any easy A because it forced me to change how I study. For example, I failed my first chemistry test after rereading my notes for hours. I started quizzing myself with flash cards and working problems every night, and my next score rose by twenty points. Some people argue that grades show talent, not effort. Although talent matters, my results changed only when my habits did. That is why I now treat struggle as a signal to adjust, not a reason to quit.'),
  essayW('Should students take a gap year before college? Write an argument of at least 80 words.', 'I argue that a planned gap year can be the best choice for some students because it builds focus and savings. For instance, a student who works for a year might save money for books and learn which career interests them. Research on gap years suggests many students return motivated. Critics say students who take a year off may never go back. That risk is real, so the year needs a plan, such as a deferred admission and a clear start date. Ultimately, a gap year with a purpose is a step forward, not a delay.'),
  ...bank('col.essay', [
    ['Which is the strongest thesis for an argumentative essay?', 'Schools should start later because teens learn better when rested.', ['This essay is about school start times.', 'Some schools start early and some start late.', 'Sleep is a thing that people do.'], 'A thesis makes a clear, arguable claim and gives a reason.', 2,
      ['This announces a topic but makes no claim.', 'This is a fact, not something to argue.', 'This is obvious and says nothing arguable.']],
    ['What is the purpose of a counterargument paragraph?', 'To show you understand the other side and explain why your view still holds', ['To switch to the opposing side so the essay sounds fair to every reader', 'To add length so the essay reaches the required word count', 'To restate your thesis in new words before the conclusion begins'], 'Answering objections makes your argument more convincing.', 2,
      ['You acknowledge the other side; you do not adopt it.', 'Padding weakens essays.', 'Restating the thesis is the conclusion’s job.']],
    ['Which sentence is the best evidence for the claim “Part-time jobs can help students”?', 'In a survey of our school, students with jobs reported better time management.', ['Jobs are good for students, and most people would agree with that.', 'My friend has a job, and she says she likes it a lot.', 'Everyone knows that jobs help teenagers grow up faster.'], 'Specific, sourced evidence is strongest.', 2,
      ['This is opinion, not evidence.', 'A friend having a job does not show it helps.', '“Everyone knows” is an assumption, not proof.']],
    ['A personal statement works best when it', 'tells one specific story and shows what you learned', ['lists every award, club and activity you have ever done', 'uses impressive vocabulary to sound as smart as possible', 'repeats your grades and test scores in full sentences'], 'Admissions readers want your voice and reflection, not a résumé.', 2,
      ['The activities section already lists awards.', 'Big words do not replace clear thinking.', 'Your grades are already in the application.']],
    ['What should a strong conclusion do?', 'Tie the evidence back to the thesis and show why it matters', ['Introduce a brand new argument to leave the reader thinking', 'Apologize for anything the essay may have left out', 'Copy the introduction word for word so the essay feels complete'], 'A conclusion lands the argument and leaves the reader with its importance.', 2,
      ['New arguments belong in body paragraphs.', 'Apologizing weakens your authority.', 'Echo the idea, but in fresh words.']],
  ]),
];

// ---------------- college applications ----------------
const apply = bank('col.apply', [
  ['What is the main difference between early decision and early action?', 'Early decision is binding if you are admitted; early action is not', ['Early action is binding; early decision is not', 'Both are binding', 'Neither has an earlier deadline'], 'Early decision commits you to attend if admitted (with limited exceptions such as aid). Early action only gets you an early answer.', 2,
    ['This has them reversed.', 'Early action does not commit you.', 'Both usually have fall deadlines, earlier than regular decision.']],
  ['When should you ask a teacher for a recommendation letter?', 'Several weeks before the deadline, with a short note about your goals', ['The night before the deadline, when you know exactly what you need', 'After the deadline passes, since late letters are usually accepted', 'Only if the teacher offers first, so you do not seem pushy'], 'Teachers write many letters; early, polite requests get better letters.', 2,
    ['Last-minute requests are unfair and lead to rushed letters.', 'A late letter may not count.', 'Most teachers expect students to ask.']],
  ['What is a personal statement?', 'An essay that shows who you are beyond grades and scores', ['A list of your test scores, grades and class rank', 'A letter from your parents describing your strengths', 'A financial aid form that shows what your family can pay'], 'It is your chance to add your voice and story.', 2,
    ['Scores are reported separately.', 'Parents do not write it; you do.', 'Aid forms are a separate process.']],
  ['A student wants a lower-cost start and then a bachelor’s degree. Which path fits?', 'Start at a community college, then transfer to a four-year school', ['Skip college for now and wait until it becomes cheaper', 'Apply only to the most expensive schools, since they give the most aid', 'Take no classes for two years and save money first'], 'Many states have transfer agreements so credits count toward a bachelor’s degree.', 2,
    ['Waiting does not earn credits.', 'That raises cost.', 'Credits are not earned without classes.']],
  ['What should a student check before relying on community college credits transferring?', 'The transfer or articulation agreement with the target school', ['The school’s mascot', 'Whether the classes were in the morning', 'The color of the diploma'], 'Articulation agreements list which courses count.', 2,
    ['The mascot has nothing to do with credits.', 'Time of day does not affect transfer.', 'Diploma design is irrelevant.']],
  ['What is an apprenticeship?', 'A paid job where you learn a skilled trade with training and classes', ['An unpaid internship where you watch others work for a summer', 'A four-year university degree focused on one trade', 'A short summer program that teaches general job skills'], 'Apprentices earn while they learn, often in trades like electrical work or plumbing.', 2,
    ['Registered apprenticeships are usually paid and include training.', 'It is work-based, not a university degree.', 'It is a real job, often lasting years.']],
  ['A balanced college list usually includes', 'reach, match and likely schools', ['only reach schools', 'only one school', 'schools chosen only by sports teams'], 'Spreading your applications lowers the risk of no good options.', 2,
    ['All reaches risks no admission.', 'One school is risky.', 'Sports alone do not tell you about fit or cost.']],
  ['What is the best way to keep track of many application deadlines?', 'Make a calendar with each deadline and set reminders a few weeks earlier', ['Keep them in your head, since you will see the dates often', 'Wait for each college to send an email reminder before it is due', 'Apply to every school on the same day, whenever you feel ready'], 'Written plans with early reminders prevent missed deadlines.', 2,
    ['Memory fails under stress.', 'Not every school sends reminders.', 'Late applications are often not read.']],
  ['A trade school program is most likely to', 'train you for a specific job in less time than a four-year degree', ['take longer than a four-year degree because of extra classes', 'require a bachelor’s degree before you can start', 'teach only general education classes like history and English'], 'Trade programs focus on hands-on job skills and are often shorter.', 2,
    ['Most trade programs take months to about two years.', 'They usually need only a high school diploma or equivalent.', 'They focus on job skills, not general education.']],
]);

// ---------------- paying for college ----------------
const aid = [
  ...bank('col.aid', [
    ['What does the FAFSA do?', 'It applies for federal student aid, and many states and colleges use it too', ['It is a college admission test that every applicant must take', 'It is a private bank loan with a fixed interest rate', 'It is a national scholarship essay contest for seniors'], 'The Free Application for Federal Student Aid is the main form for grants, work-study and federal loans.', 2,
      ['That is the SAT or ACT.', 'It is free and from the federal government, not a bank.', 'It is a form about finances, not an essay.']],
    ['Which type of aid usually does not have to be paid back?', 'A grant', ['A federal loan', 'A private loan', 'A credit card'], 'Grants are need-based gifts; they are free money unless you fail to meet the conditions.', 2,
      ['Loans must be repaid with interest.', 'Private loans must be repaid, often at higher rates.', 'Credit card balances must be repaid, often at high APRs.']],
    ['What is work-study?', 'A program that gives students part-time jobs to earn money for school', ['A loan you repay later by studying extra hours in school', 'A required class that teaches students how to find jobs', 'A grant that pays your tuition with no work required'], 'Work-study pays you for hours you work, often on campus.', 2,
      ['It is earned pay, not a loan.', 'It is a job, not a course.', 'You must work the hours to earn it.']],
    ['A school’s sticker price is high, but its net price is low. What does net price mean?', 'The cost of attendance minus grants and scholarships', ['The cost of attendance plus loans', 'Only the cost of tuition', 'The price of textbooks'], 'Net price is what your family actually pays or borrows.', 2,
      ['Loans are money you still owe; they do not lower cost.', 'Cost of attendance also includes housing, food, books and travel.', 'Books are only part of the cost.']],
    ['An aid letter lists a “Parent PLUS loan.” What should you know?', 'It is a loan your parent must repay, not free money', ['It is a grant your family never has to pay back', 'It is a scholarship based on your parents’ income', 'It is forgiven automatically after graduation'], 'Any line called a loan must be repaid with interest.', 2,
      ['Grants are not loans.', 'Scholarships do not have to be repaid.', 'Loans do not vanish; they come due.']],
    ['Which is a debt trap to avoid?', 'Borrowing far more than your expected first-year salary', ['Using grants before loans', 'Comparing net price between schools', 'Applying for scholarships'], 'A common guideline is to keep total borrowing below your expected starting salary.', 3,
      ['Using free money first is wise.', 'Comparing net price is smart.', 'Scholarships reduce debt.']],
    ['Why fill out the FAFSA as soon as it opens?', 'Some aid is limited and given first come, first served', ['It closes after one day, so late forms are never accepted', 'It raises your GPA when colleges review your application', 'It is required before you can sign up to take the SAT'], 'Many state and school programs run out of money.', 2,
      ['It is open for months, but early is better.', 'It does not affect grades.', 'Tests and aid forms are separate.']],
    ['A scholarship website asks you to pay a fee to apply. What should you do?', 'Be very cautious, because real scholarships rarely charge to apply', ['Pay right away, because fees show the scholarship is serious', 'Send your bank details so they can deposit the award faster', 'Assume small fees are normal for every scholarship'], 'Fees and requests for bank logins are classic scam signs.', 2,
      ['Legitimate scholarships do not need your money first.', 'Never share passwords.', 'Most real scholarships are free to apply for.']],
  ]),
  () => { const p = ri(4, 12) * 1000, r = pick([4, 5, 6, 7, 8]); return num('col.aid', `A hypothetical $${p} loan has ${r}% simple interest per year. How many dollars of interest build up in one year?`, p * r / 100, `${p} × ${r / 100} = ${p * r / 100}.`, 2, { prefix: '$' }); },
  () => { const coa = ri(20, 40) * 1000, g = ri(3, 12) * 1000, s = ri(1, 5) * 1000; return num('col.aid', `A hypothetical aid letter: cost of attendance $${coa}, grant $${g}, scholarship $${s}, loan $5000. What is the net price?`, coa - g - s,
      `Net price subtracts only free money: ${coa} − ${g} − ${s} = ${coa - g - s}. The loan still has to be paid.`, 3, { prefix: '$' }); },
];

// ---------------- study skills ----------------
const study = bank('col.study', [
  ['Which study method helps you remember the most for a test next week?', 'Quizzing yourself a little each day', ['Rereading notes once the night before', 'Highlighting the whole chapter', 'Listening to the lecture again while texting'], 'Retrieval practice spread over days (spaced practice) beats cramming.', 2,
    ['Cramming feels productive but fades fast.', 'Highlighting everything is passive and does not test memory.', 'Divided attention weakens learning.']],
  ['What is spaced practice?', 'Reviewing material in several short sessions over days', ['Studying in a big quiet room with lots of space around you', 'Doing all your studying in one long session the night before', 'Leaving blank spaces in your notes to fill in later'], 'Spacing gives your memory time to strengthen between sessions.', 2,
    ['It is about time, not physical space.', 'That is massed practice, or cramming.', 'Blank space in notes is not the method.']],
  ['What is retrieval practice?', 'Pulling information from memory, for example with practice questions', ['Copying the textbook word for word until it sticks', 'Getting your notes back from a friend after class', 'Rereading your notes again and again until they feel familiar'], 'Recalling strengthens memory more than reviewing.', 2,
    ['Copying is passive.', 'That is retrieving paper, not memory.', 'Familiarity is not the same as recall.']],
  ['Why go to a professor’s office hours?', 'To get help, ask questions and build a relationship with the professor', ['Only if you are failing, since professors are very busy', 'To argue for a higher grade on your last assignment', 'They are mainly meant for graduate students and researchers'], 'Office hours are open to all students and are one of the most underused resources.', 2,
    ['Strong students go too, and early is better.', 'Questions, not complaints, are the point.', 'They are for every student in the class.']],
  ['What is time blocking?', 'Scheduling set blocks of time for specific tasks', ['Blocking apps forever', 'Studying only when you feel like it', 'Doing many tasks at once'], 'Giving each task a time slot makes the plan real.', 2,
    ['Limiting apps can help, but that is not time blocking.', 'Mood-based studying is unreliable.', 'Multitasking lowers quality.']],
  ['Which is a good note-taking habit?', 'Write key ideas in your own words and add questions to review later', ['Copy every word the teacher says so nothing is missed', 'Take no notes and listen closely, trusting your memory', 'Write only the date and the title of each lesson'], 'Processing ideas into your own words helps you understand and remember.', 2,
    ['Copying word for word skips thinking.', 'Memory alone is unreliable.', 'A date is not content.']],
  ['Before a big exam, a student feels very stressed. What helps most?', 'Sleep, a short walk or breathing, and a plan for what to review', ['Staying up all night to review every page one more time', 'Skipping meals so there is more time left to study', 'Avoiding the subject entirely until the stress goes away'], 'Sleep and calm planning support memory; all-nighters hurt recall.', 2,
    ['Sleep loss weakens memory.', 'Your brain needs fuel.', 'Avoidance raises stress later.']],
  ['A student has three assignments due. Which is the best first step?', 'List them with due dates and estimate how long each will take', ['Start the most fun one first and hope the rest goes fast', 'Wait until the last day, when pressure helps you focus', 'Do none of them until you feel inspired to begin'], 'Seeing the whole picture lets you prioritize and plan.', 2,
    ['Fun first may leave urgent work unfinished.', 'Waiting stacks up the stress.', 'Inspiration often follows starting.']],
  ['A practice test shows you missed questions on one topic. What should you do?', 'Study that topic more and then test yourself on it again', ['Ignore it because the rest went well', 'Reread the topics you already know', 'Quit practice tests'], 'Mistakes show exactly where to spend time.', 2,
    ['Gaps stay gaps unless you work on them.', 'Studying what you know feels good but helps less.', 'Practice tests are one of the best tools.']],
]);

// ---------------- choosing a path ----------------
const path = [
  ...bank('col.path', [
    ['What should you compare when choosing between paths?', 'Total cost, time to finish, likely earnings and whether you would enjoy the work', ['Mostly which path your friends and classmates choose', 'Only the starting salary, since that decides everything else', 'Only the school’s ranking, since that predicts your future'], 'Good decisions weigh cost, time, pay and fit together.', 2,
      ['Friends’ choices may not fit your goals.', 'Salary without cost and fit tells half the story.', 'Rankings do not show cost or fit.']],
    ['Which is true about choosing a major?', 'Many students change majors, and some careers accept many majors', ['Your major is fixed on day one and cannot be changed later', 'Each job accepts only one major, so choose carefully at first', 'Majors do not matter at all, so it is fine to pick at random'], 'Majors matter for some jobs, but there is often flexibility.', 2,
      ['Changing majors is common.', 'Many careers accept a range of majors.', 'Some careers, like nursing or engineering, require specific majors.']],
    ['What can military service offer someone considering college?', 'Job training and education benefits, in exchange for a service commitment', ['Free college money with no service commitment required', 'A guaranteed college degree after basic training ends', 'A short summer job that pays for one year of school'], 'Service brings real benefits and real obligations; learn both before signing.', 2,
      ['Benefits come with a service commitment.', 'Benefits help pay, but you still must earn the degree.', 'Enlistment is usually several years.']],
    ['A career pays well but you dislike every part of the work. What is a wise thought?', 'Pay matters, but you will spend years doing the daily tasks, so fit matters too', ['Salary is what matters most, since you can learn to like anything', 'Enjoyment never matters once the paycheck is high enough', 'Choose the highest-paying job and decide about the rest later'], 'Balance earnings with interest and strengths.', 3,
      ['Burnout can cost more than a higher salary pays.', 'People tend to do better in work that suits them.', 'Random choices ignore useful information.']],
    ['What is a good way to learn what a job is really like?', 'Talk to people in the job, shadow them or do an internship', ['Watch TV shows and movies about people in that job', 'Guess what it is like from the job title and the pay', 'Ask a friend who has heard about it but never done it'], 'Firsthand experience shows daily reality.', 2,
      ['TV dramatizes jobs.', 'Titles can be misleading.', 'Secondhand guesses are unreliable.']],
    ['Going straight to work after high school can be a good choice when', 'it fits a plan, such as saving money, gaining skills or using employer tuition help', ['you plan to stop learning once you get your first job', 'it is chosen mainly to avoid thinking about the future', 'you assume pay will rise without new skills'], 'Work can be a strong path when it builds toward something.', 2,
      ['Every path benefits from learning.', 'Avoiding the decision is not a plan.', 'Pay usually rises with skills and experience.']],
  ]),
  () => { const cost = ri(2, 8) * 10000, s = ri(4, 8) * 10000, extra = ri(5, 15) * 1000; return num('col.path', `Hypothetical: a program costs $${cost} in total and raises your yearly pay by $${extra}. About how many full years of higher pay does it take to earn back the cost? (Round up.)`, Math.ceil(cost / extra),
      `${cost} ÷ ${extra} ≈ ${(cost / extra).toFixed(1)}, so about ${Math.ceil(cost / extra)} years. Starting pay of $${s} alone does not answer the question; the raise does.`, 3, { suffix: 'years' }); },
  () => { const a = ri(2, 4) * 10000, b = ri(5, 9) * 10000; return ch('col.path', `Hypothetical: Path A costs $${a} and takes 2 years. Path B costs $${b} and takes 4 years. Both lead to similar starting pay. Which statement is true?`, 'Path A costs less and gets you earning sooner',
      [['Path B is better because it costs more', 'A higher price does not mean a better outcome.'], ['They are exactly the same', 'They differ in both cost and time.'], ['Cost and time never matter', 'Cost and time affect debt and lost earnings.']], `With similar pay, the cheaper, shorter path ($${a}, 2 years) usually wins on money, though fit still matters.`, 3); },
];

// computed distractors can collide for some numbers: draw again until there are four different choices
const safe = (g) => () => { let Q; for (let i = 0; i < 50; i++) { Q = g(); if (Q.type !== 'choice' || (Q.o.length === 4 && new Set(Q.o).size === 4)) return Q; } return Q; };
const S4 = (list) => list.map(safe);
export const PRECOL_GEN = { 'col.algebra': S4(algebra), 'col.data': S4(data), 'col.geometry': S4(geometry), 'col.functions': S4(functions), 'col.reading': reading,
  'col.grammar': grammar, 'col.essay': essay, 'col.apply': apply, 'col.aid': aid, 'col.study': study, 'col.path': S4(path) };

export const PRECOL_DAY = [
  { id: 'donow', icon: '⏱️', title: 'Do Now: warm-up', teacher: 'Pencils up, minds on. Five quick problems before the bell rings, and I know you can do every one.', skills: ['col.algebra', 'col.data', 'col.grammar'], kind: 'lesson' },
  { id: 'satmath', icon: '📐', title: 'SAT/ACT Math', teacher: 'Math is a language, and today you get fluent. Show your work, check your sign, no guessing without thinking.', skills: ['col.algebra', 'col.functions', 'col.data', 'col.geometry'], kind: 'lesson' },
  { id: 'reading', icon: '📖', title: 'Evidence-based reading', teacher: 'If you cannot point to it in the passage, it is not the answer. Read like a detective.', skills: ['col.reading'], kind: 'lesson' },
  { id: 'grammar', icon: '✏️', title: 'Writing & grammar', teacher: 'Clean sentences open doors. Find the real subject, cut the extra words, and make every comma earn its place.', skills: ['col.grammar'], kind: 'lesson' },
  { id: 'essay', icon: '📝', title: 'College essay workshop', teacher: 'Nobody else has your story. Make a claim, prove it, and finish strong.', skills: ['col.essay'], kind: 'lesson' },
  { id: 'money', icon: '🎓', title: 'College & money', teacher: 'Deadlines do not wait and debt does not forgive. We plan now so you have choices later.', skills: ['col.apply', 'col.aid', 'col.path'], kind: 'lesson' },
  { id: 'study', icon: '🗓️', title: 'Study skills & planning', teacher: 'Talent gets you in the room; habits keep you there. Let’s build a week that works.', skills: ['col.study'], kind: 'lesson' },
  { id: 'exit', icon: '🚪', title: 'Exit ticket', teacher: 'One last check before you go. Prove to me what you learned today. I already believe you can.', skills: ['col.algebra', 'col.reading', 'col.aid', 'col.study'], kind: 'lesson' },
];
