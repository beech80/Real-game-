// Automated playtest: serves dist/, drives the game in headless Chromium (phone + desktop), screenshots each step.
// usage: node tests/playtest.cjs [phone|desktop] [stepsFilter]
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = process.env.DIST || path.join(__dirname, '..', 'dist'), OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
const wrap = (f, b) => (f.endsWith('index.html') && !b.slice(0, 200).toString().includes('<!doctype') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => {
  let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0]));
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); });
}).listen(0);
const port = () => srv.address().port;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const kind = process.argv[2] || 'phone';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext(kind === 'phone' ? { ...devices['iPhone 13 landscape'] } : kind === 'portrait' ? { ...devices['iPhone 13'] } : { viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  p.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  const shot = async (n) => { await p.screenshot({ path: path.join(OUT, `${kind}_${n}.png`), timeout: 150000 }); console.log('shot', n); };
  const t0 = Date.now();
  await p.goto(`http://localhost:${port()}/index.html`);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  console.log('loaded in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  await sleep(2500); await shot('01_title');
  await p.click('#btn-new');
  await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 60000 }); await sleep(2500); await shot('02_creator');
  await p.click('#cr-next'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 60000 }); await sleep(1500); await shot('03_creator_cat');
  await p.click('#cr-prev');  await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 60000 });
  await p.fill('#cr-name', 'Nova');
  await p.click('#cr-go');
  await sleep(3500); await shot('04_intro');
  await p.evaluate(() => window.REAL.skip());
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 60000 });
  await sleep(3000); await shot('05_play_start');
  // walk forward using keyboard
  await p.keyboard.down('KeyW'); await sleep(2500); await p.keyboard.up('KeyW'); await sleep(600); await shot('06_walk');
  // Career Center
  await p.evaluate(() => window.REAL.teleport('Door_CareerCenter'));
  await sleep(1200); await shot('07_career_door');
  console.log('info', JSON.stringify(await p.evaluate(() => window.REAL.info())));
  fs.writeFileSync(path.join(OUT, `${kind}_errors.txt`), errors.join('\n'));
  console.log('errors:', errors.length); errors.slice(0, 15).forEach((e) => console.log('  ', e.slice(0, 300)));
  await b.close(); srv.close();
})().catch(async (e) => { console.error('FAILED', e.message); srv.close(); process.exit(1); });
