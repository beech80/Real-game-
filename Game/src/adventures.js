// REAL — the open-world adventure system. Ten adventures, each started by talking to a character in the city.
// Short adventures can be tried once and dropped; long-term paths lead to careers. Interest is learned only from
// what the player chooses to do (and optional chats), never from test scores, and the player can clear it any time.
import { UI, h, money, wait } from './ui.js';
import { runActivity } from './learnkit.js';
import { GEN } from './curriculum.js';
import { T, workShift } from './careers.js';
import { CAREERS, careerStatus } from './life.js';
import { PARTS, COLORS, TRACKS, carStats, buildCost } from './race.js';
import { ROBOT_PARTS, ROBOT_LEVELS, CUES } from './arenas.js';
import { BUSINESSES } from './expansion.js';
import { askNPC } from './voice.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const gen = (id) => (GEN[id] ? pick(GEN[id]) : T[id]);
const act = (G, id, ctx, title, icon) => runActivity(G, typeof id === 'string' ? gen(id) : id, ctx, title, icon);

// ------------------------------------------------------------------------------------------------ registry
// npc.loc: 'district' (Starting District) or a district id; x/y in that space's plan coordinates (districts add ox).
export const ADVENTURES = {
  race: { title: 'Build & Race', icon: '🏎️', tags: ['vehicles', 'building', 'competition', 'science'], npc: { name: 'Rita', role: 'Mechanic', species: 'Horse', outfit: { jacket: 0x2a5bd2, hoodie: 0xe8b23a }, loc: 'district', x: 13, y: -12 }, hint: 'A mechanic near Brighter Park has a car with its hood up…', career: 'racemech' },
  pets: { title: 'Pet Championship', icon: '🐾', tags: ['animals', 'caring', 'competition', 'science'], npc: { name: 'Penny', role: 'Pet trainer', species: 'Dog', outfit: { jacket: 0x2f8f5a, hoodie: 0xf1f1f1 }, loc: 'district', x: 30, y: -52 }, hint: 'Someone in Brighter Park is training animals…', career: 'vettech' },
  rescue: { title: 'Emergency Rescue', icon: '🚒', tags: ['helping', 'action', 'science', 'safety'], npc: { name: 'Captain Rhodes', role: 'Firefighter', species: 'Elephant', outfit: { jacket: 0xd23b2a, hoodie: 0xe8b23a }, loc: 'district', x: -46, y: -6.8 }, hint: 'A firefighter on Main St is looking for volunteers…', career: 'firefighter' },
  mystery: { title: 'Mystery Detectives', icon: '🔍', tags: ['puzzles', 'reading', 'people', 'logic'], npc: { name: 'Detective Ivy', role: 'Detective', species: 'Cat', outfit: { jacket: 0x5a3a20, hoodie: 0xe6dccb }, loc: 'district', x: -44, y: 7.2 }, hint: 'A detective near the Community Center has a case…', career: 'detective' },
  culinary: { title: 'Culinary Adventures', icon: '👩‍🍳', tags: ['food', 'creativity', 'competition', 'business'], npc: { name: 'Chef Lou', role: 'Chef', species: 'Cow', outfit: { jacket: 0xf1f1f1, hoodie: 0xd23b2a }, loc: 'midtown', x: -6.6, y: 40 }, hint: 'A chef in Midtown is planning a cook-off…', career: 'chef' },
  medical: { title: 'Medical Missions', icon: '🩺', tags: ['helping', 'science', 'caring', 'people'], npc: { name: 'Nurse Kim', role: 'Nurse', species: 'Bird', outfit: { jacket: 0x2a9fd6, hoodie: 0xf1f1f1 }, loc: 'midtown', x: 6.6, y: 44 }, hint: 'The City Clinic in Midtown needs helpers…', career: 'medasst' },
  robots: { title: 'Robot Builders', icon: '🤖', tags: ['technology', 'building', 'logic', 'competition'], npc: { name: 'Dr. Bolt', role: 'Robotics engineer', species: 'Lion', outfit: { jacket: 0x0f5c5c, hoodie: 0x2fd2b0 }, loc: 'opportunity', x: 6.6, y: 32 }, hint: 'A robotics lab in the Opportunity District is recruiting…', career: 'robotech' },
  construction: { title: 'Construction Challenge', icon: '🏗️', tags: ['building', 'design', 'math', 'outdoors'], npc: { name: 'Jo', role: 'Foreman', species: 'Horse', outfit: { jacket: 0xe8b23a, hoodie: 0x2a2d33 }, loc: 'opportunity', x: -6.6, y: 34 }, hint: 'A builder in the Opportunity District has a project for the park…', career: 'contractor' },
  inventor: { title: 'The Inventor’s Workshop', icon: '💡', tags: ['technology', 'creativity', 'design', 'science'], npc: { name: 'Professor Volt', role: 'Inventor', species: 'Fox', outfit: { jacket: 0x7b3fb0, hoodie: 0xe8b23a }, loc: 'opportunity', x: -6.6, y: 81 }, hint: 'An inventor in the Opportunity District needs a fresh mind…', career: 'designer' },
  business: { title: 'Build Your Business', icon: '🏪', tags: ['business', 'people', 'leadership', 'math'], npc: { name: 'Advisor Kemi', role: 'Business coach', species: 'Dolphin', outfit: { jacket: 0x1f6b35, hoodie: 0xe6dccb }, loc: 'opportunity', x: 6.6, y: 86 }, hint: 'A business coach in the Opportunity District runs a Best Business award…', career: null },
};
const QUESTIONS = {
  race: ['What did you enjoy most?', [['Choosing the parts', ['design']], ['Driving the race', ['competition', 'action']], ['Figuring out what was wrong', ['puzzles', 'science']]]],
  pets: ['What was the best part?', [['Caring for the animals', ['caring', 'animals']], ['Training and practice', ['animals', 'science']], ['The competition', ['competition']]]],
  rescue: ['How did that feel?', [['I liked helping people', ['helping', 'people']], ['I liked the action', ['action']], ['I liked knowing the safety rules', ['safety', 'science']]]],
  mystery: ['What part was most fun?', [['Finding clues', ['puzzles']], ['Talking to people', ['people']], ['Putting the evidence together', ['logic', 'reading']]]],
  culinary: ['What did you like best?', [['Cooking itself', ['food', 'creativity']], ['Winning the judges over', ['competition']], ['Pricing the menu', ['business', 'math']]]],
  medical: ['What stood out to you?', [['Helping patients feel better', ['caring', 'helping']], ['Learning how the body works', ['science']], ['Keeping things organized', ['logic']]]],
  robots: ['Would you rather design robots or test them?', [['Design them', ['design', 'building']], ['Test them', ['logic', 'science']], ['Program them', ['technology', 'logic']]]],
  construction: ['Which part did you enjoy?', [['Planning and measuring', ['math', 'design']], ['Seeing it get built', ['building', 'outdoors']], ['Choosing materials', ['science']]]],
  inventor: ['What do you like about inventing?', [['Coming up with ideas', ['creativity']], ['Testing and fixing', ['science', 'design']], ['Thinking about who it helps', ['helping']]]],
  business: ['What part of business interests you?', [['Serving customers', ['people']], ['Making the numbers work', ['math', 'business']], ['Leading a team', ['leadership']]]],
};

