// Community Center playtest (landscape phone): the menu, the career board and asking Mr. Okafor a question.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = process.env.DIST || path.join(__dirname, '..', 'dist'), OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const wrap = (f, b) => (f.endsWith('index.html') && !b.slice(0, 200).toString().includes('<!doctype') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let step = 0;

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...devices[process.env.DEVICE || 'iPhone 13 landscape'] });
  const p = await ctx.newPage(); global.__p = p;
  const errors = [];
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  const shot = async (n) => { step++; await p.screenshot({ path: path.join(OUT, `${process.env.DEVICE ? 'p' : ''}story_${String(step).padStart(2, '0')}_${n}.png`), timeout: 120000 }); console.log('✓', n); };
  const ev = (f, a) => p.evaluate(f, a);
  const interact = async (key, where) => { await ev(([k, w]) => window.REAL.teleport(k, w), [key, where || 'district']); await sleep(700); await p.click('#btn-interact', { timeout: 45000 }); await sleep(500); };
  const nextDialog = async (choice) => { for (let i = 0; i < 8; i++) { if (await p.isHidden('#dialog')) return; const c = await p.$$('#dialog .d-choice'); if (c.length) { await c[choice ?? 0].click(); } else { await p.click('#dialog .d-text'); await p.click('#dialog .d-next'); } await sleep(400); } };

  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden' });
  await p.fill('#cr-name', 'Nova'); await p.click('#cr-go');
  await sleep(1500); await ev(() => window.REAL.skip());
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 60000 }); await sleep(1500);
  try {
    // The Community Center (Mr. Okafor): menu → career board (every tier listed) → ask a question and get an answer.
    // (Applying for the first job now happens at Fresh Mart with Rosa; tests/saga.cjs plays that whole story.)
    await interact('Door_CareerCenter');
    await p.waitForSelector('.sh-title:text-is("Community Center")', { timeout: 15000 }); await shot('community_center');
    await p.click('.sheet .opt:has-text("Career board")');
    await p.waitForSelector('.sh-title:text-is("Career board")', { timeout: 15000 });
    const tiers = await p.$$eval('.tier-h', (e) => e.map((x) => x.textContent));
    console.log('career tiers:', tiers.join(' | ')); await shot('career_board');
    await p.click('.sheet .sh-x'); await sleep(600);
    await interact('Door_CareerCenter');
    await p.click('.sheet .opt:has-text("Ask Mr. Okafor")');
    await p.waitForSelector('.chatlog'); await p.fill('.microw input', 'How do I get my first job?'); await p.click('button:text-is("Ask")');
    await p.waitForFunction(() => document.querySelectorAll('.bubble.npc').length >= 2 && !/^…$/.test([...document.querySelectorAll('.bubble.npc')].pop().textContent.split(': ').pop()), null, { timeout: 30000 });
    const answer = await p.$$eval('.bubble.npc', (e) => e.pop().textContent); console.log('Okafor:', answer); await shot('okafor_answer');
    await p.click('button:text-is("Thanks, bye!")'); await sleep(500);
    const ok = tiers.length >= 4 && answer.length > 12 && !errors.filter((e) => !/favicon|Failed to load resource/.test(e)).length;
    console.log('errors', errors.length, errors.slice(0, 3));
    console.log(ok ? 'STORY PASSED' : 'STORY FAILED');
    await b.close(); srv.close(); process.exit(ok ? 0 : 1);
  } catch (e) { console.log('FAILED at step', step, e.message); try { await shot('FAIL'); } catch (x) {} await b.close(); srv.close(); process.exit(1); }
})();
