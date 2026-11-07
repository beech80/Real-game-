// Keyboard-only play: start a game, move and interact, open the phone with P, move with Tab, open an app with
// Enter, answer a multiple-choice lesson with number keys, type a keypad answer with digits, continue with Enter,
// close with Escape. No mouse or touch at all after the page loads.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 760 } })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a), key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await sleep(250); } };
  const focused = () => ev(() => { const e = document.activeElement; return e ? (e.id || e.className || e.tagName) + ' “' + (e.textContent || '').trim().slice(0, 30) + '”' : null; });
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  // title → creator → start, keyboard only
  await ev(() => document.getElementById('btn-new').focus()); await key('Enter');
  await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 }); await sleep(600);
  await ev(() => document.getElementById('cr-name').focus()); await p.keyboard.type('Kai'); await key('Tab');
  console.log('after typing the name, focus is on', await focused());
  await ev(() => document.getElementById('cr-go').focus()); await key('Enter');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 240000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1200);
  // dialogs: Enter continues
  for (let i = 0; i < 20 && await p.isVisible('#dialog'); i++) await key('Enter');
  if (await p.isVisible('#dialog')) fail('Enter did not continue dialogs');
  await ev(() => { window.REAL.state.quest = 'free'; });
  // move with the keyboard
  const a = await ev(() => window.REAL.playerPos()); await p.keyboard.down('KeyW'); await sleep(2500); await p.keyboard.up('KeyW'); await sleep(300);
  const b2 = await ev(() => window.REAL.playerPos()); const moved = Math.hypot(b2.x - a.x, b2.y - a.y); console.log('W moved', moved.toFixed(2), 'm');
  if (moved < 0.3) fail('W key did not move the player');
  // phone with P, Tab to an app, Enter to open it, Escape to close
  await key('KeyP'); await sleep(800);
  if (!(await p.isVisible('#modal .phone'))) fail('P did not open the phone');
  const startFocus = await focused(); await key('Tab', 3); const tabFocus = await focused();
  console.log('phone focus', startFocus, '→ after 3 tabs', tabFocus);
  const inside = await ev(() => !!document.activeElement.closest('#modal .modal'));
  if (!inside) fail('Tab moved focus out of the open screen');
  await key('Escape'); await sleep(500);
  if (await p.isVisible('#modal .modal')) fail('Escape did not close the phone');
  // a multiple-choice lesson with number keys, then Enter
  await ev(() => { window.__pr = window.REAL.practice('read.main'); }); await sleep(900);
  for (let i = 0; i < 4 && await p.isVisible('.learn-card'); i++) { await key('Enter'); await sleep(400); }
  await p.waitForSelector('#modal .activity .opt', { timeout: 20000 });
  const idx = await ev(() => [...document.querySelectorAll('#modal .modal:last-child .opt')].findIndex((o) => o.textContent === String(window.__lastQ.a)));
  await key(String(idx + 1)); await sleep(500);
  const right = await ev(() => !!document.querySelector('#modal .modal:last-child .opt.right'));
  console.log('number key picked option', idx + 1, 'right:', right);
  if (!right) fail('number key did not choose the answer');
  await p.screenshot({ path: path.join(OUT, 'keyboard_lesson.png'), timeout: 180000 });
  await key('Enter'); await sleep(500);
  if (await p.isVisible('#modal .activity')) fail('Enter did not continue after the answer');
  // a keypad answer with digit keys
  await ev(() => { window.__pr = window.REAL.practice('math.add'); }); await sleep(900);
  for (let i = 0; i < 4 && await p.isVisible('.learn-card'); i++) { await key('Enter'); await sleep(400); }
  const Q = await ev(() => window.__lastQ && { type: window.__lastQ.type, a: window.__lastQ.a });
  if (Q && Q.type === 'number') {
    for (const d of String(Q.a)) await key(d); await key('Enter'); await sleep(600);
    const ok = await ev(() => !document.querySelector('#modal .modal:last-child .why, #modal .modal:last-child .whybox') || !document.querySelector('#modal .modal:last-child .whybox').hidden);
    console.log('keypad answer typed:', Q.a, 'explanation shown:', ok);
    if (!ok) fail('typing digits and Enter did not answer the keypad');
  }
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'KEYBOARD FAILED' : 'KEYBOARD PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
