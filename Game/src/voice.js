// REAL — voice. Characters speak their lines (device speech voice). Players can answer out loud (device speech
// recognition), or type / use the keyboard's dictation mic as a fallback. A "brain" understands free answers,
// gives friendly feedback on speaking practice, and lets characters answer questions in character.
// The brain uses Claude through the claude.ai viewer when available (child-safe instructions, no personal data sent),
// and falls back to on-device rules everywhere else.
import { h, UI } from './ui.js';

// ------------------------------------------------------------------------------------------- speaking (TTS)
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
let voices = [];
const loadVoices = () => { try { voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)); } catch (e) {} };
try { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
export const Voice = {
  enabled: () => !window.__voiceOff,
  speak(text, who = '') {
    try {
      if (!('speechSynthesis' in window) || window.__voiceOff || !text || !/[a-z0-9]/i.test(text)) return;
      // characters never talk: the real player speaks their own answers. (Only the opt-in 'Read questions aloud' setting uses speech.)
      if (who !== '__readaloud') return;
      const me = '';
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[★☆♛🎤💡✓○]/g, ''));
      const k = Math.abs(hash(who === '__me' ? me : who.split('·')[0].trim().toLowerCase()));
      if (voices.length) u.voice = voices[k % voices.length];
      u.pitch = /Jax/.test(who) ? 0.9 : 0.85 + (k % 5) * 0.1; u.rate = 0.98 + (k % 3) * 0.04; u.lang = 'en-US';
      speechSynthesis.speak(u);
    } catch (e) {}
  },
  stop() { try { speechSynthesis.cancel(); } catch (e) {} },
  canListen: () => !!(window.SpeechRecognition || window.webkitSpeechRecognition) && !window.__micBroken,
  /** Listen once. Shows words live through onText; resolves with everything heard (string) or null.
   *  Uses interim results because iPhones often never send a "final" result otherwise. */
  listen({ onStatus, onText } = {}) {
    return new Promise((res) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return res(null);
      let done = false, best = '', started = false, quiet = null;
      const fin = () => { if (done) return; done = true; clearTimeout(quiet); clearTimeout(watch); clearTimeout(cap); if (Voice._rec === r) Voice._rec = null; try { r.abort(); } catch (e) {} res(best.trim() || null); };
      let r, watch, cap;
      try {
        this.stop(); if (Voice._rec) try { Voice._rec.abort(); } catch (e) {}
        r = new SR(); Voice._rec = r; r.lang = 'en-US'; r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
        const go = () => { if (!started) { started = true; onStatus && onStatus('audio'); } };
        r.onstart = go; r.onaudiostart = go;
        r.onresult = (e) => {
          go(); let t = '', final = false;
          for (let i = 0; i < e.results.length; i++) { const x = e.results[i]; t += (x[0] && x[0].transcript || '') + ' '; if (x.isFinal) final = true; }
          if (t.trim()) { best = t.replace(/\s+/g, ' '); onText && onText(best.trim()); }
          clearTimeout(quiet); quiet = setTimeout(fin, final ? 500 : 1800);   // stop once they pause
        };
        r.onerror = (e) => { if (/not-allowed|service-not-allowed|audio-capture/.test(e.error)) window.__micBroken = true; onStatus && onStatus(window.__micBroken ? 'denied' : 'error'); fin(); };
        r.onend = fin;
        r.start(); onStatus && onStatus('listening');
        watch = setTimeout(() => { if (!started) { window.__micBroken = true; onStatus && onStatus('denied'); fin(); } }, 3000);   // never opened the mic
        cap = setTimeout(fin, 12000);
      } catch (e) { window.__micBroken = true; onStatus && onStatus('denied'); fin(); }
    });
  },
  cancelListen() { const r = Voice._rec; Voice._rec = null; if (r) try { r.abort(); } catch (e) {} },
  /** Hear the player's answer, whatever the device allows. Opens an answer box straight from the tap:
   *  the game listens and writes the words in live when the browser allows it; the keyboard's own 🎤 dictation
   *  works in the same box everywhere else (the Claude app, blocked mic). Resolves the words (string) or null. */
  ask({ prompt = 'Say your answer' } = {}) { return answerBox(prompt); },
};
const embedded = () => { try { return window.self !== window.top; } catch (e) { return true; } };