// ------------------------------------------------------------------------------------------------ install
export function installAdventures(Game) {
  const P = Game.prototype;
  const adv = (s, id) => { s.adv = s.adv || {}; return (s.adv[id] = s.adv[id] || { stage: 0, runs: 0, met: false, best: null }); };
  /** interest signals: only voluntary choices count; private, on-device, and the player can clear them */
  P.interest = function (id, w = 1) { const s = this.state; s.interests = s.interests || {}; for (const t of ADVENTURES[id].tags) s.interests[t] = Math.round(((s.interests[t] || 0) + w) * 10) / 10; };
  P.advOffer = function (id) { const s = this.state, A = adv(s, id); return !A.met || (this.advNext(id) && !s.mission); };
  P.advNext = function (id) { const A = adv(this.state, id); return EPISODES[id][Math.min(A.stage, EPISODES[id].length - 1)]; };
  /** Talking to an adventure character: offer, continue, repeat, work, or walk away. */
  P.advTalk = async function (id) {
    const s = this.state, D = ADVENTURES[id], A = adv(s, id), who = `${D.npc.name} · ${D.npc.role}`;
    if (!s.flags.housed) { await UI.say(who, 'Find the Community Center first, then come back. I’ll still be here.'); return; }
    if (s.mission && s.mission.adv === id) { await UI.say(who, s.mission.text); return; }
    const eps = EPISODES[id], ep = eps[Math.min(A.stage, eps.length - 1)], allDone = A.stage >= eps.length;
    if (!A.met) { A.met = true; await UI.say(who, ep.hook || INTRO[id]); }
    const career = D.career && CAREERS.find((c) => c.id === D.career), held = career && s.jobs.includes(career.id);
    const opts = [[allDone ? `${ep.repeat || 'Do it again'}` : `${ep.title}`, 'go'], held ? ['Work a shift', 'work'] : null, career && !held && careerStatus(career, s, this.edu, this.life().level).ready ? [`Ask about becoming a ${career.title.toLowerCase()}`, 'job'] : null, ['💬 Ask a question', 'ask'], ['Not right now', 'no']].filter(Boolean);
    const c = await UI.say(who, allDone ? 'Back for more? There’s always a new challenge.' : ep.offer, opts.map((o) => o[0]));
    const pickd = opts[c][1];
    if (pickd === 'no') { await UI.say(who, pick(['No problem. Come back any time.', 'Go explore. The offer stands.', 'Maybe another day!'])); return; }
    if (pickd === 'work') return workShift(this, career);
    if (pickd === 'ask') return askNPC(this, { name: D.npc.name });
    if (pickd === 'job') { await UI.say(who, `You’ve shown real talent. The ${career.employer} job is yours if you want it: ${money(career.rate)} an hour.`); s.jobs.push(career.id); this.sfx('level'); this.achieve('hired'); this.save(); return; }
    this.interest(id, A.runs ? 1.5 : 1);   // choosing to (re)play is the strongest interest signal
    A.runs++; s.stats.adventures = (s.stats.adventures || 0) + 1;
    await ep.run(this, A, who);
    this.save();
  };
  /** Missions with in-world objectives: walk to a place, then interact. */
  P.setMission = function (m) { this.state.mission = m; this.save(); UI.toast(`🗺️ ${m.text}`, 'info', 3200); };
  P.missionArrive = async function () {
    const m = this.state.mission; if (!m) return;
    const fn = MISSION_STEPS[m.step]; this.state.mission = null;
    if (fn) await fn(this, m);
    this.save();
  };
  P.advFinishEpisode = async function (id, A, who, { reward = 0, xpTag = null, flag = null, msg = null } = {}) {
    const s = this.state;
    A.stage = Math.min(A.stage + 1, EPISODES[id].length);
    if (reward) this.earn(reward, `${ADVENTURES[id].title} reward`);
    if (flag) s.flags[flag] = true;
    s.flags[`adv_${id}_${A.stage}`] = true;
    this.sfx('level');
    if (msg) await UI.say(who, msg);
    // optional, friendly interest chat (only once per adventure)
    if (!A.asked && QUESTIONS[id]) {
      A.asked = true; const [q, opts] = QUESTIONS[id];
      const c = await UI.say(who, q, [...opts.map((o) => o[0]), 'Rather not say']);
      if (c < opts.length) { s.interests = s.interests || {}; for (const t of opts[c][1]) s.interests[t] = (s.interests[t] || 0) + 1; }
    }
    const career = ADVENTURES[id].career && CAREERS.find((c) => c.id === ADVENTURES[id].career);
    if (career && A.stage === EPISODES[id].length && !s.jobs.includes(career.id)) {
      s.flags['ref_' + career.id] = true;
      await UI.say(who, `If you ever want to do this for real, I could use a ${career.title.toLowerCase()}. No pressure. Just ask me.`);
    }
    if (Object.values(s.adv || {}).filter((a) => a.stage > 0).length >= 5) this.achieve('explorer2');
    this.save();
  };
  /** Discover app: what you might enjoy, something new, and every adventure you've met. */
  P.discoverApp = function (body, open) {
    const s = this.state, I = s.interests || {}, adv2 = s.adv || {};
    const score = (id) => ADVENTURES[id].tags.reduce((a, t) => a + (I[t] || 0), 0);
    const ids = Object.keys(ADVENTURES), tried = ids.filter((id) => (adv2[id] || {}).runs);
    const liked = [...ids].sort((a, b) => score(b) - score(a)).filter((id) => score(id) > 0).slice(0, 2);
    const fresh = ids.filter((id) => !(adv2[id] || {}).runs);
    const newOne = fresh.length ? fresh[(s.day * 7) % fresh.length] : null;
    const row = (id, why) => { const D = ADVENTURES[id], A = adv2[id] || {}; const met = A.met; return h('div', { class: 'bill' }, h('div', {}, h('b', {}, `${D.icon} ${D.title}`), h('small', {}, why || (met ? `${D.npc.name} · ${{ district: 'Starting District', midtown: 'Midtown', opportunity: 'Opportunity District' }[D.npc.loc]} · ${A.stage || 0}/${EPISODES[id].length} done` : D.hint))), A.stage >= EPISODES[id].length ? h('span', { class: 'ok' }, '★') : null); };
    return h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'Adventures happen all over the city. Try anything. Keep what you love, drop what you don’t.'),
      liked.length ? h('div', { class: 'tier-h' }, 'You might enjoy') : null, ...liked.map((id) => row(id, `Because you’ve enjoyed ${ADVENTURES[id].tags.filter((t) => I[t]).slice(0, 2).join(' and ')}`)),
      newOne ? h('div', { class: 'tier-h' }, 'Try something new') : null, newOne ? row(newOne) : null,
      h('div', { class: 'tier-h' }, `All adventures (${tried.length}/${ids.length} tried)`), ...ids.map((id) => row(id)),
      h('button', { class: 'ghost sm', onclick: () => { s.interests = {}; this.save(); open('Discover'); } }, 'Clear what REAL has learned about my interests'),
      h('p', { class: 'tip' }, 'Suggestions only use what you chose to play. They never decide your future.'));
  };

  // -------------------------------------------------------------------------------------------- creation: garage
  P.garage = async function (budget) {
    const s = this.state; s.builds = s.builds || {}; const b = { ...(s.builds.car || { body: 'hatch', engine: 'stock', tires: 'street', susp: 'stock', color: COLORS[0] }) };
    const owned = s.ownedParts = s.ownedParts || ['hatch', 'stock', 'street'];
    const fund = budget != null ? budget : s.money;
    return UI.sheet('Garage', (close, body) => {
      const render = () => {
        const extra = Object.keys(PARTS).reduce((a, k) => a + (owned.includes(b[k]) ? 0 : PARTS[k].find((p) => p.id === b[k]).cost), 0), st = carStats(b);
        const bar = (label, v, max) => h('div', { class: 'skill' }, h('span', {}, label), h('div', { class: 'bar' }, h('i', { style: { width: Math.round(100 * Math.min(1, v / max)) + '%' } })));
        body.replaceChildren(h('div', { class: 'act' },
          h('div', { class: 'budget' }, h('div', {}, h('small', {}, budget != null ? 'PARTS CREDIT' : 'YOUR MONEY'), h('b', {}, money(fund))), h('div', {}, h('small', {}, 'NEW PARTS'), h('b', { class: extra > fund ? 'neg' : '' }, money(extra))), h('div', {}, h('small', {}, 'LEFT'), h('b', {}, money(fund - extra)))),
          h('div', { class: 'skills' }, bar('Top speed', st.top, 50), bar('Acceleration', st.acc, 12), bar('Grip', st.grip, 1.1), bar('Off-road', st.off, 0.95)),
          ...Object.entries({ body: 'Body', engine: 'Engine', tires: 'Tires', susp: 'Suspension' }).map(([k, n]) => h('div', {}, h('div', { class: 'tier-h' }, n), h('div', { class: 'partrow' }, PARTS[k].map((p) => h('button', { class: 'part' + (b[k] === p.id ? ' sel' : ''), onclick: () => { b[k] = p.id; render(); } }, h('b', {}, p.name), h('small', {}, owned.includes(p.id) && p.cost ? 'Owned' : p.cost ? money(p.cost) : 'Free'), h('small', {}, p.note)))))),
          h('div', { class: 'tier-h' }, 'Paint'), h('div', { class: 'swatches' }, COLORS.map((c) => h('button', { class: 'swatch' + (b.color === c ? ' sel' : ''), style: { background: '#' + c.toString(16).padStart(6, '0') }, onclick: () => { b.color = c; render(); } }))),
          h('button', { class: 'primary', disabled: extra > fund, onclick: () => close({ build: b, cost: extra }) }, extra > fund ? 'Over budget' : extra ? `Buy parts (${money(extra)})` : 'Save build')));
      };
      render(); return h('div');
    }, { icon: '🔧', cls: 'wide' }).then((r) => {
      if (!r) return null;
      for (const k of Object.keys(PARTS)) if (!owned.includes(r.build[k])) owned.push(r.build[k]);
      if (r.cost && budget == null) this.spend(r.cost, 'Car parts');
      s.builds.car = r.build; this.save(); return r;
    });
  };
  P.raceDebrief = async function (res, who) {
    const s = this.state, t = res.tele, st = carStats(s.builds.car);
    const notes = [];
    if (t.slide > 4) notes.push(st.grip < 0.85 ? 'You slid wide in a lot of corners. Your tires ran out of grip. Better tires add friction so you can turn at speed.' : 'You slid in corners. Try braking a little before the turn, then accelerating out.');
    if (t.off > 5) notes.push(st.off < 0.6 ? 'You lost time on the grass. Stiffer suspension keeps you steady off the road.' : 'You went off the track a few times. Stay inside the curbs.');
    if (t.dirtSlow > 3 && st.off < 0.7) notes.push('The dirt section slowed you down. A rally suspension (or truck body) helps on loose ground.');
    if (!notes.length) notes.push(res.place === 1 ? 'Clean driving. Your setup suits this track.' : 'Good clean race. More engine power would help on the straights.');
    this.edu.record('sci.friction', t.slide < 4, { ctx: 'race' }); this.edu.discover('sci.method');
    await UI.say(who, notes.join(' '));
  };
}

