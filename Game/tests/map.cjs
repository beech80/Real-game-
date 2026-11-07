// Full-story playtest (iPhone 13 portrait): Prologue → Nowhere → Community Center → Fresh Mart (application, interview,
// shift, paycheck) → Jax → home → sleep → phone → Invitation → ending → epilogue. Drives the real UI.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = process.env.DIST || path.join(__dirname, '..', 'dist-hosted'), OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') && !b.slice(0, 200).toString().includes('<!doctype') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let step = 0, p;

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices[process.env.DEVICE || 'iPhone 13'] });
  p = await ctx.newPage();
  const _click = p.click.bind(p); p.click = async (sel, o) => { console.log('  click', sel); return _click(sel, { timeout: 60000, ...(o || {}) }); };
  const errors = [];
  p.on('pageerror', (e) => errors.push('[pageerror] ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async (n) => { step++; await p.screenshot({ path: path.join(OUT, `map_${String(step).padStart(2, '0')}_${n}.png`), timeout: 150000 }); console.log('✓', n); };
  const ev = (f, a) => p.evaluate(f, a);
  const vis = (sel) => p.isVisible(sel);
  // close any "New skill" learn cards that pop up (Discover → Understand)
  const settle = async () => { for (let i = 0; i < 6; i++) { if (await vis('.learn-card')) { await p.click('.learn-card button.primary'); await sleep(300); } else break; } };
  const dialog = async (choiceText) => {
    for (let i = 0; i < 14; i++) {
      await sleep(250);
      if (await vis('.learn-card')) { await settle(); continue; }
      if (!(await vis('#dialog'))) return;
      const ch = await p.$$('#dialog .d-choice');
      if (ch.length) {
        let el = ch[0];
        if (choiceText) for (const c of ch) if ((await c.textContent()).includes(choiceText)) el = c;
        await el.click();
      } else { await p.$eval('#dialog .d-text', (e) => e.click()); await p.click('#dialog .d-next'); }
    }
  };
  const waitIdle = async (ms = 60000) => { await p.waitForFunction(() => document.querySelector('#caption').hidden && document.querySelector('#dialog').hidden, null, { timeout: ms }); };
  const interact = async (setPos) => { await ev(setPos); await sleep(900); await p.click('#btn-interact', { timeout: 15000 }); await sleep(600); await settle(); };
  const keypadType = async (str) => { for (const d of str) await p.click(`.sheet .key:text-is("${d}")`); await p.click('.sheet .key.ok'); await sleep(500); await settle(); };

  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden' });
  await p.fill('#cr-name', 'Nova'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 90000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await p.click('#minimap'); await sleep(800);
  console.log('map open:', await ev(() => window.REAL.mapOpen()));
  await shot('map_starting');
  // drag to pan, then zoom in with the button
  const box = await (await p.$('.mapview canvas')).boundingBox();
  await p.mouse.move(box.width / 2, box.height / 2); await p.mouse.down(); await p.mouse.move(box.width / 2 + 60, box.height / 2 + 120, { steps: 6 }); await p.mouse.up();
  await p.click('.mv-zoom button[data-z="1.4"]'); await sleep(400); await shot('map_starting_zoomed');
  await p.click('.mv-tabs button:has-text("Midtown")'); await sleep(500); await shot('map_tab_midtown');
  await p.click('.mv-x'); await sleep(500);
  console.log('closed, game busy:', await ev(() => window.REAL.game().busy));
  await ev(() => { const s = window.REAL.state; Object.assign(s.stats, { shifts: 14, promotions: 1, perfectShifts: 5, wiseChoices: 5, workouts: 6, mealsCooked: 6, goodNights: 8, budgetsPlanned: 3, billsOnTime: 4, daysIndependent: 8 }); });
  await ev(() => window.REAL.travel('midtown')); await sleep(2500);
  await p.click('#minimap'); await sleep(800); await shot('map_in_midtown');
  await p.click('.mv-x'); await sleep(300);
  console.log('ERRORS', errors.length, errors.slice(0, 5).join('\n'));
  await b.close(); srv.close(); process.exit(errors.length ? 1 : 0);
})().catch(async (e) => { console.error('FAIL', e); try { await p.screenshot({ path: path.join(OUT, 'map_fail.png') }); } catch (x) {} process.exit(2); });
