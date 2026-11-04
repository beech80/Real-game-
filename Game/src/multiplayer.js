// REAL — child-safe live neighbors. Other players appear as anonymous REALs in the same district.
// Only presence is shared (species, jacket colour, position, a preset gesture). No names, no chat, no trading.
import * as THREE from 'three';
import { P2W } from './world.js';
import { Character, loadSpecies, SPECIES } from './characters.js';

const EMOTES = ['👋', '🎉', '👍', '💡'];
const SPECIES_IDS = SPECIES.map((s) => s.id);
const num = (v, lo, hi) => (typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : null);

function bubble(text) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(64, 60, 52, 0, Math.PI * 2); g.fill();
  g.font = '64px system-ui, Apple Color Emoji, Segoe UI Emoji'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 64, 64);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
  s.scale.set(0.6, 0.6, 1); s.position.y = 2.25; s.renderOrder = 5; return s;
}

export class Neighbors {
  constructor(scene) { this.scene = scene; this.room = null; this.peers = new Map(); this.count = null; this.myEmote = { i: -1, t: 0 }; this.sendT = 0; }
  async connect() {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return false;
      const room = await window.claude.use('room');
      if (!room) return false;
      this.room = room; this.count = 0;
      room.onPeers((ch) => this.sync(ch.peers), () => { this.room = null; this.count = null; });
      return true;
    } catch (e) { return false; }
  }
  emote(i) { this.myEmote = { i, t: Date.now() }; }
  /** Call every frame with my state. Sends presence at ~5 Hz. */
  update(dt, me, loc) {
    if (!this.room) return;
    this.sendT += dt;
    if (this.sendT > 0.2) {
      this.sendT = 0;
      this.room.presence({ v: 1, loc, x: Math.round(me.pos.x * 10) / 10, y: Math.round(me.pos.y * 10) / 10, h: Math.round(me.heading * 100) / 100, sp: me.species, j: me.jacket | 0, hd: me.hoodie | 0, mv: me.moving ? 1 : 0, em: this.myEmote.i, et: this.myEmote.t }).catch(() => {});
    }
    for (const p of this.peers.values()) {
      if (!p.ch) continue;
      const vis = p.loc === loc && loc !== 'apartment' && loc !== 'club';
      p.ch.root.visible = vis;
      if (!vis) continue;
      p.cur.x += (p.x - p.cur.x) * Math.min(1, dt * 6); p.cur.y += (p.y - p.cur.y) * Math.min(1, dt * 6);
      p.ch.root.position.copy(P2W(p.cur.x, p.cur.y, loc === 'apartment' ? -500 : 0.13));
      p.ch.root.rotation.y = Math.PI - p.h;
      p.ch.locomote(p.mv ? 2.2 : 0, dt); p.ch.update(dt);
      if (p.bub) { p.bubT -= dt; if (p.bubT <= 0) { p.ch.root.remove(p.bub); p.bub = null; } }
    }
  }
  sync(list) {
    const seen = new Set();
    for (const peer of list) {
      if (peer.isMe || peer.kind !== 'viewer') continue;
      const pr = peer.presence || {};
      const sp = SPECIES_IDS.includes(pr.sp) ? pr.sp : null, x = num(pr.x, -1e4, 1e4), y = num(pr.y, -1e4, 1e4);
      if (!sp || x === null || y === null || typeof pr.loc !== 'string') continue;
      seen.add(peer.peer);
      let p = this.peers.get(peer.peer);
      if (!p) { p = { cur: { x, y }, ch: null, loading: false, em: -1, et: 0 }; this.peers.set(peer.peer, p); }
      Object.assign(p, { x, y, h: num(pr.h, -10, 10) || 0, loc: pr.loc.slice(0, 16), mv: pr.mv === 1 });
      if (!p.ch && !p.loading) {
        p.loading = true;
        loadSpecies(sp).then((g) => { const ch = new Character(g, { outfit: { jacket: num(pr.j, 0, 0xffffff) ?? 0x14204a, hoodie: num(pr.hd, 0, 0xffffff) ?? 0xe6dccb } }); ch.root.visible = false; this.scene.add(ch.root); p.ch = ch; if (!this.peers.has(peer.peer)) this.scene.remove(ch.root); }).catch(() => {});
      }
      const em = num(pr.em, -1, 3), et = num(pr.et, 0, 1e15) || 0;
      if (em !== null && em >= 0 && et !== p.et && p.ch) { p.et = et; if (p.bub) p.ch.root.remove(p.bub); p.bub = bubble(EMOTES[em]); p.bubT = 3; p.ch.root.add(p.bub); }
    }
    for (const [k, p] of this.peers) if (!seen.has(k)) { if (p.ch) this.scene.remove(p.ch.root); this.peers.delete(k); }
    this.count = this.peers.size;
  }
  nearbyWave(me, loc) {   // a neighbor waving within 4 m
    for (const p of this.peers.values()) if (p.loc === loc && p.bub && p.bubT > 2.9 && Math.hypot(p.x - me.x, p.y - me.y) < 4) return true;
    return false;
  }
}
export { EMOTES };
