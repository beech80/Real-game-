// Afternoon events: after work, small things happen around the Starting District (a street fair, a lost
// visitor, a park class...). Each one is a mini-goal on the goal bar with an arrow, a short scene, two quick
// lessons at the player's own level, and a small reward. At most three a day, one at a time.
import { UI } from './ui.js';
import { runActivity } from './learnkit.js';
import { GEN } from './curriculum.js';
import { SKILLS } from './edu.js';

export const EVENTS = {
  fair: { title: 'Street fair in Brighter Park', at: 'Interact_ParkBench_01', who: 'Vendor Lou · Street fair', icon: '🎪',
    intro: 'Guess-the-price game! Get them right and the prize is yours.', skills: ['fin.prices', 'math.rounding', 'fin.budget', 'math.finmath'],
    reward: (G) => { G.earn(5, 'Street fair prize'); return '+$5 prize'; } },
  tourist: { title: 'A visitor is lost at the bus stop', at: 'Interact_BusStop', who: 'Visitor', icon: '🧭',
    intro: 'Excuse me… I’m trying to find my way around. Can you help me read this map?', skills: ['soc.maps', 'think.directions', 'soc.geography', 'math.coords'],
    reward: (G) => { G.state.stats.wiseChoices = (G.state.stats.wiseChoices || 0) + 1; G.state.mood = Math.min(100, G.state.mood + 8); return 'You helped someone. +Mood'; } },
  fitness: { title: 'Coach Bo’s free fitness class', at: 'Interact_ParkJog', who: 'Coach Bo · Park class', icon: '🏃',
    intro: 'Free class today! Warm up first, and learn why it works.', skills: ['hl.exercise', 'sci.body', 'hl.sleep', 'sci.health'],
    reward: (G) => { const s = G.state; s.stats.workouts = (s.stats.workouts || 0) + 1; s.mood = Math.min(100, s.mood + 10); s.energy = Math.max(0, s.energy - 6); return 'A real workout. +Mood'; } },
  story: { title: 'Story time at the Community Center', at: 'Door_CareerCenter', who: 'Ms. Ada · Story time', icon: '📖',
    intro: 'We read a short story together today. Tell me what you notice.', skills: ['read.story', 'read.main', 'read.inference', 'read.figurative'],
    reward: (G) => { G.state.mood = Math.min(100, G.state.mood + 6); return 'Good reading. +Mood'; } },
  weather: { title: 'Science demo: where does rain come from?', at: 'Interact_ParkBench_02', who: 'Dr. Rae · Science cart', icon: '🌦️',
    intro: 'Watch the steam on this cold glass. That’s the water cycle, right here.', skills: ['sci.weather', 'sci.water', 'sci.matter', 'sci.data'],
    reward: (G) => { G.befriend('Dr. Rae', 0.5); return 'Science! +Friend'; } },
  garden: { title: 'Community garden needs a hand', at: 'Interact_ParkBench_03', who: 'Gardener Mo', icon: '🌱',
    intro: 'Help me plant? I’ll show you what plants need to grow.', skills: ['sci.plants', 'sci.ecosystems', 'math.measure', 'sci.observe'],
    reward: (G) => { const s = G.state; s.pantry = s.pantry || {}; s.pantry.apples = (s.pantry.apples || 0) + 2; return 'Fresh apples for your fridge (+2 meals)'; } },
  coding: { title: 'Kids’ coding club', at: 'Door_CareerCenter', who: 'Pixel · Coding club', icon: '💻',
    intro: 'Robots only do exactly what you tell them. Let’s give good instructions.', skills: ['tech.sequence', 'tech.loops', 'tech.conditionals', 'tech.debug'],
    reward: (G) => { G.state.stats.wiseChoices = (G.state.stats.wiseChoices || 0) + 0.5; return 'Nice code! +Thinking'; } },
  pitch: { title: 'A stranger with a “money deal”', at: 'Interact_ParkBench_04', who: 'Slick Stranger', icon: '🎩',
    intro: 'Give me $20 now and I’ll give you $200 next week. Guaranteed! Think fast…', skills: ['fin.fraud', 'think.persuasion', 'think.evidence', 'think.risk'],
    reward: (G) => { G.state.stats.wiseChoices = (G.state.stats.wiseChoices || 0) + 1.5; return 'You didn’t fall for it. Smart choice!'; } },
  safety: { title: 'Safety day at the bus stop', at: 'Interact_BusStop', who: 'Officer Lin', icon: '🦺',
    intro: 'Quick safety quiz! Everyone who plays gets a sticker.', skills: ['hl.safety', 'sci.safety', 'tech.safety', 'hl.firstaid'],
    reward: (G) => { G.state.mood = Math.min(100, G.state.mood + 5); return 'Safety sticker earned'; } },
  cooking: { title: 'Free cooking demo in the park', at: 'Interact_ParkBench_02', who: 'Chef Tia', icon: '🍳',
    intro: 'Cooking at home saves money. Let’s learn to do it safely. Free samples!', skills: ['hl.foodsafety', 'sci.nutrition', 'sci.heat', 'fin.needs'],
    reward: (G) => { G.feed(20); return 'Free samples. +Food'; } },
};

