// Full-story playtest (iPhone 13 portrait): Prologue → Nowhere → Community Center → Fresh Mart (application, interview,
// shift, paycheck) → Jax → home → sleep → phone → Invitation → ending → epilogue. Drives the real UI.
const traceSteps = require('./trace.cjs');
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = process.env.DIST || path.join(__dirname, '..', 'dist-hosted'), OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') && !b.slice(0, 200).toString().includes('<!doctype') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let step = 0, p;

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices[process.env.DEVICE || 'iPhone 13'] });
  p = await ctx.newPage();
  const _click = p.click.bind(p); p.click = async (sel, o) => { console.log('  click', sel); return _click(sel, { timeout: 60000, ...(o || {}) }); };
  const errors = [];
  p.on('pageerror', (e) => errors.push('[pageerror] ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async (n) => { step++; await p.screenshot({ path: path.join(OUT, `saga_${String(step).padStart(2, '0')}_${n}.png`), timeout: 150000 }); console.log('✓', n); };
  const ev = (f, a) => p.evaluate(f, a);
  const vis = (sel) => p.isVisible(sel);
  // close any "New skill" learn cards that pop up (Discover → Understand)
  const settle = async () => { for (let i = 0; i < 6; i++) { if (await vis('.learn-card')) { await p.click('.learn-card button.primary'); await sleep(300); } else break; } };
  const dialog = async (choiceText) => {
    for (let i = 0; i < 14; i++) {
      await sleep(250);
      if (await vis('.learn-card')) { await settle(); continue; }
      if (!(await vis('#dialog'))) return;
      const ch = await p.$$('#dialog .d-choice');
      if (ch.length) {
        let el = ch[0];
        if (choiceText) for (const c of ch) if ((await c.textContent()).includes(choiceText)) el = c;
        await el.click();
      } else { await p.click('#dialog .d-text'); await p.click('#dialog .d-next'); }
    }
  };
  const waitIdle = async (ms = 60000) => { await p.waitForFunction(() => document.querySelector('#caption').hidden && document.querySelector('#dialog').hidden, null, { timeout: ms }); };
  const interact = async (setPos) => { await ev(setPos); await sleep(900); await p.click('#btn-interact', { timeout: 15000 }); await sleep(600); await settle(); };
  const keypadType = async (str) => { for (const d of str) await p.click(`.sheet .key:text-is("${d}")`); await p.click('.sheet .key.ok'); await sleep(500); await settle(); };

  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden' });
  await p.fill('#cr-name', 'Nova'); await p.click('#cr-go');

  if (process.env.START === 'ending') {
    await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 90000 });
    await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  }
  if (process.env.START === 'hired') {
    await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 90000 });
    await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  } else if (process.env.START !== 'ending') {
  // PROLOGUE
  await p.waitForFunction(() => window.REAL.mode === 'play' && window.REAL.state.location === 'club', null, { timeout: 90000 });
  await waitIdle(); await sleep(1500); await shot('prologue_club_hall');
  await ev(() => { const c = window.REAL.club(); window.REAL.teleportXY(c.councilDoor.x, c.councilDoor.y - 1.5); });
  await p.waitForSelector('#dialog:not([hidden])', { timeout: 30000 }); await sleep(600); await shot('council');
  await dialog('What did I do wrong');
  await p.waitForSelector('.clubcard', { timeout: 30000 }).catch(() => {}); await sleep(900); await shot('card_revoked');
  await dialog();
  await p.waitForFunction(() => window.REAL.state.chapter === 'nowhere', null, { timeout: 90000 });
  await waitIdle(); await sleep(1200); await shot('chapter1_nowhere');

  // CHAPTER 1 — signs and the fork
  await interact(() => { const s = window.REAL.wildSign(0); window.REAL.teleportXY(s.x - 1.5, s.y - 1); });
  await shot('read_first_sign');
  await p.click('.sheet .opt:has-text("Straight ahead")'); await sleep(500);
  await interact(() => { const s = window.REAL.wildSign(1); window.REAL.teleportXY(s.x - 1.5, s.y - 1); });
  await p.click('.sheet .opt:has-text("The road has signs")'); await sleep(400);
  await ev(() => window.REAL.teleportXY(-9, -232)); await sleep(800); await shot('the_trail_creek');
  await ev(() => window.REAL.teleportXY(0, -150)); await sleep(800);
  await ev(() => window.REAL.teleportXY(0, -80)); await sleep(1500); await shot('arrival_city');
  await waitIdle();

  // CHAPTER 2 — Community Center
  await interact(() => { const n = window.REAL.npcPos('Counselor'); window.REAL.teleportXY(n.x - 1.4, n.y - 0.6); });
  await dialog('Nowhere');
  await p.waitForSelector('.sortrow', { timeout: 30000 }); await settle(); await shot('needs_vs_wants');
  const needs = ['Groceries', 'Rent', 'Work shoes', 'Phone bill'];
  for (const row of await p.$$('.sortrow')) { const t = await row.textContent(); await (await row.$(needs.some((n) => t.includes(n)) ? 'button:text-is("Need")' : 'button:text-is("Want")')).click(); await sleep(200); }
  await sleep(500); await settle();
  await p.waitForSelector('.sheet .key', { timeout: 20000 }); await shot('first_budget'); await keypadType('50');
  await dialog();
  console.log('after housing:', JSON.stringify(await ev(() => ({ q: window.REAL.state.quest, m: window.REAL.state.money, phone: window.REAL.state.flags.phone }))));

  // CHAPTER 3 — Fresh Mart application + interview
  await interact(() => { const n = window.REAL.npcPos('Rosa'); window.REAL.teleportXY(n.x + 1.2, n.y - 0.8); });
  await dialog();
  await p.waitForSelector('.posting', { timeout: 20000 }); await settle(); await shot('application_posting');
  await p.click('.sheet .opt:has-text("hiring a cashier")'); await sleep(400); await settle();
  for (const t of ['Nova', 'Mornings and weekends', 'I am reliable']) { await p.click(`.sheet .opt:has-text("${t}")`); await sleep(350); await settle(); }
  console.log('signature traced:', (await traceSteps(p, '.sheet')).join(' → ')); await sleep(800);
  await shot('interview'); await dialog('Listen, check'); await dialog('Message the manager'); await dialog('To earn my own money'); await dialog();
  console.log('hired:', await ev(() => window.REAL.state.flags.hired));

  }
  if (process.env.START !== 'ending') {
  // first shift
  await interact(() => window.REAL.teleport('Interact_TimeClock'));
  console.log('sheets at clock:', JSON.stringify(await ev(() => window.REAL.sheets())));
  const early = await p.$eval('.clockface', (e) => 60 - parseInt(e.firstChild.textContent.split(':')[1], 10));
  await p.click(`.sheet .opt:text-is("${early} minutes")`); await sleep(700);
  console.log('sheets after clock:', JSON.stringify(await ev(() => window.REAL.sheets())), await ev(() => window.REAL.state.quest));
  await interact(() => window.REAL.teleport('Interact_Register_01'));
  for (const it of await p.$$('.item')) { await it.click(); await sleep(120); }
  await sleep(800); await settle();
  await shot('register_total');
  const prices = await p.$$eval('.sheet .receipt .rline span:last-child', (els) => els.map((e) => parseFloat(e.textContent.replace('$', ''))));
  const total = Math.round(prices.reduce((a, v) => a + v, 0) * 100) / 100;
  const whole = Number.isInteger(total);
  await keypadType(whole ? String(total) : String(Math.round(total * 100)));
  await p.waitForSelector('.math-card', { timeout: 20000 }); await settle(); await shot('register_change');
  const txt = await p.$eval('.math-card p', (e) => e.textContent);
  const [tt, paid] = [...txt.matchAll(/\$([\d.]+)/g)].map((m) => parseFloat(m[1]));
  let need = Math.round((paid - tt) * 100);
  for (const [v, lab] of [[2000, '$20'], [1000, '$10'], [500, '$5'], [100, '$1'], [25, '25¢'], [10, '10¢'], [5, '5¢'], [1, '1¢']]) while (need >= v && await p.$(`.cash:text-is("${lab}")`)) { await p.click(`.cash:text-is("${lab}")`); need -= v; }
  await p.click('button.primary:has-text("Give change")'); await sleep(900);
  console.log('sheets after register:', JSON.stringify(await ev(() => window.REAL.sheets())), 'quest', await ev(() => window.REAL.state.quest), JSON.stringify(await ev(() => window.REAL.state.shift)));
  for (let i = 0; i < 2; i++) {
    const aisle = await ev(() => window.REAL.state.shift.product[1]);
    await ev((a) => window.REAL.teleport(`Interact_StockShelf_A${a}`), aisle); await sleep(800); await p.click('#btn-interact'); await sleep(700); await settle();
    if (await ev(() => window.REAL.state.shift.stock) === i) { await p.click('#btn-interact').catch(() => {}); await sleep(700); }
  }
  await interact(() => window.REAL.teleport('Interact_InventoryCount'));
  await shot('inventory');
  const lead = await p.$eval('.sheet .lead', (e) => e.textContent);
  let ans;
  if (/Count the cans on the shelf/.test(lead)) ans = (await p.$$('.cangrid span')).length;
  else if (/dented/.test(lead)) { const [tot, , den] = lead.match(/\d+/g).map(Number); ans = tot - tot / den; }
  else { const [c, per, loose] = lead.match(/\d+/g).map(Number); ans = c * per + loose; }
  await keypadType(String(ans));
  await interact(() => { const n = window.REAL.npcPos('Rosa'); window.REAL.teleportXY(n.x + 1.2, n.y - 0.8); });
  await dialog(); await settle();
  for (let i = 0; i < 60 && !(await p.$('.sheet .key')); i++) { await sleep(500); await settle(); }   // speaking practice runs first
  await p.waitForSelector('.sheet .key', { timeout: 20000 }); await shot('earnings_question'); await keypadType('60');
  await p.waitForSelector('.stub', { timeout: 20000 }); await shot('paystub');
  await p.click('button.primary:has-text("Deposit")'); await sleep(1000);
  await waitIdle(); console.log('after pay:', JSON.stringify(await ev(() => ({ q: window.REAL.state.quest, m: window.REAL.state.money, ll: window.REAL.life().level }))));

  // CHAPTER 4 — Jax at Thread & Co
  await p.waitForFunction(() => !!window.REAL.npcPos('Jax'), null, { timeout: 20000 });
  await ev(() => { const j = window.REAL.npcPos('Jax'); window.REAL.teleportXY(j.x + 1.5, j.y + 1.5); });
  await p.waitForSelector('#dialog:not([hidden])', { timeout: 30000 }); await sleep(800); await shot('jax_hoodie');
  await dialog('Why do you think');
  await p.waitForSelector('.sheet .opt', { timeout: 20000 }); await shot('think_it_through'); await p.click('.sheet .opt:has-text("Skip it")'); await sleep(500); await dialog();

  // home: bills, sleep
  await interact(() => window.REAL.teleport('Door_ApartmentLobby')); await sleep(2500);
  await shot('apartment');
  await interact(() => window.REAL.teleport('Interact_Bills', 'apartment')); await shot('bills');
  await p.click('.bill button.primary >> nth=0'); await sleep(400); await p.click('.sh-x');
  await ev(() => window.REAL.setTime(21.5)); await sleep(500);
  await interact(() => window.REAL.teleport('Interact_Sleep', 'apartment')); await sleep(2500);
  await shot('day_summary'); await p.click('button.primary:has-text("Wake up")'); await sleep(1200);

  // phone apps
  await p.click('#btn-phone'); await sleep(500); await shot('phone');
  await p.click('.app:has-text("Stats")'); await sleep(400); await shot('life_level');
  await p.click('button.ghost:has-text("Home")'); await p.click('.app:has-text("Jobs")'); await sleep(400); await shot('career_tiers');
  await p.click('button.ghost:has-text("Home")'); await p.click('.app:has-text("Learn")'); await sleep(500); await shot('learn_mastery');
  await p.click('.card:has-text("Math")'); await sleep(400); await shot('learn_math_skills'); await p.click('.sh-x'); await sleep(300);

  }
  // CHAPTERS 11–12 — the invitation, the decision, the epilogue (invitation forced: reaching Life Level 6 takes several in-game days)
  await ev(() => { const g = window.REAL.game(); g.state.flags.invited = g.state.day; g.state.quest = 'invite'; });
  await ev(() => { window.REAL.game().hooks.goToClub(); });
  await p.waitForSelector('#dialog:not([hidden])', { timeout: 90000 }); await sleep(600); await shot('invitation');
  await dialog(); await p.waitForSelector('#dialog .d-choice', { timeout: 90000 }); await shot('real_decision');
  await dialog('Rebuild'); await dialog();
  await p.waitForFunction(() => window.REAL.state.ending && document.querySelector('#caption').hidden === false, null, { timeout: 90000 });
  await p.waitForFunction(() => /never nothing|Look at what/.test(document.querySelector('#caption').textContent), null, { timeout: 90000 }); await shot('epilogue');
  await waitIdle(90000);
  const st = await ev(() => { const s = window.REAL.state; return { chapter: s.chapter, ending: s.ending, day: s.day, money: s.money, ll: window.REAL.life().level, ach: Object.keys(s.achievements), skills: Object.fromEntries(Object.entries(s.edu.skills).map(([k, v]) => [k, v.st])) }; });
  console.log('STATE', JSON.stringify(st));
  console.log('errors', errors.length, errors.slice(0, 8));
  await b.close(); srv.close(); process.exit(errors.length ? 1 : 0);
})().catch(async (e) => { console.error('FAILED at step', step, e.message.split('\n')[0]); try { await p.screenshot({ path: path.join(OUT, 'saga_FAIL.png'), timeout: 240000 }); } catch (x) { console.error('no fail shot', x.message.split('\n')[0]); } srv.close(); process.exit(1); });