// ------------------------------------------------------------------------------------------------ episodes
const INTRO = {
  race: 'Hey! You! Think you can help me figure out what’s wrong with this engine?',
  pets: 'Hi there! Do you like animals? We run fun agility races here, and every pet that tries is a winner.',
  rescue: 'Afternoon. Station 7 runs community rescue drills, and we could use a sharp volunteer.',
  mystery: 'Psst. You look observant. I’ve got a case nobody can crack. Interested?',
  culinary: 'Ah, a new face! Do you cook? The Midtown Cook-off is coming and I need a sous-chef.',
  medical: 'Hello! The clinic is busy today. Would you like to help out? No experience needed.',
  robots: 'Welcome to the Robo Lab. Want to build a robot and see what it can do?',
  construction: 'We’re building something for Brighter Park and could use another pair of hands.',
  inventor: 'A problem is just an invention waiting to happen! Got a minute?',
  business: 'Every year the city gives a Best Business award. Want to compete?',
};
const MISSION_STEPS = {};
const EPISODES = {
  // ============================================================== 1. BUILD & RACE
  race: [
    { title: 'Help fix the engine', offer: 'My car won’t start. Help me find the problem?', run: async (G, A, who) => {
      await UI.say(who, 'It cranks but won’t start, and the dash lights are dim. Let’s think it through like a mechanic.');
      await act(G, 'diagnose', 'race', 'What’s wrong?', '🔧');
      await act(G, { type: 'order', skill: 'read.instructions', q: 'Put the battery swap in the safe order.', items: ['Turn the engine off and take the key out', 'Disconnect the black (−) cable first', 'Disconnect the red (+) cable', 'Swap in the new battery', 'Connect red (+), then black (−)'], why: 'Black comes off first and goes on last, so a slipping wrench can’t make a spark.' }, 'race', 'Swap the battery', '🔋');
      await UI.say(who, 'VROOM! Listen to that. You’ve got good hands.');
      await G.advFinishEpisode('race', A, who, { reward: 50, msg: 'Here’s $50, and something better: I’ve got a spare car and $500 of parts credit. Build it your way, then let’s race it.' });
    } },
    { title: 'Build your race car', offer: 'Your car is ready for parts. You have $500 of credit. What will you build?', run: async (G, A, who) => {
      await UI.say(who, 'Every part is a trade-off. Power is fun, but grip keeps you on the road. Test, then improve.');
      await act(G, 'sci.method#0', 'race', 'Think like an engineer', '🧪');
      const r = await G.garage(500); if (!r) return;
      await act(G, { type: 'number', skill: 'fin.budget', q: `You had $500 of credit and spent ${money(r.cost)}. How much is left?`, a: 500 - r.cost, prefix: '$', why: `500 − ${r.cost} = ${500 - r.cost}.` }, 'race', 'Budget check', '🧮');
      await UI.say(who, 'Now a practice lap. No pressure, just feel how it handles.');
      const res = await G.hooks.race('loop', G.state.builds.car, { laps: 1 });
      await G.raceDebrief(res, who);
      await G.advFinishEpisode('race', A, who, { msg: 'That’s how real racing works: build, test, learn, improve. Ready for a real race?' });
    } },
    { title: 'Race the Brighter Park Loop', offer: 'Three drivers, two laps, prize money. Want in?', repeat: 'Race again', run: async (G, A, who) => {
      const tracks = ['loop', ...(G.state.flags.adv_race_3 ? ['circuit'] : []), ...(G.state.flags.adv_race_4 ? ['rally'] : [])];
      let trk = tracks[0];
      if (tracks.length > 1) { const c = await UI.say(who, 'Which track?', tracks.map((t) => TRACKS[t].name)); trk = tracks[c]; }
      const tune = await UI.say(who, 'Want to change your setup first?', ['Open the garage', 'Race as is']);
      if (tune === 0) await G.garage();
      const res = await G.hooks.race(trk, G.state.builds.car, {});
      const prize = TRACKS[trk].prize[res.place - 1] || 0;
      if (prize) G.earn(prize, `${TRACKS[trk].name} prize`);
      await UI.say(who, `${['🥇 You won!', '🥈 Second place!', '🥉 Third place!', 'You finished fourth.'][res.place - 1]} ${prize ? `Prize: ${money(prize)}.` : ''}`);
      await G.raceDebrief(res, who);
      A.best = A.best == null ? res.place : Math.min(A.best, res.place);
      if (res.place === 1) G.achieve('racewin');
      if (A.stage < 5) await G.advFinishEpisode('race', A, who, { msg: A.stage === 2 ? 'Keep winning and the Midtown Circuit opens up. It has tight corners. Grip matters there.' : A.stage === 3 ? 'The Midtown Circuit is open! After that: the Old Road Rally, with a dirt section.' : 'The Old Road Rally is open. Bring a suspension that likes dirt.' });
    } },
    { title: 'Race the Midtown Circuit', offer: 'The Midtown Circuit has tight corners. Grip wins there.', repeat: 'Race again', run: (G, A, who) => EPISODES.race[2].run(G, A, who) },
    { title: 'Race the Old Road Rally', offer: 'Half the rally is on dirt. Set up your car for it.', repeat: 'Race again', run: (G, A, who) => EPISODES.race[2].run(G, A, who) },
  ],
  // ============================================================== 2. PET CHAMPIONSHIP
  pets: [
    { title: 'Try a fun run', offer: 'Want to try the agility course? If you don’t have a pet yet, you can run with my dog Pepper.', run: async (G, A, who) => {
      await UI.say(who, 'Animals learn best with kindness: reward what they do right, never punish. And a pet that ate and rested runs happiest.');
      await act(G, 'sci.animals#0', 'pets', 'Animal care', '🐾');
      const pet = G.petForRace();
      await UI.say(who, `${pet.name} is ready! When ${pet.name} reaches an obstacle, tap the cue button so they know what to do.`);
      const res = await G.hooks.petRace(pet, G.petCare01(), 0);
      await G.petDebrief(res, who);
      await G.advFinishEpisode('pets', A, who, { reward: 25, msg: 'Here’s $25 for a great run. Want to train together? Training makes a big difference.' });
    } },
    { title: 'Training day', offer: 'Let’s practice. Remember: reward the right behavior the moment it happens.', repeat: 'Train again', run: async (G, A, who) => {
      const pet = G.petForRace(); const score = await G.trainPet(pet);
      if (G.state.pet) { G.state.pet.training = Math.min(10, (G.state.pet.training || 0) + score * 0.6); G.state.pet.bond = Math.min(10, G.state.pet.bond + 0.3); }
      await act(G, 'sci.nutrition#0', 'pets', 'Fuel for practice', '🥕');
      await UI.say(who, score >= 3 ? 'Wonderful timing! They’ll remember that.' : 'Good start. Practice makes it click.');
      if (A.stage < 2) await G.advFinishEpisode('pets', A, who, { msg: 'Ready for the real championship? Make sure your pet is fed and rested on race day.' });
    } },
    { title: 'The Brighter Park Championship', offer: 'Today’s championship has three good teams. Good luck!', repeat: 'Enter another championship', run: async (G, A, who) => {
      const pet = G.petForRace(); const care = G.petCare01();
      const res = await G.hooks.petRace(pet, care, 1);
      const prize = [80, 45, 25, 10][res.place - 1]; G.earn(prize, 'Pet Championship prize');
      await UI.say(who, `${['🥇 Champions!', '🥈 Second place!', '🥉 Third place!', 'Fourth, and a happy pet!'][res.place - 1]} Prize: ${money(prize)}.`);
      await G.petDebrief(res, who);
      if (res.place === 1) G.achieve('petchamp');
      if (A.stage < 3) await G.advFinishEpisode('pets', A, who, {});
    } },
  ],
  // ============================================================== 3. EMERGENCY RESCUE
  rescue: [
    { title: 'Rescue drill: kitten in a tree', offer: 'A kitten is stuck in a tree in Brighter Park. Want to help? Safety first.', run: async (G, A, who) => {
      await UI.say(who, 'Head to the big oak in Brighter Park. I’ll bring the ladder.');
      G.setMission({ adv: 'rescue', step: 'kitten', loc: 'district', x: 52, y: -60, label: 'Rescue the kitten', text: 'Go to the big oak in Brighter Park' });
    } },
    { title: 'Smoke alarm safety check', offer: 'Station 7 checks smoke alarms in the Starter Apartments. Ready?', run: async (G, A, who) => {
      G.setMission({ adv: 'rescue', step: 'alarm', loc: 'district', x: -24, y: 5.6, label: 'Check the smoke alarms', text: 'Meet at The Starter Apartments lobby' });
    } },
    { title: 'Find the lost hiker', offer: 'A hiker is lost out on the old road south of the city. Will you search with us?', repeat: 'Run another drill', run: async (G, A, who) => {
      await act(G, 'sci.safety#0', 'rescue', 'Before you go', '🦺');
      G.setMission({ adv: 'rescue', step: 'hiker', loc: 'district', x: 14, y: -232, label: 'Help the hiker', text: 'Search the old road south of the city (near the creek)' });
    } },
  ],
  // ============================================================== 4. MYSTERY DETECTIVES
  mystery: [
    { title: 'The Case of the Missing Bus Pass', offer: 'Dee from Daily Grind lost her monthly bus pass. Find three clues, then tell me what happened.', run: async (G, A, who) => {
      G.state.case = { id: 'pass', found: [] };
      G.setMission({ adv: 'mystery', step: 'clue1', loc: 'district', x: 21, y: -3.6, label: 'Examine the bus stop', text: 'Clue 1 of 3: check the bus stop' });
    } },
    { title: 'The Mystery of the Night Lights', offer: 'Someone keeps seeing lights in Brighter Park at night. Investigate?', run: async (G, A, who) => {
      G.state.case = { id: 'lights', found: [] };
      G.setMission({ adv: 'mystery', step: 'light1', loc: 'district', x: 43, y: -36, label: 'Look around the benches', text: 'Clue 1 of 2: check the park benches' });
    } },
    { title: 'Solve a quick case', offer: 'I’ve got a quick puzzle for you. Facts only, no guessing!', repeat: 'Another case', run: async (G, A, who) => {
      await act(G, 'read.inference#0', 'mystery', 'The note', '🔍'); await act(G, 'think.evidence#0', 'mystery', 'The evidence', '🔍'); await act(G, 'read.evidence#0', 'mystery', 'The witness', '🔍');
      G.earn(20, 'Case fee'); if (A.stage < 3) await G.advFinishEpisode('mystery', A, who, { msg: 'Sharp work. You think like a detective.' });
    } },
  ],
  // ============================================================== 5. CULINARY
  culinary: [
    { title: 'The Pancake Cook-off', offer: 'Round one: pancakes for six judges. Follow the recipe, scale it, time it.', run: async (G, A, who) => {
      const pts = await G.cookRound(['recipe', 'sci.heat#0', 'orders'], who);
      await G.judges(pts, who, 'pancakes');
      await G.advFinishEpisode('culinary', A, who, { reward: 30 + pts * 10, msg: 'You’ve got kitchen instincts. Next round: a food-truck menu.' });
    } },
    { title: 'Food-truck menu challenge', offer: 'Design a three-item food-truck menu and price it to make a profit.', run: async (G, A, who) => {
      const dish = await UI.sheet('Your signature dish', (close) => h('div', { class: 'opts' }, [['🌮 Veggie tacos', 'tacos'], ['🍜 Noodle bowls', 'noodles'], ['🥪 Grilled sandwiches', 'sandwich']].map(([l, k]) => h('button', { class: 'opt', onclick: () => close(k) }, l))), { icon: '🚚', noClose: true });
      G.state.flags.signatureDish = dish;
      const pts = await G.cookRound(['fin.margins#0', 'math.ratio#1', 'sci.nutrition#0'], who);
      await G.judges(pts, who, dish);
      await G.advFinishEpisode('culinary', A, who, { reward: 40 + pts * 10, msg: 'That menu could sell. One more: the Grand Cook-off.' });
    } },
    { title: 'The Grand Cook-off', offer: 'The Grand Cook-off! Three courses, tough judges, a trophy.', repeat: 'Cook again', run: async (G, A, who) => {
      const pts = await G.cookRound(['recipe', 'sci.heat#0', 'math.ratio#0', 'orders'], who);
      await G.judges(pts, who, 'grand');
      if (pts >= 4) G.achieve('cookchamp');
      G.earn(30 + pts * 15, 'Cook-off prize');
      if (A.stage < 3) await G.advFinishEpisode('culinary', A, who, {});
    } },
  ],
  // ============================================================== 6. MEDICAL MISSIONS
  medical: [
    { title: 'Organize the supply room', offer: 'Our supply room is a mess. Can you sort it so nurses find things fast?', run: async (G, A, who) => {
      await act(G, { type: 'sort', skill: 'sci.body', q: 'Put each supply on the right shelf.', bins: ['Wound care', 'Checkups', 'Cleaning'], items: [['Bandages', 'Wound care'], ['Thermometer', 'Checkups'], ['Gauze pads', 'Wound care'], ['Blood pressure cuff', 'Checkups'], ['Hand sanitizer', 'Cleaning'], ['Disinfectant wipes', 'Cleaning']], why: 'Grouping supplies by job means nurses grab the right thing quickly when it matters.' }, 'medical', 'Supply room', '🧰');
      await act(G, 'sci.body#0', 'medical', 'Body basics', '🫀');
      await G.advFinishEpisode('medical', A, who, { reward: 30, msg: 'Thank you! Everything has a place now.' });
    } },
    { title: 'Help at the check-in desk', offer: 'Patients are arriving. Read their forms carefully and help them check in.', run: async (G, A, who) => {
      await act(G, 'allergy', 'medical', 'Check-in', '📋'); await act(G, 'meds', 'medical', 'Medicine times', '⏰'); await act(G, 'curs.documents#0', 'medical', 'A handwritten note', '📝');
      await G.advFinishEpisode('medical', A, who, { reward: 35, msg: 'Careful reading keeps patients safe. Nice work.' });
    } },
    { title: 'The sniffles puzzle', offer: 'Three patients, three different problems. Help me figure out who needs what. (Real diagnosis needs real training. This is a puzzle!)', repeat: 'Help again', run: async (G, A, who) => {
      await act(G, 'sci.health#0', 'medical', 'Patient 1', '🌡️'); await act(G, 'vitals', 'medical', 'Patient 2', '📈'); await act(G, 'nextQ', 'medical', 'Patient 3', '💬');
      G.earn(25, 'Clinic volunteer thanks'); if (A.stage < 3) await G.advFinishEpisode('medical', A, who, { msg: 'You listened, checked the facts and asked good questions. That’s what care is.' });
    } },
  ],
  // ============================================================== 7. ROBOT BUILDERS
  robots: [
    { title: 'Build your first robot', offer: 'Choose a frame, wheels or legs, a tool and a battery. Then we test it.', run: async (G, A, who) => { await G.robotBuilder(who); await G.robotChallenge(0, who); await G.advFinishEpisode('robots', A, who, { reward: 40, msg: 'Your robot did that because YOU programmed it. Ready for rubble?' }); } },
    { title: 'Rubble run', offer: 'This course has rubble. Will your parts handle it?', run: async (G, A, who) => { if (await UI.say(who, 'Change your robot first?', ['Open the workbench', 'Use my robot']) === 0) await G.robotBuilder(who); await G.robotChallenge(1, who); await G.advFinishEpisode('robots', A, who, { reward: 50, msg: 'One more: the Stairway. Think about which robots can climb.' }); } },
    { title: 'The Stairway challenge', offer: 'The goal is across a staircase. Engineer your way there.', repeat: 'Pick a challenge', run: async (G, A, who) => {
      let lv = 2; if (A.stage >= 3) lv = await UI.say(who, 'Which course?', ROBOT_LEVELS.map((l) => l.name));
      if (await UI.say(who, 'Change your robot first?', ['Open the workbench', 'Use my robot']) === 0) await G.robotBuilder(who);
      const ok = await G.robotChallenge(lv, who); if (ok && A.stage < 3) await G.advFinishEpisode('robots', A, who, { reward: 60, msg: 'You’re thinking like an engineer: define, build, test, improve.' });
    } },
  ],
  // ============================================================== 8. CONSTRUCTION
  construction: [
    { title: 'Build a park bench', offer: 'Brighter Park needs a new bench. Plan it, measure it, and we’ll build it.', run: async (G, A, who) => G.buildProject('bench', A, who) },
    { title: 'Build a playground', offer: 'Next project: a small playground. Bigger plan, bigger budget.', run: async (G, A, who) => G.buildProject('playground', A, who) },
    { title: 'Build a garden shed', offer: 'The community garden needs a shed that can stand up to wind.', repeat: 'Help on a site', run: async (G, A, who) => { if (A.stage >= 3) { await act(G, 'math.geometry#0', 'construction', 'Site work', '📐'); await act(G, 'sci.forces#0', 'construction', 'Site work', '🏗️'); G.earn(30, 'Site work'); return; } return G.buildProject('shed', A, who); } },
  ],
  // ============================================================== 9. INVENTOR
  inventor: [
    { title: 'Invent a self-watering planter', offer: 'The community garden plants keep drying out. Let’s invent a fix.', run: async (G, A, who) => G.invent('planter', A, who) },
    { title: 'Invent a path night-light', offer: 'The park path is dark at night. Invent a light that turns on by itself?', run: async (G, A, who) => G.invent('light', A, who) },
    { title: 'Invent a bike-lock alarm', offer: 'Bikes keep getting stolen at the bus stop. Invent an alarm?', repeat: 'Invent something new', run: async (G, A, who) => G.invent(A.stage >= 3 ? pick(['planter', 'light', 'alarm']) : 'alarm', A, who) },
  ],
  // ============================================================== 10. BUILD YOUR BUSINESS
  business: [
    { title: 'Upgrade your business', offer: 'Every great business improves. Want to upgrade yours?', run: async (G, A, who) => {
      if (!G.state.biz) { await UI.say(who, 'First you need a business. Write a plan in your phone’s Business app, then register at the Small Business Center next door.'); A.runs--; return; }
      await G.bizUpgrade(who);
      await G.advFinishEpisode('business', A, who, { msg: 'Upgrades cost money now and earn it back later, if customers value them. Keep an eye on your numbers.' });
    } },
    { title: 'Win the Best Business award', offer: 'The judges look at reputation, profit margin and how you treat people.', repeat: 'Compete again', run: async (G, A, who) => {
      if (!G.state.biz) { await UI.say(who, 'You’ll need a business first!'); return; }
      const b = G.state.biz, B = BUSINESSES[b.type];
      await act(G, 'fin.margins#0', 'business', 'The judges ask', '📊'); await act(G, 'think.ethics#1', 'business', 'The judges ask', '⚖️'); await act(G, 'think.strategy#0', 'business', 'The judges ask', '♟️');
      const margin = (b.price - B.unit) / b.price, score = b.rep * 0.5 + margin * 5 + (b.staff.length ? 1 : 0) + (b.upgrades || []).length * 0.5;
      const place = score > 7 ? 1 : score > 5 ? 2 : 3;
      await UI.say(who, `${['🥇 Best Business in the city!', '🥈 Runner-up!', '🥉 Honorable mention!'][place - 1]} Reputation ${b.rep.toFixed(1)}/10, margin ${Math.round(margin * 100)}%.`);
      if (place === 1) { G.achieve('bestbiz'); b.rep = Math.min(10, b.rep + 1); }
      if (A.stage < 2) await G.advFinishEpisode('business', A, who, {});
    } },
  ],
};

