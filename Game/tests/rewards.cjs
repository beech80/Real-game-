// Rewards: the Trophies app shows today's goals, streak calendar, stickers, jackets, badges and trophies; finishing
// the daily goals celebrates, pays $25, gives a sticker and a streak day; a 3-day streak unlocks the Sunrise jacket.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} window.__voiceOff = true; });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 240000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Lee'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1000);
  for (let i = 0; i < 25 && await p.isVisible('#dialog'); i++) { await ev(() => { const c = document.querySelector('#dialog .d-choice, #dialog .d-next'); if (c) c.click(); }); await sleep(300); }
  await ev(() => { window.REAL.state.quest = 'free'; });
  // open Trophies
  await ev(() => document.getElementById('btn-phone').click()); await sleep(1200);
  await p.$$eval('#modal .app', (els) => { const x = els.find((e) => /Trophies/.test(e.textContent)); if (x) x.click(); }); await sleep(1200);
  const tr = await ev(() => { const m = document.querySelector('#modal .trophies'); return m && { goals: m.querySelectorAll('.goal').length, cal: m.querySelectorAll('.cal-c').length, stickers: m.querySelectorAll('.stk').length, badges: m.querySelectorAll('.badge').length, jackets: m.querySelectorAll('.unl').length }; });
  console.log('trophies app:', JSON.stringify(tr));
  if (!tr || tr.goals !== 3 || tr.cal < 28 || tr.stickers < 20 || tr.badges < 40 || tr.jackets < 5) fail('the Trophies app is missing parts');
  await p.screenshot({ path: path.join(OUT, 'trophies.png'), timeout: 240000 });
  await ev(() => { for (let i = 0; i < 4; i++) { const x = document.querySelector('#modal .modal:last-child .sh-x'); if (x) x.click(); } }); await sleep(800);
  // simple goals for the test, then two lessons
  await ev(() => { const G = window.REAL.game(), s = G.state, d = new Date().toISOString().slice(0, 10), days = G.edu.s.days || {};
    const ans = Object.values(days).reduce((a, x) => a + x[0], 0); s.daily = { date: d, goals: [{ k: 'answered', n: 2, base: ans }, { k: 'lessons', n: 1, base: s.stats.lessons || 0 }, { k: 'answered', n: 1, base: ans }], done: false }; window.__m0 = s.money; });
  for (let L = 0; L < 2; L++) {
    await ev(() => { window.__pr = window.REAL.practice('math.add'); }); await sleep(900);
    for (let i = 0; i < 12 && await p.$('#modal .modal .activity'); i++) {
      await ev(() => { const m = document.querySelector('#modal .modal:last-child'); if (!m) return; const c = [...m.querySelectorAll('button.primary')].find((x) => x.textContent === 'Continue' && !x.hidden); if (c) return c.click();
        const Q = window.__lastQ || {}; const o = [...m.querySelectorAll('.opt:not([disabled])')]; const r = o.find((x) => x.textContent === String(Q.a)) || o[0]; if (r) return r.click();
        if (Q.type === 'number') { for (const d of String(Q.a)) { const k = [...m.querySelectorAll('.key')].find((x) => x.textContent === d); if (k) k.click(); } const ok = m.querySelector('.key.ok'); if (ok) ok.click(); }
        const lc = document.querySelector('.learn-card button.primary'); if (lc) lc.click(); }); await sleep(700); }
  }
  await p.waitForSelector('.celebrate', { timeout: 20000 }).catch(() => {});
  const cel = await ev(() => { const c = document.querySelector('.celebrate b'); return c && c.textContent; }); console.log('celebration:', cel);
  if (!cel || !/Daily goals/i.test(cel)) fail('finishing the daily goals did not celebrate');
  await p.screenshot({ path: path.join(OUT, 'celebrate.png'), timeout: 240000 });
  const after = await ev(() => { const s = window.REAL.state; return { paid: Math.round((s.money - window.__m0) * 100) / 100, stickers: (s.stickers || []).length, streak: (s.streak || {}).days.length }; });
  console.log('after goals:', JSON.stringify(after));
  if (after.paid < 25 || after.stickers !== 1 || after.streak !== 1) fail('daily goals reward ($25, sticker, streak day) missing');
  // a 3-day streak unlocks the Sunrise jacket
  await ev(() => { const s = window.REAL.state; const d = (k) => new Date(Date.now() - k * 864e5).toISOString().slice(0, 10); s.streak.days = [d(2), d(1), d(0)]; });
  await sleep(4000);
  const jk = await ev(() => window.REAL.state.wardrobe); console.log('wardrobe:', jk.join(','));
  if (!jk.includes('sunrise')) fail('a 3-day streak did not unlock the Sunrise jacket');
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'REWARDS FAILED' : 'REWARDS PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
