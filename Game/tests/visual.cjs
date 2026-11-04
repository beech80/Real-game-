// Visual review: high-quality renders of key places at different times of day.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist'), OUT = path.join(__dirname, 'shots');
const srv = http.createServer((q, r) => { let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(b); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.evaluate(() => { try { localStorage.clear(); localStorage.setItem('real.quality', 'high'); } catch (e) {} });
  await p.reload();
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden' });
  await p.click('#cr-next'); await p.click('#cr-next'); await p.click('#cr-next'); await p.click('#cr-next'); await p.click('#cr-next'); await p.click('#cr-next');
  await p.waitForSelector('#cr-loading', { state: 'hidden' });
  await p.fill('#cr-name', 'Leo'); await p.click('#cr-go'); await sleep(1000); await p.evaluate(() => window.REAL.skip());
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 60000 });
  await p.addStyleTag({ content: '#hud, #toasts { display: none !important; }' });
  const shots = [
    ['day_street', 13, () => { window.REAL.teleportXY(-6, 12); window.REAL.cam(Math.PI * 0.85, 0.22, 6.5); }],
    ['sunset_freshave', 18.6, () => { window.REAL.teleportXY(2.5, -12); window.REAL.cam(0, 0.12, 5); }],
    ['night_mainst', 21.5, () => { window.REAL.teleportXY(16, 6.5); window.REAL.cam(-Math.PI * 0.42, 0.18, 6); }],
    ['night_freshmart', 21.0, () => { window.REAL.teleportXY(44, 18); window.REAL.cam(Math.PI * 0.05, 0.2, 7); }],
    ['freshmart_inside', 12, () => { window.REAL.teleportXY(38, 30); window.REAL.cam(Math.PI * 0.75, 0.3, 4); }],
  ];
  for (const [n, t, f] of shots) {
    await p.evaluate(`window.REAL.setTime(${t}); (${f.toString()})()`);
    await sleep(4000);
    await p.screenshot({ path: path.join(OUT, `visual_${n}.png`), timeout: 180000 }); console.log('shot', n);
  }
  console.log('errors', errs);
  await b.close(); srv.close();
})().catch((e) => { console.error('FAILED', e.message); srv.close(); process.exit(1); });
