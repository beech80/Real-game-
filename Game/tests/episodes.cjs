// New adventure episodes and the Toolbox, played in the browser: for each adventure, jump to a new episode, play it
// through (answering every lesson), and check the story moved on; then open every Toolbox tool.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 800 } })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a), top = '#modal .modal:last-child';
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} window.__voiceOff = true; });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 240000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Rae'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1200);
  // play whatever is on screen: dialogs (first choice), learn cards, any activity type, simple choice sheets
  const playAll = async (rounds = 120) => { for (let i = 0; i < rounds; i++) {
    await sleep(350);
    if (await p.isVisible('#dialog')) { await ev(() => { const c = document.querySelector('#dialog .d-choice'); if (c) c.click(); else { const n = document.querySelector('#dialog .d-next'); if (n) n.click(); } }); continue; }
    if (await p.isVisible('.learn-card')) { await p.$eval('.learn-card button.primary', (e) => e.click()).catch(() => {}); continue; }
    if (!(await p.isVisible('#modal .modal'))) { if (await ev(() => window.__epDone)) return; continue; }
    const did = await ev((t) => { const m = document.querySelector(t); if (!m) return 'none';
      const cont = [...m.querySelectorAll('button.primary')].find((x) => !x.hidden && /^(Continue|Got it|Let me try)/.test(x.textContent)); if (cont) { cont.click(); return 'continue'; }
      if (m.querySelector('.activity')) { const Q = window.__lastQ || {}; const opts = [...m.querySelectorAll('.opt:not([disabled])')];
        if (Q.type === 'number') { for (const d of String(Q.decimals ? Math.round(Q.a * 100) : Q.a)) { const k = [...m.querySelectorAll('.key')].find((x) => x.textContent === d); if (k) k.click(); } const ok = m.querySelector('.key.ok'); if (ok) ok.click(); return 'number'; }
        if (Q.type === 'order') { for (const it of Q.items) { const o = [...m.querySelectorAll('.opt')].find((x) => x.textContent === it); if (o) o.click(); } return 'order'; }
        if (Q.type === 'sort') { for (const [it, bin] of Q.items) { const o = [...m.querySelectorAll('.sort-items .opt')].find((x) => x.textContent === it); if (o) { o.click(); const bb = [...m.querySelectorAll('button')].find((x) => x.textContent.startsWith(bin)); if (bb) bb.click(); } } return 'sort'; }
        if (Q.type === 'write') { const ta = m.querySelector('textarea'); if (ta) { ta.value = Q.model || 'I would plan it carefully because it helps people. First, I check the facts. Then, I decide.'; ta.dispatchEvent(new Event('input')); } const c = [...m.querySelectorAll('button')].find((x) => /Check my writing/.test(x.textContent)); if (c) c.click(); return 'write'; }
        const right = opts.find((x) => x.textContent === String(Q.a)); if (right) { right.click(); return 'right'; } if (opts[0]) { opts[0].click(); return 'opt'; }
        const plan = [...m.querySelectorAll('button')].find((x) => /Check my plan|Done/.test(x.textContent)); if (plan) { plan.click(); return 'plan'; } return 'stuck'; }
      const opt = m.querySelector('.opts .opt, .opts button'); if (opt) { opt.click(); return 'pick'; }
      const x = m.querySelector('.sh-x'); if (x) { x.click(); return 'close'; } return 'none'; }, top);
    if (did === 'stuck') { await p.screenshot({ path: path.join(OUT, 'ep_stuck.png') }); }
  } };
  const NEWEP = { pets: 1, rescue: 2, mystery: 2, culinary: 2, medical: 2, robots: 2, construction: 2, inventor: 2, business: 2 };   // index of a new episode
  for (const [id, at] of Object.entries(NEWEP)) {
    const r = await ev(({ id, at }) => { const s = window.REAL.state; s.quest = 'free'; s.mission = null; s.money = 2000; if (id === 'business' && !s.biz) s.biz = { type: 'coffee', name: 'Test Cart', days: 3, profit: 50, rep: 6, log: [], loan: 0, staff: 0 };
      s.adv = s.adv || {}; s.adv[id] = { stage: at, runs: 0, met: true, best: null }; window.__epDone = false;
      Promise.resolve(window.REAL.game().advTalk(id)).then(() => { window.__epDone = true; }, (e) => { window.__epErr = String(e); window.__epDone = true; }); return true; }, { id, at });
    await playAll(160);
    const st = await ev((id) => ({ stage: window.REAL.state.adv[id].stage, err: window.__epErr || null, done: window.__epDone }), id);
    console.log(id, 'episode', at + 1, '→ stage', st.stage, st.err ? 'ERROR ' + st.err : '', st.done ? '' : '(not finished)');
    if (st.err) fail(`${id}: ${st.err}`); else if (st.stage !== at + 1) fail(`${id}: the new episode did not finish (stage ${st.stage})`);
    await ev(() => { window.__epErr = null; });
  }
  // Toolbox: every tool opens
  await ev(() => document.getElementById('btn-phone').click()); await sleep(1200);
  await p.$$eval('#modal .app', (els) => { const x = els.find((e) => /Toolbox/.test(e.textContent)); if (x) x.click(); }); await sleep(900);
  for (const tool of ['Word flashcards', 'Calculator with steps', 'Focus timer', 'My notes', 'Calm down']) {
    await p.$$eval(`${top} .card`, (els, t) => { const x = els.find((e) => e.textContent.includes(t)); if (x) x.click(); }, tool); await sleep(700);
    const ok = await ev((t) => !!document.querySelector(`${t} .tier-h`), top);
    if (!ok) fail(`Toolbox: ${tool} did not open`);
    if (tool === 'Calculator with steps') { const ins = await p.$$(`${top} .calc-in`); await ins[0].fill('47'); await ins[1].fill('38'); await sleep(300); const out = await ev((t) => document.querySelector(`${t} .calc-out`).textContent, top); console.log('calculator:', out.slice(0, 80)); if (!/85/.test(out) || !/carry/.test(out)) fail('calculator did not show 47 + 38 = 85 with steps'); }
    if (tool === 'My notes') { await p.fill(`${top} textarea`, 'Fractions: make the bottoms match first.'); await p.$$eval(`${top} button`, (els) => els.find((e) => e.textContent === 'Save note').click()); await sleep(400); const n = await ev(() => (window.REAL.state.notes || []).length); if (n !== 1) fail('note was not saved'); }
    await p.$$eval(`${top} button`, (els) => { const x = els.find((e) => /Toolbox/.test(e.textContent)); if (x) x.click(); }); await sleep(500);
  }
  await p.screenshot({ path: path.join(OUT, 'toolbox.png'), timeout: 180000 });
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'EPISODES FAILED' : 'EPISODES PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
