// Two players in one (mocked) room: each should see the other in Midtown, and gestures show as bubbles.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = path.join(__dirname, 'shots');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MOCK = () => {
  window.claude = { use: async (n) => {
    if (n !== 'room') return null;
    const bc = new BroadcastChannel('real-room'), me = Math.random().toString(36).slice(2), peers = new Map(), fns = []; let mine = {};
    const emit = () => fns.forEach((f) => f({ peers: [...peers.values()], joined: [], left: [], updated: [] }));
    bc.onmessage = (e) => { peers.set(e.data.peer, { peer: e.data.peer, presence: e.data.presence, isMe: false, sameTab: false, kind: 'viewer', by: null, guest: false, updatedAt: Date.now() }); emit(); };
    return { presence: async (p) => { Object.assign(mine, p); bc.postMessage({ peer: me, presence: mine }); }, onPeers: (f) => { fns.push(f); return () => {}; }, peers: () => [...peers.values()] };
  } };
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(MOCK);
  const errors = [];
  const start = async (name, species) => {
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(name + ' ' + e.message));
    await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
    await p.evaluate(() => window.REAL.quality('low'));
    await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden' });
    if (species) await p.click(`.species button:has-text("${species}")`).catch(() => {});
    await p.fill('#cr-name', name); await p.click('#cr-go');
    await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 120000 });
    await p.evaluate(() => window.REAL.devJump('hired')); await sleep(800);
    await p.evaluate(() => window.REAL.travel('midtown')); await sleep(1500);
    return p;
  };
  const A = await start('Ava'), B = await start('Ben', 'Cat');
  await A.evaluate(() => { window.REAL.teleportXY(3006.5, 14); window.REAL.cam(Math.PI * 0.95, 0.2, 5); });
  await B.evaluate(() => window.REAL.teleportXY(3006.5, 9));
  await sleep(4000);
  const seen = await A.evaluate(() => window.REAL.game().hooks.peers());
  console.log('A sees peers:', seen);
  await B.evaluate(() => window.REAL.game().hooks.emote(0)); await sleep(900);
  await A.screenshot({ path: path.join(OUT, 'neighbors_A.png') });
  console.log('errors', errors.length, errors.slice(0, 5));
  await b.close(); srv.close(); process.exit(seen >= 1 && !errors.length ? 0 : 1);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
