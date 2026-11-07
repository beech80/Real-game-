// REAL — items added after the grades 3–8 and high-school teacher reviews: missing topics, misconception-based
// distractors, multi-step problems. `whyWrong` gives feedback for the specific wrong choice a learner picks.
// These are ADDED to the existing banks (not replacing them). Pure data: tests/curriculum.test.mjs checks them all.
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const $ = (v) => (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
const ch = (skill, q, a, wrong, why, extra = {}) => ({ type: 'choice', skill, q, a, o: [a, ...[...new Set(wrong)].filter((w) => w !== a).slice(0, 3)], why, ...extra });
const num = (skill, q, a, why, extra = {}) => ({ type: 'number', skill, q, a, why, ...extra });
/** a bank of [q, a, [wrong…], why, {wrong: feedback}] rows */
const bank = (skill, rows) => () => { const [q, a, w, why, ww] = pick(rows); return ch(skill, q, a, w, why, ww ? { whyWrong: ww } : {}); };

const sentences = (t) => t.split(/[.!?]+/).map((x) => x.trim()).filter((x) => x.split(/\s+/).length >= 3);
const copied = (t, src) => { const w = src.toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/); const tw = t.toLowerCase().replace(/[^a-z ]/g, ''); for (let i = 0; i + 6 <= w.length; i++) if (tw.includes(w.slice(i, i + 6).join(' '))) return true; return false; };
const PASSAGE = 'Brighter Park used to close at sunset. Families said there was nowhere to play after work. The city added bright lights along the paths and by the playground. Now the park stays open until 9 PM. More people walk there in the evening, and the snack cart sells twice as much. Some neighbors worry about noise, so the playground closes at 8.';
const WRITE_MORE = {
  'read.summarize': [() => ({ type: 'write', skill: 'read.summarize', v: { title: 'NEWS: LATER PARK HOURS', lines: PASSAGE.split(/(?<=\.) /) }, q: 'Write a 1–2 sentence summary of this article in your own words.',
    rubric: [['Says the main change (lights, later hours)', /\b(light|lights|later|9|open)\b/i, 'The park now stays open later because…'], ['Says why or what happened because of it', /\b(because|so|families|more people|busier)\b/i, '…so more people…'],
      ['In your own words (no long copied phrases)', (t) => !copied(t, PASSAGE)], ['Short: 40 words or fewer', (t) => t.split(/\s+/).length <= 40]], minWords: 12,
    model: 'Brighter Park added lights and now stays open until 9 PM, so more families can visit after work.' })],
  'write.persuasive': [() => ({ type: 'write', skill: 'write.persuasive', q: 'Should Brighter Park add a fenced dog area? Write your opinion and give two reasons.',
    rubric: [['States an opinion (should / I think / I believe)', /\b(should|I think|I believe|in my opinion)\b/i, 'I think the park should…'], ['Two reasons', (t) => (t.match(/\b(because|also|another reason|first|second|since)\b/gi) || []).length >= 2, 'Another reason is…'],
      ['A linking phrase (for example, in addition…)', /\b(for example|in addition|also|for instance)\b/i, 'For example,…'], ['A closing sentence', /\b(so|that is why|in conclusion|this is why)\b/i, 'That is why…']], minWords: 30,
    model: 'I think Brighter Park should add a fenced dog area. First, dogs could run safely without bothering kids on the playground. Another reason is that owners would meet each other, for example on weekend mornings. That is why a dog area would help everyone.' })],
  'write.report': [() => { const d = [['Mon', 30], ['Tue', 28], ['Wed', 31], ['Sat', 58], ['Sun', 61]];
    return { type: 'write', skill: 'write.report', v: { title: 'COFFEE CUPS SOLD', lines: d.map(([a, b]) => `${a}: ${b} cups`) }, q: 'Write a short report: one finding, the evidence from the table, and a recommendation.',
      rubric: [['A finding with a comparison (more, fewer, twice…)', /\b(more|fewer|less|twice|double|higher|lower|increase)\b/i, 'Weekends sold more cups than…'], ['Uses a number from the table', /\b(28|30|31|58|61)\b/, 'On Saturday we sold 58 cups…'], ['A recommendation (should / recommend / next)', /\b(should|recommend|next|plan to)\b/i, 'We should…']], minWords: 20,
      model: 'Weekends sold about twice as many cups as weekdays: 58 on Saturday and 61 on Sunday, but only about 30 on weekdays. We should buy more supplies and add a helper on weekends.' }; }],
  'write.argument': [() => ({ type: 'write', skill: 'write.argument', v: { title: 'TWO SOURCES', lines: ['Source A (sleep researchers): Teens who start school after 8:30 AM sleep about 30 minutes more.', 'Source B (bus company): Later start times cost more for buses and push sports later.'] },
    q: 'Should school start later? Make a claim, cite a source, answer the other side (counterclaim), and explain why your claim still holds.',
    rubric: [['A clear claim', /\b(should|should not|shouldn’t|I believe|I argue)\b/i, 'School should…'], ['Cites a source', /\b(according to|source a|source b|researchers|the bus company)\b/i, 'According to Source A,…'],
      ['Names the other side (counterclaim)', /\b(some people|others|however|although|on the other hand|opponents)\b/i, 'Some people say…'], ['Answers it (rebuttal)', /\b(but|still|even so|yet|nevertheless)\b/i, 'But…']], minWords: 40,
    model: 'School should start after 8:30 AM. According to Source A, teens sleep about 30 more minutes with a later start, and rested students learn better. Some people say later starts cost more for buses and push sports later. But better sleep helps health and grades, and schedules can be adjusted, so the benefit is worth the cost.' })],
  'write.paragraph': [() => ({ type: 'write', skill: 'write.paragraph', q: 'Write a short story about the day the register at Fresh Mart broke. Use time-order words and a line someone says.',
    rubric: [['A character’s name', /\b[A-Z][a-z]+\b.*\b[A-Z][a-z]+\b/, 'Rosa…'], ['Time-order words (first, then, after, finally)', (t) => (t.match(/\b(first|then|next|after|later|finally|suddenly)\b/gi) || []).length >= 2, 'First,… Then,…'],
      ['Someone speaks (use “quotation marks”)', /[“"][^”"]{3,}[”"]/, 'Rosa said, “…”'], ['A feeling word', /\b(happy|worried|nervous|calm|surprised|proud|scared|relieved|upset|glad)\b/i, 'I felt…']], minWords: 35,
    model: 'First, the register screen went black just as a long line formed. Rosa looked worried. Then she said, “Let’s add the prices by hand.” I wrote each price on paper and added them carefully. Finally, the register turned back on, and I felt proud that no customer had to wait long.' })],
};
export const MORE_TOPICS = {
  // ------------------------------------------------------------------ high school money
  'fin.taxes': [
    () => { const inc = pick([15000, 20000, 30000]); const t1 = Math.min(inc, 11600) * 0.10, t2 = Math.max(0, Math.min(inc, 47150) - 11600) * 0.12, tax = Math.round(t1 + t2);
      return num('fin.taxes', `Tax brackets: 10% on the first $11,600 of taxable income, 12% on income from $11,600 to $47,150. Taxable income is $${inc.toLocaleString()}. What is the tax?`, tax,
        `Brackets tax each slice at its own rate: 10% × $11,600 = $1,160, plus 12% × $${(inc - 11600).toLocaleString()} = $${Math.round(t2).toLocaleString()}. Total $${tax.toLocaleString()}. Moving into a higher bracket never taxes all your income at the higher rate.`, { prefix: '$' }); },
    bank('fin.taxes', [
      ['What is a W-4?', 'A form you give your employer so they know how much tax to hold back from each paycheck', ['A form showing your total pay for the year', 'Your tax refund check', 'A bank account form'], 'You fill out a W-4 when you start a job. Your employer sends you a W-2 after the year ends, showing what you earned and what was withheld.', { 'A form showing your total pay for the year': 'That’s the W-2, which your employer sends after the year ends.' }],
      ['Your pay stub shows Social Security and Medicare taken out. What are these together called?', 'FICA payroll taxes', ['Income tax refund', 'Union dues', 'Sales tax'], 'FICA (7.65% for most workers) pays for Social Security and Medicare. Federal and state income tax are separate lines on the stub.'],
      ['A raise moves part of your income into the 22% bracket. What happens to your tax?', 'Only the income above the bracket line is taxed at 22%', ['All your income is now taxed at 22%', 'You take home less money than before the raise', 'Your tax goes down'], 'Brackets are marginal: each dollar is taxed at the rate of its slice. A raise never lowers your take-home pay because of brackets.', { 'You take home less money than before the raise': 'A common myth. Only the new dollars above the line pay 22%; you still keep most of the raise.' }],
    ])],
  'fin.insurance': [
    () => { const ded = pick([500, 1000, 1500]), bill = pick([3000, 5000, 8000]), co = pick([20, 30]); const pay = ded + (bill - ded) * co / 100;
      return num('fin.insurance', `Your health plan has a $${ded} deductible and ${co}% coinsurance. A hospital bill is $${bill.toLocaleString()}. How much do you pay (before any out-of-pocket maximum)?`, pay,
        `You pay the first $${ded} (deductible). Of the remaining $${(bill - ded).toLocaleString()}, you pay ${co}% = $${((bill - ded) * co / 100).toLocaleString()}. Total: $${pay.toLocaleString()}. The out-of-pocket maximum caps how much you can pay in a year.`, { prefix: '$' }); },
    bank('fin.insurance', [
      ['What is a premium?', 'The amount you pay every month to keep the insurance', ['What you pay at each doctor visit', 'The money the insurance pays you', 'A bonus for being healthy'], 'Premium: monthly price of the plan. Deductible: what you pay first each year. Copay: a set fee per visit.'],
      ['Plan A: low premium, $3,000 deductible. Plan B: higher premium, $500 deductible. Who might choose Plan B?', 'Someone who expects many doctor visits or has a health condition', ['Someone who never sees a doctor', 'Anyone, because it’s always cheaper', 'Nobody'], 'Paying more each month for a lower deductible makes sense if you’ll use a lot of care. Healthy people often save with a higher deductible.'],
    ])],
  'fin.planning': [
    bank('fin.planning', [
      ['Prices rise 3% a year (inflation). Your savings earn 1% a year. What happens to what your money can buy?', 'It falls about 2% a year', ['It grows 1% a year', 'It stays the same', 'It grows 4% a year'], 'Real growth = interest − inflation ≈ 1% − 3% = −2%. To keep up, savings for the long term need to earn more than inflation.', { 'It grows 1% a year': 'The number in the account grows, but prices grow faster, so it buys less.' }],
      ['Rule of 72: at 8% a year, about how long until money doubles?', 'About 9 years', ['About 8 years', 'About 72 years', 'About 2 years'], '72 ÷ 8 = 9. The rule of 72 is a quick way to estimate doubling time for compound growth.'],
      ['What is the FAFSA?', 'The free federal form that decides your grants, work-study and student loans for college', ['A college entrance exam', 'A private bank loan', 'A scholarship you have to win'], 'Fill out the FAFSA every year you’re in college. Grants (like Pell) don’t have to be paid back; loans do.'],
      ['Your job matches 401(k) savings up to 4% of your pay. You earn $40,000. If you save 4%, how much does your employer add?', '$1,600', ['$0', '$400', '$16,000'], '4% × $40,000 = $1,600 from you, and the match adds another $1,600: free money for retirement. Not taking a match leaves pay on the table.'],
    ])],
  'fin.fraud': [
    bank('fin.fraud', [
      ['A buyer says they sent you $500 by mistake on a payment app for a $50 item and asks you to send back $450. What should you do?', 'Don’t send money; contact the app and wait for the payment to fully clear or be reversed', ['Send back the $450 right away to be nice', 'Keep all $500', 'Send it from a different account'], 'This is a common overpayment scam: their payment is reversed later and you lose the $450 you sent.'],
      ['Someone opened a credit card in your name. What should you do first?', 'Freeze your credit, report it at IdentityTheft.gov and tell the card company', ['Wait and see if it goes away', 'Pay the bill so it doesn’t hurt your credit', 'Post about it online'], 'A credit freeze stops new accounts in your name. An identity-theft report helps you dispute the charges.'],
    ])],
  'fin.payroll': [
    () => { const r = pick([16, 18, 20]), h = pick([42, 44, 46]); const pay = 40 * r + (h - 40) * r * 1.5;
      return num('fin.payroll', `You earn $${r}/hour and worked ${h} hours this week. Overtime (over 40 hours) pays 1.5×. What is your gross pay?`, pay, `40 × $${r} = $${40 * r}. ${h - 40} overtime hours × $${r * 1.5} = $${(h - 40) * r * 1.5}. Total $${pay}. Most hourly workers have a legal right to overtime pay.`, { prefix: '$' }); }],
  // ------------------------------------------------------------------ health, civics
  'hl.mental': [bank('hl.mental', [
    ['A friend says they don’t want to be alive anymore. What should you do?', 'Take it seriously, stay with them, tell a trusted adult, and call or text 988', ['Keep it a secret because they asked', 'Change the subject so they feel better', 'Wait to see if they mean it'], 'Thoughts of suicide are an emergency. 988 is the Suicide & Crisis Lifeline (call or text, any time). Telling an adult is not breaking trust: it can save a life.', { 'Keep it a secret because they asked': 'Some secrets are too big to keep. Getting help is how you protect your friend.' }],
  ])],
  'hl.medicine': [bank('hl.medicine', [
    ['Someone offers you a pill they say is a pain reliever. Why is that dangerous?', 'Pills not from a pharmacy can be fake and contain fentanyl, which can kill in tiny amounts', ['It isn’t; pills look the same everywhere', 'It’s only dangerous if you take two', 'Only liquid medicine can be fake'], 'Counterfeit pills often look real. Only take medicine from a pharmacy or a doctor, and know that naloxone (Narcan) can reverse an overdose.'],
  ])],
  'soc.civics': [bank('soc.civics', [
    ['The President vetoes a bill. Can it still become law?', 'Yes, if two-thirds of both the House and the Senate vote to override', ['No, a veto is final', 'Yes, if the Supreme Court signs it', 'Yes, if half of the House agrees'], 'Checks and balances: Congress can override a veto with a 2/3 vote in each chamber.'],
  ])],
  // ------------------------------------------------------------------ science (misconception distractors)
  'sci.planets': [bank('sci.planets', [
    ['Why is it warmer in summer where you live?', 'Your half of Earth tilts toward the Sun, so sunlight is more direct and days are longer', ['Earth is closer to the Sun in summer', 'The Sun burns hotter in summer', 'Clouds block the cold'], 'Earth’s tilt causes seasons. Earth is actually closest to the Sun in early January, during Northern Hemisphere winter.', { 'Earth is closer to the Sun in summer': 'A very common idea, but Earth is closest to the Sun in January. It’s the tilt that matters.' }],
    ['Why does the Moon’s shape seem to change?', 'We see different amounts of its sunlit half as it orbits Earth', ['Earth’s shadow covers part of it', 'Clouds hide part of it', 'The Moon changes size'], 'Half the Moon is always lit by the Sun. As it orbits, we see more or less of that lit half. Earth’s shadow only matters during an eclipse.', { 'Earth’s shadow covers part of it': 'That only happens in a lunar eclipse. Phases come from our view of the Moon’s sunlit side.' }],
  ])],
  'sci.energy': [bank('sci.energy', [
    ['A ball rolls down a ramp and stops on a carpet. Where did its motion energy go?', 'It changed into heat (and a little sound) because of friction', ['It was used up and is gone', 'It turned back into stored energy', 'The carpet destroyed it'], 'Energy is never used up; it changes form. Friction turns motion energy into heat.', { 'It was used up and is gone': 'Energy can’t disappear. It moved into the carpet and air as heat.' }],
    ['Two identical carts roll at different speeds. Which has more motion (kinetic) energy?', 'The faster cart', ['The slower cart', 'They have the same', 'The one that started first'], 'Kinetic energy grows with speed (and mass). Doubling the speed gives four times the energy.'],
  ])],
  'sci.heat': [bank('sci.heat', [
    ['A metal spoon and a wooden spoon sat in the same room all night. Which is colder?', 'Neither: they are the same temperature; metal feels colder because it pulls heat from your hand faster', ['The metal spoon', 'The wooden spoon', 'Metal makes its own cold'], 'Objects left in the same room reach room temperature. Metal conducts heat away from your skin faster, so it feels colder.', { 'The metal spoon': 'It feels colder, but a thermometer would read the same for both.' }],
  ])],
  'sci.water': [bank('sci.water', [
    ['Drops of water form on the outside of a cold can of juice. Where did the water come from?', 'Water vapor in the air condensed on the cold can', ['It leaked through the metal', 'It came from the juice', 'The cold made new water'], 'Air holds water vapor you can’t see. When it touches something cold, it turns back into liquid: condensation.', { 'It leaked through the metal': 'The can is sealed. The water was in the air all along.' }],
  ])],
  'sci.matter': [bank('sci.matter', [
    ['When water boils, what are the big bubbles made of?', 'Water vapor (water as a gas)', ['Air', 'Oxygen and hydrogen gas', 'Heat'], 'Boiling turns liquid water into gas. The bubbles are pockets of water vapor; the water molecules haven’t split apart.', { 'Air': 'The first tiny bubbles are air, but the big rolling bubbles are water vapor.' }],
    ['You dissolve 10 g of sugar in 100 g of water. What is the total mass?', '110 g', ['100 g: the sugar disappeared', 'More than 110 g', '10 g'], 'Matter is conserved: the sugar breaks into tiny pieces you can’t see, but it’s still there. 100 + 10 = 110 g.'],
  ])],
  'sci.forces': [bank('sci.forces', [
    ['A heavy ball and a light ball of the same size are dropped together. Which lands first?', 'They land at about the same time', ['The heavy ball', 'The light ball', 'It depends on who drops them'], 'Gravity speeds all objects up at the same rate. Air resistance only matters a lot for very light or spread-out things like feathers.', { 'The heavy ball': 'It feels true, but experiments (and Galileo) show they fall together.' }],
    ['You throw a ball straight up. At the very top, what force acts on it?', 'Gravity, pulling down', ['The force of your throw', 'No forces at all', 'An upward force that slowly runs out'], 'Once it leaves your hand, your push is over. Gravity pulls down the whole time, slowing it, stopping it and pulling it back.'],
    ['You push on a wall. What does the wall do?', 'It pushes back on you just as hard', ['Nothing: walls can’t push', 'It pushes back harder', 'It pulls you toward it'], 'Newton’s third law: forces come in equal and opposite pairs.'],
  ])],
  'sci.ecosystems': [bank('sci.ecosystems', [
    ['Foxes are removed from a meadow. What happens first to rabbits, then to grass?', 'Rabbits increase, then grass decreases', ['Both increase', 'Nothing changes', 'Grass increases first'], 'With fewer predators, more rabbits survive. More rabbits eat more grass. Changing one link changes the whole food web.'],
    ['What is the difference between weather and climate?', 'Weather is today’s conditions; climate is the usual pattern over many years', ['They mean the same thing', 'Climate is only about rain', 'Weather is about other planets'], 'One cold day is weather. Average temperatures over 30 years are climate.'],
    ['A fish fossil is found on top of a mountain. What does that tell you?', 'The rock there was once under water', ['Fish used to climb mountains', 'Someone left it there', 'Fossils grow inside rocks'], 'Fossils show past environments. Rock layers that formed under seas can be pushed up into mountains over millions of years.'],
    ['A river carries sand and rock downstream. What is this called?', 'Erosion', ['Evaporation', 'Photosynthesis', 'Condensation'], 'Weathering breaks rock down; erosion moves the pieces (by water, wind or ice).'],
  ])],
  'sci.cells': [bank('sci.cells', [
    ['Two black-furred dogs have a puppy with brown fur. How is that possible?', 'Both parents can carry a hidden gene for brown fur and pass it on', ['The puppy chose its color', 'Brown fur comes from eating brown food', 'It isn’t possible'], 'Traits are passed through genes. A parent can carry a gene that doesn’t show in them but shows up in offspring.'],
  ])],
  // ------------------------------------------------------------------ math (multi-step, missing strands)
  'math.fractions': [
    bank('math.fractions', [
      ['Which is bigger: 1/8 or 1/4 of the same pizza?', '1/4', ['1/8, because 8 is bigger', 'They are the same', 'You can’t tell'], 'The bigger the bottom number, the more pieces, so each piece is smaller. 1/4 is two times 1/8.', { '1/8, because 8 is bigger': 'A bigger denominator means more, smaller pieces. 1/8 is half of 1/4.' }],
      ['Which fraction is equal to 1/2?', '3/6', ['2/3', '1/3', '3/5'], 'Multiply top and bottom by the same number: 1/2 = 2/4 = 3/6.'],
      ['1/4 + 1/2 = ?', '3/4', ['2/6', '2/4', '1/6'], 'Make the bottoms match: 1/2 = 2/4. Then 1/4 + 2/4 = 3/4. Never add the bottom numbers.', { '2/6': 'That adds the denominators. The pieces must be the same size first: 1/2 = 2/4.' }],
    ]),
    () => { const n = pick([2, 3, 5]), d = pick([4, 8]); return ch('math.fractions', `A recipe for 4 people uses ${n}/${d} cup of milk. How much for 8 people?`, n * 2 >= d ? `${n * 2}/${d} cup (${n * 2 / d} cups)` : `${n * 2}/${d} cup`, [`${n}/${d * 2} cup`, `${n + 4}/${d} cup`, `${n}/${d} cup`], `8 people is twice as many as 4, so double the milk: ${n}/${d} × 2 = ${n * 2}/${d}.`); },
  ],
  'math.percent': [() => { const p = pick([40, 48, 60, 80]), tax = 8; const sale = p * 0.75, tot = Math.round(sale * 1.08 * 100) / 100;
    return num('math.percent', `A $${p} jacket is 25% off, then ${tax}% sales tax is added. What do you pay?`, tot, `Step 1: 25% off → $${p} × 0.75 = $${sale}. Step 2: add ${tax}% tax → $${sale} × 1.08 = $${tot.toFixed(2)}.`, { prefix: '$', decimals: 2 }); }],
  'math.multiply': [() => { const n = pick([3, 4]), c = pick([2.75, 1.5, 3.25]), pen = 1.49; const cost = Math.round((n * c + pen) * 100) / 100, chg = Math.round((20 - cost) * 100) / 100;
    return num('math.multiply', `You have $20. You buy ${n} notebooks at $${c.toFixed(2)} each and a pen for $${pen}. How much change?`, chg, `Notebooks: ${n} × $${c.toFixed(2)} = $${(n * c).toFixed(2)}. Plus the pen: $${cost.toFixed(2)}. Change: $20 − $${cost.toFixed(2)} = $${chg.toFixed(2)}.`, { prefix: '$', decimals: 2 }); }],
  'math.geometry2': [() => { const r = pick([2, 3, 5, 10]); return num('math.geometry2', `A round garden has a radius of ${r} m. About how much area is that? Use π ≈ 3.14 and round to the nearest whole m².`, Math.round(3.14 * r * r), `Area of a circle = π × r × r = 3.14 × ${r} × ${r} ≈ ${(3.14 * r * r).toFixed(2)} ≈ ${Math.round(3.14 * r * r)} m².`, { suffix: 'm²' }); }],
  'math.ratio': [() => { const k = pick([3, 4, 6]), x = pick([5, 7, 9]); return num('math.ratio', `Cookies cost the same per cookie. 2 cookies cost $${2 * k}. How much do ${x} cookies cost?`, k * x, `Find the price of one cookie (the unit rate): $${2 * k} ÷ 2 = $${k}. Then ${x} × $${k} = $${k * x}.`, { prefix: '$' }); }],
  'math.algebra': [() => { const a = pick([3, 4, 5]), b = pick([6, 10, 12]), m = pick([30, 40, 50]); const x = Math.floor((m - b) / a);
    return num('math.algebra', `A taxi charges $${b} plus $${a} per mile. You have $${m}. What is the most whole miles you can ride? (${a}x + ${b} ≤ ${m})`, x, `${a}x + ${b} ≤ ${m} → ${a}x ≤ ${m - b} → x ≤ ${((m - b) / a).toFixed(2)}. The most whole miles is ${x}.`, { suffix: 'miles' }); }],
  'math.algebra2': [bank('math.algebra2', [
    ['Which is 3,200,000 in scientific notation?', '3.2 × 10⁶', ['32 × 10⁵', '3.2 × 10⁵', '0.32 × 10⁷'], 'Move the decimal 6 places to get a number from 1 to 10: 3.2 × 10⁶.'],
  ])],
  'math.precalc': [() => { const m = pick([2, 3, 4]), b = pick([1, 5, 10]); return num('math.precalc', `A line goes through (0, ${b}) and (2, ${b + 2 * m}). What is its slope?`, m, `Slope = change in y ÷ change in x = (${b + 2 * m} − ${b}) ÷ (2 − 0) = ${2 * m} ÷ 2 = ${m}.`); }],
};
for (const [k, g] of Object.entries(WRITE_MORE)) MORE_TOPICS[k] = (MORE_TOPICS[k] || []).concat(g);
