// REAL — Education Mastery engine ("Learn by Living").
// Private, adaptive skill tracking across ten subjects and six internal bands (never shown as grade labels).
// Every skill moves through: Not Introduced → Learning → Practicing → Proficient → Mastered → Review.
// Evidence comes only from correctness, hint use, variety of contexts and time between successes — never speed.

import { NEW_SKILLS } from './curriculum.js';

export const SUBJECTS = {
  reading: { name: 'Reading', icon: '📖' },
  writing: { name: 'Writing', icon: '✍️' },
  cursive: { name: 'Cursive', icon: '🖋️' },
  math: { name: 'Math', icon: '➗' },
  finance: { name: 'Money', icon: '💰' },
  science: { name: 'Science', icon: '🔬' },
  thinking: { name: 'Critical thinking', icon: '🧠' },
  social: { name: 'Social studies', icon: '🌍' },
  health: { name: 'Health & life skills', icon: '🩺' },
  tech: { name: 'Technology', icon: '💻' },
};

export const STATES = ['Not introduced', 'Learning', 'Practicing', 'Proficient', 'Mastered', 'Review'];
export const BAND_NAMES = ['Foundation', 'Beginner Independence', 'Practical Skills', 'Career Development', 'Professional Growth', 'Mastery & Leadership'];