function answerBox(prompt) {
  return new Promise((res) => {
    const old = document.querySelector('.dictate'); if (old) old.remove();
    const inp = h('textarea', { class: 'writebox', rows: 3, maxlength: 400, placeholder: 'Your words show up here…', autocomplete: 'off', enterkeyhint: 'done' });
    const status = h('p', { class: 'tip dictate-status' });
    let done = false, edited = false;
    const fin = (v) => { if (done) return; done = true; Voice.cancelListen(); wrap.remove(); res(v && v.trim() ? v.trim() : null); };
    const keyboardHelp = 'Tap the box, then the 🎤 key on your keyboard and talk. Tap Done when your words appear.';
    const listen = () => {
      if (!Voice.canListen()) { status.textContent = keyboardHelp; again.hidden = true; return; }
      wrap.classList.add('hearing'); again.hidden = true; status.textContent = '🎙️ Listening… speak now';
      Voice.listen({
        onText: (t) => { if (!edited) inp.value = t; status.textContent = '🎙️ Hearing you…'; },
        onStatus: (s) => { if (s === 'denied') status.textContent = 'This phone won’t let the game use the mic here. ' + keyboardHelp; },
      }).then((t) => {
        wrap.classList.remove('hearing'); if (done) return;
        if (t && !edited) { inp.value = t; status.textContent = `✓ Heard you! Sending…`; setTimeout(() => { if (!edited) fin(inp.value); }, 900); return; }
        if (!window.__micBroken) { status.textContent = 'I didn’t hear anything. Tap “Listen again” and speak a bit louder — or use your keyboard’s 🎤.'; again.hidden = false; }
        else { status.textContent = 'This phone won’t let the game use the mic here. ' + keyboardHelp; again.hidden = true; }
      });
    };
    const again = h('button', { class: 'ghost sm', hidden: true, onclick: () => listen() }, '🎙️ Listen again');
    const wrap = h('div', { class: 'dictate', role: 'dialog', 'aria-label': 'Say your answer' },
      h('div', { class: 'dictate-card' },
        h('p', { class: 'lead' }, '🎤 ' + prompt), status, inp,
        h('div', { class: 'row' }, again, h('button', { class: 'ghost sm', onclick: () => fin(null) }, 'Cancel'), h('button', { class: 'primary', onclick: () => fin(inp.value) }, 'Done ✓'))));
    // typing or keyboard dictation takes over: free the mic for the keyboard
    inp.addEventListener('focus', () => { if (Voice._rec) { Voice.cancelListen(); wrap.classList.remove('hearing'); status.textContent = keyboardHelp; } });
    // keyboard dictation: words arrive in chunks. When they stop for a moment, send — no need to find the Done button
    let lastLen = 0, spoke = false, autoT = null;
    const autoSend = (ms) => { clearTimeout(autoT); autoT = setTimeout(() => { if (!done && inp.value.trim()) { status.textContent = '✓ Got it! Sending…'; fin(inp.value); } }, ms); };
    inp.addEventListener('input', (e) => {
      edited = true; const n = inp.value.length, jump = n - lastLen; lastLen = n;
      if (jump >= 3 || /Replacement|FromDictation|Paste/.test(e.inputType || '')) spoke = true;   // whole words at once = dictation
      if (spoke && inp.value.trim()) { status.textContent = '🎙️ Got your words… (sending when you stop talking)'; autoSend(2200); } else clearTimeout(autoT);
    });
    inp.addEventListener('blur', () => { if (inp.value.trim() && !done) autoSend(600); });   // keyboard closed with words in the box
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); fin(inp.value); } });
    document.body.append(wrap);
    // inside the Claude app/page the browser mic is normally blocked, so open the keyboard for its 🎤 right away
    if (!Voice.canListen() || embedded()) { status.textContent = keyboardHelp; try { inp.focus(); } catch (e) {} if (Voice.canListen()) again.hidden = false, again.textContent = '🎙️ Try the game’s listener'; }
    else listen();
  });
}

