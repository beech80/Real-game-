// the clock moves and drains food and energy gently; sleeping in the daytime offers "skip to tonight"
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = '/home/user/Real-game-/Game/dist-hosted';
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 700 } })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} window.__voiceOff = true; });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 240000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(2500);
  for (let i = 0; i < 25 && await p.isVisible('#dialog'); i++) { await ev(() => { const c = document.querySelector('#dialog .d-choice, #dialog .d-next'); if (c) c.click(); }); await sleep(300); }
  await ev(() => { const s = window.REAL.state; s.quest = 'free'; s.time = 10; s.energy = 90; s.hunger = 90; });
  const a = await ev(() => ({ t: window.REAL.state.time, e: window.REAL.state.energy, h: window.REAL.state.hunger, at: performance.now() })); await sleep(30000);
  const z = await ev(() => ({ t: window.REAL.state.time, e: window.REAL.state.energy, h: window.REAL.state.hunger, at: performance.now(), day: window.REAL.state.day }));
  const perMin = (z.t - a.t) * 60 / ((z.at - a.at) / 60000); console.log('game minutes per real minute:', perMin.toFixed(1), '· energy/hunger lost per game hour:', ((a.e - z.e) / (z.t - a.t)).toFixed(1), ((a.h - z.h) / (z.t - a.t)).toFixed(1));
  // (the test browser draws about one frame a second and the game caps the time one frame can add, so the speed is not asserted here)
  if (z.t <= a.t) fail('the clock is not moving');
  // daytime sleep → asks, "Not yet" keeps the day, "Yes" skips to the next morning
  await ev(() => { window.REAL.state.time = 11; window.REAL.state.energy = 90; window.__sl = window.REAL.game().sleep(); }); await sleep(1500);
  const asks = await ev(() => document.querySelector('#dialog') && !document.querySelector('#dialog').hidden && [...document.querySelectorAll('#dialog .d-choice')].map((x) => x.textContent)); console.log('daytime sleep asks:', asks);
  if (!asks || asks.length !== 2) fail('no skip-to-tonight question');
  else {
    await ev(() => document.querySelectorAll('#dialog .d-choice')[1].click()); await sleep(1500);
    const same = await ev(() => window.REAL.state.day); if (same !== z.day) fail('"Not yet" still ended the day');
    await ev(() => { window.__sl = window.REAL.game().sleep(); }); await sleep(1500);
    await ev(() => document.querySelectorAll('#dialog .d-choice')[0].click());
    await p.waitForFunction((d) => window.REAL.state.day === d + 1, z.day, { timeout: 120000 }).catch(() => fail('"Yes" did not move to the next day'));
    console.log('after skipping: day', await ev(() => window.REAL.state.day), 'time', await ev(() => window.REAL.state.time));
  }
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'TIME FAILED' : 'TIME PASSED'); await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
