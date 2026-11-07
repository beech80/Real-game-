import { speakerBtn, autoRead, readEls, stopReading, readToMe, markWords } from './readalong.js';
// REAL — UI: tiny DOM helper, HUD, dialogue, modal sheets, toasts, minimap, captions.
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}
export const $ = (s) => document.querySelector(s);
const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k !== null && k !== undefined && k !== false));
export const money = (v) => (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function clock(t) {
  const H = Math.floor(t) % 24, M = Math.floor((t % 1) * 60);
  return `${((H + 11) % 12) + 1}:${String(M).padStart(2, '0')} ${H < 12 ? 'AM' : 'PM'}`;
}

let sfx = null;
export function setSfx(f) { sfx = f; }
const click = () => sfx && sfx('click');

export const UI = {
  hud: null,
  init() {
    this.hud = $('#hud');
    this.els = {
      money: $('#hud-money'), day: $('#hud-day'), time: $('#hud-time'), energy: $('#bar-energy'), hunger: $('#bar-hunger'),
      obj: $('#objective'), objText: $('#obj-text'), objDist: $('#obj-dist'), interact: $('#btn-interact'), interactLabel: $('#interact-label'),
      toasts: $('#toasts'), dialog: $('#dialog'), modal: $('#modal'), sheet: $('#sheet'), caption: $('#caption'), minimap: $('#minimap'),
      fade: $('#fade'), task: $('#taskpanel'),
    };
  },
  showHUD(on) { this.hud.hidden = !on; },
  updateHUD(s) {
    const E = this.els;
    E.money.textContent = money(s.money);
    E.day.textContent = `Day ${s.day}`;
    E.time.textContent = clock(s.time);
    E.energy.style.setProperty('--v', s.energy + '%');
    E.hunger.style.setProperty('--v', s.hunger + '%');
    E.energy.classList.toggle('low', s.energy < 20); E.hunger.classList.toggle('low', s.hunger < 20);
  },
  objective(text, dist) {
    const E = this.els;
    E.obj.hidden = !text;
    if (text) {
      if (text !== this._objLast) { this._objLast = text; E.objText.textContent = text; if (!this.els.dialog.hidden || this.anySheet()) this._objPending = true; else autoRead(() => [E.objText]); }
      else if (this._objPending && this.els.dialog.hidden && !this.anySheet()) { this._objPending = false; autoRead(() => [E.objText]); }
      E.objDist.textContent = dist !== undefined && dist !== null ? `${Math.round(dist)} m` : '';
    }
  },
  taskPanel(title, rows, earn) {
    const E = this.els;
    if (!rows) { E.task.hidden = true; return; }
    E.task.hidden = false;
    fill(E.task, h('div', { class: 'tp-title' }, title),
      ...rows.map((r) => h('div', { class: 'tp-row' + (r.done >= r.need ? ' done' : '') }, h('span', { class: 'tp-check' }, r.done >= r.need ? '✓' : ''), h('span', { class: 'tp-label' }, r.label), h('span', { class: 'tp-n' }, `${Math.min(r.done, r.need)}/${r.need}`))),
      earn !== undefined ? h('div', { class: 'tp-earn' }, h('small', {}, "TODAY'S EARNINGS"), h('b', {}, money(earn))) : null);
  },
  interact(label) {
    const E = this.els;
    E.interact.hidden = !label;
    if (label) E.interactLabel.textContent = label;
  },
  toast(text, kind = 'info', ms = 2600) {
    const t = h('div', { class: 'toast ' + kind }, text);
    this.els.toasts.append(t);
    setTimeout(() => t.classList.add('out'), ms);
    setTimeout(() => t.remove(), ms + 500);
  },
  /** Dialogue with optional choices. Resolves with the choice index (or undefined). */
  say(speaker, text, choices, opts = {}) {
    return new Promise((res) => {
      const D = this.els.dialog;
      D.hidden = false;
      D.className = 'dialog ' + (opts.tone || ''); D.setAttribute('role', 'dialog'); D.setAttribute('aria-live', 'polite'); D.setAttribute('aria-label', speaker);
      const body = h('div', { class: 'd-text' });
      const letters = ['A', 'B', 'C', 'D'];
      if (!opts.player && text && text !== '…') this.lastSpeaker = { name: speaker, t: Date.now() };
      if (this.onLine && text && text !== '…') this.onLine(speaker, text);
      const done = (v) => { click(); stopReading(); D.hidden = true; if (choices && v !== undefined && this.onLine) this.onLine('You', choices[v]); res(v); };
      const list = choices ? h('div', { class: 'd-choices' }, choices.map((c, i) => h('button', { class: 'd-choice', onclick: () => done(i) }, h('span', { class: 'd-key' }, letters[i]), h('span', { class: 'd-ctext' }, c)))) : null;
      const next = !choices ? h('button', { class: 'd-next', onclick: () => done() }, 'Continue ›') : null;
      const finishType = () => { cancelAnimationFrame(this._tw); if (body.dataset.typing !== '0') { body.textContent = text; body.dataset.typing = '0'; markWords(body); } };
      const readAll = () => { finishType(); return [body, ...(list ? [...list.querySelectorAll('.d-ctext')] : [])]; };
      const spk = speakerBtn(readAll);
      const voice = this.voiceHooks;
      const mic = null;   // dialog choices are tapped; speaking out loud is only for speaking practice
      fill(D, h('div', { class: 'd-name' }, opts.crown !== false ? h('span', { class: 'crown' }, '♛') : null, speaker), h('div', { class: 'd-say' }, spk), body, list, mic, next);
      if (voice && !opts.silent) voice.speak(text, speaker);
      // typewriter
      let i = 0; const full = text;
      const tick = () => { i += 2; body.textContent = full.slice(0, i); if (i < full.length) this._tw = requestAnimationFrame(tick); else { body.dataset.typing = '0'; markWords(body); } };
      cancelAnimationFrame(this._tw); body.dataset.typing = '1';
      if (readToMe()) { finishType(); autoRead(readAll); } else tick();
      body.onclick = () => { if (body.dataset.typing === '1') finishType(); };
    });
  },
  /** Modal sheet. build(close) returns content element. Resolves with close(value). */
  sheet(title, build, opts = {}) {
    // each sheet is its own stacked layer, so a "New skill" card can open on top of an activity without destroying it
    return new Promise((res) => {
      const host = this.els.modal;
      const layer = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Screen' });
      host.append(layer);
      const close = (v) => { layer.remove(); res(v); };
      const head = h('div', { class: 'sh-head' }, h('div', { class: 'sh-title' }, opts.icon ? h('span', { class: 'sh-icon' }, opts.icon) : null, title),
        speakerBtn(() => [...body.querySelectorAll('.lead, .tip:not([hidden]), .helpbox:not([hidden]), .whybox:not([hidden]), .msg p, .doc-l, .learn-card p, .readable')].filter((e) => !e.closest('[hidden]')).slice(0, 12), 'Read this page to me'),
        opts.noClose ? null : h('button', { class: 'sh-x', 'aria-label': 'Close', onclick: () => { click(); stopReading(); close(undefined); } }, '✕'));
      const body = h('div', { class: 'sh-body' });
      const card = h('div', { class: 'sheet ' + (opts.cls || '') }, head, body);
      layer.append(card);
      body.append(build(close, body));
    });
  },
  anySheet() { return !!this.els.modal.querySelector('.modal'); },
  async caption(lines, hold = 2600) {
    const C = this.els.caption;
    C.hidden = false;
    for (const l of lines) {
      const line = h('div', { class: 'cap-line' }, l); C.replaceChildren(line);
      if (readToMe()) { await Promise.all([readEls([line]), wait(hold)]); } else await wait(hold);
    }
    C.hidden = true;
  },
  async fade(to, ms = 500) { const F = this.els.fade; F.style.transition = `opacity ${ms}ms`; F.style.opacity = to; await wait(ms); },
};

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------------------- minimap
export class Minimap {
  constructor(canvas, world) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.w = world;
    this.scale = 1.05;   // px per metre
  }
  drawPlan(D, player, heading, target, npcs) {
    const g = this.g, c = this.c, s = this.scale * (c.width / 120), ox = D.def.ox;
    g.save(); g.clearRect(0, 0, c.width, c.height);
    g.beginPath(); g.arc(c.width / 2, c.height / 2, c.width / 2 - 2, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#2a3350'; g.fillRect(0, 0, c.width, c.height);
    g.translate(c.width / 2, c.height / 2);
    const tx = (x) => (x - player.x) * s, ty = (y) => -(y - player.y) * s;
    g.fillStyle = '#0d111d'; g.fillRect(tx(ox - 5), ty(140), 10 * s, 160 * s); g.fillRect(tx(ox - 50), ty(65), 100 * s, 10 * s);
    for (const [x0, y0, x1, y1] of D.walk) if (x1 - x0 > 20 && y1 - y0 > 20 && x1 - x0 < 60) { g.fillStyle = '#2f5a35'; g.fillRect(tx(x0), ty(y1), (x1 - x0) * s, (y1 - y0) * s); }
    for (const b of D.buildings) { g.fillStyle = '#55607e'; g.fillRect(tx(b.x - b.hx), ty(b.y + b.hy), b.hx * 2 * s, b.hy * 2 * s); }
    g.fillStyle = '#e9a93a'; for (const p of D.points) if (p.key !== 'bench') g.fillRect(tx(p.x) - 2, ty(p.y) - 2, 4, 4);
    if (npcs) { g.fillStyle = '#b8c2dc'; for (const p of npcs) g.fillRect(tx(p.x) - 1.5, ty(p.y) - 1.5, 3, 3); }
    if (target) { let x = tx(target.x), y = ty(target.y); const R = c.width / 2 - 10, d = Math.hypot(x, y); if (d > R) { x *= R / d; y *= R / d; } g.fillStyle = '#e9a93a'; g.strokeStyle = '#1b2236'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.rotate(heading); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -8); g.lineTo(6, 6); g.lineTo(0, 3); g.lineTo(-6, 6); g.closePath(); g.fill();
    g.restore();
    g.strokeStyle = 'rgba(233,169,58,.85)'; g.lineWidth = 3; g.beginPath(); g.arc(c.width / 2, c.height / 2, c.width / 2 - 2, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.font = `bold ${c.width * 0.09}px system-ui`; g.textAlign = 'center'; g.fillText('N', c.width / 2, c.width * 0.13);
  }
  draw(player, heading, target, label, npcs, wild) {
    const indoor = !!label;
    const g = this.g, c = this.c, s = this.scale * (c.width / 120);
    g.save();
    g.clearRect(0, 0, c.width, c.height);
    g.beginPath(); g.arc(c.width / 2, c.height / 2, c.width / 2 - 2, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#1b2236'; g.fillRect(0, 0, c.width, c.height);
    g.translate(c.width / 2, c.height / 2);
    if (indoor) {
      g.fillStyle = '#e8b23a'; g.font = `bold ${c.width * 0.1}px system-ui`; g.textAlign = 'center'; g.fillText(label, 0, 4);
      g.restore(); return;
    }
    const tx = (x) => (x - player.x) * s, ty = (y) => -(y - player.y) * s;
    if (wild) {   // the old road: fields, Route 1 and the field trail
      g.fillStyle = '#2f4a2a'; g.fillRect(-c.width, -c.height, c.width * 2, c.height * 2);
      const path = (pts, w, col) => { g.strokeStyle = col; g.lineWidth = w * s; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(tx(x), ty(y)) : g.moveTo(tx(x), ty(y)))); g.stroke(); };
      path(this.wildRoad || [], 6.5, '#0d111d'); path(this.wildTrail || [], 2.2, '#8a6a45');
      g.fillStyle = '#2a3350'; g.fillRect(tx(-72), ty(72), 144 * s, 144 * s);
    }
    // lots
    g.fillStyle = '#2a3350'; g.fillRect(tx(-72), ty(72), 144 * s, 144 * s);
    g.fillStyle = '#2f5a35'; g.fillRect(tx(8), ty(-8), 64 * s, 64 * s);
    // roads
    g.fillStyle = '#0d111d';
    g.fillRect(tx(-80), ty(4), 160 * s, 8 * s); g.fillRect(tx(-4), ty(80), 8 * s, 160 * s);
    g.fillStyle = '#e9a93a'; g.fillRect(tx(-80), ty(0.15), 160 * s, 0.3 * s); g.fillRect(tx(-0.15), ty(80), 0.3 * s, 160 * s);
    // buildings
    for (const b of this.w.buildings) {
      g.fillStyle = /FreshMart/.test(b.n) ? '#2f8f5a' : '#55607e';
      g.fillRect(tx(b.x - b.hx), ty(b.y + b.hy), b.hx * 2 * s, b.hy * 2 * s);
    }
    const fm = this.w.freshmart; g.fillStyle = '#2f8f5a'; g.fillRect(tx(fm.x - fm.w / 2), ty(fm.y + fm.d), fm.w * s, fm.d * s);
    if (npcs) { g.fillStyle = '#b8c2dc'; for (const p of npcs) g.fillRect(tx(p.x) - 1.5, ty(p.y) - 1.5, 3, 3); }
    if (target) {
      let x = tx(target.x), y = ty(target.y); const R = c.width / 2 - 10, d = Math.hypot(x, y);
      if (d > R) { x *= R / d; y *= R / d; }
      g.fillStyle = '#e9a93a'; g.strokeStyle = '#1b2236'; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); g.stroke();
    }
    g.rotate(heading);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -8); g.lineTo(6, 6); g.lineTo(0, 3); g.lineTo(-6, 6); g.closePath(); g.fill();
    g.restore();
    g.strokeStyle = 'rgba(233,169,58,.85)'; g.lineWidth = 3; g.beginPath(); g.arc(c.width / 2, c.height / 2, c.width / 2 - 2, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.font = `bold ${c.width * 0.09}px system-ui`; g.textAlign = 'center'; g.fillText('N', c.width / 2, c.width * 0.13);
  }
}