export function installEvents(Game) {
  const P = Game.prototype; Game.EVENTS = EVENTS;

  /** Called from tick: maybe start an event, and end one that ran out of time. */
  P.eventsTick = function () {
    const s = this.state, ev = s.event;
    if (ev && (ev.day !== s.day || s.time > ev.until)) { s.event = null; UI.toast(`${EVENTS[ev.id] ? EVENTS[ev.id].title : 'The event'} has ended.`, 'info'); }
    if (s.event || this.busy || s.quest !== 'free' || s.location !== 'district' || s.mission) return;
    if (s.time < 13 || s.time > 18.5 || !s.flags[`worked${s.day}`]) return;   // after work, in the afternoon
    const today = s.flags[`events${s.day}`] || 0;
    if (today >= 3 || (s.flags.eventLast && s.time - s.flags.eventLast < 1)) return;
    if (this._evRoll && performance.now() - this._evRoll < 4000) return; this._evRoll = performance.now();
    if (Math.random() > 0.35) return;   // ~ every 10-15 s of free time
    const seen = s.flags.eventsSeen || {};
    const ids = Object.keys(EVENTS).filter((id) => id !== s.flags.eventLastId).sort((a, b) => (seen[a] || 0) - (seen[b] || 0) || Math.random() - 0.5);
    const id = ids[0], E = EVENTS[id];
    s.event = { id, at: E.at, day: s.day, until: Math.min(22, s.time + 3) };
    s.flags[`events${s.day}`] = today + 1; s.flags.eventLast = s.time; s.flags.eventLastId = id;
    UI.toast(`${E.icon} ${E.title}`, 'gold', 4000);
    this.message(E.who.split(' · ')[0], `${E.intro} Come find me soon (follow the goal arrow).`);
  };

  /** Two short lessons at the player's level from the event's topics, then the reward. */
  P.runEvent = async function () {
    const s = this.state, ev = s.event, E = ev && EVENTS[ev.id];
    if (!E) return;
    await UI.say(E.who, E.intro);
    const fit = (k) => Math.abs(k.band - this.edu.band(k.subj));
    const pool = E.skills.map((id) => SKILLS[id]).filter((k) => k && GEN[k.id]).sort((a, b) => fit(a) - fit(b) || this.edu.state(a.id) - this.edu.state(b.id));
    for (const k of pool.slice(0, 2)) {
      await runActivity(this, () => ({ skill: k.id, ...GEN[k.id][Math.floor(Math.random() * GEN[k.id].length)]() }), 'event', E.title, E.icon);
    }
    const got = E.reward(this);
    s.event = null; this.advance(0.5);
    const seen = s.flags.eventsSeen = s.flags.eventsSeen || {}; seen[ev.id] = (seen[ev.id] || 0) + 1;
    s.stats.events = (s.stats.events || 0) + 1;
    UI.toast(`${E.icon} ${got}`, 'good', 3200);
    if (s.stats.events >= 5) this.achieve('regular');
  };
}
