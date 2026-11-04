// REAL — full-screen map. Tap the minimap to open it: drag to pan, pinch (or scroll) to zoom,
// tabs to look at every district, labels for every building, your position and your objective.
import { DISTRICTS, AVE } from './districts.js';

const nice = (t) => t.replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase()).replace(/\bAnd\b/g, '&').replace(/ & Co\b/i, ' & Co');
const hex = (c) => '#' + c.toString(16).padStart(6, '0');

function startingArea(data, extra) {
  const L = { CareerCenter: 'Community Center', GrowGym: 'Grow Gym', MainStDiner: 'Main St Diner', StarterApartments: 'Starter Apartments', ThreadAndCo: 'Thread & Co' };
  const fm = data.freshmart, so = (k) => data.sockets.find((s) => s.n === 'SOCKET_' + k);
  const bus = so('Interact_BusStop'), cafe = so('Door_CoffeeShop');
  return {
    title: 'Starting District', bounds: [-90, -410, 90, 95],
    ground: '#26304a',
    lots: [{ x0: -72, y0: -72, x1: 72, y1: 72, c: '#2e3854' }, { x0: 8, y0: -72, x1: 72, y1: -8, c: '#2f5a35', label: 'Brighter Park' }, { x0: -150, y0: -400, x1: 150, y1: -84, c: '#2f4a2a' }],
    roads: [{ x0: -80, y0: -4, x1: 80, y1: 4 }, { x0: -4, y0: -84, x1: 4, y1: 88 }],
    lines: [{ pts: extra.wildRoad || [], w: 6.5, c: '#0d111d' }, { pts: extra.wildTrail || [], w: 2.2, c: '#8a6a45' }],
    blds: data.buildings.map((b) => { const k = b.n.replace('BLD_REAL_', ''); return { x: b.x, y: b.y, hx: b.hx, hy: b.hy, c: L[k] ? '#6a76a0' : '#4a5474', label: L[k] }; })
      .concat([{ x: fm.x, y: fm.y + fm.d / 2, hx: fm.w / 2, hy: fm.d / 2, c: '#2f8f5a', label: 'Fresh Mart' }]),
    pois: [bus && { x: bus.x, y: bus.y, icon: '🚌', label: 'Bus stop' }, cafe && { x: cafe.x, y: cafe.y - 1, icon: '☕', label: 'Daily Grind' },
      { x: 0, y: 84, icon: '♛', label: 'To The Club' }, { x: 0, y: -390, icon: '🛣️', label: 'Where you started' }, extra.cart && { x: extra.cart.x, y: extra.cart.y, icon: '🛒', label: 'Your business' }].filter(Boolean),
  };
}
function districtArea(id) {
  const D = DISTRICTS[id], ox = D.ox;
  const blds = [], lots = [{ x0: ox - 60, y0: -30, x1: ox + 60, y1: 140, c: '#2e3854' }], pois = [{ x: ox + AVE.walk - 2.2, y: 1.2, icon: '🚌', label: 'Bus stop' }];
  for (const b of D.buildings) {
    const s = b.side === 'E' ? 1 : -1, cy = (b.y0 + b.y1) / 2, len = b.y1 - b.y0;
    if (b.park) { const x0 = ox + s * AVE.walk, x1 = ox + s * (AVE.walk + b.depth + 20); lots.push({ x0: Math.min(x0, x1), y0: b.y0, x1: Math.max(x0, x1), y1: b.y1, c: '#2f5a35', label: 'Overlook Park' }); continue; }
    blds.push({ x: ox + s * (AVE.walk + b.depth / 2), y: cy, hx: b.depth / 2, hy: len / 2, c: hex(b.awning), label: nice(b.sign[0]) });
  }
  for (const f of D.friends) pois.push({ x: ox + f.x, y: f.y, icon: '🙂', label: f.id });
  return { title: D.name, life: D.life, bounds: [ox - 60, -30, ox + 60, 140], ground: '#26304a', lots, blds, pois,
    roads: [{ x0: ox - AVE.half, y0: AVE.y0 - 4, x1: ox + AVE.half, y1: AVE.y1 }, { x0: ox - AVE.crossX, y0: AVE.crossY - AVE.half, x1: ox + AVE.crossX, y1: AVE.crossY + AVE.half }], lines: [] };
}

