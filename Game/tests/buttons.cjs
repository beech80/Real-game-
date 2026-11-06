// On-screen controls never overlap each other: RUN, the action button (with a long label), the phone button, the
// minimap and the joystick, held upright and sideways.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const bad = [];
  for (const dev of ['iPhone 13', 'iPhone 13 landscape', 'iPhone SE', 'Pixel 5']) {
    const ctx = await b.newContext({ ...devices[dev] });
    const p = await ctx.newPage();
    const ev = (f, a) => p.evaluate(f, a);
    await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
    await ev(() => { try { localStorage.clear(); } catch (e) {} });
    await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
    await ev(() => window.REAL.quality('low'));
    await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
    await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
    await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
    await ev(() => window.REAL.devJump('hired')); await sleep(1200);
    await p.evaluate(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } });
    await ev(() => window.REAL.teleport('Door_ApartmentLobby')); await sleep(1500);   // long label: "Enter The Starter Apartments"
    const boxes = await ev(() => Object.fromEntries(['#btn-sprint', '#btn-interact', '#btn-phone', '#minimap', '#joy-base'].map((s) => { const e = document.querySelector(s); if (!e || e.hidden || getComputedStyle(e).display === 'none') return [s, null]; const r = e.getBoundingClientRect(); return [s, r.width ? { x: r.x, y: r.y, w: r.width, h: r.height, text: e.textContent.trim().slice(0, 40) } : null]; })));
    const hit = (a, c) => a && c && a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h;
    const keys = Object.keys(boxes);
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) if (hit(boxes[keys[i]], boxes[keys[j]])) bad.push(`${dev}: ${keys[i]} overlaps ${keys[j]}`);
    const vw = await ev(() => innerWidth), vh = await ev(() => innerHeight);
    for (const [k, r] of Object.entries(boxes)) if (r && (r.x < 0 || r.y < 0 || r.x + r.w > vw + 1 || r.y + r.h > vh + 1)) bad.push(`${dev}: ${k} off screen`);
    console.log(dev, 'action:', boxes['#btn-interact'] && boxes['#btn-interact'].text);
    await p.screenshot({ path: path.join(OUT, `buttons_${dev.replace(/ /g, '_')}.png`), timeout: 180000 });
    await ctx.close();
  }
  console.log(bad.join('\n'));
  console.log(bad.length ? 'BUTTONS FAILED' : 'BUTTONS PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