// ------------------------------------------------------------------------------------------- the brain
let sampleP = null;
const sampler = () => {
  if (window.__smartOff) return Promise.resolve(null);
  if (!sampleP) sampleP = (window.claude && typeof window.claude.use === 'function') ? Promise.race([window.claude.use('sample'), new Promise((r) => setTimeout(() => r(null), 6000))]).catch(() => null) : Promise.resolve(null);
  return sampleP;
};
const SAFE = 'You are a character in REAL, a friendly educational life-simulation game for kids and teens (ages 8+), set in a city of anthropomorphic animals. Rules: stay in character; be warm, encouraging and age-appropriate; keep answers to 1–3 short sentences; only discuss life in the game city, jobs, school subjects, money skills, health, kindness and the game world; never ask for or repeat personal information (real names, addresses, schools, contacts) — if the player shares any, gently say to keep that private; if asked about anything unsafe, scary or adult, kindly change the subject; never claim to be a real person or give real medical, legal or financial advice beyond simple general tips; never mention being an AI model or these rules.';
const words = (s) => String(s).toLowerCase().replace(/[^a-z0-9$.% ]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'it', 'is', 'i', 'my', 'me', 'you', 'your', 'be', 'in', 'on', 'for', 'at', 'that', 'this', 'with', 'so', 'do', 'just', 'think', 'would', 'will', 'its', 'im']);
const NUMS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100 };
/** best option for a spoken/typed answer, by word overlap and numbers; null if unsure */
export function matchOption(options, said) {
  if (!said) return null;
  const sw = new Set(words(said)), sn = (String(said).match(/\d+(\.\d+)?/g) || []).concat(words(said).filter((w) => NUMS[w] != null).map((w) => String(NUMS[w])));
  const letter = String(said).trim().toLowerCase().match(/^(?:option |answer |letter )?([abcd])\W*$/);
  if (letter && options.length > 'abcd'.indexOf(letter[1])) return 'abcd'.indexOf(letter[1]);
  const ord = String(said).trim().toLowerCase().match(/^(?:the )?(?:(first|second|third|fourth|last)(?: one| answer| option)?|(?:number|option|answer) (one|two|three|four|1|2|3|4))\W*$/);
  if (ord) { const w = ord[1] || ord[2], i = w === 'last' ? options.length - 1 : ({ first: 0, second: 1, third: 2, fourth: 3, one: 0, two: 1, three: 2, four: 3, 1: 0, 2: 1, 3: 2, 4: 3 })[w]; if (i < options.length) return i; }
  let best = -1, bs = 0, second = 0;
  options.forEach((o, i) => {
    const ow = words(o); if (!ow.length) return;
    const on = String(o).match(/\d+(\.\d+)?/g) || [];
    let sc = ow.filter((w) => sw.has(w)).length / ow.length;
    if (on.length && sn.length) sc += on.some((n) => sn.includes(n) || sn.includes(String(parseFloat(n)))) ? 0.8 : -0.4;
    if (sc > bs) { second = bs; bs = sc; best = i; } else if (sc > second) second = sc;
  });
  return bs >= 0.34 && bs - second >= 0.12 ? best : null;
}
export const Brain = {
  available: async () => !!(await sampler()),
  /** Map a free answer to one of the options. Local match first, Claude if unsure. */
  async pick(question, options, said) {
    const local = matchOption(options, said); if (local != null) return local;
    const S = await sampler(); if (!S) return null;
    try {
      const r = await Promise.race([new Promise((r) => setTimeout(() => r(null), 7000)), S.json(`${SAFE}\nA player was asked: "${question}". Options: ${options.map((o, i) => `${i}: ${o}`).join(' | ')}. The player said: "${said}". Which option index best matches what they meant? Reply JSON {"index": number or null}. Use null if it matches none.`, { modelTier: 'quick' })]);
      return Number.isInteger(r && r.index) && r.index >= 0 && r.index < options.length ? r.index : null;
    } catch (e) { return null; }
  },
  /** Friendly feedback on a spoken/typed answer. task: {prompt, goals:[...], keywords:[[label, regex]]} → {stars 1..4, feedback, tip} */
  async grade(task, said, who) {
    const S = await sampler();
    if (S) {
      try {
        const r = await Promise.race([new Promise((r) => setTimeout(() => r(null), 9000)), S.json(`${SAFE}\nYou are ${who}, coaching a player's speaking practice at work.\nSituation: ${task.prompt}\nA strong answer would: ${task.goals.join('; ')}.\nThe player said: "${said}"\nGive encouraging feedback. Reply JSON {"stars": 1-4 (4 = covers every goal clearly and politely), "feedback": one short sentence in character praising something specific, "tip": one short concrete suggestion (or "" if perfect)}.`, { modelTier: 'quick' })]);
        if (r && r.stars) return { stars: Math.max(1, Math.min(4, Math.round(r.stars))), feedback: String(r.feedback || '').slice(0, 220), tip: String(r.tip || '').slice(0, 200), smart: true };
      } catch (e) {}
    }
    // on-device rubric
    const hits = task.keywords.filter(([, re]) => re.test(said)), n = words(said).length;
    const stars = Math.max(1, Math.min(4, hits.length + (n >= 6 ? 1 : 0) - (n < 3 ? 1 : 0)));
    const miss = task.keywords.filter(([, re]) => !re.test(said)).map(([l]) => l);
    return { stars, feedback: stars >= 3 ? 'That sounded clear and friendly.' : 'Good start. You’re getting there.', tip: miss.length ? `Try to also ${miss[0].toLowerCase()}.` : '', smart: false };
  },
  /** A character answers a free question in character, using what they know. */
  async answer(npc, question, history = []) {
    const kb = KNOW[npc.name] || KNOW._default;
    const S = await sampler();
    if (S) {
      try {
        const msgs = [...history.slice(-6), { role: 'user', content: question }];
        msgs[0] = { role: msgs[0].role, content: `${SAFE}\nYou are ${npc.name}, ${kb.role}. What you know well: ${kb.facts.join(' ')} City facts: ${CITY.join(' ')}\n\nPlayer: ${msgs[0].content}` };
        if (msgs[0].role !== 'user') msgs.shift();
        const r = await Promise.race([new Promise((r) => setTimeout(() => r(null), 12000)), S(msgs, { modelTier: 'quick' })]);
        if (r && r.text) return { text: r.text.trim().slice(0, 400), smart: true };
      } catch (e) {}
    }
    // on-device: best matching fact
    // match by meaning, not exact words: "work", "hired" and "apply" all count as being about jobs
    const SYN = { job: /^(jobs?|work(ing|s)?|careers?|hir(e|ed|ing)|apply(ing)?|applications?|employ(er|ment)?|shifts?|interviews?)$/, money: /^(money|dollars?|cash|pay(check)?s?|earn(ing|s)?|sav(e|ing|ings)|budget(s|ing)?)$/,
      home: /^(home|rent|apartments?|house|lofts?|lease)$/, food: /^(food|eat(ing)?|hungry|groceries|meals?|cook(ing)?)$/, learn: /^(learn(ing)?|school|courses?|classes|skills?|study(ing)?|practi[sc]e)$/ };
    const concepts = (t) => new Set(words(t).map((w) => { for (const [k, re] of Object.entries(SYN)) if (re.test(w)) return '#' + k; return w.replace(/(ing|ed|s)$/, ''); }));
    const q = concepts(question);
    const qw = words(question), bigrams = qw.slice(1).map((w, i) => `${qw[i]} ${w}`);
    const all = [...kb.facts.map((f) => [f, 0.5]), ...CITY.map((f) => [f, 0])];   // a character's own facts win ties
    let best = null, bs = 0;
    for (const [f, bonus] of all) { const c = concepts(f); let sc = 0; for (const w of q) if (c.has(w)) sc += w[0] === '#' ? 2 : 1; const low = f.toLowerCase(); for (const bg of bigrams) if (low.includes(bg)) sc += 2;   // the question's words together as a phrase ("first job")
      const tot = sc && sc + bonus - c.size * 0.02; if (sc && tot > bs) { bs = tot; best = f; } }   // ties: the shorter, more focused answer
    return { text: best && bs > 0 ? best : pickOne(kb.unsure || ['Good question! I’m not sure. Mr. Okafor at the Community Center knows a lot about the city.']), smart: false };
  },
};
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

