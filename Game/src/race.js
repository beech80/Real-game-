// REAL — Build & Race. A drivable race on a 3D track against NPC drivers.
// Car performance comes from the parts the player chose in the garage (creation framework).
// Telemetry after each race teaches what the parts actually did (grip, power, weight, suspension).
import * as THREE from 'three';
import { P2W, mergeStatic } from './world.js';
import { carMesh } from './city.js';
import { textTexture } from './scenes.js';

export const PARTS = {
  body: [{ id: 'hatch', name: 'City hatch', cost: 0, mass: 1.0, top: 0, note: 'Light and nimble.' }, { id: 'coupe', name: 'Sport coupe', cost: 200, mass: 0.95, top: 3, note: 'Sleek: higher top speed.' }, { id: 'truck', name: 'Rally truck', cost: 250, mass: 1.25, top: -2, note: 'Heavy but tough off the road.' }],
  engine: [{ id: 'stock', name: 'Stock engine', cost: 0, top: 30, acc: 7, note: 'Reliable.' }, { id: 'sport', name: 'Sport engine', cost: 250, top: 36, acc: 9, note: 'More power, more speed.' }, { id: 'turbo', name: 'Turbo engine', cost: 450, top: 42, acc: 11.5, note: 'Big power. Hard to control without grip.' }],
  tires: [{ id: 'street', name: 'Street tires', cost: 0, grip: 0.72, note: 'Fine for errands.' }, { id: 'sport', name: 'Sport tires', cost: 150, grip: 0.88, note: 'Better grip in corners.' }, { id: 'race', name: 'Racing tires', cost: 300, grip: 1.04, note: 'Maximum grip on pavement.' }],
  susp: [{ id: 'stock', name: 'Stock suspension', cost: 0, off: 0.45, note: 'Bumpy off the road.' }, { id: 'tuned', name: 'Tuned suspension', cost: 120, off: 0.55, note: 'Steadier.' }, { id: 'rally', name: 'Rally suspension', cost: 220, off: 0.78, note: 'Handles dirt and grass.' }],
};
export const COLORS = [0xd23b2a, 0x2a5bd2, 0xe8b23a, 0x2f8f5a, 0x7b3fb0, 0xf1f1f1, 0x1b1b1f, 0xe8823a];
export const TRACKS = {
  loop: { name: 'Brighter Park Loop', laps: 2, width: 14, pts: [[0, 0], [90, 10], [150, 70], [140, 160], [60, 200], [-40, 170], [-80, 90], [-60, 20]], dirt: [], ai: [0.8, 0.86, 0.9], prize: [120, 70, 40, 15] },
  circuit: { name: 'Midtown Circuit', laps: 2, width: 12, pts: [[0, 0], [120, 0], [160, 40], [120, 90], [170, 140], [110, 210], [20, 180], [40, 110], [-30, 80], [-60, 20]], dirt: [], ai: [0.86, 0.92, 0.97], prize: [200, 120, 60, 20] },
  rally: { name: 'Old Road Rally', laps: 2, width: 13, pts: [[0, 0], [100, -20], [180, 30], [200, 130], [120, 190], [30, 160], [-20, 220], [-110, 170], [-90, 60], [-50, 10]], dirt: [[0.35, 0.62]], ai: [0.88, 0.94, 1.0], prize: [300, 160, 80, 25] },
};
export function carStats(b) {
  const P = (k) => PARTS[k].find((p) => p.id === b[k]) || PARTS[k][0];
  const body = P('body'), eng = P('engine'), tire = P('tires'), sus = P('susp');
  return { top: (eng.top + body.top) / body.mass ** 0.3, acc: eng.acc / body.mass, grip: tire.grip * (body.id === 'truck' ? 0.96 : 1), off: sus.off * (body.id === 'truck' ? 1.15 : 1), mass: body.mass, handling: 1.9 / body.mass ** 0.5 };
}
export const buildCost = (b) => Object.keys(PARTS).reduce((a, k) => a + ((PARTS[k].find((p) => p.id === b[k]) || { cost: 0 }).cost), 0);

