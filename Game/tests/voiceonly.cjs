// Only the player's own character speaks aloud: other characters' lines must never reach speech synthesis.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MOCK = () => {
  window.__spoken = [];
  const synth = { speak: (u) => window.__spoken.push(u.text), cancel: () => {}, getVoices: () => [], onvoiceschanged: null };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); await ctx.addInitScript(MOCK);
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await p.waitForFunction(() => document.querySelector('#caption').hidden, null, { timeout: 60000 });
  await ev(() => { const c = window.REAL.club(); window.REAL.teleportXY(c.councilDoor.x, c.councilDoor.y - 1.5); });
  const shown = [];
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    if (!(await p.isVisible('#dialog'))) continue;
    const who = await p.textContent('#dialog .d-name'); shown.push(who.replace('♛', '').trim());
    const ch = await p.$$('#dialog .d-choice'); if (ch.length) await ch[0].click(); else await p.click('#dialog .d-next').catch(() => {});
  }
  await ev(() => window.REAL.devJump('hired')); await sleep(1000);
  await ev(() => { window.__a = window.REAL.askNPC('Rita'); });
  await p.waitForSelector('.chatlog'); await p.fill('.microw input', 'How do I corner faster?'); await p.click('button:text-is("Ask")'); await sleep(2500);
  const spoken = await ev(() => window.__spoken);
  const speakers = [...new Set(shown)];
  console.log('dialog speakers seen:', speakers.join(' | '));
  console.log('spoken aloud:', JSON.stringify(spoken));
  const npcLeak = spoken.some((t) => /Tires|Council|membership|Ask me anything/i.test(t));
  const ok = spoken.length === 0 && !npcLeak && !errors.length;   // characters never talk; the player speaks
  console.log(ok ? 'NO-CHARACTER-VOICES PASSED' : 'NO-CHARACTER-VOICES FAILED', errors.slice(0, 3));
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
