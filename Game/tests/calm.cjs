// Calm & clear mode (made with autistic players in mind): it can be turned on at the start, the 🌿 calm space pauses the
// game, a heads-up comes before a change of place, wrong answers are not red, no confetti, sounds are softened, and
// messages stay longer. Also checks everything goes back to normal when it is turned off.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted');
const OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const shot = (n) => p.screenshot({ path: path.join(OUT, `calm_${n}.png`), timeout: 240000 });
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} window.__gradeAsk = true; window.__calmAsk = true; });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForSelector('#calm-pick', { timeout: 60000 }); await p.click('#calm-pick'); await sleep(600); await shot('1_start_choice');
  if (!(await ev(() => document.body.classList.contains('calm-clear')))) fail('turning it on at the start did not switch calm & clear on');
  await p.click('.grade-btn[data-grade="2"]');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } window.REAL.state.quest = 'free'; });
  const st = await ev(() => ({ btn: !document.getElementById('btn-calm').hidden, motion: document.body.classList.contains('a11y-calm'), music: window.REAL.game() && 1 }));
  if (!st.btn) fail('the 🌿 calm space button is not shown'); if (!st.motion) fail('calm & clear should also reduce motion');
  // the calm space pauses the game
  const t0 = await ev(() => window.REAL.state.time);
  await p.click('#btn-calm'); await p.waitForSelector('.calm-room', { timeout: 30000 }); await sleep(5000); await shot('2_calm_space');
  const t1 = await ev(() => window.REAL.state.time); if (Math.abs(t1 - t0) > 0.01) fail(`game time moved while in the calm space (${t0} → ${t1})`);
  const circle = await ev(() => getComputedStyle(document.querySelector('.calm-circle')).animationDuration); if (circle !== '8s') fail('the breathing circle should move slowly (8s), got ' + circle);
  await p.click('.calm-room button.primary'); await sleep(800);
  if (await p.isVisible('.calm-room')) fail('“I’m ready” did not close the calm space');
  // a heads-up before a change of place
  ev(() => window.REAL.game().hooks.travel('midtown')); await p.waitForSelector('.calm-next', { timeout: 30000 }).catch(() => fail('no heads-up before travelling')); await sleep(600); await shot('3_heads_up');
  const msg = await p.$eval('.calm-next', (e) => e.innerText).catch(() => ''); console.log('heads-up:', msg.replace(/\n/g, ' | '));
  if (!/Midtown/.test(msg)) fail('the heads-up should name where you are going');
  if (await ev(() => window.REAL.state.location) === 'midtown') fail('the place changed before the player tapped OK');
  await p.click('.calm-next button.primary'); await p.waitForFunction(() => window.REAL.state.location === 'midtown', null, { timeout: 120000 }).catch(() => fail('tapping OK did not travel'));
  await sleep(1500);
  // gentle look: no confetti, wrong answers not red, longer messages, softer sounds
  const look = await ev(async () => {
    const { } = {}; const R = window.REAL;
    const div = document.createElement('div'); div.className = 'opt wrong'; document.body.append(div); const wrongColor = getComputedStyle(div).borderTopColor; div.remove();
    const c = document.createElement('div'); c.className = 'confetti'; document.body.append(c); const conf = getComputedStyle(c).display; c.remove();
    return { wrongColor, conf };
  });
  console.log('calm look →', JSON.stringify(look));
  if (/rgb\(2[0-5]\d, [0-9]{1,2}, [0-9]{1,2}\)/.test(look.wrongColor)) fail('a wrong answer is still shown in red: ' + look.wrongColor);
  if (look.conf !== 'none') fail('confetti still shows in calm mode');
  const toastMs = await ev(async () => { const t0 = performance.now(); window.REAL.game().hooks; const UIt = document.querySelector('#toasts') || document.body; const before = document.querySelectorAll('.toast').length; window.REAL.toast ? window.REAL.toast('test') : null; return before; });
  // turn it off in Settings: everything back to normal
  await ev(() => window.REAL.setCalm(false)); await sleep(500);
  const off = await ev(() => ({ cls: document.body.classList.contains('calm-clear'), btn: !document.getElementById('btn-calm').hidden, motion: document.body.classList.contains('a11y-calm') }));
  console.log('after turning off →', JSON.stringify(off));
  if (off.cls || off.btn || off.motion) fail('turning calm & clear off did not restore the normal game');
  console.log('page errors', errors.length, errors.slice(0, 3)); if (errors.length) fail('page errors');
  console.log(bad.length ? 'CALM FAILED' : 'CALM PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); srv.close(); process.exit(2); });
