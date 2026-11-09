// Music and sound: the soundtrack starts, changes mood with the place (Starting District → lesson → Midtown → night),
// footsteps play while walking, and the Music / Sounds / Heart's voice sliders change the volume.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 700 } })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 240000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Mo'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1000);
  for (let i = 0; i < 25 && await p.isVisible('#dialog'); i++) { await ev(() => { const c = document.querySelector('#dialog .d-choice, #dialog .d-next'); if (c) c.click(); }); await sleep(300); }
  await ev(() => { window.REAL.state.quest = 'free'; });
  const mood = () => ev(() => window.__audio && [window.__audio.ctx && window.__audio.ctx.state, window.__audio.wantMood || window.__audio.mood]);
  await sleep(2500); const m1 = await mood(); console.log('in the city:', m1);
  if (!m1 || !m1[0]) fail('the soundtrack did not start');
  await ev(() => { window.__pr = window.REAL.practice('math.add'); }); await sleep(2500);
  const m2 = await mood(); console.log('in a lesson:', m2); if (!m2 || m2[1] !== 'lesson') fail('lessons should switch to the calm lesson music');
  for (let i = 0; i < 12 && await p.$('#modal .modal .activity'); i++) {
    await ev(() => { const m = document.querySelector('#modal .modal:last-child'); const c = [...m.querySelectorAll('button.primary')].find((x) => x.textContent === 'Continue' && !x.hidden); if (c) return c.click();
      const Q = window.__lastQ || {}; const o = [...m.querySelectorAll('.opt:not([disabled])')]; const r = o.find((x) => x.textContent === String(Q.a)) || o[0]; if (r) return r.click();
      if (Q.type === 'number') { for (const d of String(Q.a)) { const k = [...m.querySelectorAll('.key')].find((x) => x.textContent === d); if (k) k.click(); } const ok = m.querySelector('.key.ok'); if (ok) ok.click(); } }); await sleep(700); }
  await sleep(800);
  await ev(() => window.REAL.travel('midtown')); await sleep(6000);
  const m3 = await mood(); console.log('in Midtown:', m3); if (!m3 || m3[1] !== 'midtown') fail('Midtown should have its own music');
  await ev(() => window.REAL.setTime(22)); await sleep(2000);
  const m4 = await mood(); console.log('at night:', m4); if (!m4 || m4[1] !== 'night') fail('night should switch to the night music');
  // footsteps while walking
  await ev(() => { window.__steps = 0; const P = window.__audio.play.bind(window.__audio); window.__audio.play = (n) => { if (n === 'step') window.__steps++; return P(n); }; });
  for (let i = 0; i < 8; i++) { await ev(() => { const pl = window.__player(); pl.pos.x += 0.4; }); await sleep(400); }   // walk ~3 m (this test machine draws ~1 frame a second)
  const steps = await ev(() => window.__steps); console.log('footsteps:', steps); if (!steps) fail('no footsteps while walking');
  // sliders
  await ev(() => document.getElementById('btn-phone').click()); await sleep(1200);
  await p.$$eval('#modal .app', (els) => { const x = els.find((e) => /Settings/.test(e.textContent)); if (x) x.click(); }); await sleep(900);
  const sliders = await p.$$('#modal .vol-row input[type=range]'); console.log('sliders:', sliders.length);
  if (sliders.length !== 3) fail('Settings should have Music, Sounds and Heart’s voice sliders');
  else { await sliders[0].fill('20'); await sleep(300); const v = await ev(() => JSON.parse(localStorage.getItem('real.vol')).music); console.log('music volume →', v); if (Math.abs(v - 0.2) > 0.01) fail('music slider did not change the volume'); }
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'SOUND FAILED' : 'SOUND PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
