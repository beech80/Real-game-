// REAL — Life Level (overall growth, never a measure of worth) + career tiers.
export const LIFE_CATS = [
  ['education', 'Education', '📚'], ['career', 'Career', '💼'], ['financial', 'Financial responsibility', '💰'], ['health', 'Health', '💪'],
  ['decisions', 'Decision making', '🧠'], ['independence', 'Independence', '🏠'], ['relationships', 'Relationships', '🤝'],
  ['reputation', 'Reputation', '⭐'], ['entrepreneurship', 'Entrepreneurship', '🚀'], ['achievements', 'Achievements', '🏆'],
];
export const INVITE_LEVEL = 6;   // The Club takes notice

const cap = (v) => Math.max(0, Math.min(10, Math.round(v * 10) / 10));

export function lifeScores(s, edu) {
  const st = s.stats, f = s.flags;
  const paidOnTime = s.bills.filter((b) => b.paid && !b.lateFee).length + (st.billsOnTime || 0);
  const savings = s.money;
  const friends = Object.values(s.friends || {}).reduce((a, v) => a + v, 0);
  return {
    education: cap(edu.proficientCount() * 0.7 + edu.masteredCount() * 0.8),
    career: cap(st.shifts * 0.8 + (s.jobs || []).length * 1 + (st.promotions || 0) * 2),
    financial: cap(paidOnTime * 2 + (savings >= 100 ? 1 : 0) + (savings >= 300 ? 1.5 : 0) + (savings >= 500 ? 1.5 : 0) - (st.lateFees || 0) + (st.budgetsPlanned || 0) * 0.5),
    health: cap((st.mealsCooked || 0) * 0.7 + (st.workouts || 0) * 1 + (st.goodNights || 0) * 0.5 + (st.mealsEaten || 0) * 0.2),
    decisions: cap((st.wiseChoices || 0) * 1.5 + (st.thoughtThrough || 0) * 1),
    independence: cap((f.housed ? 2 : 0) + (f.hired ? 2 : 0) + (st.rentPaidSelf || 0) * 2 + Math.min(4, (st.daysIndependent || 0) * 0.5)),
    relationships: cap(friends * 0.5),
    reputation: cap((st.perfectShifts || 0) * 1.2 + (st.shifts || 0) * 0.4 - (st.thefts || 0) * 3),
    entrepreneurship: cap((st.businessSteps || 0) * 2),
    achievements: cap(Object.keys(s.achievements || {}).length * 0.8),
  };
}
export function lifeLevel(s, edu) {
  const sc = lifeScores(s, edu);
  const total = Object.values(sc).reduce((a, v) => a + v, 0);
  return { level: 1 + Math.floor(total / 6), total, next: (Math.floor(total / 6) + 1) * 6, scores: sc };
}

