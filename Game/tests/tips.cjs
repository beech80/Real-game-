// First-time experience on a phone: the title animates in, then the guided tips appear one at a time with a spotlight
// on the right thing (walk → goal → map …), "Got it" moves on, and "Skip tips" turns them off.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
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
  await ev(() => { try { localStorage.clear(); } catch (e) {} window.__tips = true; window.__voiceOff = true; });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 240000 });
  await sleep(2500);
  await p.screenshot({ path: path.join(OUT, 'tips_title.png'), timeout: 240000 });
  const anim = await ev(() => getComputedStyle(document.querySelector('#title .logo-crown')).animationName);
  console.log('title animation:', anim); if (!/crownDrop/.test(anim)) fail('title logo is not animated');
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Ava'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1000);
  for (let i = 0; i < 25 && await p.isVisible('#dialog'); i++) { await ev(() => { const c = document.querySelector('#dialog .d-choice, #dialog .d-next'); if (c) c.click(); }); await sleep(300); }
  const seenTips = [];
  for (let k = 0; k < 4; k++) {
    await p.waitForSelector('.tip-bubble', { timeout: 30000 }).catch(() => {});
    const t = await ev(() => { const b = document.querySelector('.tip-bubble'), s = document.querySelector('.tip-spot'); return b && { text: b.querySelector('p').textContent, spot: s && s.getBoundingClientRect().width > 10 }; });
    if (!t) break; seenTips.push(t.text.slice(0, 40)); console.log('tip:', t.text);
    if (!t.spot) fail('tip has no spotlight');
    if (k === 0) await p.screenshot({ path: path.join(OUT, 'tips_first.png'), timeout: 240000 });
    if (k === 0 && !/walk/i.test(t.text)) fail('the first tip should be about walking');
    await p.$eval('.tip-bubble button.primary', (e) => e.click()); await sleep(1500);
  }
  if (seenTips.length < 3) fail(`only ${seenTips.length} tips appeared`);
  await p.waitForSelector('.tip-bubble', { timeout: 20000 }).catch(() => {});
  if (await p.$('.tip-bubble')) { await p.$eval('.tip-bubble button.ghost', (e) => e.click()); await sleep(2000); if (await p.$('.tip-bubble')) fail('Skip tips did not turn tips off'); }
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'TIPS FAILED' : 'TIPS PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