export class MapView {
  constructor(data, extra) {
    this.data = data; this.extra = extra; this.open = false; this.zoom = 3; this.cx = 0; this.cy = 0; this.ptrs = new Map();
    const el = this.el = document.createElement('div'); el.className = 'mapview'; el.hidden = true;
    el.innerHTML = '<canvas></canvas><div class="mv-top"><b class="mv-title"></b><button class="mv-x" aria-label="Close map">✕</button></div><div class="mv-tabs"></div><div class="mv-zoom"><button data-z="1.4">＋</button><button data-z="0.7">－</button><button data-me="1">◎</button></div><div class="mv-note"></div>';
    document.body.appendChild(el);
    this.cv = el.querySelector('canvas'); this.g = this.cv.getContext('2d');
    el.querySelector('.mv-x').onclick = () => this.close();
    el.querySelectorAll('.mv-zoom button').forEach((b) => (b.onclick = () => { if (b.dataset.me) this.centerOnMe(); else this.zoomBy(+b.dataset.z); }));
    const cv = this.cv;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
    cv.addEventListener('pointermove', (e) => {
      if (!this.ptrs.has(e.pointerId)) return;
      const prev = this.ptrs.get(e.pointerId), pts = [...this.ptrs.values()];
      if (pts.length === 1) { this.cx -= (e.clientX - prev.x) / this.zoom; this.cy += (e.clientY - prev.y) / this.zoom; }
      else if (pts.length === 2) { const other = pts.find((p) => p !== prev); const d0 = Math.hypot(prev.x - other.x, prev.y - other.y), d1 = Math.hypot(e.clientX - other.x, e.clientY - other.y); if (d0 > 10) this.zoomBy(d1 / d0, true); }
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    const up = (e) => this.ptrs.delete(e.pointerId);
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.15 : 0.87); }, { passive: false });
  }
  zoomBy(f) { this.zoom = Math.max(0.6, Math.min(14, this.zoom * f)); }
  centerOnMe() { if (this.me && this.me.area === this.areaId) { this.cx = this.me.x; this.cy = this.me.y; this.zoom = Math.max(this.zoom, 3); } }
  /** me: { area: 'district'|district id, x, y, heading, inside?: name }, target: {x,y} | null */
  show(me, target, ctx) {
    this.me = me; this.target = target; this.ctx = ctx || {};
    this.open = true; this.el.hidden = false; this.setArea(me.area, true);
  }
  close() { this.open = false; this.el.hidden = true; this.ptrs.clear(); this.onClose && this.onClose(); }
  setArea(id, centerMe) {
    this.areaId = id;
    this.area = id === 'district' ? startingArea(this.data, { ...this.extra, cart: this.ctx.cart }) : districtArea(id);
    const tabs = this.el.querySelector('.mv-tabs'); tabs.replaceChildren();
    for (const [k, n, lv] of [['district', 'Start', 1], ['midtown', 'Midtown', 3], ['opportunity', 'Opportunity', 5], ['heights', 'Heights', 8]]) {
      const b = document.createElement('button'); b.textContent = (this.ctx.life || 1) >= lv ? n : `🔒${n}`; if (k === id) b.className = 'on';
      b.onclick = () => this.setArea(k, k === this.me.area); tabs.appendChild(b);
    }
    this.el.querySelector('.mv-title').textContent = this.area.title;
    const locked = this.area.life && (this.ctx.life || 1) < this.area.life;
    this.el.querySelector('.mv-note').textContent = this.me.inside && id === this.me.area ? `You are inside ${this.me.inside}.` : locked ? `Opens at Life Level ${this.area.life}. Take the bus once it does.` : id !== this.me.area ? 'Take the bus to get here.' : '';
    const [x0, y0, x1, y1] = id === 'district' ? [-80, -90, 80, 90] : this.area.bounds;
    const w = innerWidth, hgt = innerHeight;
    this.zoom = Math.min(w / (x1 - x0), (hgt - 140) / (y1 - y0)) * 0.95;
    if (centerMe && this.me.area === id) { this.cx = this.me.x; this.cy = this.me.y; this.zoom = Math.max(this.zoom, id === 'district' && this.me.y < -84 ? 1.6 : this.zoom); }
    else { this.cx = (x0 + x1) / 2; this.cy = (y0 + y1) / 2; }
  }
  draw(t) {
    if (!this.open) return;
    const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight, cv = this.cv, g = this.g, A = this.area;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const z = this.zoom, X = (x) => W / 2 + (x - this.cx) * z, Y = (y) => H / 2 - (y - this.cy) * z;
    g.fillStyle = '#141a2c'; g.fillRect(0, 0, W, H);
    const rect = (r, c) => { g.fillStyle = c; g.fillRect(X(r.x0), Y(r.y1), (r.x1 - r.x0) * z, (r.y1 - r.y0) * z); };
    for (const l of A.lots) rect(l, l.c);
    for (const ln of A.lines) { if (!ln.pts.length) continue; g.strokeStyle = ln.c; g.lineWidth = Math.max(2, ln.w * z); g.lineJoin = g.lineCap = 'round'; g.beginPath(); ln.pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); }
    for (const r of A.roads) rect(r, '#0d111d');
    g.strokeStyle = 'rgba(233,169,58,.7)'; g.lineWidth = Math.max(1, 0.25 * z); g.setLineDash([3 * z, 3 * z]);
    for (const r of A.roads) { g.beginPath(); if (r.x1 - r.x0 > r.y1 - r.y0) { const y = (r.y0 + r.y1) / 2; g.moveTo(X(r.x0), Y(y)); g.lineTo(X(r.x1), Y(y)); } else { const x = (r.x0 + r.x1) / 2; g.moveTo(X(x), Y(r.y0)); g.lineTo(X(x), Y(r.y1)); } g.stroke(); }
    g.setLineDash([]);
    for (const b of A.blds) { g.fillStyle = b.c; g.globalAlpha = b.label ? 1 : 0.7; g.fillRect(X(b.x - b.hx), Y(b.y + b.hy), b.hx * 2 * z, b.hy * 2 * z); g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.strokeRect(X(b.x - b.hx), Y(b.y + b.hy), b.hx * 2 * z, b.hy * 2 * z); }
    const label = (txt, x, y, size = 13, col = '#fff') => { g.font = `700 ${size}px "Barlow Condensed", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3.5; g.strokeStyle = 'rgba(10,14,26,.9)'; g.strokeText(txt, x, y); g.fillStyle = col; g.fillText(txt, x, y); };
    const fs = Math.max(11, Math.min(15, z * 3.2));
    for (const l of A.lots) if (l.label) label(l.label, X((l.x0 + l.x1) / 2), Y((l.y0 + l.y1) / 2), fs, '#bfe3c2');
    for (const b of A.blds) if (b.label) label(b.label, X(b.x), Y(b.y), fs);
    for (const p of A.pois) { label(p.icon, X(p.x), Y(p.y), 18); label(p.label, X(p.x), Y(p.y) + 16, Math.max(10, fs - 2), '#e9d6a8'); }
    const here = this.me && this.me.area === this.areaId;
    if (here && this.target) { const tx = X(this.target.x), ty = Y(this.target.y), r = 9 + Math.sin(t * 4) * 2; g.fillStyle = '#e9a93a'; g.strokeStyle = '#141a2c'; g.lineWidth = 3; g.beginPath(); g.arc(tx, ty, r, 0, Math.PI * 2); g.fill(); g.stroke(); label('★', tx, ty, 12, '#141a2c'); }
    if (here) {
      const px = X(this.me.x), py = Y(this.me.y);
      g.fillStyle = 'rgba(42,159,214,.25)'; g.beginPath(); g.arc(px, py, 18 + Math.sin(t * 3) * 3, 0, Math.PI * 2); g.fill();
      g.save(); g.translate(px, py); g.rotate(this.me.heading); g.fillStyle = '#fff'; g.strokeStyle = '#2a9fd6'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(0, -12); g.lineTo(9, 9); g.lineTo(0, 4); g.lineTo(-9, 9); g.closePath(); g.fill(); g.stroke(); g.restore();
      label('You', px, py + 22, 12, '#9fd8f5');
    }
    // compass
    label('N ↑', W - 34, H - 34, 16, '#e9a93a');
  }
}
