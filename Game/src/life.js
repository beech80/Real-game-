// REAL — Life Level (overall growth, never a measure of worth) + career tiers.
export const LIFE_CATS = [
  ['education', 'Education', '📚'], ['career', 'Career', '💼'], ['financial', 'Financial responsibility', '💰'], ['health', 'Health', '💪'],
  ['decisions', 'Decision making', '🧠'], ['independence', 'Independence', '🏠'], ['relationships', 'Relationships', '🤝'],
  ['reputation', 'Reputation', '⭐'], ['entrepreneurship', 'Entrepreneurship', '🚀'], ['achievements', 'Achievements', '🏆'],
];
export const INVITE_LEVEL = 10;   // The Club takes notice: after the bigger world (The Heights opens at 8), careers and homes
export const INVITE_MIN_DAY = 7;   // …and after at least a week of living on your own

const cap = (v) => Math.max(0, Math.min(10, Math.round(v * 10) / 10));

export function lifeScores(s, edu) {
  const st = s.stats, f = s.flags;
  const paidOnTime = s.bills.filter((b) => b.paid && !b.lateFee).length + (st.billsOnTime || 0);
  const savings = s.money;
  const friends = Object.values(s.friends || {}).reduce((a, v) => a + v, 0);
  return {
    // tuned with a full natural playthrough (tests/playthrough.cjs): each area should grow over one to two weeks of play
    education: cap(edu.proficientCount() * 0.35 + edu.masteredCount() * 0.5 + Object.values(s.courses || {}).filter((c) => c.done).length * 1.2 + (st.challenges || 0) * 0.5),
    career: cap(st.shifts * 0.8 + (s.jobs || []).length * 1 + (st.promotions || 0) * 2 + Math.max(0, ...(s.jobs || []).map((j) => (CAREERS.find((c) => c.id === j) || { tier: 0 }).tier)) * 1.5),
    financial: cap(paidOnTime * 0.8 + (savings >= 100 ? 1 : 0) + (savings >= 300 ? 1.5 : 0) + (savings >= 500 ? 1.5 : 0) - (st.lateFees || 0) + (st.budgetsPlanned || 0) * 0.3),
    health: cap((st.mealsCooked || 0) * 0.5 + (st.workouts || 0) * 0.5 + (st.goodNights || 0) * 0.4 + (st.mealsEaten || 0) * 0.15),
    decisions: cap((st.wiseChoices || 0) * 1.5 + (st.thoughtThrough || 0) * 1 + Object.keys(edu.s.skills || {}).filter((id) => /^think\./.test(id) && edu.state(id) >= 3).length * 0.6),   // critical-thinking skills count too
    independence: cap((f.housed ? 2 : 0) + (f.hired ? 2 : 0) + (st.rentPaidSelf || 0) * 2 + Math.min(4, (st.daysIndependent || 0) * 0.5) + (s.vehicle ? 1 : 0) + ({ loft: 1, heights: 2, owned: 3 }[s.home] || 0)),
    relationships: cap(friends * 0.35 + (s.pet ? s.pet.bond * 0.3 : 0)),
    reputation: cap((st.perfectShifts || 0) * 1.2 + (st.shifts || 0) * 0.4 - (st.thefts || 0) * 3),
    entrepreneurship: cap((st.businessSteps || 0) * 2 + (s.biz ? 1 + s.biz.days * 0.3 + Math.max(0, s.biz.profit) / 250 + s.biz.staff.length : 0)),
    achievements: cap(Object.keys(s.achievements || {}).length * 0.5),
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
  { id: 'cook', tier: 1, title: 'Line cook', employer: 'Corner Kitchen', rate: 18, where: 'Midtown', req: { life: 4, skills: { 'math.fractions': 3 } }, desc: 'Scale recipes, time orders, keep the kitchen safe.' },
  { id: 'sales', tier: 1, title: 'Sales associate', employer: 'Thread & Co', rate: 18, where: 'Midtown', req: { life: 4, skills: { 'math.percent': 2, 'write.professional': 2 } }, desc: 'Help customers compare options and work out discounts.' },
  { id: 'office', tier: 1, title: 'Office assistant', employer: 'Opportunity District', rate: 20, where: 'Opportunity District', req: { life: 5, skills: { 'write.professional': 3, 'read.documents': 3 } }, desc: 'Write emails, file documents, schedule meetings.' },
  { id: 'construction', tier: 1, title: 'Construction helper', employer: 'Build Right Co', rate: 21, where: 'Opportunity District', req: { life: 5, skills: { 'math.fractions': 3 } }, desc: 'Measure, cut and build to plan.' },
  { id: 'photo', tier: 2, title: 'Photographer', employer: 'Studio Lumen', rate: 26, where: 'Opportunity District', req: { life: 7, skills: { 'math.percent': 3, 'write.professional': 3 } }, desc: 'Equipment, clients, pricing and creative work.' },
  { id: 'programmer', tier: 2, title: 'Junior programmer', employer: 'Brightline Tech', rate: 32, where: 'Opportunity District', req: { course: 'code', life: 8, skills: { 'math.algebra': 2, 'think.evaluate': 3 } }, desc: 'Logic, problem solving and building apps.' },
  { id: 'accountant', tier: 2, title: 'Accounting clerk', employer: 'Ledger & Co', rate: 28, where: 'Opportunity District', req: { course: 'acct', life: 8, skills: { 'fin.taxes': 3, 'math.percent': 3 } }, desc: 'Records, reports and accuracy.' },
  { id: 'health', tier: 2, title: 'Healthcare aide', employer: 'City Clinic', rate: 25, where: 'Midtown', req: { life: 7, skills: { 'read.documents': 3 } }, desc: 'Care for patients, read charts, follow procedures.' },
  { id: 'electrician', tier: 2, title: 'Electrician apprentice', employer: 'Volt Works', rate: 27, where: 'Opportunity District', req: { course: 'trades', life: 7, skills: { 'math.algebra': 2, 'read.instructions': 3 } }, desc: 'Wiring, safety codes and measurement.' },
  { id: 'engineer', tier: 3, title: 'Engineer', employer: 'Heights Engineering', rate: 45, where: 'The Heights', req: { course: 'eng', life: 10, skills: { 'math.algebra': 3 } }, desc: 'Design and test real-world systems.' },
  { id: 'doctor', tier: 3, title: 'Medical professional', employer: 'Heights Medical', rate: 60, where: 'The Heights', req: { course: 'med', life: 11, skills: { 'read.documents': 3 } }, desc: 'Years of study to care for others.' },
  { id: 'architect', tier: 3, title: 'Architect', employer: 'Form Studio', rate: 48, where: 'The Heights', req: { course: 'arch', life: 10, skills: { 'math.multiply': 3 } }, desc: 'Buildings, geometry and clients.' },
  { id: 'lawyer', tier: 3, title: 'Lawyer', employer: 'Heights Legal', rate: 55, where: 'The Heights', req: { course: 'law', life: 11, skills: { 'read.documents': 3 } }, desc: 'Contracts, evidence and argument.' },
  // careers that grow out of adventures (the adventure character becomes your boss)
  { id: 'racemech', tier: 1, title: 'Race mechanic', employer: 'Rita’s Garage', rate: 19, where: 'Starting District', adv: 'race', req: { life: 3, flag: 'adv_race_1' }, desc: 'Tune cars, fix engines, prep racers.' },
  { id: 'firefighter', tier: 1, title: 'Firefighter cadet', employer: 'Station 7', rate: 18, where: 'Starting District', adv: 'rescue', req: { life: 3, flag: 'adv_rescue_2' }, desc: 'Safety checks, drills and community rescues.' },
  { id: 'vettech', tier: 1, title: 'Animal care assistant', employer: 'Brighter Park Pet Club', rate: 17, where: 'Starting District', adv: 'pets', req: { flag: 'adv_pets_1' }, desc: 'Feed, exercise and care for animals.' },
  { id: 'medasst', tier: 1, title: 'Medical assistant', employer: 'City Clinic', rate: 19, where: 'Midtown', adv: 'medical', req: { life: 4, flag: 'adv_medical_2' }, desc: 'Check-in, supplies and patient care.' },
  { id: 'detective', tier: 1, title: 'Junior investigator', employer: 'City Detective Agency', rate: 20, where: 'Starting District', adv: 'mystery', req: { life: 4, flag: 'adv_mystery_1' }, desc: 'Find facts, interview people, solve cases.' },
  { id: 'robotech', tier: 2, title: 'Robotics technician', employer: 'Opportunity Robo Lab', rate: 26, where: 'Opportunity District', adv: 'robots', req: { life: 6, flag: 'adv_robots_3' }, desc: 'Build, program and test robots.' },
  { id: 'chef', tier: 2, title: 'Chef', employer: 'Corner Kitchen', rate: 27, where: 'Midtown', adv: 'culinary', req: { life: 6, flag: 'adv_culinary_2' }, desc: 'Create menus, run the kitchen, train cooks.' },
  { id: 'designer', tier: 2, title: 'Product designer', employer: 'Volt Works Lab', rate: 29, where: 'Opportunity District', adv: 'inventor', req: { life: 7, flag: 'adv_inventor_2' }, desc: 'Invent, prototype and test new products.' },
  { id: 'contractor', tier: 2, title: 'Contractor', employer: 'Build Right Co', rate: 30, where: 'Opportunity District', adv: 'construction', req: { life: 7, flag: 'adv_construction_3' }, desc: 'Plan and lead building projects.' },
  { id: 'owner', tier: 4, title: 'Business owner', employer: 'Your own company', rate: 0, where: 'Business app', req: { life: 6, skills: { 'fin.budget': 3 } }, desc: 'Build something that’s yours. Start with a business plan in the Business app.' },
];
export const COURSE_NAMES = { code: 'Intro to Programming (City Tech)', trades: 'Electrical Safety (City Tech)', acct: 'Accounting Basics (City Tech)', eng: 'Engineering Design (Heights College)', med: 'Pre-Medicine (Heights College)', arch: 'Architecture Studio (Heights College)', law: 'Law Foundations (Heights College)' };
export const TIER_NAMES = ['Starter work', 'Skilled work', 'Careers', 'Professional careers', 'Entrepreneurship'];

export function careerStatus(c, s, edu, ll) {
  const r = c.req, missing = [];
  if (r.shifts && s.stats.shifts < r.shifts) missing.push(`${r.shifts} shifts worked (${s.stats.shifts} so far)`);
  if (r.life && ll < r.life && !s.flags['ref_' + c.id]) missing.push(`Life Level ${r.life}`);
  if (r.flag && !s.flags[r.flag]) missing.push(/^adv_/.test(r.flag) ? 'More experience in this adventure' : 'A tip about the opening');
  if (r.course && !(s.courses && s.courses[r.course] && s.courses[r.course].done)) missing.push(`Course: ${COURSE_NAMES[r.course]}`);
  for (const [id, need] of Object.entries(r.skills || {})) if (edu.state(id) < need) missing.push(`${skillName(id)} — ${['', 'learning', 'practicing', 'proficient', 'mastered'][need]}`);
  const held = (s.jobs || []).includes(c.id);
  return { held, missing, ready: !missing.length, playable: c.where === 'here' || c.tier < 4 };
}
let _skills = null;
export function setSkillNames(SK) { _skills = SK; }
function skillName(id) { return _skills && _skills[id] ? _skills[id].name : id; }

// ------------------------------------------------------------------------------------------- achievements
export const ACHIEVEMENTS = {
  found_way: ['Found your way', 'Walked from nowhere to the Starting District.'],
  first_home: ['A place to sleep', 'Got your first apartment key.'],
  hired: ['Hired', 'Got your first job.'],
  regular: ['Part of the neighbourhood', 'Joined in 5 afternoon events around town.'],
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
  career: ['A real career', 'Got a Tier 2 career job.'],
  professional: ['Professional', 'Became a Tier 3 professional.'],
  graduate: ['Graduate', 'Completed a course.'],
  explorer: ['Explorer', 'Visited every district.'],
  owner: ['Open for business', 'Opened your own business.'],
  boss: ['Good boss', 'Hired your first employee.'],
  profit: ['In the black', 'Made $500 in business profit.'],
  wheels: ['On the move', 'Bought a vehicle.'],
  moved_up: ['New address', 'Moved into a better home.'],
  homeowner: ['Homeowner', 'Bought a home.'],
  pet: ['Best friend', 'Adopted a pet.'],
  friend3: ['Neighbors', 'Made three friends in the city.'],
  challenge: ['Challenger', 'Cleared a challenge zone.'],
  allzones: ['Think Tank champion', 'Cleared every challenge zone.'],
  companion: ['Plush pal', 'Linked a plush companion.'],
  investor: ['Investor', 'Opened a savings account that earns interest.'],
  mentor: ['Mentor', 'Helped a newcomer get started in the city.'],
  racewin: ['Checkered flag', 'Won a race.'],
  petchamp: ['Champion team', 'Won the Pet Championship.'],
  cookchamp: ['Top chef', 'Wowed the cook-off judges.'],
  robot: ['It works!', 'Programmed a robot to complete a challenge.'],
  inventor: ['Inventor', 'Invented something that passed its test.'],
  bestbiz: ['Best in the city', 'Won the Best Business award.'],
  explorer2: ['Curious mind', 'Tried five different adventures.'],
  reader: ['Bookworm', 'Read five books at the library.'],
};