// ------------------------------------------------------------------------------------------------ mission steps (in-world)
Object.assign(MISSION_STEPS, {
  kitten: async (G) => {
    const who = 'Captain Rhodes · Firefighter', A = G.state.adv.rescue;
    await UI.say(who, 'There she is, way up there. Before we climb, safety check.');
    await act(G, 'ladder', 'rescue', 'Set up the ladder', '🪜');
    await act(G, { type: 'order', skill: 'sci.safety', q: 'Put the rescue steps in order.', items: ['Check the ground is flat and firm', 'Set the ladder and have someone hold it', 'Climb slowly, three points of contact', 'Talk softly and lift the kitten gently', 'Climb down and hand her to her owner'], why: 'Safe ground and a held ladder first, careful climbing, calm handling, and back down.' }, 'rescue', 'Rescue', '🐱');
    await UI.say('Mrs. Alvarez', 'Whiskers! Thank you, thank you!');
    await G.advFinishEpisode('rescue', A, who, { reward: 40, msg: 'Textbook rescue. Want to help with safety checks next?' });
  },
  alarm: async (G) => {
    const who = 'Captain Rhodes · Firefighter', A = G.state.adv.rescue;
    await act(G, 'sci.safety#1', 'rescue', 'Spot the hazards', '🔥');
    await act(G, 'sci.circuits#0', 'rescue', 'How the alarm works', '🔔');
    await act(G, { type: 'choice', skill: 'sci.safety', q: 'An alarm chirps every minute. What does that usually mean?', a: 'The battery is low and should be replaced', o: ['The battery is low and should be replaced', 'There is a fire right now', 'It is broken forever'], why: 'A short chirp is the low-battery warning. Replace the battery so it can warn you when it really matters.' }, 'rescue', 'The chirp', '🔋');
    await G.advFinishEpisode('rescue', A, who, { reward: 40, msg: 'Every alarm is working. You may have just saved someone’s life.' });
  },
  hiker: async (G) => {
    const who = 'Captain Rhodes · Firefighter', A = G.state.adv.rescue;
    await UI.say('Hiker', 'Over here! I twisted my ankle and my phone died. I’m so thirsty.');
    await act(G, 'sci.health#0', 'rescue', 'First things first', '💧');
    await act(G, { type: 'choice', skill: 'sci.safety', q: 'The hiker can’t walk on the ankle. What’s safest?', a: 'Keep them still and call the rescue team with your location', o: ['Keep them still and call the rescue team with your location', 'Make them walk back fast', 'Leave them and go home'], why: 'Moving an injured person can make it worse. Stay with them and call trained help, giving clear directions.' }, 'rescue', 'Getting help', '📞');
    await act(G, 'address', 'rescue', 'Give directions', '🪧');
    await G.advFinishEpisode('rescue', A, who, { reward: 60, msg: 'Found, safe and on the way to the clinic. That’s what rescue is: calm, careful, kind.' });
  },
  clue1: async (G) => {
    await UI.caption(['A bus schedule is taped to the shelter.', 'Someone wrote on it: “Dee — 8:10 bus. Pass in pocket?”'], 2200);
    await act(G, 'sci.observe#0', 'mystery', 'Clue: the bus stop', '🔍');
    G.state.case.found.push('The 8:10 bus note');
    G.setMission({ adv: 'mystery', step: 'clue2', loc: 'district', x: 33, y: -34.4, label: 'Examine the park bench', text: 'Clue 2 of 3: check the benches in Brighter Park' });
  },
  clue2: async (G) => {
    await UI.caption(['Under the bench: a coffee cup from Daily Grind.', 'The lid says “Dee” and the receipt shows 8:02 AM.'], 2200);
    await act(G, 'read.inference#0', 'mystery', 'Clue: the bench', '🔍');
    G.state.case.found.push('Dee’s coffee cup at 8:02');
    G.setMission({ adv: 'mystery', step: 'clue3', loc: 'district', x: -32, y: 6, label: 'Ask at Daily Grind', text: 'Clue 3 of 3: ask at Daily Grind' });
  },
  clue3: async (G) => {
    await UI.say('Barista · Daily Grind', 'Dee sat on the park bench before her bus. She was juggling her coffee and her bag.');
    G.state.case.found.push('Dee sat on the bench with full hands');
    const who = 'Detective Ivy · Detective', A = G.state.adv.mystery;
    await act(G, { type: 'choice', skill: 'think.evidence', q: 'Clues: a note about the 8:10 bus, Dee’s 8:02 coffee cup under the park bench, and Dee juggling her bag. What most likely happened?', a: 'The pass slipped out of her pocket at the bench', o: ['The pass slipped out of her pocket at the bench', 'Jax stole it', 'The bus driver kept it', 'It was never lost'], why: 'Every clue points to the bench at about 8:05, with full hands. No clue points to anyone taking it. Good detectives follow evidence, not suspicion.' }, 'mystery', 'Solve the case', '🧠');
    await UI.caption(['You check the grass behind the bench…', 'There it is: Dee’s bus pass!'], 2000);
    G.befriend('Dee', 1);
    await G.advFinishEpisode('mystery', A, who, { reward: 40, msg: 'Case closed, and no one was blamed without evidence. That’s real detective work.' });
  },
  light1: async (G) => {
    await UI.caption(['Tiny footprints and a dropped battery near the bench.', 'A note: “Club meeting, 9 PM, bring flashlights.”'], 2200);
    await act(G, 'sci.observe#0', 'mystery', 'Clue: the benches', '🔍');
    G.setMission({ adv: 'mystery', step: 'light2', loc: 'district', x: 38, y: -46, label: 'Check the jogging path', text: 'Clue 2 of 2: check the jogging path' });
  },
  light2: async (G) => {
    await UI.caption(['A sign on the path: “Brighter Park Stargazing Club — Tuesdays, 9 PM.”'], 2000);
    const who = 'Detective Ivy · Detective', A = G.state.adv.mystery;
    await act(G, { type: 'choice', skill: 'read.inference', q: 'Flashlights, a 9 PM club note, and a stargazing sign. What are the night lights?', a: 'The Stargazing Club meeting in the park', o: ['The Stargazing Club meeting in the park', 'Aliens', 'Burglars', 'A fire'], why: 'All three clues fit together: a club that meets at 9 PM with flashlights. The simplest answer that fits every clue wins.' }, 'mystery', 'Solve the case', '🧠');
    await G.advFinishEpisode('mystery', A, who, { reward: 40, msg: 'Mystery solved, and nothing scary after all. Want a quick case any time? Just ask.' });
  },
});