// id: [subject, band, name, objective, prereqs, explanation, alternate explanation]
const S = [
  // Band 1 — Foundation
  ['read.signs', 'reading', 1, 'Signs & labels', 'Read signs and labels to find your way and find things.', [],
    'Signs answer a question: where is it, what is it, how far? Read the big words first, then the arrows.',
    'Look for the one word that matches what you need (like “DISTRICT” or “RICE”). The arrow or number next to it tells you where.'],
  ['read.vocab', 'reading', 1, 'Everyday words', 'Recognise common words used at work and in the city.', [],
    'Many jobs reuse the same words: shift, aisle, receipt, total. Learn them once and they keep helping.',
    'Say the word out loud and think of where you have seen it in the city.'],
  ['write.sentences', 'writing', 1, 'Complete sentences', 'Write sentences with a capital letter, a subject and a verb, and end punctuation.', [],
    'A sentence starts with a capital letter, says who does something and what they do, and ends with . ! or ?',
    'Try reading it aloud. If it sounds like a full thought, and starts with a capital, it is a sentence.'],
  ['curs.strokes', 'cursive', 1, 'Cursive strokes', 'Make the basic cursive strokes and simple joins.', [],
    'Cursive letters are made of loops, waves and slants that flow into each other without lifting the pen.',
    'Trace slowly. Keep your finger down and let each letter lead into the next.'],
  ['math.add', 'math', 1, 'Adding', 'Add numbers within 20 and solve adding stories.', [],
    'Start with the bigger number and count on. Or make a ten: 8 + 5 → 8 + 2 = 10, then 3 more = 13.',
    'Make tens: look for numbers that add to 10 (like 6 and 4), then add what is left.'],
  ['math.sub', 'math', 1, 'Taking away', 'Subtract to find what is left.', ['math.add'],
    'Subtracting finds the difference. Count up from the smaller number to the bigger one.',
    'Start with all of them, cross out the ones taken away, and count what is left.'],
  ['math.count', 'math', 1, 'Counting', 'Count groups of objects accurately.', [],
    'Touch each thing once as you count. The last number you say tells how many.',
    'Count by tens for full groups of ten, then count on the ones.'],
  ['fin.money', 'finance', 1, 'Bills & coins', 'Recognise bills and coins and their values.', [],
    'Bills: $1, $5, $10, $20. Coins: quarter 25¢, dime 10¢, nickel 5¢, penny 1¢. 100¢ = $1.',
    'Four quarters make a dollar. Ten dimes make a dollar.'],
  ['fin.needs', 'finance', 1, 'Needs vs wants', 'Tell needs (required to live and work) from wants (nice to have).', [],
    'A need keeps you safe, healthy or able to work: food, housing, basic clothes. A want is extra.',
    'Ask: “What if I don’t buy this?” If nothing bad happens, it is a want.'],
  ['think.observe', 'thinking', 1, 'Observing', 'Notice details in the world before deciding.', [],
    'Good decisions start with good information. Look around before you choose.',
    'Stop and look for signs, people and clues. What do they tell you?'],
  ['think.compare', 'thinking', 1, 'Comparing choices', 'Compare two options using what you know.', ['think.observe'],
    'List what each choice gives you and what it costs you. Then decide.',
    'Imagine yourself after each choice. Which future do you like better?'],
  // Band 2 — Beginner independence
  ['read.instructions', 'reading', 2, 'Following instructions', 'Read and follow multi-step instructions.', ['read.signs'],
    'Instructions are steps in order. Read all of them first, then do step 1.',
    'Point to each step as you do it. Check off what is done.'],
  ['read.main', 'reading', 2, 'Main idea', 'Find the main idea of a short text.', ['read.vocab'],
    'The main idea is the one thing the writer most wants you to know.',
    'Ask: if I had to tell a friend in one sentence, what would I say?'],
  ['write.forms', 'writing', 2, 'Forms & applications', 'Complete forms clearly and correctly.', ['write.sentences'],
    'Forms want short, clear, correct answers. Fill every required box.',
    'Read the label above each box. It tells you exactly what to write.'],
  ['curs.signature', 'cursive', 2, 'Signature', 'Sign your name in connected cursive.', ['curs.strokes'],
    'Your signature is your name in cursive. It shows you agree to what you signed.',
    'Trace the guide slowly, letter by letter, keeping the letters joined.'],
  ['math.decimals', 'math', 2, 'Dollars & cents', 'Add and subtract amounts with cents.', ['math.add', 'math.sub'],
    'Line up the dots. Add cents first, then dollars. 100 cents makes 1 dollar.',
    'Round to whole dollars to estimate first, then work out the exact cents.'],
  ['math.change', 'math', 2, 'Making change', 'Give correct change by counting up.', ['math.sub', 'fin.money'],
    'Start at the total and count up to what the customer paid. What you counted is the change.',
    'Use the biggest bills and coins that fit, then smaller ones, until you reach the amount paid.'],
  ['math.multiply', 'math', 2, 'Multiplying', 'Multiply to count groups fast.', ['math.count'],
    'Multiplying is fast adding: 5 cases of 12 = 12 + 12 + 12 + 12 + 12 = 60.',
    'Break it apart: 6 × 12 = 6 × 10 + 6 × 2 = 60 + 12.'],
  ['math.time', 'math', 2, 'Time', 'Work out time between two clock times.', ['math.sub'],
    'Count minutes up to the next hour, then add the hours.',
    'Picture the clock hand moving forward. Count the steps.'],
  ['fin.paycheck', 'finance', 2, 'Paychecks', 'Understand gross pay, deductions and net pay.', ['math.multiply'],
    'Gross pay = hours × hourly wage. Some is withheld for taxes. What you keep is net pay.',
    'Think of gross as the whole pizza and deductions as slices taken out. Net is what is left on your plate.'],
  ['fin.budget', 'finance', 2, 'Budgeting', 'Plan spending so bills are covered first.', ['fin.needs'],
    'A budget is a plan: money in, money out. Needs first, then savings, then wants.',
    'Write what must be paid and when. Anything left over is what you can spend.'],
  ['think.consequence', 'thinking', 2, 'Cause & consequence', 'Predict what a choice will lead to.', ['think.compare'],
    'Every choice causes something. Ask: what happens next, and then what?',
    'Follow the choice two steps forward: today, and next week.'],
  // Band 3 — Practical skills
  ['read.documents', 'reading', 3, 'Reading documents', 'Understand leases, bills and agreements.', ['read.instructions'],
    'Documents hide important details in small sentences: dates, fees and rules. Read every line.',
    'Look for numbers and dates first, then read the sentence around each one.'],
  ['write.professional', 'writing', 3, 'Professional messages', 'Write clear, polite professional messages.', ['write.forms'],
    'Greet the person, say what you need clearly, thank them and sign your name.',
    'Imagine your manager reading it. Is it polite, clear and short?'],
  ['curs.reading', 'cursive', 3, 'Reading handwriting', 'Read handwritten cursive notes.', ['curs.signature'],
    'Read cursive by finding the tall letters and loops first, then fill in the rest.',
    'Read the words you are sure of, then use the sentence to guess the tricky one.'],
  ['math.fractions', 'math', 3, 'Fractions', 'Use fractions in recipes and measurements.', ['math.multiply'],
    'Half a recipe means every amount ÷ 2. Double means × 2.',
    'Draw it: a cup split into 2 parts, then 4 parts. Which piece is bigger?'],
  ['math.percent', 'math', 3, 'Percentages', 'Work out discounts and taxes.', ['math.decimals', 'math.multiply'],
    '10% of a price = move the decimal one place left. 20% = double that.',
    'Percent means “out of 100”. 25% is a quarter. 50% is half.'],
  ['fin.bills', 'finance', 3, 'Bills & due dates', 'Pay bills on time and avoid fees.', ['fin.budget'],
    'Bills have due dates. Paying late costs extra (a late fee). Pay needs first, before the due date.',
    'Put due dates on your calendar and check it every morning.'],
  ['fin.credit', 'finance', 3, 'Credit & interest', 'Understand borrowing, interest and debt.', ['fin.bills'],
    'Borrowing costs money: interest. The longer you owe, the more you pay.',
    'If you borrow $100 at 20% a year, you owe about $120 after a year.'],
  ['think.opportunity', 'thinking', 3, 'Opportunity cost', 'See what you give up when you choose.', ['think.consequence'],
    'Opportunity cost is what you give up. Spending $40 now means $40 less for rent.',
    'Ask: if I say yes to this, what am I saying no to?'],
  ['think.evaluate', 'thinking', 3, 'Evaluating advice', 'Judge advice and claims on evidence, not pressure.', ['think.consequence'],
    'Good advice survives questions. Ask why, ask for proof, and notice pressure like “only today!”.',
    'Who benefits if you follow the advice? That tells you a lot.'],
  // Band 4+ (career development and beyond; unlocked as careers grow)
  ['math.algebra', 'math', 4, 'Algebra', 'Use variables to solve work problems.', ['math.percent'],
    'A letter stands for a number you don’t know yet. Do the same thing to both sides to find it.',
    'Undo the steps in reverse: if 3 boxes plus 2 = 14, take 2 away, then divide by 3.'],
  ['fin.taxes', 'finance', 4, 'Taxes & insurance', 'Understand taxes, insurance and planning.', ['fin.credit'],
    'Taxes fund public services. Insurance protects you from big unexpected costs.',
    'Insurance: pay a little regularly so one bad day doesn’t cost a lot.'],
  ['fin.business', 'finance', 5, 'Business finance', 'Revenue, costs, profit, payroll and cash flow.', ['fin.taxes', 'math.algebra'],
    'Profit = revenue − costs. Cash flow is when money actually comes in and goes out.',
    'Track every dollar in and out each week. Profit is what remains.'],
  ['think.leadership', 'thinking', 6, 'Leadership & ethics', 'Make decisions that create opportunity for others.', ['think.evaluate'],
    'Leaders weigh long-term effects on people, not just short-term gain.',
    'Ask: who does this decision help, who does it hurt, and can I make it fairer?'],
];

