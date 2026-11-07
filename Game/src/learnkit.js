// REAL — the activity runner. One reusable sheet for every kind of educational interaction:
// choice, number entry, ordering steps, sorting, open writing (rubric feedback), budget allocation, cursive tracing.
// Every answer gets a worked explanation ("why"), hints are free, nothing is timed, and struggling players
// are pointed back to a prerequisite. Read-aloud uses the device's own speech voice.
import { h, UI } from './ui.js';
import { SKILLS, SUBJECTS } from './edu.js';
import { Voice } from './voice.js';
import { GEN } from './curriculum.js';
import { splitWords } from './glossary.js';
import { difficulty } from './readlevel.js';
import { say } from './readalong.js';

const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const fmt = (Q, v) => `${Q.prefix || ''}${Q.decimals ? Number(v).toFixed(2) : v}${Q.suffix ? ' ' + Q.suffix : ''}`;

export function speak(text) { return say(text); }
function clockSVG(hh, mm) {
  const NS = 'http://www.w3.org/2000/svg', el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const svg = el('svg', { viewBox: '0 0 120 120', width: 150, height: 150, class: 'clock', role: 'img', 'aria-label': 'clock' });
  svg.append(el('circle', { cx: 60, cy: 60, r: 56, fill: '#fffaf0', stroke: '#1c2148', 'stroke-width': 4 }));
  for (let i = 1; i <= 12; i++) { const a = i / 12 * 2 * Math.PI; const t = el('text', { x: 60 + 44 * Math.sin(a), y: 60 - 44 * Math.cos(a) + 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#1c2148' }); t.textContent = i; svg.append(t); }
  for (let i = 0; i < 60; i++) { const a = i / 60 * 2 * Math.PI, r0 = i % 5 ? 52 : 49; svg.append(el('line', { x1: 60 + r0 * Math.sin(a), y1: 60 - r0 * Math.cos(a), x2: 60 + 55 * Math.sin(a), y2: 60 - 55 * Math.cos(a), stroke: '#1c2148', 'stroke-width': i % 5 ? 1 : 2 })); }
  const hand = (ang, len, w, c) => svg.append(el('line', { x1: 60, y1: 60, x2: 60 + len * Math.sin(ang), y2: 60 - len * Math.cos(ang), stroke: c, 'stroke-width': w, 'stroke-linecap': 'round' }));
  hand(((hh % 12) + mm / 60) / 12 * 2 * Math.PI, 28, 6, '#1c2148'); hand(mm / 60 * 2 * Math.PI, 42, 4, '#d2552f');
  svg.append(el('circle', { cx: 60, cy: 60, r: 4, fill: '#1c2148' }));
  return h('div', { class: 'clockwrap' }, svg);
}
function visual(v) {
  if (!v) return null;
  if (v instanceof Node) return v;
  if (v.big) return h('div', { class: 'bigpic', 'aria-hidden': 'true' }, v.big);
  if (v.lines && v.lines.length >= 3 && v.lines.join(' ').length > 160) return h('div', { class: 'passage readable' }, v.title ? h('div', { class: 'doc-h' }, v.title) : null, ...v.lines.map((l) => h('p', { class: 'doc-l' }, ...String(l).split(' / ').flatMap((x, i) => i ? [h('br'), x] : [x]))));
  if (v.clock) return clockSVG(v.clock[0], v.clock[1]);
  if (v.row) return h('div', { class: 'row2' }, ...v.row.map(visual));
  return h('div', { class: 'doc' }, v.title ? h('div', { class: 'doc-h' }, v.title) : null, ...(v.lines || []).map((l) => h('div', { class: 'doc-l' }, l)));
}
function helpFor(G, id) {
  const sup = G.edu.support(id);
  const band = (SKILLS[id] || {}).band || 1, card = h('div', { class: 'wordcard', hidden: true });
  const box = h('div', { class: 'helpbox', hidden: sup !== 'guided' }, h('b', {}, '💡 '), h('span', {}, ...wordful(G, G.edu.explain(id), band, card)));
  let used = false;
  const btn = h('button', { class: 'ghost sm', hidden: sup === 'guided', onclick: () => { box.hidden = false; btn.hidden = true; used = true; } }, 'Show a hint');
  return { box, btn, card, hinted: () => sup === 'guided' || used, show: () => { box.hidden = false; box.lastChild.replaceChildren(...wordful(G, G.edu.explain(id), band, card)); } };
}

const RECENT = {};   // skill → keys of the last few questions shown
export const forgetRecent = () => { for (const k of Object.keys(RECENT)) delete RECENT[k]; };
/** text with the lesson's key words underlined; tapping one shows its meaning and adds it to the learner's words */
function wordful(G, text, band, card) {
  return splitWords(text, band).map((p) => typeof p === 'string' ? p : h('button', { class: 'gloss', type: 'button', onclick: (e) => {
    e.stopPropagation();
    const w = p.entry.base.toLowerCase(), words = G.state.words || (G.state.words = []);
    const fresh = !words.includes(w); if (fresh) words.push(w);
    card.hidden = false; card.replaceChildren(h('b', {}, `📖 ${p.word}`), ` — ${p.entry.meaning}`, fresh ? h('small', {}, ` · new word! You know ${words.length}`) : null);
  } }, p.word));
}
/** Run one activity. Resolves { ok: correct on the first try }. */
export function runActivity(G, gen, ctx = 'world', title = 'Task', icon = '🧩') {
  let Q;
  try {
    Q = typeof gen === 'function' ? gen() : gen;
    // practise the idea, not one memorised answer: avoid the last few questions this skill asked
    if (typeof gen === 'function' && Q && Q.skill) {
      const key = (q) => JSON.stringify([q.q, q.a, q.word, q.items]);
      const seen = RECENT[Q.skill] || (RECENT[Q.skill] = []);
      for (let tries = 0; tries < 8 && seen.includes(key(Q)); tries++) { const n = gen(); if (n && n.skill === Q.skill) Q = n; }
      // grow with the learner: easier versions while a skill is new, harder ones (more reading, bigger numbers,
      // more steps) as they get better. Draw a few fresh candidates and pick the one that fits.
      const st = G.edu.state(Q.skill); let pool = [Q];
      for (let k = 0; k < 6; k++) { const n = gen(); if (n && n.skill === Q.skill && !seen.includes(key(n)) && !pool.some((p) => key(p) === key(n))) pool.push(n); }
      // items written for a specific band (reading passages…) only go to learners within one band of it
      const lb = G.edu.band((SKILLS[Q.skill] || {}).subj || 'reading'), fits = pool.filter((p) => !p.band || Math.abs(p.band - lb) <= 1);
      if (fits.length) pool = fits; else for (let k = 0; k < 10 && pool.every((p) => p.band && Math.abs(p.band - lb) > 1); k++) { const n = gen(); if (n && n.skill === Q.skill && (!n.band || Math.abs(n.band - lb) <= 1)) pool = [n]; }
      if (pool.length > 1) {
        pool.sort((a, b) => difficulty(a) - difficulty(b));
        const at = st <= 1 ? 0 : st === 2 ? 0.5 : 1;   // new → easiest, practising → middle, proficient+ → hardest
        Q = pool[Math.round(at * (pool.length - 1))];
      }
      seen.push(key(Q)); if (seen.length > 6) seen.shift();
    }
  } catch (e) { console.warn('activity', e); return Promise.resolve({ ok: true }); }
  Q.type = Q.type || 'choice'; window.__lastQ = Q;
  const id = Q.skill, sk = SKILLS[id] || { name: '', subj: 'thinking' };
  if (!Q.why && sk.explain) Q.why = sk.explain;   // every item ends with a worked explanation
  G.edu.discover(id);
  G.state.stats.lessons = (G.state.stats.lessons || 0) + 1;
  const settings = G.state.settings || {};
  let tries = 0;
  return UI.sheet(title, (close) => {
    const hp = helpFor(G, id);
    const why = h('div', { class: 'whybox', hidden: true });
    const done = h('button', { class: 'primary', hidden: true }, 'Continue');
    const finish = (ok) => { if (body) body.querySelectorAll('button').forEach((b) => { if (!b.classList.contains('right')) b.disabled = true; }); why.hidden = false; why.replaceChildren(h('b', {}, ok ? '✓ ' : '💡 '), ...wordful(G, Q.why || (ok ? 'Nice work.' : ''), sk.band || 1, hp.card)); done.hidden = false; done.onclick = () => close({ ok: tries === 1 && ok }); if (settings.readAloud && Q.why) speak(Q.why); };
    const attempt = (ok, err) => {
      tries++;
      G.edu.record(id, ok, { ctx, hinted: hp.hinted() || tries > 1, err });
      if (ok) { G.sfx('good'); finish(true); return true; }
      G.sfx('bad'); G.state.stats.mistakes = (G.state.stats.mistakes || 0) + 1; hp.show();
      const pre = G.edu.struggling(id);
      if (pre) {   // step back to the skill this one builds on, right now, with one tap
        const g = GEN[pre];
        hint2.replaceChildren(`This builds on “${SKILLS[pre].name}”. `, g ? h('button', { class: 'ghost sm stepback', onclick: async (e) => { e.currentTarget.disabled = true; for (let i = 0; i < 2; i++) await runActivity(G, () => ({ skill: pre, ...g[Math.floor(Math.random() * g.length)]() }), ctx, SKILLS[pre].name, '🪜'); } }, `🪜 Practise “${SKILLS[pre].name}” first`) : 'You can practise it in 📚 Learn.');
        hint2.hidden = false;
      }
      if (tries >= 3 && Q.why) finish(false);   // after a few tries, show the worked solution and move on; mistakes teach
      return false;
    };
    const hint2 = h('p', { class: 'tip', hidden: true });
    const head = [h('div', { class: 'lc-subj' }, `${SUBJECTS[sk.subj] ? SUBJECTS[sk.subj].icon + ' ' + SUBJECTS[sk.subj].name : ''} · ${sk.name || ''}`),
      visual(Q.v), Q.cursive ? h('div', { class: 'cursive-note' }, ...Q.cursive.map((l) => h('div', {}, l))) : null,
      h('div', { class: 'qrow' }, h('p', { class: 'lead' }, ...wordful(G, Q.q, sk.band || 1, hp.card)), h('button', { class: 'ghost sm say', 'aria-label': 'Read aloud', onclick: () => speak(Q.decode ? Q.q.replace(/[:“].*$/, '') + (Q.say ? '. ' + Q.say : '') : (Q.say ? Q.say + '. ' : '') + Q.q + (Q.o ? '. ' + Q.o.join('. ') : '')) }, '🔊'))];
    let body;
    if (Q.type === 'choice') {
      const optsShown = shuffle([...new Set(Q.o)]);
      body = h('div', { class: 'opts' + (Q.decode ? ' decode' : '') }, optsShown.map((o) => h('button', { class: 'opt', 'data-noread': Q.decode ? '1' : null, onclick: (e) => { if (!done.hidden) return; const ok = o === Q.a; if (!attempt(ok, ok ? null : 'chose:' + String(o).slice(0, 24))) { e.currentTarget.classList.add('wrong'); e.currentTarget.disabled = true; if (Q.whyWrong && Q.whyWrong[o]) { hint2.hidden = false; hint2.textContent = '💡 ' + Q.whyWrong[o]; } } else e.currentTarget.classList.add('right'); } }, o)));
    } else if (Q.type === 'number') {
      let val = '';
      const disp = h('div', { class: 'keypad-disp' }, fmt(Q, 0));
      const show = () => { disp.textContent = Q.prefix === '$' && Q.decimals ? '$' + (val ? (parseInt(val, 10) / 100).toFixed(2) : '0.00') : `${Q.prefix || ''}${val || '0'}${Q.suffix ? ' ' + Q.suffix : ''}`; };
      const value = () => (Q.decimals ? parseInt(val || '0', 10) / 100 : parseFloat(val || '0'));
      const key = (k) => h('button', { class: 'key', onclick: () => { if (k === '⌫') val = val.slice(0, -1); else if (k === '.' ) { if (!val.includes('.') && !Q.decimals) val += val ? '.' : '0.'; } else if (val.length < 9) val += k; show(); } }, k);
      body = h('div', {}, disp, h('div', { class: 'keypad' }, ['1', '2', '3', '4', '5', '6', '7', '8', '9', Q.decimals ? '⌫' : '.', '0', Q.decimals ? '' : '⌫'].filter(Boolean).map(key),
        h('button', { class: 'key ok', onclick: () => { if (!done.hidden) return; const v = value(); const ok = Math.abs(v - Q.a) < 0.005; if (!attempt(ok, ok ? null : (v === 0 ? 'blank' : Math.abs(v - Q.a) / Math.max(1, Math.abs(Q.a)) < 0.15 ? 'close' : 'far'))) { val = ''; show(); } } }, '✓')));
    } else if (Q.type === 'order') {
      const pool = shuffle(Q.items.map((t, i) => ({ t, i }))), chosen = [];
      const list = h('ol', { class: 'orderlist' }), bank = h('div', { class: 'opts' });
      const render = () => {
        list.replaceChildren(...chosen.map((c) => h('li', {}, c.t)));
        bank.replaceChildren(...pool.filter((p) => !chosen.includes(p)).map((p) => h('button', { class: 'opt', onclick: () => { chosen.push(p); render(); if (chosen.length === Q.items.length) { const ok = chosen.every((c, k) => c.i === k); if (!attempt(ok, ok ? null : 'order')) { chosen.length = 0; setTimeout(render, 500); } } } }, p.t)));
      };
      render();
      body = h('div', {}, h('p', { class: 'tip' }, 'Tap the steps in order.'), list, bank, h('button', { class: 'ghost sm', onclick: () => { chosen.length = 0; render(); } }, 'Start over'));
    } else if (Q.type === 'sort') {
      let sel = null; const placed = new Map();
      const items = shuffle(Q.items);
      const wrap = h('div', {});
      const render = () => {
        wrap.replaceChildren(
          h('div', { class: 'sort-items' }, items.filter((it) => !placed.has(it)).map((it) => h('button', { class: 'opt' + (sel === it ? ' sel' : ''), onclick: () => { sel = it; render(); } }, it[0]))),
          h('div', { class: 'sort-bins' }, Q.bins.map((b) => h('button', { class: 'bin', onclick: () => { if (!sel) return; placed.set(sel, b); sel = null; render(); if (placed.size === items.length) { const ok = [...placed].every(([it, bb]) => it[1] === bb); if (!attempt(ok, ok ? null : 'sort')) { for (const [it, bb] of [...placed]) if (it[1] !== bb) placed.delete(it); setTimeout(render, 400); } } } },
            h('b', {}, b), ...[...placed].filter(([, bb]) => bb === b).map(([it]) => h('small', { class: it[1] === b ? '' : 'bad' }, it[0]))))));
      };
      render(); body = h('div', {}, h('p', { class: 'tip' }, 'Tap an item, then tap where it belongs.'), wrap);
    } else if (Q.type === 'write') {
      const ta = h('textarea', { class: 'writebox', rows: 4, placeholder: 'Write here…', maxlength: 600 });
      const fb = h('ul', { class: 'rubric' }); let revised = false;
      body = h('div', {}, ta, fb, h('div', { class: 'row' }, h('button', { class: 'ghost sm', onclick: () => { ta.value = Q.model; } }, 'See an example'),
        h('button', { class: 'primary sm', onclick: () => {
          if (!done.hidden) return;
          const t = ta.value.trim(), words = t.split(/\s+/).filter(Boolean).length;
          const checks = [['Long enough (' + Q.minWords + '+ words)', words >= Q.minWords], ['Starts with a capital letter', /^[A-Z“"]/.test(t)], ['Ends with punctuation', /[.!?]["”]?$/.test(t)],
            ...Q.rubric.map(([label, test]) => [label, typeof test === 'function' ? test(t) : test.test(t)])];
          const starters = Object.fromEntries((Q.rubric || []).filter((r) => r[2]).map((r) => [r[0], r[2]]));
          fb.replaceChildren(...checks.map(([l, ok]) => h('li', { class: ok ? 'ok' : 'todo' }, (ok ? '✓ ' : '○ ') + l, !ok && starters[l] ? h('small', { class: 'starter' }, ` Try: “${starters[l]}”`) : null)));
          const passed = checks.filter((c) => c[1]).length, ok = passed === checks.length;
          if (!ok && !revised) { revised = true; UI.toast('Good start! Add what’s missing (○), then check again.', 'info', 3200); return; }   // one revision round before it counts
          if (ok || passed >= checks.length - 1) { tries++; G.edu.record(id, ok, { ctx, hinted: hp.hinted() || ta.value === Q.model }); G.sfx('good'); finish(true); why.firstChild.textContent = ok ? '✓ ' : '✓ Almost there. '; why.lastChild && why.append(h('div', { class: 'tip' }, 'Example: ' + Q.model)); }
          else { tries++; G.edu.record(id, false, { ctx, err: 'rubric' }); G.sfx('bad'); hp.show(); }
        } }, 'Check my writing')));
      Q.why = Q.why || 'Clear writing says what you mean, with complete sentences and the details the reader needs.';
    } else if (Q.type === 'budget') {
      const vals = Q.cats.map((c) => c.min);
      const left = h('b', {}), rows = h('div', { class: 'budgetrows' });
      const render = () => {
        const rem = Q.total - vals.reduce((a, v) => a + v, 0); left.textContent = `Left to plan: $${rem}`; left.className = rem === 0 ? 'pos' : rem < 0 ? 'neg' : '';
        rows.replaceChildren(...Q.cats.map((c, i) => h('div', { class: 'brow' }, h('span', {}, c.name + (c.min ? ` (needs $${c.min})` : '')),
          h('button', { class: 'key sm', onclick: () => { vals[i] = Math.max(0, vals[i] - 10); render(); } }, '−'), h('b', {}, '$' + vals[i]), h('button', { class: 'key sm', onclick: () => { vals[i] += 10; render(); } }, '+'))));
      };
      render();
      body = h('div', {}, rows, left, h('button', { class: 'primary sm', onclick: () => { if (!done.hidden) return; const rem = Q.total - vals.reduce((a, v) => a + v, 0); const needsOk = Q.cats.every((c, i) => vals[i] >= c.min); const ok = rem === 0 && needsOk; if (!attempt(ok, ok ? null : rem !== 0 ? 'unbalanced' : 'needs')) UI.toast(rem !== 0 ? `Every dollar needs a job: $${rem} ${rem > 0 ? 'still unplanned' : 'too much planned'}.` : 'Cover every need first.', 'info'); } }, 'Check my plan'));
    } else if (Q.type === 'trace') {
      const pad = h('div', {});
      const mount = () => import('./activities.js').then((A) => pad.replaceChildren(A.cursivePad(G, Q.word, id, '', () => { tries = 1; finish(true); })));
      mount();
      const typeAlt = h('button', { class: 'ghost sm', onclick: () => {   // accessible alternative: handwriting is never a barrier
        const inp = h('input', { class: 'writebox', placeholder: `Type “${Q.word}”` });
        pad.replaceChildren(h('p', { class: 'lead' }, 'Type the word instead. (Tracing practice can come later.)'), inp, h('button', { class: 'primary sm', onclick: () => { if (inp.value.trim().toLowerCase() === Q.word.toLowerCase()) { tries = 1; G.edu.record(id, true, { ctx, hinted: true }); finish(true); } else UI.toast(`Type exactly: ${Q.word}`, 'info'); } }, 'Done'));
      } }, '⌨️ Type instead');
      body = h('div', {}, pad, typeAlt);
      Q.why = Q.why || 'Cursive letters join with smooth upward swings. Neat comes before fast.';
    }
    if (settings.readAloud || Voice.enabled() && Q.say) setTimeout(() => speak(Q.decode ? Q.q.replace(/[:“].*$/, '') + (Q.say ? '. ' + Q.say : '') : (Q.say ? Q.say + '. ' : '') + Q.q), 250);   // decoding items: only the instruction is read, never the word to decode
    return h('div', { class: 'act activity' + (sk.band === 1 ? ' lv1' : '') }, ...head.filter(Boolean), hp.card, hp.box, body, hint2, why, h('div', { class: 'row' }, hp.btn), done);
  }, { icon, noClose: true });
}