// ------------------------------------------------------------------------------------------- what characters know
const CITY = [
  'The Starting District has Fresh Mart, the Starter Apartments, Daily Grind coffee, Main St Diner, Thread & Co, Grow Gym, Brighter Park and the Community Center.',
  'The bus costs $2 and connects the Starting District, Midtown, the Opportunity District and The Heights.',
  'Midtown opens at Life Level 3, the Opportunity District at Life Level 5, and The Heights at Life Level 8.',
  'Rent at the Starter Apartments is $300 a week, and Fresh Start pays half for the first four weeks.',
  'Fresh Mart pays $15 an hour for a four-hour shift.',
  'Pay bills before they are due to avoid late fees; the Bills app shows what is due.',
  'Cooking at home costs much less than eating out.',
  'The Learn app on your phone lets you practise any skill privately with free hints.',
  'The Community Center helps with housing, résumés, budgets, and has a food bank in hard weeks.',
];
export const KNOW = {
  _default: { role: 'a friendly resident of the city', facts: ['People here help each other. Ask around and you will find work, friends and adventures.'] },
  Rosa: { role: 'the manager of Fresh Mart (a cow)', facts: ['At the register, scan every item, read the total, then count change back starting from the total.', 'Stock each product in the aisle that matches the sign above it.', 'Inventory means counting what is on the shelves; rows times columns is faster than counting one by one.', 'Show up on time, greet every customer, and ask when you are unsure.', 'After four shifts and solid register skills you can become a Shift Lead for $17 an hour.', 'Fresh Mart shifts start at 9 in the morning. Clock in a few minutes early at the time clock in the back room.'] },
  Dee: { role: 'the barista at Daily Grind (a dog)', facts: ['A latte is espresso plus steamed milk; a cappuccino has more foam.', 'Weekend barista shifts pay $15 an hour plus tips.', 'Measuring carefully makes every cup taste the same.'] },
  'Mr. Okafor': { role: 'the counselor at the Community Center (an elephant)', facts: ['Every career is open to everyone; skills and Life Level unlock them, never wealth.', 'A résumé lists what you did with action words and numbers.', 'A budget gives every dollar a job: needs first, then savings, then wants.', 'If a week goes badly, the Community Center offers a food bank and rent payment plans.', 'Your first job: Fresh Mart is hiring. Talk to Rosa, the manager, fill out the application honestly and sign it.', 'To get hired, read the job posting, answer the interview questions honestly and always show up on time.', 'Better jobs open up as you learn: practise skills, take courses and build your Life Level.'] },
  Jax: { role: 'a confident cat with a red cap who used to be in The Club', facts: ['Looking good matters, but so does paying rent.', 'The Club only cares about what you build yourself.'] },
  Rita: { role: 'a mechanic who races cars (a horse)', facts: ['Tires grip the road with friction; more grip lets you corner faster without sliding.', 'A bigger engine adds speed on straights but can make you slide in corners without good tires.', 'Rally suspension keeps the car steady on dirt and grass.', 'When testing parts, change one thing at a time so you know what made the difference.', 'A car that clicks but will not start with dim lights usually has a weak battery.'] },
  Penny: { role: 'a pet trainer at Brighter Park (a dog)', facts: ['Reward the exact moment your pet does the right thing; that is positive reinforcement.', 'Never yell at or punish a pet; kindness teaches faster.', 'Pets need food, fresh water, rest, play and a safe home every day.', 'A pet that ate and rested well runs faster in competitions.'] },
  'Captain Rhodes': { role: 'a firefighter at Station 7 (an elephant)', facts: ['If there is smoke, stay low, get out, and call for help.', 'A smoke alarm that chirps needs a new battery.', 'A ladder needs flat, firm ground and someone holding it.', 'Do not move an injured person; keep them calm and call trained help with clear directions.'] },
  'Detective Ivy': { role: 'a detective (a cat)', facts: ['Observe first, decide later: write down what you see before guessing who did it.', 'Good detectives follow evidence, not suspicion.', 'The simplest explanation that fits every clue is usually right.'] },
  'Chef Lou': { role: 'a chef at Corner Kitchen in Midtown (a cow)', facts: ['To double a recipe, double every ingredient.', 'Chicken is safe to eat at 165°F; use a thermometer.', 'Use one cutting board for raw meat and another for vegetables.', 'Start the food that takes longest first so everything is ready together.'] },
  'Nurse Kim': { role: 'a nurse at the City Clinic in Midtown (a bird)', facts: ['The heart pumps blood, the lungs bring in air, bones support the body and muscles move it.', 'Rest, water, and balanced meals help the body heal.', 'Always read a patient’s chart for allergies before giving anything.', 'For real health problems, always talk to a trusted adult or a doctor.'] },
  'Dr. Bolt': { role: 'a robotics engineer at the Opportunity Robo Lab (a lion)', facts: ['Robots follow instructions in exact order; one wrong turn changes everything.', 'Wheels are fast on flat floors, tracks handle rubble, legs can climb stairs.', 'Heavier robots use more battery power.', 'Engineers define the problem, build, test, then improve.'] },
  Jo: { role: 'a construction foreman at Build Right Co (a horse)', facts: ['Measure twice, cut once.', 'Area is length times width; perimeter is the distance around.', 'A wide base and low weight make structures stable.', 'Wear a hard hat and keep ladders on firm ground.'] },
  'Professor Volt': { role: 'an inventor at Volt Works (a fox)', facts: ['Most inventions have a sensor to notice, power to run, and an action to do something.', 'Solar panels charge in daylight; batteries store energy for later.', 'If a test fails, change one part at a time and test again.'] },
  'Advisor Kemi': { role: 'a business coach at the Small Business Center (a dolphin)', facts: ['Profit equals revenue minus costs.', 'Profit margin is profit divided by price.', 'Raising prices earns more per sale but can mean fewer customers.', 'Honest marketing builds trust; fake reviews destroy it.'] },
  Marcus: { role: 'a delivery courier in Midtown (a horse)', facts: ['Read the address twice before you knock.', 'Distance divided by speed tells you how long a trip will take.'] },
  'Ms. Lindqvist': { role: 'the Midtown librarian (a bird)', facts: ['The library is free, and books are picked for your reading level.', 'The Learning Lab upstairs has challenge zones with free hints and no timers.'] },
  Priya: { role: 'a developer at Brightline Tech (a cat)', facts: ['Bugs are puzzles: find exactly where the code does something different from what you meant.', 'The City Tech Institute teaches programming at night.'] },
  'Coach Bo': { role: 'the challenge coach at The Think Tank (a lion)', facts: ['Hints are not cheating; professionals use them every day.', 'Speed is never the point. Understanding is.'] },
  'Dr. Amara': { role: 'a doctor at Heights Medical (an elephant)', facts: ['Medicine takes years of study, and Heights College offers financial aid.', 'Sleep and good food are part of health.'] },
  Theo: { role: 'an architect at Form Studio (a dolphin)', facts: ['A scale drawing shrinks real sizes by the same amount, like 1 cm for every 2 m.', 'Good buildings start with a sketch and a question about who will use them.'] },
};