const ALL = [...S, ...NEW_SKILLS.filter((n) => !S.some((o) => o[0] === n[0]))];
export const SKILLS = Object.fromEntries(ALL.map(([id, subj, band, name, objective, prereq, explain, alt, where]) => [id, { id, subj, band, name, objective, prereq: prereq || [], explain, alt, where: where || [] }]));
const REVIEW_GAPS = [3, 7, 14, 30];   // spaced review: each passed review pushes the next one further out

export function newEdu() {
  return { skills: {}, journal: [] };
}

export class Edu {
  constructor(state, hooks = {}) {
    this.s = state;          // persistent edu object in the save
    this.hooks = hooks;      // { onState(skill, state), day: () => n }
  }
  get(id) { return this.s.skills[id] || { st: 0, ok: 0, n: 0, hints: 0, streak: 0, ctx: [], lastOkDay: 0, lastSeenDay: 0 }; }
  state(id) { return this.get(id).st; }
  stateName(id) { return STATES[this.state(id)]; }

  /** First encounter (Discover). Returns true if this is new to the player → show the Understand card. */
  discover(id) {
    const k = this.get(id);
    if (k.st === 0) { k.st = 1; this.s.skills[id] = k; this._log(id, 'Discovered'); this.hooks.onState && this.hooks.onState(SKILLS[id], k.st); return true; }
    return false;
  }

