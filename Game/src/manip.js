// REAL — math you can move. Tools a learner can open on any math or money question:
//   number line (hop forward and back), base-ten blocks (build a number, regroup), fraction bars (shade parts,
//   split them smaller), and coins & bills (count money). The tool that fits the question opens first; the
//   others are one tap away. Using a tool is thinking, not a hint: it doesn't count as help.
import { h } from './ui.js';

const nums = (q) => (String(q).replace(/,(?=\d{3})/g, '').match(/-?\d+(\.\d+)?/g) || []).map(Number);
const fracs = (q) => [...String(q).matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((m) => [+m[1], +m[2]]).filter(([n, d]) => d > 0 && d <= 24 && n <= d * 3);

/** which tool fits this question best */
export function pickTool(Q, sk = {}) {
  const q = String(Q.q) + ' ' + (Q.o || []).join(' ') + ' ' + (Q.v && Q.v.lines ? Q.v.lines.join(' ') : '');
  if (fracs(q).length || /fraction/.test(sk.id || '')) return 'fractions';
  if (/\$|¢|cents?\b|dollars?|coins?|quarters?|dimes?|nickels?|pennies|change\b/i.test(q) || /^fin\./.test(sk.id || '')) return 'coins';
  const n = nums(Q.q);
  if (/negative|below zero|°|temperature|\bowe\b/i.test(q) || n.some((x) => x < 0)) return 'line';
  if (n.length && n.every((x) => Number.isInteger(x) && x >= 0 && x <= 999)) return 'blocks';
  return 'line';
}
const TOOLS = [['line', '📏', 'Number line'], ['blocks', '🧱', 'Blocks'], ['fractions', '🍫', 'Fraction bars'], ['coins', '🪙', 'Coins']];

export function manipulatives(Q, sk) {
  const host = h('div', { class: 'manip' }), stage = h('div', { class: 'manip-stage' });
  let cur = pickTool(Q, sk);
  const tabs = h('div', { class: 'manip-tabs', role: 'tablist' });
  const render = () => {
    tabs.replaceChildren(...TOOLS.map(([k, ic, n]) => h('button', { class: 'chip style' + (k === cur ? ' on' : ''), role: 'tab', 'aria-selected': k === cur ? 'true' : 'false', onclick: () => { cur = k; render(); } }, `${ic} ${n}`)));
    stage.replaceChildren(({ line: numberLine, blocks: baseTen, fractions: fractionBars, coins: coinMat })[cur](Q));
  };
  render();
  host.append(tabs, stage);
  return host;
}

// ------------------------------------------------------------------------------------------- number line
function numberLine(Q) {
  const n = nums(Q.q).filter((x) => Math.abs(x) <= 10000);
  let lo = Math.min(0, ...n), hi = Math.max(10, ...n);
  if (hi - lo > 40) { const span = hi - lo; const step0 = span > 400 ? 100 : span > 100 ? 25 : 10; lo = Math.floor(lo / step0) * step0; hi = Math.ceil(hi / step0) * step0; }
  const span = hi - lo, step = span <= 20 ? 1 : span <= 40 ? 2 : span <= 100 ? 5 : span <= 200 ? 10 : span <= 500 ? 25 : 100;
  let at = n.length ? n[0] : lo; const hops = [];
  const W = 320, X = (v) => 16 + (W - 32) * (v - lo) / (span || 1);
  const NS = 'http://www.w3.org/2000/svg', el = (t, a, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const svg = el('svg', { viewBox: `0 0 ${W} 86`, class: 'nl-svg', role: 'img', 'aria-label': 'number line' });
  const readout = h('p', { class: 'manip-read' });
  const draw = () => {
    svg.replaceChildren(el('line', { x1: 10, y1: 56, x2: W - 10, y2: 56, stroke: '#cfd6ff', 'stroke-width': 2 }));
    for (let v = lo; v <= hi + 1e-9; v += step) { svg.append(el('line', { x1: X(v), y1: 50, x2: X(v), y2: 62, stroke: '#cfd6ff', 'stroke-width': v === 0 ? 3 : 1.5 })); if ((v - lo) / step % (span / step > 12 ? 2 : 1) === 0) svg.append(el('text', { x: X(v), y: 78, 'text-anchor': 'middle', 'font-size': 11, fill: '#e8ecff' }, String(v))); }
    let from = n.length ? n[0] : lo;
    for (const d of hops) { const to = from + d, mid = (X(from) + X(to)) / 2; svg.append(el('path', { d: `M${X(from)},50 Q${mid},${18} ${X(to)},50`, fill: 'none', stroke: d > 0 ? '#3fbf7a' : '#e86a5a', 'stroke-width': 2.5 })); svg.append(el('text', { x: mid, y: 22, 'text-anchor': 'middle', 'font-size': 11, fill: d > 0 ? '#7fe0a5' : '#ff9d90' }, (d > 0 ? '+' : '') + d)); from = to; }
    svg.append(el('circle', { cx: X(Math.max(lo, Math.min(hi, at))), cy: 56, r: 7, fill: '#e9a93a', stroke: '#1c2148', 'stroke-width': 2 }));
    readout.textContent = hops.length ? `Start ${n.length ? n[0] : lo}, ${hops.map((d) => (d > 0 ? '+ ' : '− ') + Math.abs(d)).join(' ')} → you are on ${at}` : `You are on ${at}. Tap a hop to move.`;
  };
  const hop = (d) => { at = +(at + d).toFixed(2); hops.push(d); if (at < lo) { lo = Math.floor(at / step) * step; } if (at > hi) { hi = Math.ceil(at / step) * step; } draw(); };
  draw();
  const big = step >= 10 ? step : 10;
  return h('div', {}, svg, readout, h('div', { class: 'row manip-btns' },
    h('button', { class: 'ghost sm', onclick: () => hop(-big) }, `−${big}`), h('button', { class: 'ghost sm', onclick: () => hop(-1) }, '−1'),
    h('button', { class: 'ghost sm', onclick: () => hop(1) }, '+1'), h('button', { class: 'ghost sm', onclick: () => hop(big) }, `+${big}`),
    h('button', { class: 'ghost sm', onclick: () => { hops.length = 0; at = n.length ? n[0] : lo; draw(); } }, 'Start over')),
    h('p', { class: 'tip' }, 'Adding hops right. Taking away hops left. Count the hops.'));
}

// ------------------------------------------------------------------------------------------- base-ten blocks
function baseTen(Q) {
  const n = nums(Q.q).filter((x) => Number.isInteger(x) && x >= 0 && x <= 999);
  let c = { h: 0, t: 0, o: 0 }; const set = (v) => { c = { h: Math.floor(v / 100), t: Math.floor(v / 10) % 10, o: v % 10 }; };
  set(n[0] || 0);
  const mat = h('div', { class: 'bt-mat' }), readout = h('p', { class: 'manip-read' });
  const draw = () => {
    mat.replaceChildren(
      h('div', { class: 'bt-col' }, h('small', {}, 'Hundreds'), h('div', { class: 'bt-pile' }, ...[...Array(c.h)].map(() => h('i', { class: 'bt-flat' })))),
      h('div', { class: 'bt-col' }, h('small', {}, 'Tens'), h('div', { class: 'bt-pile' }, ...[...Array(c.t)].map(() => h('i', { class: 'bt-rod' })))),
      h('div', { class: 'bt-col' }, h('small', {}, 'Ones'), h('div', { class: 'bt-pile' }, ...[...Array(c.o)].map(() => h('i', { class: 'bt-cube' })))));
    const v = c.h * 100 + c.t * 10 + c.o;
    readout.textContent = `${c.h} hundred${c.h === 1 ? '' : 's'} + ${c.t} ten${c.t === 1 ? '' : 's'} + ${c.o} one${c.o === 1 ? '' : 's'} = ${v}` + (c.o >= 10 || c.t >= 10 ? '  · You can trade 10 for 1 bigger block!' : '');
  };
  const add = (k, d) => { c[k] = Math.max(0, Math.min(30, c[k] + d)); draw(); };
  draw();
  return h('div', {}, mat, readout,
    h('div', { class: 'row manip-btns' }, ...[['h', '100'], ['t', '10'], ['o', '1']].flatMap(([k, l]) => [h('button', { class: 'ghost sm', onclick: () => add(k, 1) }, `+${l}`), h('button', { class: 'ghost sm', onclick: () => add(k, -1) }, `−${l}`)])),
    h('div', { class: 'row manip-btns' },
      h('button', { class: 'ghost sm', onclick: () => { if (c.o >= 10) { c.o -= 10; c.t++; } else if (c.t >= 10) { c.t -= 10; c.h++; } draw(); } }, '🔁 Trade 10 for 1'),
      h('button', { class: 'ghost sm', onclick: () => { if (c.t > 0) { c.t--; c.o += 10; } else if (c.h > 0) { c.h--; c.t += 10; } draw(); } }, '🔨 Break one apart'),
      ...n.slice(0, 3).map((v) => h('button', { class: 'ghost sm', onclick: () => { set(v); draw(); } }, `Show ${v}`))),
    h('p', { class: 'tip' }, 'Build the first number, then add or take away blocks. Ten ones make a ten; ten tens make a hundred.'));
}

// ------------------------------------------------------------------------------------------- fraction bars
function fractionBars(Q) {
  let F = fracs(Q.q + ' ' + (Q.o || []).join(' ')).slice(0, 3);
  if (!F.length) F = [[1, 2], [1, 4]];
  const bars = F.map(([nu, d]) => ({ d, on: new Set([...Array(Math.min(nu, d))].map((_, i) => i)) }));
  const wrap = h('div', { class: 'fb-wrap' });
  const draw = () => wrap.replaceChildren(...bars.map((b, bi) => h('div', { class: 'fb-row' },
    h('div', { class: 'fb-bar', style: { gridTemplateColumns: `repeat(${b.d}, 1fr)` } }, ...[...Array(b.d)].map((_, i) => h('button', { class: 'fb-part' + (b.on.has(i) ? ' on' : ''), 'aria-label': `part ${i + 1} of ${b.d}`, onclick: () => { b.on.has(i) ? b.on.delete(i) : b.on.add(i); draw(); } }))),
    h('b', { class: 'fb-lab' }, `${b.on.size}/${b.d}`),
    h('button', { class: 'ghost sm', title: 'Cut every part in two', onclick: () => { if (b.d * 2 > 24) return; const on = new Set(); b.on.forEach((i) => { on.add(i * 2); on.add(i * 2 + 1); }); b.d *= 2; b.on = on; draw(); } }, '✂️ Split'),
    bi === bars.length - 1 && bars.length < 3 ? h('button', { class: 'ghost sm', onclick: () => { bars.push({ d: b.d, on: new Set() }); draw(); } }, '+ bar') : null)));
  draw();
  return h('div', {}, wrap, h('p', { class: 'tip' }, 'Each bar is one whole. Tap parts to shade them. ✂️ Split cuts every part in two: 1/2 becomes 2/4, the same amount. Line the bars up to compare.'));
}

// ------------------------------------------------------------------------------------------- coins and bills
const MONEY = [[2000, '$20', 'bill'], [1000, '$10', 'bill'], [500, '$5', 'bill'], [100, '$1', 'bill'], [25, '25¢', 'coin q'], [10, '10¢', 'coin d'], [5, '5¢', 'coin n'], [1, '1¢', 'coin p']];
function coinMat() {
  const mat = []; const area = h('div', { class: 'cm-mat' }), readout = h('p', { class: 'manip-read' });
  const fmt = (c) => '$' + (c / 100).toFixed(2);
  const draw = () => {
    area.replaceChildren(...(mat.length ? mat.map((m, i) => h('button', { class: 'cm-piece ' + m[2], title: 'Tap to take it away', onclick: () => { mat.splice(i, 1); draw(); } }, m[1])) : [h('small', {}, 'Tap money below to count it here.')]));
    readout.textContent = `Total: ${fmt(mat.reduce((a, m) => a + m[0], 0))}` + (mat.length ? ` (${mat.length} piece${mat.length > 1 ? 's' : ''})` : '');
  };
  draw();
  return h('div', {}, area, readout,
    h('div', { class: 'cm-tray' }, ...MONEY.map((m) => h('button', { class: 'cm-piece ' + m[2], onclick: () => { if (mat.length < 40) { mat.push(m); mat.sort((a, b) => b[0] - a[0]); draw(); } } }, m[1]))),
    h('div', { class: 'row manip-btns' }, h('button', { class: 'ghost sm', onclick: () => { mat.length = 0; draw(); } }, 'Clear')),
    h('p', { class: 'tip' }, 'Count the biggest money first, then the smaller coins. To make change, count up from the price to what was paid.'));
}
