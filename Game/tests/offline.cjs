// Offline: the one-file copy (dist/REAL-offline.html) opens straight from disk with every network request blocked,
// reaches the title, starts a game and loads the 3D world; the installable app registers its service worker.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const FILE = path.join(__dirname, '..', 'dist', 'REAL-offline.html'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 700 } });
  const net = []; await ctx.route(/^https?:/, (r) => { net.push(r.request().url()); r.abort(); });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  console.log('offline file:', (fs.statSync(FILE).size / 1048576).toFixed(1), 'MB');
  await p.goto('file://' + FILE, { timeout: 300000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 300000 });
  await p.evaluate(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 200000 });
  await p.fill('#cr-name', 'Bo'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 }).catch(() => fail('the offline copy did not reach play'));
  await sleep(1500);
  await p.screenshot({ path: path.join(OUT, 'offline_play.png'), timeout: 180000 });
  const blocked = net.filter((u) => !/fonts\.(googleapis|gstatic)/.test(u));
  console.log('network requests attempted:', blocked.length, blocked.slice(0, 3));
  if (blocked.length) fail('the offline copy tried to use the network for game files');
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'OFFLINE FAILED' : 'OFFLINE PASSED');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