  /** Record evidence. ctx = where it happened (e.g. "register", "groceries"). hinted = used a hint. */
  record(id, correct, { ctx = 'world', hinted = false, err = null } = {}) {
    const day = this.hooks.day ? this.hooks.day() : 1;
    const k = this.get(id);
    if (k.st === 0) k.st = 1;
    k.n++; k.lastSeenDay = day; k.last5 = [...(k.last5 || []), correct && !hinted ? 1 : 0].slice(-5);
    const before = k.st;
    if (correct) {
      k.ok++;
      if (hinted) { k.hints++; if (k.st < 2) k.st = 2; }   // helped answers count as practice, not toward Proficient
      else {
        k.streak++;
        if (!k.ctx.includes(ctx)) k.ctx.push(ctx);
        if (k.st === 5) { k.st = 4; k.reviews = (k.reviews || 0) + 1; }   // review passed → next review later
        else if (k.st <= 1 && k.streak >= 1) k.st = 2;                   // Learning → Practicing
        else if (k.st === 2 && k.streak >= 3 && k.last5.reduce((a, v) => a + v, 0) >= 4) k.st = 3;   // Practicing → Proficient: 3 in a row without hints, 4 of the last 5
        else if (k.st === 3 && k.ctx.length >= 2 && day > (k.firstProfDay || day)) k.st = 4;  // Mastered: new context, later day
        if (k.st === 3 && !k.firstProfDay) k.firstProfDay = day;
        k.lastOkDay = day;
      }
    } else {
      k.streak = 0; k.miss = (k.miss || 0) + 1;
      if (err) { k.errs = k.errs || {}; k.errs[err] = (k.errs[err] || 0) + 1; }   // error patterns (private, on-device)
      k.needsAlt = true;       // next time, offer the alternate explanation
      if (k.st === 4) { k.st = 5; k.reviewMiss = 0; }                    // one slip on a mastered skill: review it
      else if (k.st === 5) { k.reviewMiss = (k.reviewMiss || 0) + 1; if (k.reviewMiss >= 2) k.st = 2; }
      else if (k.st === 3) k.st = 2; // gentle: back to practice, never below
    }
    this.s.skills[id] = k;
    if (k.st !== before) { this._log(id, STATES[k.st]); this.hooks.onState && this.hooks.onState(SKILLS[id], k.st); }
    return k.st;
  }

  /** Scaffold level for an activity: 'guided' (Understand/Practice with help), 'hint' (hint available), 'independent'. */
  support(id) {
    const st = this.state(id), band = (SKILLS[id] || {}).band || 1;
    // new skill: early levels show the help up front (worked example first); from level 3 learners try first,
    // with the hint one tap away, since that productive struggle helps older learners remember more
    if (st <= 1) return band <= 2 ? 'guided' : 'hint';
    if (st === 2) return 'hint';
    return 'independent';
  }

  /** The explanation to show (alternate after a mistake). */
  explain(id) {
    const k = this.get(id), sk = SKILLS[id];
    if (k.needsAlt) { k.needsAlt = false; this.s.skills[id] = k; return sk.alt; }
    return sk.explain;
  }

  /** Working band for a subject, private and adaptive: the lowest band where the player is still developing
   *  something they've met; if nothing is in progress, one band above their highest proficient skill.
   *  Advanced players are never sent back through foundations they've never needed. */
  band(subj) {
    const list = Object.values(SKILLS).filter((s) => s.subj === subj);
    const developing = list.filter((s) => { const st = this.state(s.id); return st >= 1 && st < 3; }).map((s) => s.band);
    if (developing.length) return Math.min(...developing);
    const prof = list.filter((s) => this.state(s.id) >= 3).map((s) => s.band);
    return prof.length ? Math.min(6, Math.max(...prof) + 1) : 1;
  }
  /** After repeated misses, point back to an unmastered prerequisite (review prerequisites when struggling). */
  struggling(id) {
    const k = this.get(id), sk = SKILLS[id];
    if (!sk || (k.miss || 0) < 2 || k.streak > 0) return null;
    return (sk.prereq || []).find((p) => SKILLS[p] && this.state(p) < 3) || null;
  }

  /** Spaced review: mastered skills unseen for 3+ days come back for a light check. */
  dailyReview(day) {
    for (const [id, k] of Object.entries(this.s.skills)) if (k.st === 4 && day - (k.lastSeenDay || day) >= REVIEW_GAPS[Math.min(REVIEW_GAPS.length - 1, k.reviews || 0)]) { k.st = 5; }
  }

  progress(subj) {
    const list = Object.values(SKILLS).filter((s) => s.subj === subj);
    const pts = list.reduce((a, s) => a + Math.min(4, this.state(s.id) === 5 ? 4 : this.state(s.id)), 0);
    return { list, pct: Math.round(100 * pts / (list.length * 4)) };
  }
  masteredCount() { return Object.values(this.s.skills).filter((k) => k.st >= 4).length; }
  proficientCount() { return Object.values(this.s.skills).filter((k) => k.st >= 3).length; }
  _log(id, what) { this.s.journal.unshift({ id, what, t: Date.now() }); this.s.journal.length = Math.min(this.s.journal.length, 60); }
}
