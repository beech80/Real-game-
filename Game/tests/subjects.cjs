// Every new skill (social studies, health, technology and the added reading/writing/math/science topics) plays on a phone; the Library nonfiction shelf, Nurse Kim and the Community Center teach them in the city.
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
  const shot = async (n) => { step++; await p.screenshot({ path: path.join(OUT, `subjects_${String(step).padStart(2, '0')}_${n}.png`), timeout: 150000 }); console.log('✓', n); };
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
  // solve whatever activity sheet is on top, using the generated question
  const types = new Set();
  const solve = async (label) => {
    for (let guard = 0; guard < 40; guard++) {
      await sleep(300);
      if (await vis('.learn-card')) { await settle(); continue; }
      if (await vis('#dialog')) { const ch = await p.$$('#dialog .d-choice'); if (ch.length) await ch[0].click(); else { await p.$eval('#dialog .d-text', (e) => e.click()).catch(() => {}); await p.click('#dialog .d-next').catch(() => {}); } continue; }
      const tops = await p.$$('#modal .modal'); const top = tops[tops.length - 1]; if (!top) return;
      if (!(await top.$('.activity'))) return;
      const cont = await top.$('button.primary:text-is("Continue")');
      if (cont && await cont.isVisible()) { if (label) { await shot(label); label = null; } await cont.click(); continue; }
      const Q = await ev(() => { const q = window.__lastQ; return q && { type: q.type, a: q.a, items: q.items, word: q.word, decimals: q.decimals, total: q.total, cats: q.cats }; });
      types.add(Q.type);
      if (Q.type === 'choice') { const o = await top.$(`.opt:text-is(${JSON.stringify(String(Q.a))})`); if (o) await o.click(); }
      else if (Q.type === 'number') { const s = Q.decimals ? String(Math.round(Q.a * 100)) : String(Q.a); for (const d of s) await (await top.$(`.key:text-is("${d}")`)).click(); await (await top.$('.key.ok')).click(); }
      else if (Q.type === 'order') { for (const it of Q.items) await (await top.$(`.opt:text-is(${JSON.stringify(it)})`)).click(); }
      else if (Q.type === 'sort') { for (const [t, bin] of Q.items) { await (await top.$(`.sort-items .opt:text-is(${JSON.stringify(t)})`)).click(); await (await top.$(`.bin:has(b:text-is(${JSON.stringify(bin)}))`)).click(); } }
      else if (Q.type === 'write') { await (await top.$('button:text-is("See an example")')).click(); await (await top.$('button:text-is("Check my writing")')).click(); }
      else if (Q.type === 'budget') { const extra = Q.total - Q.cats.reduce((a, c) => a + c.min, 0); for (let k = 0; k < extra / 10; k++) { const rows = await top.$$('.brow'); const keys = await rows[rows.length - 1].$$('.key'); await keys[1].click(); } await (await top.$('button:text-is("Check my plan")')).click(); }
      else if (Q.type === 'trace') { await (await top.$('button:has-text("Type instead")')).click(); await (await top.$('input.writebox')).fill(Q.word); await (await top.$('button.primary.sm:text-is("Done")')).click(); }
    }
  };
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden' });
  await p.fill('#cr-name', 'Nova'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 90000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { const s = window.REAL.state; s.quest = 'free'; s.money = 500; s.flags.jax1 = true; });
  await settle();
  const newIds = ['soc.community', 'soc.rules', 'soc.maps', 'soc.geography', 'soc.timeline', 'soc.cultures', 'soc.government', 'soc.rights', 'soc.economics', 'soc.history', 'soc.sources', 'soc.civics', 'soc.trade', 'soc.policy', 'soc.citizenship',
    'hl.hygiene', 'hl.feelings', 'hl.safety', 'hl.sleep', 'hl.exercise', 'hl.kindness', 'hl.firstaid', 'hl.foodsafety', 'hl.stress', 'hl.medicine', 'hl.habits', 'hl.mental', 'hl.relationships', 'hl.wellbeing', 'hl.publichealth',
    'tech.basics', 'tech.sequence', 'tech.safety', 'tech.passwords', 'tech.loops', 'tech.search', 'tech.citizenship', 'tech.conditionals', 'tech.debug', 'tech.variables', 'tech.privacy', 'tech.internet', 'tech.ai', 'tech.design',
    'read.story', 'read.wordparts', 'read.context', 'read.figurative', 'write.grammar', 'write.homophones', 'write.tense', 'write.commas',
    'math.shapes', 'math.patterns', 'math.rounding', 'math.graphs', 'math.negatives', 'math.coords',
    'sci.weather', 'sci.plants', 'sci.matter', 'sci.water', 'sci.space', 'sci.planets', 'sci.magnets', 'sci.sound', 'sci.cells', 'sci.chem'];
  const done = [];
  const snap = new Set(['soc.timeline', 'hl.foodsafety', 'tech.variables', 'math.graphs', 'sci.matter', 'write.grammar']);
  for (const id of newIds) {
    await ev((sk) => { window.__pr = window.REAL.practice(sk); }, id);
    await solve(snap.has(id) ? 'q_' + id.replace('.', '_') : null); await ev(() => window.__pr);
    const st = await ev((sk) => window.REAL.game().edu.state(sk), id);
    done.push([id, st]);
  }
  const notLearned = done.filter(([, st]) => !(st >= 1)).map(([id]) => id);
  console.log('practised', done.length, 'new skills; types seen:', [...types].join(', '), notLearned.length ? 'NOT RECORDED: ' + notLearned.join(' ') : '');
  // in the city: Library nonfiction shelf, Nurse Kim's health question, the Community Center's civics lesson
  await ev(() => { window.__rb = window.REAL.game().readBook(); });
  await p.waitForSelector('#modal .opt:has-text("History & the world")', { timeout: 20000 }); await shot('library_shelf');
  await p.click('#modal .opt:has-text("History & the world")'); await solve('library_history'); await ev(() => window.__rb);
  await ev(() => { window.__ck = window.REAL.game().checkup(); });
  await solve(); await ev(() => window.__ck);
  await ev(() => { window.__cc = window.REAL.game().counselor(); });
  await p.waitForSelector('#modal .opt:has-text("How our city works")', { timeout: 20000 }); await p.click('#modal .opt:has-text("How our city works")');
  await solve('civics'); await ev(() => window.__cc);
  const city = await ev(() => { const e = window.REAL.game().edu; return { social: e.progress('social').pct, health: e.progress('health').pct, tech: e.progress('tech').pct, books: window.REAL.state.stats.booksRead }; });
  console.log('progress after the city lessons:', JSON.stringify(city));
  console.log('page errors', errors.length, errors.slice(0, 5));
  const ok = done.length === newIds.length && !notLearned.length && city.books >= 1 && city.health > 0 && city.social > 0 && !errors.length;
  console.log(ok ? 'SUBJECTS PASSED' : 'SUBJECTS FAILED');
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch(async (e) => { console.error('FAIL', e); process.exit(2); });