// ------------------------------------------------------------------------------------------- speaking practice at work
export const SPEAK_TASKS = {
  cashier: [{ prompt: 'A customer walks up to your register. Greet them and offer help.', goals: ['greet the customer politely', 'offer to help'], keywords: [['Greet them', /\b(hi|hello|good (morning|afternoon|evening)|welcome|hey)\b/i], ['Offer help', /\b(help|find|need|ready|ring|check)\b/i], ['Be polite', /\b(please|thank|thanks|welcome|today)\b/i]] },
    { prompt: 'A customer asks where the rice is. It is in aisle 3, on the left. Tell them.', goals: ['say aisle 3', 'say it is on the left', 'be friendly'], keywords: [['Say “aisle 3”', /\b(aisle|isle) ?(3|three)\b/i], ['Say “on the left”', /\bleft\b/i], ['Be friendly', /\b(sure|happy|of course|no problem|follow|show|right this way)\b/i]] }],
  barista: [{ prompt: 'A customer orders a latte. Repeat the order back and tell them the price is $4.25.', goals: ['repeat the order', 'say the price $4.25', 'thank them'], keywords: [['Repeat “latte”', /\blatte\b/i], ['Say the price', /4\.25|four (dollars )?(and )?twenty[- ]five/i], ['Thank them', /\bthank/i]] }],
  courier: [{ prompt: 'You deliver a package but the owner isn’t home. Their neighbor in 2B answers. Explain politely.', goals: ['introduce yourself as the courier', 'ask them to hold the package', 'thank them'], keywords: [['Say you are the courier', /\b(deliver|courier|package|express)\b/i], ['Ask them to hold it', /\b(hold|keep|give|leave)\b/i], ['Thank them', /\bthank/i]] }],
  sales: [{ prompt: 'A customer can’t choose between two jackets. Help them decide.', goals: ['ask what they need it for', 'compare the two', 'be helpful without pressure'], keywords: [['Ask a question', /\?|\b(what|where|when|how)\b/i], ['Compare them', /\b(warmer|cheaper|lighter|better|both|either|this one|that one)\b/i], ['No pressure', /\b(take your time|up to you|whatever you|no rush|happy to)\b/i]] }],
  office: [{ prompt: 'Answer the office phone and take a message for Mr. Haddad.', goals: ['greet with the company name', 'say Mr. Haddad is away', 'offer to take a message'], keywords: [['Greet with the company', /\b(opportunity|tower|office|good (morning|afternoon)|hello)\b/i], ['Say he’s away', /\b(not (in|available|here)|away|out|in a meeting)\b/i], ['Offer a message', /\bmessage\b/i]] }],
  health: [{ prompt: 'A nervous patient arrives at the clinic. Welcome them and explain they’ll be seen soon.', goals: ['welcome them kindly', 'reassure them', 'explain the wait'], keywords: [['Welcome them', /\b(hi|hello|welcome)\b/i], ['Reassure them', /\b(okay|ok|safe|don.?t worry|good hands|take care|here to help)\b/i], ['Explain the wait', /\b(soon|minute|shortly|next|wait)\b/i]] }],
  cook: [{ prompt: 'Tell the server that table 4’s pasta needs five more minutes.', goals: ['say table 4', 'say pasta', 'say five more minutes'], keywords: [['Say “table 4”', /\btable (4|four)\b/i], ['Say “pasta”', /\bpasta\b/i], ['Say “five minutes”', /\b(5|five) (more )?minutes?\b/i]] }],
  _any: [{ prompt: 'Your boss asks how your shift went. Give a short, professional update.', goals: ['say what you finished', 'mention anything that needs attention', 'stay positive'], keywords: [['Say what you did', /\b(finished|done|helped|served|stocked|counted|completed|fixed|built)\b/i], ['Mention what needs attention', /\b(need|low|tomorrow|next|still|problem|issue)\b/i], ['Stay positive', /\b(good|great|well|thanks|happy)\b/i]] }],
};