const OX = -8000, OY = 0;
function sampleTrack(T) {
  const curve = new THREE.CatmullRomCurve3(T.pts.map(([x, y]) => new THREE.Vector3(x, 0, y)), true, 'centripetal');
  const N = 600, s = [];
  let d = 0, prev = null;
  for (let i = 0; i < N; i++) { const p = curve.getPoint(i / N), t = curve.getTangent(i / N); if (prev) d += p.distanceTo(prev); s.push({ x: p.x, y: p.z, tx: t.x, ty: t.z, d, u: i / N }); prev = p; }
  const len = d + prev.distanceTo(curve.getPoint(0));
  for (let i = 0; i < N; i++) { const a = s[(i + N - 4) % N], b = s[(i + 4) % N]; s[i].curv = Math.abs(Math.atan2(a.tx * b.ty - a.ty * b.tx, a.tx * b.tx + a.ty * b.ty)) / Math.max(1, (b.d - a.d + len) % len); }
  return { s, len, N };
}

export class Race {
  constructor(scene, textures) { this.scene = scene; this.textures = textures; this.groups = {}; this.active = false; }
  _buildTrack(id) {
    if (this.groups[id]) return this.groups[id];
    const T = TRACKS[id], S = sampleTrack(T), g = new THREE.Group(), root = new THREE.Group(), w = T.width;
    const mat = (n, c, o = {}) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.85, metalness: o.m ?? 0 }); m.name = n; return m; };
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), mat('MAT_R_Grass', 0x4f8a3a, { r: 0.95 }));
    grass.position.copy(P2W(OX + 40, OY + 100, -0.02)); root.add(grass);
    const strip = (off0, off1, m, y, inDirt) => {
      const pos = [], uv = [], idx = [];
      for (let i = 0; i <= S.N; i++) { const p = S.s[i % S.N], nx = -p.ty, ny = p.tx; const L = Math.hypot(nx, ny) || 1;
        for (const o of [off0, off1]) { const v = P2W(OX + p.x + nx / L * o, OY + p.y + ny / L * o, y); pos.push(v.x, v.y, v.z); uv.push(o, (i / S.N) * S.len / 4); }
        if (i < S.N) { const a = i * 2; const dirtHere = T.dirt.some(([u0, u1]) => p.u >= u0 && p.u <= u1); if (inDirt === dirtHere) idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      root.add(new THREE.Mesh(geo, m));
    };
    strip(-w / 2, w / 2, mat('MAT_R_Asphalt', 0x3a3d44, { r: 0.92 }), 0.01, false);
    strip(-w / 2, w / 2, mat('MAT_R_Dirt', 0x9a7550, { r: 1 }), 0.012, true);
    // red/white curbs and barriers
    for (let i = 0; i < S.N; i += 2) {
      const p = S.s[i], nx = -p.ty, ny = p.tx, L = Math.hypot(nx, ny) || 1, ang = Math.atan2(p.tx, p.ty);
      for (const sd of [-1, 1]) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, (S.len / S.N) * 2.05), mat('MAT_R_Curb', (i / 2) % 2 ? 0xd23b2a : 0xf1f1f1, { r: 0.6 }));
        c.position.copy(P2W(OX + p.x + nx / L * sd * (w / 2 + 0.5), OY + p.y + ny / L * sd * (w / 2 + 0.5), 0.05)); c.rotation.y = Math.PI - ang; root.add(c);
        if (i % 6 === 0) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, (S.len / S.N) * 6.1), mat('MAT_R_Barrier', sd > 0 ? 0x2a5bd2 : 0xe8e8e8, { r: 0.5 })); b.position.copy(P2W(OX + p.x + nx / L * sd * (w / 2 + 3.4), OY + p.y + ny / L * sd * (w / 2 + 3.4), 0.45)); b.rotation.y = Math.PI - ang; root.add(b); }
      }
      if (i % 40 === 0) { const tr = new THREE.Group(); const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 7), mat('MAT_R_Trunk', 0x5a3d26)); trunk.position.y = 1.5; tr.add(trunk); const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), mat('MAT_R_Leaves', 0x3d7a34, { r: 0.9 })); crown.position.y = 4; tr.add(crown); const sd = (i / 40) % 2 ? 1 : -1; tr.position.copy(P2W(OX + p.x + nx / L * sd * (w / 2 + 10), OY + p.y + ny / L * sd * (w / 2 + 10), 0)); root.add(tr); }
    }
    // start/finish gantry and line, grandstand
    const p0 = S.s[0], a0 = Math.atan2(p0.tx, p0.ty);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(w, 2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 16; const x = c.getContext('2d'); for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#fff'; x.fillRect(i * 8, j * 8, 8, 8); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })() }));
    line.position.copy(P2W(OX + p0.x, OY + p0.y, 0.03)); line.rotation.y = Math.PI - a0; g.add(line);
    const gant = new THREE.Group(); const post = mat('MAT_R_Post', 0x2a2d33, { m: 0.6, r: 0.4 });
    for (const sd of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 0.4), post); m.position.set(sd * (w / 2 + 1), 3, 0); gant.add(m); }
    const tex = textTexture([T.name.toUpperCase()], { w: 1024, h: 160, bg: '#14204a', border: '#e8a33a', font: 'bold 80px "Barlow Condensed", Arial' });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(w + 2.4, 1.6, 0.3), [post, post, post, post, new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3 }), new THREE.MeshStandardMaterial({ map: tex })]);
    sign.position.y = 6.2; gant.add(sign); gant.position.copy(P2W(OX + p0.x, OY + p0.y, 0)); gant.rotation.y = Math.PI - a0; g.add(gant);
    const nx0 = -p0.ty, ny0 = p0.tx, L0 = Math.hypot(nx0, ny0);
    const stand = new THREE.Group(); for (let r = 0; r < 4; r++) { const st = new THREE.Mesh(new THREE.BoxGeometry(30, 0.8, 2.2), mat('MAT_R_Stand', 0x8a8f99)); st.position.set(0, 0.4 + r * 0.8, r * 2.2); stand.add(st); for (let k = 0; k < 14; k++) if (Math.random() < 0.6) { const fan = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), mat('MAT_R_Fan', COLORS[(k + r) % COLORS.length])); fan.position.set(-13 + k * 2, 1.3 + r * 0.8, r * 2.2); stand.add(fan); } }
    stand.position.copy(P2W(OX + p0.x - nx0 / L0 * (w / 2 + 12), OY + p0.y - ny0 / L0 * (w / 2 + 12), 0)); stand.rotation.y = Math.PI - a0 + Math.PI / 2; g.add(stand);
    const merged = mergeStatic(root, this.textures, 80); g.add(merged); g.visible = false; this.scene.add(g);
    return (this.groups[id] = { g, S, T });
  }
  /** Start a race. build = player's car build. Resolves with results. */
  start(id, build, input, camera, hud, laps) {
    const tr = this._buildTrack(id); tr.g.visible = true; this.laps = laps || tr.T.laps;
    this.tr = tr; this.input = input; this.camera = camera; this.hud = hud; this.build = build;
    const st = carStats(build), S = tr.S, w = tr.T.width;
    const p0 = S.s[S.N - 6], nx = -p0.ty, ny = p0.tx, L = Math.hypot(nx, ny);
    const mk = (color, lane, back, stats, ai) => { const m = carMesh(color); this.scene.add(m); const i0 = (S.N - 6 - back * 3 + S.N) % S.N, p = S.s[i0]; return { m, x: p.x + nx / L * lane, y: p.y + ny / L * lane, h: Math.atan2(p.tx, p.ty), v: 0, st, ai, lane, idx: i0, dist: -(S.len - p.d), lap: 0, half: false, stats, done: false, time: 0 }; };
    this.player = mk(build.color, -w / 4, 0, st, null);
    const names = ['Rita', 'Dash', 'Sky'], cols = [0x2f8f5a, 0x7b3fb0, 0xe8823a];
    this.cars = [this.player, ...tr.T.ai.map((sk, k) => { const c = mk(cols[k], k % 2 ? -w / 4 : w / 4, k + 1, null, { skill: sk, name: names[k], top: 30 + sk * 10, grip: 0.7 + sk * 0.25 }); c.v = 0; return c; })];
    this.t = -3.2; this.active = true; this._snap = true; this.tele = { off: 0, slide: 0, wall: 0, top: 0, dirtSlow: 0 };
    this.finishOrder = []; this.gas = 0; this.brake = 0;
    return new Promise((res) => (this._resolve = res));
  }
  _nearest(c) {
    const S = this.tr.S; let best = c.idx, bd = 1e9;
    for (let k = -15; k <= 25; k++) { const i = (c.idx + k + S.N) % S.N, p = S.s[i]; const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2; if (d < bd) { bd = d; best = i; } }
    const prev = c.idx; c.idx = best;
    if (prev > S.N * 0.85 && best < S.N * 0.15 && c.half) { c.lap++; c.half = false; }
    if (best > S.N * 0.45 && best < S.N * 0.6) c.half = true;
    const p = S.s[best], nx = -p.ty, ny = p.tx, L = Math.hypot(nx, ny);
    return { p, off: ((c.x - p.x) * nx + (c.y - p.y) * ny) / L, nx: nx / L, ny: ny / L };
  }
  update(dt) {
    if (!this.active) return;
    const T = this.tr.T, S = this.tr.S, w = T.width;
    this.t += dt;
    const racing = this.t >= 0;
    // ---- player car
    const c = this.player, st = c.stats, mv = this.input.read();
    let steer = THREE.MathUtils.clamp(mv.x, -1, 1), gas = Math.max(this.gas, mv.y > 0.2 ? mv.y : 0), brk = Math.max(this.brake, mv.y < -0.3 ? -mv.y : 0);
    if (window.__autoDrive) {   // automated-test autopilot only
      const tgt = S.s[(c.idx + 12) % S.N]; let dh = Math.atan2(tgt.x - c.x, tgt.y - c.y) - c.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      steer = THREE.MathUtils.clamp(dh * 2.5, -1, 1); gas = Math.abs(dh) > 0.5 && c.v > 14 ? 0 : 1;
    }
    const near = this._nearest(c), off = Math.abs(near.off) > w / 2 + 0.6, dirt = T.dirt.some(([u0, u1]) => near.p.u >= u0 && near.p.u <= u1);
    let top = st.top, grip = st.grip;
    if (dirt) { grip *= 0.55 + 0.45 * st.off; top *= 0.6 + 0.4 * st.off; }
    if (off) { top *= st.off; grip *= 0.8; }
    if (racing && !c.done) { c.v += (gas * st.acc * (1 - c.v / Math.max(1, top)) - brk * 16 - (gas ? 0 : 1.6)) * dt; c.v = THREE.MathUtils.clamp(c.v, 0, Math.max(top, c.v - 20 * dt)); if (c.v > top) c.v -= (c.v - top) * 2 * dt; }
    else c.v *= 1 - 2 * dt;
    let omega = steer * st.handling * Math.min(1, c.v / 8);
    const lat = c.v * Math.abs(omega), limit = grip * 11;
    let slide = 0;
    if (lat > limit && c.v > 4) { slide = (lat - limit) / limit; omega *= limit / lat; c.v *= 1 - Math.min(0.6, slide) * 1.2 * dt; this.tele.slide += dt; }
    c.h += omega * dt;
    const fx = Math.sin(c.h), fy = Math.cos(c.h);
    c.x += fx * c.v * dt; c.y += fy * c.v * dt;
    if (slide) { c.x += near.nx * Math.sign(near.off || 1) * slide * 3 * dt; c.y += near.ny * Math.sign(near.off || 1) * slide * 3 * dt; }
    if (Math.abs(near.off) > w / 2 + 3) { const k = (Math.abs(near.off) - (w / 2 + 3)) * Math.sign(near.off); c.x -= near.nx * k; c.y -= near.ny * k; c.v *= 0.55; this.tele.wall++; }
    if (off && racing) this.tele.off += dt; if (dirt && racing) this.tele.dirtSlow += dt;
    this.tele.top = Math.max(this.tele.top, c.v);
    // ---- AI cars: follow the racing line, slow for curves according to their grip
    for (const a of this.cars) {
      if (a === c) continue;
      const nr = this._nearest(a); const ahead = S.s[(a.idx + 10) % S.N];
      const cv = Math.max(...[4, 8, 14, 20].map((k) => S.s[(a.idx + k) % S.N].curv));
      const tgt = Math.min(a.ai.top, Math.sqrt(a.ai.grip * 11 / Math.max(0.004, cv))) * (T.dirt.some(([u0, u1]) => nr.p.u >= u0 && nr.p.u <= u1) ? 0.72 : 1);
      if (racing && !a.done) a.v += THREE.MathUtils.clamp(tgt - a.v, -14 * dt, 8 * a.ai.skill * dt); else a.v *= 1 - 2 * dt;
      const tx = ahead.x + nr.nx * a.lane * 0.6 - a.x, ty = ahead.y + nr.ny * a.lane * 0.6 - a.y; const want = Math.atan2(tx, ty);
      let dh = want - a.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); a.h += dh * Math.min(1, dt * 4);
      a.x += Math.sin(a.h) * a.v * dt; a.y += Math.cos(a.h) * a.v * dt;
    }
    // simple car-to-car bumps
    for (let i = 0; i < this.cars.length; i++) for (let j = i + 1; j < this.cars.length; j++) { const A = this.cars[i], B = this.cars[j], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy); if (d < 2.4 && d > 0.01) { const k = (2.4 - d) / 2; A.x -= dx / d * k; A.y -= dy / d * k; B.x += dx / d * k; B.y += dy / d * k; } }
    for (const a of this.cars) {
      if (!a.done && a.lap >= this.laps) { a.done = true; a.time = this.t; this.finishOrder.push(a); }
      a.m.position.copy(P2W(OX + a.x, OY + a.y, 0)); a.m.rotation.y = Math.PI - a.h;
    }
    // ---- chase camera
    const cw = P2W(OX + c.x, OY + c.y, 0), fwd = new THREE.Vector3(Math.sin(c.h), 0, -Math.cos(c.h));
    const want = cw.clone().addScaledVector(fwd, -7.5).add(new THREE.Vector3(0, 3.2, 0));
    if (this._snap) { this.camera.position.copy(want); this._snap = false; } else this.camera.position.lerp(want, 1 - Math.exp(-dt * 6)); this.camera.lookAt(cw.clone().addScaledVector(fwd, 5).add(new THREE.Vector3(0, 1, 0)));
    // ---- HUD
    const order = [...this.cars].sort((a, b) => (b.done - a.done) || (a.done && b.done ? a.time - b.time : (b.lap * S.N + b.idx) - (a.lap * S.N + a.idx)));
    const pos = order.indexOf(c) + 1;
    this.hud({ count: this.t < 0 ? Math.ceil(-this.t) : this.t < 0.8 ? 'GO!' : '', lap: Math.min(this.laps, c.lap + 1), laps: this.laps, pos, of: this.cars.length, kmh: Math.round(c.v * 3.6), dirt, off, slide: slide > 0.15 });
    if (c.done && !this._ending) { this._ending = true; setTimeout(() => this._finish(order), 1600); }
    if (this.t > 240 && !this._ending) { this._ending = true; c.done = true; c.time = this.t; this._finish(order); }
    return P2W(OX + c.x, OY + c.y, 0);
  }
  _finish(order) {
    this.active = false;
    const res = { place: order.indexOf(this.player) + 1, time: this.player.time, tele: { ...this.tele }, order: order.map((a) => (a === this.player ? 'You' : a.ai.name)) };
    for (const a of this.cars) this.scene.remove(a.m);
    this.tr.g.visible = false; this._ending = false;
    this._resolve(res);
  }
  /** Garage preview car */
  static preview(build) { const m = carMesh(build.color); if (build.body === 'truck') m.scale.set(1.08, 1.15, 1.05); if (build.body === 'coupe') m.scale.set(1, 0.85, 1.08); return m; }
}
