// Start-up robustness on a phone: create a character and reach the playable prologue even when the
// viewer's live-neighbors service misbehaves (never answers, or throws), with a full-quality renderer.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = path.join(__dirname, 'shots');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MOCKS = {
  hang: () => { window.claude = { use: () => new Promise(() => {}) }; },
  throws: () => { window.claude = { use: async () => ({ presence: () => { throw new TypeError('presence failed'); }, onPeers: (f) => { setTimeout(() => f({ peers: [{ peer: 'x', isMe: false, kind: 'viewer', presence: { sp: 'Cat', x: 'bad' } }] }), 500); return () => {}; } }) }; },
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let failed = 0;
  for (const [name, mock] of Object.entries(MOCKS)) {
    const ctx = await b.newContext({ ...devices['iPhone 13'] });
    await ctx.addInitScript(mock);
    const p = await ctx.newPage(); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
    await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
    await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
    await sleep(1500);
    const loaderShown = await p.isVisible('#loading');
    const saved = await p.evaluate(() => { try { return !!localStorage.getItem('real.save.v2'); } catch (e) { return 'n/a'; } });
    await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 }).catch(() => {});
    const mode = await p.evaluate(() => window.REAL.mode);
    await sleep(4000);
    const crash = await p.isVisible('#crash');
    await p.screenshot({ path: path.join(OUT, `startup_${name}.png`), timeout: 180000 });
    const ok = mode === 'play' && !crash;
    console.log(name, '| loader shown:', loaderShown, '| saved on create:', saved, '| mode:', mode, '| crash panel:', crash, '| page errors:', errors.length, ok ? 'OK' : 'FAIL');
    if (!ok) failed++;
    await ctx.close();
  }
  await b.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