// ------------------------------------------------------------------------------------------- careers (Tier 0-4)
// req: skills (skill id -> min state), life (Life Level), shifts, flag; where: 'here' playable now, else district
export const CAREERS = [
  { id: 'cashier', tier: 0, title: 'Cashier', employer: 'Fresh Mart', rate: 15, hours: 4, where: 'here', req: {}, desc: 'Scan items, make change, help customers.' },
  { id: 'shiftlead', tier: 0, title: 'Shift Lead', employer: 'Fresh Mart', rate: 17, hours: 4, where: 'here', req: { shifts: 4, skills: { 'math.change': 3, 'read.instructions': 3 } }, desc: 'Open the store, train new cashiers, balance the register.', promotionOf: 'cashier' },
  { id: 'barista', tier: 0, title: 'Barista (weekends)', employer: 'Daily Grind', rate: 15, hours: 4, where: 'here', req: { shifts: 1, flag: 'baristaTip' }, desc: 'Take orders, measure recipes, make change. Tips on top.' },
  { id: 'courier', tier: 0, title: 'Delivery courier', employer: 'Midtown Express', rate: 16, where: 'Midtown', req: { skills: { 'read.signs': 3 } }, desc: 'Read addresses and maps, deliver on time.' },
  { id: 'warehouse', tier: 0, title: 'Warehouse associate', employer: 'Opportunity Logistics', rate: 17, where: 'Opportunity District', req: { skills: { 'math.multiply': 3 } }, desc: 'Count, sort and load inventory.' },
  { id: 'mechanic', tier: 1, title: 'Mechanic apprentice', employer: 'Midtown Motors', rate: 19, where: 'Midtown', req: { life: 5, skills: { 'read.instructions': 3, 'math.fractions': 2 } }, desc: 'Diagnose problems, follow service manuals, measure parts.' },
  { id: 'cook', tier: 1, title: 'Line cook', employer: 'Main St Diner', rate: 18, where: 'Midtown', req: { life: 4, skills: { 'math.fractions': 3 } }, desc: 'Scale recipes, time orders, keep the kitchen safe.' },
  { id: 'sales', tier: 1, title: 'Sales associate', employer: 'Thread & Co', rate: 18, where: 'Midtown', req: { life: 4, skills: { 'math.percent': 2, 'write.professional': 2 } }, desc: 'Help customers compare options and work out discounts.' },
  { id: 'office', tier: 1, title: 'Office assistant', employer: 'Opportunity District', rate: 20, where: 'Opportunity District', req: { life: 5, skills: { 'write.professional': 3, 'read.documents': 3 } }, desc: 'Write emails, file documents, schedule meetings.' },
  { id: 'construction', tier: 1, title: 'Construction helper', employer: 'Build Right Co', rate: 21, where: 'Opportunity District', req: { life: 5, skills: { 'math.fractions': 3 } }, desc: 'Measure, cut and build to plan.' },
  { id: 'photo', tier: 2, title: 'Photographer', employer: 'Studio Lumen', rate: 26, where: 'Opportunity District', req: { life: 7, skills: { 'math.percent': 3, 'write.professional': 3 } }, desc: 'Equipment, clients, pricing and creative work.' },
  { id: 'programmer', tier: 2, title: 'Junior programmer', employer: 'Brightline Tech', rate: 32, where: 'Opportunity District', req: { life: 8, skills: { 'math.algebra': 3, 'think.evaluate': 3 } }, desc: 'Logic, problem solving and building apps.' },
  { id: 'accountant', tier: 2, title: 'Accounting clerk', employer: 'Ledger & Co', rate: 28, where: 'Opportunity District', req: { life: 8, skills: { 'fin.taxes': 3, 'math.percent': 3 } }, desc: 'Records, reports and accuracy.' },
  { id: 'health', tier: 2, title: 'Healthcare aide', employer: 'City Clinic', rate: 25, where: 'Midtown', req: { life: 7, skills: { 'read.documents': 3 } }, desc: 'Care for patients, read charts, follow procedures.' },
  { id: 'electrician', tier: 2, title: 'Electrician apprentice', employer: 'Volt Works', rate: 27, where: 'Opportunity District', req: { life: 7, skills: { 'math.algebra': 2, 'read.instructions': 4 } }, desc: 'Wiring, safety codes and measurement.' },
  { id: 'engineer', tier: 3, title: 'Engineer', employer: 'Heights Engineering', rate: 45, where: 'The Heights', req: { life: 11, skills: { 'math.algebra': 4 } }, desc: 'Design and test real-world systems.' },
  { id: 'doctor', tier: 3, title: 'Medical professional', employer: 'Heights Medical', rate: 60, where: 'The Heights', req: { life: 12 }, desc: 'Years of study to care for others.' },
  { id: 'architect', tier: 3, title: 'Architect', employer: 'Form Studio', rate: 48, where: 'The Heights', req: { life: 11 }, desc: 'Buildings, geometry and clients.' },
  { id: 'lawyer', tier: 3, title: 'Lawyer', employer: 'Heights Legal', rate: 55, where: 'The Heights', req: { life: 12, skills: { 'read.documents': 4 } }, desc: 'Contracts, evidence and argument.' },
  { id: 'owner', tier: 4, title: 'Business owner', employer: 'Your own company', rate: 0, where: 'Business app', req: { life: 6, skills: { 'fin.budget': 3 } }, desc: 'Build something that’s yours. Start with a business plan in the Business app.' },
];
export const TIER_NAMES = ['Starter work', 'Skilled work', 'Careers', 'Professional careers', 'Entrepreneurship'];

export function careerStatus(c, s, edu, ll) {
  const r = c.req, missing = [];
  if (r.shifts && s.stats.shifts < r.shifts) missing.push(`${r.shifts} shifts worked (${s.stats.shifts} so far)`);
  if (r.life && ll < r.life) missing.push(`Life Level ${r.life}`);
  if (r.flag && !s.flags[r.flag]) missing.push('A tip about the opening');
  for (const [id, need] of Object.entries(r.skills || {})) if (edu.state(id) < need) missing.push(`${skillName(id)} — ${['', 'learning', 'practicing', 'proficient', 'mastered'][need]}`);
  const held = (s.jobs || []).includes(c.id);
  return { held, missing, ready: !missing.length, playable: c.where === 'here' };
}
let _skills = null;
export function setSkillNames(SK) { _skills = SK; }
function skillName(id) { return _skills && _skills[id] ? _skills[id].name : id; }

// ------------------------------------------------------------------------------------------- achievements
export const ACHIEVEMENTS = {
  found_way: ['Found your way', 'Walked from nowhere to the Starting District.'],
  first_home: ['A place to sleep', 'Got your first apartment key.'],
  hired: ['Hired', 'Got your first job.'],
  first_pay: ['The first dollar', 'Earned your first paycheck.'],
  said_no: ['Not today, Jax', 'Thought it through before spending.'],
  honest: ['Clean hands', 'Refused to take what you didn’t pay for.'],
  rent_on_time: ['Roof over your head', 'Paid rent on time.'],
  cook: ['Home cooking', 'Cooked a meal with a measured recipe.'],
  saver: ['Saver', 'Had $300 in the bank.'],
  two_jobs: ['Two incomes', 'Held two jobs.'],
  promoted: ['Moving up', 'Earned a promotion.'],
  mastered5: ['Lifelong learner', 'Mastered five skills.'],
  plan: ['The first plan', 'Wrote a business plan.'],
  invited: ['The invitation', 'The Club asked you back.'],
  ending: ['Your definition of success', 'Made the REAL decision.'],
};
