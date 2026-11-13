// Players, certificate, break reminder, easier-to-read letters:
// a new game keeps the old one under 👥 Players; switching brings it back; Trophies prints a certificate with the
// player's name; Heart's break card shows; the letters option spreads the text.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted');
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 700 } })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('dialog', (d) => d.accept());
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a);
  const url = `http://localhost:${srv.address().port}/index.html`;
  const toTitle = async () => { await p.goto(url, { timeout: 240000, waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 240000 }); await ev(() => { window.__voiceOff = true; window.REAL.quality('low'); }); };
  const create = async (name) => { await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 }); await p.fill('#cr-name', name); await p.click('#cr-go'); await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 }); await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {}); await ev(() => window.REAL.game().save()); };
  await p.goto(url, { timeout: 240000, waitUntil: 'domcontentloaded' }); await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await toTitle(); await p.click('#btn-new'); await create('Kai');
  await ev(() => { const s = window.REAL.state; s.money = 77; s.stats.lessons = 4; window.REAL.game().save(); });
  // a second player: the first game is kept, not replaced
  await toTitle(); await p.click('#btn-new'); await sleep(800);
  const kept = await ev(() => ({ parked: JSON.parse(localStorage.getItem('real.players') || '[]').map((x) => x.name), slot: !!localStorage.getItem('real.save.v2') })); console.log('after New game:', JSON.stringify(kept));
  if (kept.parked.join() !== 'Kai' || kept.slot) fail('the first game was not kept under Players');
  await create('Mia');
  // the Players screen lists both; choosing Kai brings Kai's game back and keeps Mia's
  await toTitle(); await p.click('#btn-players'); await sleep(1000);
  const rows = await ev(() => [...document.querySelectorAll('#modal .player-row b')].map((x) => x.textContent)); console.log('players listed:', rows);
  if (rows.join() !== 'Mia,Kai') fail('Players does not list both games');
  await ev(() => document.querySelectorAll('#modal .player-row')[1].querySelector('button.primary').click());
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 }); await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  const now = await ev(() => ({ name: window.REAL.state.name, money: window.REAL.state.money, parked: JSON.parse(localStorage.getItem('real.players') || '[]').map((x) => x.name) })); console.log('after switching:', JSON.stringify(now));
  if (now.name !== 'Kai' || now.money !== 77 || now.parked.join() !== 'Mia') fail('switching players lost or mixed up a game');
  // certificate from Trophies
  await ev(() => window.REAL.devJump('hired')); await sleep(2500);
  for (let i = 0; i < 25 && await p.isVisible('#dialog'); i++) { await ev(() => { const c = document.querySelector('#dialog .d-choice, #dialog .d-next'); if (c) c.click(); }); await sleep(300); }
  await p.click('#btn-phone'); await sleep(1200); await ev(() => { const x = [...document.querySelectorAll('#modal button, #modal .app')].find((e) => /Trophies/.test(e.textContent)); if (x) x.click(); }); await sleep(1500);
  await ev(() => { const c = document.querySelector('#modal .cert-btn'); if (c) c.click(); }); await sleep(1200);
  const cert = await ev(() => { const c = document.querySelector('#modal .cert'); return c && { name: c.querySelector('.cert-name').textContent, art: c.querySelectorAll('svg').length, rows: c.querySelectorAll('.cert-rows div').length }; }); console.log('certificate:', JSON.stringify(cert));
  if (!cert || cert.name !== 'Kai' || cert.art < 2 || !cert.rows) fail('certificate missing or wrong');
  await p.screenshot({ path: path.join(process.env.SHOTS || path.join(__dirname, 'shots'), 'certificate.png'), timeout: 240000 }).catch(() => {});
  for (let i = 0; i < 4; i++) { await p.keyboard.press('Escape'); await sleep(400); }
  // break reminder (30 minutes in the game; a few seconds here)
  await ev(() => { window.__rewards = true; window.__breakAfter = 3; });
  await p.waitForSelector('.breakcard', { timeout: 60000 }).catch(() => fail('no break reminder'));
  console.log('break card:', await ev(() => (document.querySelector('.breakcard p') || {}).textContent));
  await ev(() => { window.__breakAfter = 1e9; const c = document.querySelector('.breakcard button'); if (c) c.click(); });
  // easier-to-read letters
  await ev(() => { const G = window.REAL.game(); G.state.settings = { ...(G.state.settings || {}), spaced: true }; G.hooks.applyA11y(G.state.settings); });
  const sp = await ev(() => getComputedStyle(document.body).letterSpacing); console.log('letter spacing:', sp); if (!sp || sp === 'normal' || parseFloat(sp) <= 0) fail('easier-to-read letters did nothing');
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'PLAYERS FAILED' : 'PLAYERS PASSED'); await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