// ------------------------------------------------------------------------------------------------ helpers used by episodes
export function installAdventureHelpers(Game) {
  const P = Game.prototype;
  P.petForRace = function () { const s = this.state; return s.pet ? { ...s.pet, color: this.hooks.PET_TYPES[s.pet.type].color } : { type: 'puppy', name: 'Pepper', color: 0x3a2a1a, training: 3, bond: 4 }; };
  /** care multiplier from fed / rested / bond / training: kindness and care make pets perform better */
  P.petCare01 = function () {
    const s = this.state, p = s.pet; if (!p) return 1.0;
    const fed = p.fed === s.day ? 1 : 0.85, rested = (p.lastRace || 0) < s.day ? 1 : 0.88, bond = 0.9 + (p.bond || 0) * 0.02;
    p.lastRace = s.day; return fed * rested * bond;
  };
  P.petDebrief = async function (res, who) {
    const s = this.state, p = s.pet, notes = [];
    if (p && p.fed !== s.day) notes.push(`${p.name} hadn’t eaten today. Fed pets have more energy.`);
    if (res.misses > res.hits) notes.push('Tap the cue as your pet reaches each obstacle. Clear, kind signals help them.');
    if (p && (p.training || 0) < 3) notes.push('A few training sessions will make a big difference.');
    if (!notes.length) notes.push('Happy, healthy and well trained. That’s how champions are made.');
    this.edu.record('sci.animals', !(p && p.fed !== s.day), { ctx: 'petrace' });
    await UI.say(who, notes.join(' '));
  };
  /** positive-reinforcement training: reward the right behavior the moment it happens */
  P.trainPet = function (pet) {
    const tricks = [['Sit', '🐕‍🦺 sits'], ['Down', '🐕 lies down'], ['Shake', '🐾 offers a paw'], ['Spin', '🌀 spins'], ['Jump', '⤴️ jumps']];
    return UI.sheet(`Training ${pet.name}`, (close) => {
      let i = 0, score = 0, timer = null, doing = false;
      const face = h('div', { class: 'trainface' }, '🐶'), lead = h('p', { class: 'lead' }), btn = h('button', { class: 'primary' }, '🦴 Treat & praise!'), log = h('p', { class: 'tip' });
      const next = () => {
        if (i >= 5) { clearTimeout(timer); close(score); return; }
        const [cmd, does] = tricks[i]; doing = false; face.textContent = '🐶'; lead.textContent = `Say “${cmd}!” and wait. Reward the moment ${pet.name} does it.`;
        timer = setTimeout(() => { doing = true; face.textContent = does; timer = setTimeout(() => { if (doing) { doing = false; log.textContent = 'Missed the moment. That’s okay, try the next one.'; i++; next(); } }, 2200); }, 900 + Math.random() * 1600);
      };
      btn.onclick = () => { if (doing) { doing = false; score++; clearTimeout(timer); log.textContent = `Perfect timing! ${pet.name} wags happily.`; i++; setTimeout(next, 700); } else { log.textContent = 'Wait for the behavior first, then reward. Rewarding too early is confusing.'; } };
      next();
      return h('div', { class: 'act center' }, face, lead, btn, log, h('p', { class: 'tip' }, 'Reward the good things your pet does. Never yell or punish.'));
    }, { icon: '🐾', noClose: true });
  };
  P.cookRound = async function (ids, who) {
    let pts = 0;
    for (const id of ids) { const r = await act(this, id, 'cookoff', 'Cook-off', '👩‍🍳'); if (r && r.ok) pts++; }
    const plate = await UI.sheet('Plating', (close) => h('div', { class: 'opts' }, [['Neat and colorful, with a garnish', 2], ['Piled on quickly', 0], ['Simple and tidy', 1]].map(([l, v]) => h('button', { class: 'opt', onclick: () => close(v) }, l))), { icon: '🍽️', noClose: true });
    return pts + (plate >= 1 ? 1 : 0);
  };
  P.judges = async function (pts, who, dish) {
    const stars = Math.max(1, Math.min(5, pts + 1));
    await UI.say('The judges', `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} ${stars >= 4 ? 'Delicious and perfectly cooked!' : stars >= 3 ? 'Tasty! A little more care with the recipe next time.' : 'A brave effort. Measure carefully and watch the heat.'}`);
  };
  P.robotBuilder = function (who) {
    const s = this.state; s.builds = s.builds || {}; const b = { ...(s.builds.robot || { frame: 'light', move: 'wheels', arm: 'gripper', battery: 'small', color: 0x2a9fd6 }) };
    const owned = s.ownedBotParts = s.ownedBotParts || ['light', 'wheels', 'gripper', 'small'];
    return UI.sheet('Robot workbench', (close, body) => {
      const render = () => {
        const extra = Object.keys(ROBOT_PARTS).reduce((a, k) => a + (owned.includes(b[k]) ? 0 : ROBOT_PARTS[k].find((p) => p.id === b[k]).cost), 0);
        body.replaceChildren(h('div', { class: 'act' }, h('p', { class: 'lead' }, `Parts credit from the Robo Lab: $200 · New parts: ${money(extra)}`),
          ...Object.entries({ frame: 'Frame', move: 'Movement', arm: 'Tool', battery: 'Battery' }).map(([k, n]) => h('div', {}, h('div', { class: 'tier-h' }, n), h('div', { class: 'partrow' }, ROBOT_PARTS[k].map((p) => h('button', { class: 'part' + (b[k] === p.id ? ' sel' : ''), onclick: () => { b[k] = p.id; render(); } }, h('b', {}, p.name), h('small', {}, owned.includes(p.id) ? 'Owned' : money(p.cost)), h('small', {}, p.note)))))),
          h('div', { class: 'swatches' }, COLORS.map((c) => h('button', { class: 'swatch' + (b.color === c ? ' sel' : ''), style: { background: '#' + c.toString(16).padStart(6, '0') }, onclick: () => { b.color = c; render(); } }))),
          h('button', { class: 'primary', disabled: extra > 200, onclick: () => close(b) }, extra > 200 ? 'Over the $200 credit' : 'Save robot')));
      };
      render(); return h('div');
    }, { icon: '🤖', cls: 'wide' }).then((r) => { if (r) { for (const k of Object.keys(ROBOT_PARTS)) if (!owned.includes(r[k])) owned.push(r[k]); s.builds.robot = r; this.save(); } return r; });
  };
  /** program the robot with commands, then watch it run in the 3D arena */
  P.robotChallenge = async function (lv, who) {
    const s = this.state, L = ROBOT_LEVELS[lv];
    await UI.say(who, `${L.name}: ${L.story} Your robot starts facing up (north).`);
    for (let attempt = 0; attempt < 6; attempt++) {
      const prog = await UI.sheet(`Program: ${L.name}`, (close, body) => {
        const p = [];
        const grid = h('div', { class: 'robogrid' }, ...L.grid.map((row) => h('div', { class: 'rrow' }, ...[...row].map((c) => h('span', { class: 'rc t' + ({ '.': 'f', r: 'r', s: 's', '#': 'w', O: 'o', G: 'g', S: 'st', '^': 'p' })[c] }, ({ O: '📦', G: '🏁', S: '🤖', s: '▤', r: '⁂', '#': '' })[c] || '')))));
        const list = h('div', { class: 'prog' });
        const show = () => list.replaceChildren(...(p.length ? p.map((c, i) => h('span', { class: 'cmd' }, `${i + 1}. ${({ F: '⬆️ Forward', L: '↩️ Turn left', R: '↪️ Turn right', P: '✋ Pick up', D: '📥 Drop' })[c]}`)) : [h('small', {}, 'Tap commands to build a program.')]));
        show();
        return h('div', { class: 'act' }, grid, h('p', { class: 'tip' }, '⁂ rubble · ▤ stairs · dark = wall. Pick up the object and drop it on 🏁.'),
          h('div', { class: 'cmds' }, ['F', 'L', 'R', 'P', 'D'].map((c) => h('button', { class: 'opt', onclick: () => { if (p.length < 20) p.push(c); show(); } }, ({ F: '⬆️ Forward', L: '↩️ Left', R: '↪️ Right', P: '✋ Pick up', D: '📥 Drop' })[c]))),
          list, h('div', { class: 'row' }, h('button', { class: 'ghost sm', onclick: () => { p.pop(); show(); } }, 'Undo'), h('button', { class: 'ghost sm', onclick: () => { p.length = 0; show(); } }, 'Clear'), h('button', { class: 'primary sm', onclick: () => p.length && close([...p]) }, '▶ Run')));
      }, { icon: '🤖', noClose: true, cls: 'wide' });
      const res = await this.hooks.robotRun(lv, s.builds.robot, prog);
      this.edu.record('think.problem', res.ok, { ctx: 'robots' }); this.edu.discover('sci.design');
      if (res.ok) {
        const bonus = res.steps <= res.par ? 'Efficient program, too!' : `It works! The lab record is ${res.par} commands. Can you beat it?`;
        await UI.say(who, `Success! ${bonus} Energy left: ${res.energyLeft}.`); this.achieve('robot'); return true;
      }
      const why = { wall: 'It drove into a wall. Check your turns.', stairs: 'Wheels and tracks can’t climb stairs. Legs can.', battery: 'The battery ran out. A bigger battery or a lighter frame would help, or a shorter path.', tipped: 'A light frame tipped on the ramp. A heavier frame or tracks are steadier.', arm: `Wrong tool for this object. Try the ${{ box: 'gripper', ball: 'scoop', metal: 'magnet' }[L.obj]}.`, notdropped: 'It was still holding the object. Add a Drop command at the goal.', notgoal: 'The object didn’t end on the goal. Trace the path square by square.' }[res.reason];
      const c = await UI.say(who, `Not yet: ${why} Engineers learn from every test.`, ['Change the program', 'Change the robot', 'Try later']);
      if (c === 1) await this.robotBuilder(who); if (c === 2) return false;
    }
    return false;
  };
  const PROJECTS = {
    bench: { name: 'park bench', budget: 200, steps: ['sci.materials#0', 'math.measure#0', 'math.geometry#1'], reward: 50 },
    playground: { name: 'playground', budget: 800, steps: ['math.geometry#0', 'sci.safety#1', 'fin.planning#0'], reward: 80 },
    shed: { name: 'garden shed', budget: 600, steps: ['sci.forces#0', 'math.geometry2#1', 'sci.machines#0'], reward: 90 },
  };
  P.buildProject = async function (key, A, who) {
    const Pj = PROJECTS[key];
    await UI.say(who, `The ${Pj.name} has a ${money(Pj.budget)} budget from the city. Plan, measure, build.`);
    for (const st of Pj.steps) await act(this, st, 'construction', `Build: ${Pj.name}`, '🏗️');
    this.state.built = this.state.built || []; if (!this.state.built.includes(key)) this.state.built.push(key);
    this.hooks.refreshWorld && this.hooks.refreshWorld();
    await this.advFinishEpisode('construction', A, who, { reward: Pj.reward, msg: `It’s built! Go see your ${Pj.name} in Brighter Park. People will use it every day.` });
  };
  const INVENTIONS = {
    planter: { name: 'self-watering planter', need: 'Plants dry out', parts: { sensor: [['Soil moisture sensor', 1], ['Motion sensor', 0], ['Light sensor', 0]], power: [['Small solar panel', 1], ['Car battery', 0], ['No power', 0]], action: [['Tiny water pump', 1], ['Loud buzzer', 0], ['Fan', 0]] }, why: ['A moisture sensor detects dry soil', 'solar power keeps it running outside', 'and a pump moves the water'] },
    light: { name: 'path night-light', need: 'The path is dark', parts: { sensor: [['Light sensor', 1], ['Soil moisture sensor', 0], ['Thermometer', 0]], power: [['Small solar panel', 1], ['No power', 0], ['Hand crank', 0]], action: [['LED light', 1], ['Water pump', 0], ['Speaker', 0]] }, why: ['A light sensor notices darkness', 'solar charges it during the day', 'and an LED lights the path'] },
    alarm: { name: 'bike-lock alarm', need: 'Bikes get stolen', parts: { sensor: [['Motion sensor', 1], ['Light sensor', 0], ['Soil moisture sensor', 0]], power: [['Coin battery', 1], ['Car battery', 0], ['No power', 0]], action: [['Loud buzzer', 1], ['LED light', 0], ['Fan', 0]] }, why: ['A motion sensor feels the bike move', 'a tiny battery keeps it light', 'and a buzzer scares thieves off'] },
  };
  P.invent = async function (key, A, who) {
    const I = INVENTIONS[key];
    await UI.say(who, `The need: ${I.need}. Every invention has a sensor (notice), power (energy) and an action (do something). Pick parts, then test.`);
    await act(this, 'sci.design#0', 'inventor', 'The design cycle', '🔁');
    for (let tries = 0; tries < 4; tries++) {
      const chosen = {};
      for (const [slot, opts] of Object.entries(I.parts)) chosen[slot] = await UI.sheet(`Choose: ${slot}`, (close) => h('div', { class: 'opts' }, opts.map(([n, ok]) => h('button', { class: 'opt', onclick: () => close([n, ok]) }, n))), { icon: '💡', noClose: true });
      const fails = Object.entries(chosen).filter(([, v]) => !v[1]);
      this.edu.record('sci.design', !fails.length, { ctx: 'inventor' });
      if (!fails.length) { this.state.inventions = (this.state.inventions || []).concat(I.name); this.achieve('inventor'); await this.advFinishEpisode('inventor', A, who, { reward: 60, msg: `Test passed! ${I.why.join(', ')}. You invented a ${I.name}!` }); return; }
      await UI.say(who, `Test result: it didn’t work. The ${fails.map(([slot, v]) => `${slot} (“${v[0]}”)`).join(' and ')} didn’t fit the job. Change one thing at a time and test again!`);
    }
  };
  P.bizUpgrade = async function (who) {
    const s = this.state, b = s.biz; b.upgrades = b.upgrades || [];
    const ups = [['☕ Better equipment ($400): +quality, +reputation', 'equip', 400], ['🪑 Cozy seats inside ($300): customers stay longer and come back', 'interior', 300], ['📋 Bigger menu ($250): more customers', 'menu', 250], ['📍 Move to a busier location ($600 deposit)', 'location', 600]].filter(([, k]) => !b.upgrades.includes(k));
    if (!ups.length) { await UI.say(who, 'You’ve upgraded everything! Now it’s about running it well.'); return; }
    const c = await UI.sheet('Upgrade', (close) => h('div', { class: 'act' }, h('p', { class: 'lead' }, `Balance ${money(s.money)}. Each upgrade should pay for itself. Will it?`), h('div', { class: 'opts' }, ups.map(([l, k, cost]) => h('button', { class: 'opt', disabled: s.money < cost, onclick: () => close([k, cost]) }, l)))), { icon: '🏪' });
    if (!c) return;
    await act(this, { type: 'number', skill: 'fin.business', q: `The upgrade costs ${money(c[1])} and should earn about $25 more profit per day. How many days to pay it back?`, a: Math.ceil(c[1] / 25), why: `${c[1]} ÷ 25 = ${c[1] / 25}${c[1] % 25 ? `, so about ${Math.ceil(c[1] / 25)} days` : ' days'}. After that, it’s extra profit.` }, 'business', 'Pay-back time', '🧮');
    this.spend(c[1], `${b.name}: ${c[0]} upgrade`); b.upgrades.push(c[0]); b.rep = Math.min(10, b.rep + 0.8);
    if (c[0] === 'location') b.store = true;
  };
}
