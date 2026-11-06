// Afternoon events + the Feedback phone app: after a shift in free time an event appears with a goal arrow;
// walking there and using it runs the scene and two lessons and gives the reward. The Feedback app saves a note
// with where you were, and lists it.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a); const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1200);
  const clearDialog = () => p.evaluate(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } });
  await clearDialog();
  await ev(() => { const s = window.REAL.state; s.quest = 'free'; s.time = 14; s.flags[`worked${s.day}`] = true; s.bills.forEach((b) => { b.paid = true; }); s.location = 'district'; s.mission = null; window.REAL.teleport('Door_ApartmentLobby'); });
  // wait for an event to show up (rolls every 4 s, 35%)
  await p.waitForFunction(() => window.REAL.state.event, null, { timeout: 120000 }).catch(() => {});
  const E = await ev(() => window.REAL.state.event); console.log('event', JSON.stringify(E));
  if (!E) fail('no event appeared in free afternoon time');
  else {
    await sleep(1500);
    const o = await ev(() => window.REAL.objective()); console.log('goal', o && o.text, o && JSON.stringify(o.pos));
    if (!o || !/optional/.test(o.text)) fail('event not on the goal bar');
    if (!o || !o.pos) fail('event goal has no arrow target');
    const it = await ev((k) => { const g = window.REAL.game(); const r = g.interaction({ key: k }); return r && r.label; }, E.at); console.log('label', it);
    if (!it) fail('event spot has no action');
    // run it, answering whatever comes up
    const done = ev(() => window.REAL.game().runEvent().then(() => 'ok'));
    for (let i = 0; i < 80 && !(await ev(() => !window.REAL.state.event && !document.querySelector('#modal .modal'))); i++) {
      await clearDialog();
      await ev(() => { const m = [...document.querySelectorAll('#modal .modal')].pop(); if (!m) return; const ans = window.__keyAns; const opt = m.querySelector('.opt:not([disabled])'); const next = [...m.querySelectorAll('button.primary')].find((x) => !x.hidden); if (next) next.click(); else if (opt) opt.click(); else if (next) next.click(); else { const x = m.querySelector('.sh-x'); if (x) x.click(); } });
      await sleep(700);
    }
    await Promise.race([done, sleep(5000)]);
    console.log('modal', await ev(() => { const m = [...document.querySelectorAll('#modal .modal')].pop(); return m ? m.innerHTML.replace(/<svg.*?<\/svg>/g, '').slice(0, 900) : 'none'; }), 'dialog hidden', await ev(() => document.querySelector('#dialog').hidden));
    const after = await ev(() => ({ event: window.REAL.state.event, n: window.REAL.state.stats.events || 0 })); console.log('after', JSON.stringify(after));
    if (after.event) fail('event did not finish');
  }
  // Feedback app
  await ev(() => { document.querySelectorAll('#modal .modal').forEach((m) => m.remove()); });
  await p.click('#btn-phone'); await sleep(800);
  await p.click('.app:has-text("Feedback")'); await sleep(800);
  await p.fill('textarea.writebox', 'The bus stop was hard to find.'); await p.click('button:has-text("Save note")'); await sleep(500);
  const notes = await ev(() => JSON.parse(localStorage.getItem('real.feedback.v1') || '[]'));
  console.log('notes', JSON.stringify(notes).slice(0, 300));
  if (notes.length !== 1 || !notes[0].where || !notes[0].day) fail('feedback note not saved with context');
  if (!(await p.isVisible('text=The bus stop was hard to find.'))) fail('saved note not listed');
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'EVENTS FAILED' : 'EVENTS PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
