// Full-story playtest: plays Day 1 through the real UI (application, shift, paycheck, Jax, groceries, home, bills, sleep).
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist'), OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(b); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let step = 0;

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...devices['iPhone 13 landscape'] });
  const p = await ctx.newPage();
  const errors = [];
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  const shot = async (n) => { step++; await p.screenshot({ path: path.join(OUT, `story_${String(step).padStart(2, '0')}_${n}.png`), timeout: 120000 }); console.log('✓', n); };
  const ev = (f, a) => p.evaluate(f, a);
  const interact = async (key, where) => { await ev(([k, w]) => window.REAL.teleport(k, w), [key, where || 'district']); await sleep(700); await p.click('#btn-interact', { timeout: 8000 }); await sleep(500); };
  const nextDialog = async (choice) => { for (let i = 0; i < 8; i++) { if (await p.isHidden('#dialog')) return; const c = await p.$$('#dialog .d-choice'); if (c.length) { await c[choice ?? 0].click(); } else { await p.click('#dialog .d-text'); await p.click('#dialog .d-next'); } await sleep(400); } };

  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden' });
  await p.fill('#cr-name', 'Nova'); await p.click('#cr-go');
  await sleep(1500); await ev(() => window.REAL.skip());
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 60000 }); await sleep(1500);

  // 1) Career Center application
  await interact('Door_CareerCenter');
  await shot('job_board');
  await p.click('.card.job:has-text("Office")'); await sleep(300); await shot('job_wrong_feedback');
  await p.click('.card.job:has-text("Cashier")'); await sleep(400);
  await p.click('.opt:has-text("I am a hard worker")'); await sleep(400);
  await shot('signature_blank');
  const box = await p.$eval('canvas.sig', (c) => { const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  // trace along the guide letters: sample guide pixels from a hidden canvas replica and drag through them
  const pts = await p.evaluate(({ name }) => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 220; const g = c.getContext('2d');
    const fit = Math.min(110, 560 / Math.max(3, name.length * 0.55));
    g.font = `${fit}px "Dancing Script", "Segoe Script", cursive`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, 320, 115);
    const d = g.getImageData(0, 0, 640, 220).data, out = [];
    for (let x = 0; x < 640; x += 6) { const col = []; for (let y = 0; y < 220; y += 4) if (d[(y * 640 + x) * 4 + 3] > 100) col.push(y); if (col.length) out.push([x, col[0], col[col.length - 1]]); }
    return out;
  }, { name: 'Nova' });
  for (const [x, y0, y1] of pts) {
    await p.mouse.move(box.x + x / 640 * box.w, box.y + y0 / 220 * box.h); await p.mouse.down();
    await p.mouse.move(box.x + x / 640 * box.w, box.y + y1 / 220 * box.h, { steps: 3 }); await p.mouse.up();
  }
  console.log('traced cols', pts.length); const t1 = Date.now(); console.log('alive', await ev(() => 1), Date.now() - t1, 'ms');
  await shot('signature_traced');
  await p.click('button.primary:has-text("Sign")'); await sleep(500);
  await shot('hired');
  await p.click('button.primary:has-text("go")'); await sleep(500);

  // 2) Manager + clock in
  await ev(() => { const s = window.REAL.game().state; return s.quest; }).then((q) => console.log('quest', q));
  await ev(() => window.REAL.teleport('NPC_Manager_Idle')); await ev(() => { window.REAL.game().state.pos = null; });
  await sleep(300); await ev(() => { const st = window.REAL; });
  await p.evaluate(() => { const P = window.REAL; });
  await p.click('#btn-interact'); await sleep(600); await shot('manager_dialog'); await nextDialog(0);
  await interact('Interact_TimeClock');
  await shot('time_clock');
  const early = await p.$eval('.clockface', (e) => 60 - parseInt(e.firstChild.textContent.split(':')[1], 10));
  await p.click(`.opt:has-text("${early} minutes")`); await sleep(500);

  // 3) Register (make change)
  for (let i = 0; i < 2; i++) {
    await interact('Interact_Register_01');
    if (i === 0) await shot('register_scan');
    for (const it of await p.$$('.item')) { await it.click(); await sleep(120); }
    await sleep(700);
    if (i === 0) await shot('register_change');
    const txt = await p.$eval('.math-card p', (e) => e.textContent);
    const [total, paid] = [...txt.matchAll(/\$([\d.]+)/g)].map((m) => parseFloat(m[1]));
    let need = Math.round((paid - total) * 100);
    for (const [v, lab] of [[2000, '$20'], [1000, '$10'], [500, '$5'], [100, '$1'], [25, '25¢'], [10, '10¢'], [5, '5¢'], [1, '1¢']]) {
      while (need >= v) { await p.click(`.cash:text-is("${lab}")`); need -= v; }
    }
    await p.click('button.primary:has-text("Give change")'); await sleep(600);
  }
  await shot('after_register');
  // 4) Stock shelves (find the right aisle)
  for (let i = 0; i < 2; i++) {
    const aisle = await ev(() => window.REAL.game().state.shift.product[1]);
    const wrong = aisle === 1 ? 2 : 1;
    if (i === 0) { await ev((a) => window.REAL.teleport(`Interact_StockShelf_A${a}`), wrong); await sleep(600); await p.click('#btn-interact'); await sleep(500); await shot('stock_wrong_aisle'); }
    await ev((a) => window.REAL.teleport(`Interact_StockShelf_A${a}`), aisle); await sleep(600); await p.click('#btn-interact'); await sleep(900);
  }
  await shot('aisles');
  // 5) Inventory
  await interact('Interact_InventoryCount');
  await shot('inventory');
  const lead = await p.$eval('.sheet .lead', (e) => e.textContent);
  const [cases, per, loose] = lead.match(/\d+/g).map(Number);
  for (const d of String(cases * per + loose)) await p.click(`.key:text-is("${d}")`);
  await p.click('.key.ok'); await sleep(600);
  // 6) Payday
  await ev(() => window.REAL.teleport('NPC_Manager_Idle')); await sleep(500);
  await p.click('#btn-interact'); await sleep(600); await nextDialog(0); await sleep(400);
  await shot('paystub');
  await p.click('button.primary:has-text("Deposit")'); await sleep(5000);
  // 7) Jax
  await ev(() => { const j = window.REAL.npcPos('Jax'); window.REAL.teleportXY(j.x, j.y + 2.0); }); await sleep(2000);
  await shot('jax');
  await nextDialog(2); await sleep(500);
  await shot('think_it_through');
  await p.click('.opt:has-text("Skip it")'); await sleep(500); await nextDialog(0);
  // 8) Groceries
  await interact('Interact_BasketPickup');
  await p.click('.food:has-text("Rice & beans") .stepper button:last-child'); await p.click('.food:has-text("Pasta") .stepper button:last-child');
  await shot('groceries');
  await p.click('.checkout button.primary'); await sleep(500);
  // 9) Home
  await interact('Door_ApartmentLobby'); await sleep(2500);
  await shot('apartment');
  await interact('Interact_Fridge', 'apartment'); await shot('kitchen'); await p.click('.food.btn >> nth=0'); await sleep(500);
  if (await p.isVisible('.sheet .opt')) { const o = await p.$$('.sheet .opt'); for (const x of o) { if (await p.isHidden('#modal')) break; await x.click(); await sleep(300); } }
  await interact('Interact_Bills', 'apartment'); await shot('bills'); await p.click('.bill button.primary >> nth=0'); await sleep(400); await shot('bills_paid'); await p.click('.sh-x');
  await ev(() => window.REAL.setTime(21.5)); await sleep(400);
  await interact('Interact_Sleep', 'apartment'); await sleep(1500);
  await shot('day_summary');
  await p.click('button.primary:has-text("Wake up")'); await sleep(1500);
  // phone
  await p.click('#btn-phone'); await sleep(500); await shot('phone');
  await p.click('.app:has-text("Bank")'); await sleep(300); await shot('phone_bank');
  const st = await ev(() => { const s = window.REAL.state; return { day: s.day, money: s.money, quest: s.quest, xp: s.xp, shifts: s.stats.shifts, rentPaid: s.bills[0].paid }; });
  console.log('STATE', JSON.stringify(st));
  console.log('errors', errors.length, errors.slice(0, 10));
  await b.close(); srv.close();
})().catch(async (e) => { console.error('FAILED at step', step, e.message.split('\n')[0]); srv.close(); process.exit(1); });