/** Speaking-practice sheet: listen (or type), get friendly stars + feedback spoken by the coach. */
export function speakTask(G, task, who, skill = 'write.professional') {
  G.edu.discover(skill);
  return UI.sheet('Speaking practice', (close) => {
    const status = h('p', { class: 'tip' }, 'Tap 🎤 and say your answer out loud. (You can type instead.)');
    const said = h('textarea', { class: 'writebox', rows: 3, placeholder: 'Your answer…', maxlength: 400 });
    const out = h('div', { class: 'whybox', hidden: true });
    const done = h('button', { class: 'primary', hidden: true, onclick: () => close(true) }, 'Continue');
    const check = async () => {
      const t = said.value.trim(); if (!t) { UI.toast('Say or type an answer first.', 'info'); return; }
      status.textContent = 'Thinking…';
      const g = await Brain.grade(task, t, who);
      G.edu.record(skill, g.stars >= 3, { ctx: 'speaking' });
      G.state.stats.speaking = (G.state.stats.speaking || 0) + 1;
      out.hidden = false; out.replaceChildren(...[h('div', { class: 'stars' }, '★'.repeat(g.stars) + '☆'.repeat(4 - g.stars)), h('p', {}, h('b', {}, `${who.split('·')[0].trim()}: `), g.feedback), g.tip ? h('p', { class: 'tip' }, 'Tip: ' + g.tip) : null].filter(Boolean));
      Voice.speak(`${g.feedback} ${g.tip || ''}`, who); status.textContent = g.smart ? '' : '';
      G.sfx(g.stars >= 3 ? 'good' : 'click'); done.hidden = false;
    };
    const mic = h('button', { class: 'mic', 'aria-label': 'Say your answer', onclick: async () => {
      mic.classList.add('on'); const t = await Voice.ask({ prompt: task.prompt });
      mic.classList.remove('on'); if (t) { said.value = t; status.textContent = `Heard: “${t}”`; check(); }
    } }, '🎤');
    setTimeout(() => Voice.speak(task.prompt, who), 200);
    if (navigator.webdriver && !window.__manualSpeak) setTimeout(async () => { said.value = 'Hello and welcome! Sure, I can help with that. It is in aisle 3 on the left, table 4 pasta needs five more minutes, a latte is $4.25, I can take a message, thank you!'; await check(); setTimeout(() => close(true), 300); }, 400);   // automated tests only
    return h('div', { class: 'act speakact' }, h('p', { class: 'lead' }, task.prompt), h('div', { class: 'microw' }, mic, said), status, h('button', { class: 'ghost sm', onclick: check }, 'Check my answer'), out, done);
  }, { icon: '🗣️', noClose: true });
}

/** Ask a character anything (typed); they answer in character, as text. */
export function askNPC(G, npc) {
  const history = [];
  return UI.sheet(`Talk with ${npc.name}`, (close) => {
    const log = h('div', { class: 'chatlog' }, h('div', { class: 'bubble npc' }, `${npc.name}: Ask me anything about ${KNOW[npc.name] ? 'my work, the city or what you’re learning' : 'the city'}.`));
    const inp = h('input', { class: 'writebox', placeholder: 'Ask a question…', maxlength: 200 });
    const send = async (q) => {
      q = (q || inp.value).trim(); if (!q) return; inp.value = '';
      log.append(h('div', { class: 'bubble me' }, q)); const wait = h('div', { class: 'bubble npc' }, '…'); log.append(wait); log.scrollTop = 1e6;
      const a = await Brain.answer(npc, q, history);
      history.push({ role: 'user', content: q }, { role: 'assistant', content: a.text });
      wait.textContent = `${npc.name}: ${a.text}`; log.scrollTop = 1e6; Voice.speak(a.text, npc.name);
      G.befriend(npc.name, 0.1); G.state.stats.questionsAsked = (G.state.stats.questionsAsked || 0) + 1;
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    return h('div', { class: 'act' }, log, h('div', { class: 'microw' }, inp, h('button', { class: 'primary sm', onclick: () => send() }, 'Ask')),
      h('p', { class: 'tip' }, 'Characters only talk about the game world. Never share personal information.'), h('button', { class: 'ghost', onclick: () => { Voice.stop(); close(); } }, 'Thanks, bye!'));
  }, { icon: '💬' });
}
