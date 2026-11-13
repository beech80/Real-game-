// REAL — characters: species models, animation state, outfits/tints, facial expressions.
import * as THREE from 'three';
import { lookCharacter } from './lookfx.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { loadGLB } from './world.js';

export const SPECIES = [
  { id: 'Fox', name: 'Fox', quote: 'Find your path. Make your own.', traits: 'Strategic · Resourceful · Fearless' },
  { id: 'Cat', name: 'Cat', quote: 'Curious minds create big things.', traits: 'Creative · Adaptable · Independent' },
  { id: 'Dog', name: 'Dog', quote: 'Loyal today. Greater tomorrow.', traits: 'Loyal · Motivated · People-oriented' },
  { id: 'Horse', name: 'Horse', quote: 'Steady steps lead far.', traits: 'Determined · Disciplined · Strong' },
  { id: 'Bird', name: 'Bird', quote: 'See further. Think bigger.', traits: 'Visionary · Free-minded · Quick learner' },
  { id: 'Elephant', name: 'Elephant', quote: 'Big dreams create bigger change.', traits: 'Wise · Patient · Problem solver' },
  { id: 'Lion', name: 'Lion', quote: 'Lead with purpose.', traits: 'Confident · Ambitious · Inspiring' },
  { id: 'Cow', name: 'Cow', quote: 'Kindness builds community.', traits: 'Caring · Reliable · Grounded' },
  { id: 'Dolphin', name: 'Dolphin', quote: 'Go beyond the surface.', traits: 'Positive · Adaptable · Explorative' },
];

export const JACKETS = [
  { id: 'black', name: 'Midnight', color: 0x0b0b0e },
  { id: 'navy', name: 'Navy', color: 0x13214a },
  { id: 'red', name: 'Crimson', color: 0x9c1a14 },
  { id: 'green', name: 'Forest', color: 0x14502a },
  { id: 'cream', name: 'Cream', color: 0xd9cbb3 },
];
export const HOODIES = [
  { id: 'cream', name: 'Cream', color: 0xe6dccb },
  { id: 'pink', name: 'Blush', color: 0xf0b3c0 },
  { id: 'grey', name: 'Grey', color: 0x8a8d96 },
  { id: 'gold', name: 'Gold', color: 0xe9a93a },
];
export const FUR_SHIFT = [
  { id: 'natural', name: 'Natural', mul: 0xffffff },
  { id: 'warm', name: 'Warm', mul: 0xffd9b8 },
  { id: 'cool', name: 'Cool', mul: 0xc9d6ff },
  { id: 'dusk', name: 'Dusk', mul: 0x9a90a8 },
];

const cache = new Map();
export async function loadSpecies(id, onProgress) {
  if (!cache.has(id)) cache.set(id, loadGLB(`assets/chars/${id}.glb.gz`, onProgress));
  return cache.get(id);
}

const CLIP_SPEED = { Walk: 1.25, Run: 3.6, Sprint: 5.6 };   // m/s the clip was authored for (stride)

export class Character {
  constructor(gltf, opts = {}) {
    this.root = SkeletonUtils.clone(gltf.scene);
    this.root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        o.material = o.material.clone();
        o.material.userData.base = o.material.color.clone();
      }
    });
    lookCharacter(this.root);
    this.mixer = new THREE.AnimationMixer(this.root);
    this.actions = {};
    for (const clip of gltf.animations) {
      const short = clip.name.split('_').pop();
      this.actions[short] = this.mixer.clipAction(clip);
    }
    for (const k of ['Jump', 'Wave', 'Pickup']) if (this.actions[k]) { this.actions[k].setLoop(THREE.LoopOnce); this.actions[k].clampWhenFinished = true; }
    this.current = null;
    this.play('Idle', 0);
    this.morphMeshes = [];
    this.root.traverse((o) => { if (o.morphTargetDictionary && o.morphTargetDictionary.Happy !== undefined) this.morphMeshes.push(o); });
    this.expr = { name: null, w: 0, target: 0 };
    this.blinkT = 2 + Math.random() * 3; this.blinkW = 0;
    if (opts.outfit) this.setOutfit(opts.outfit);
    // the seated pose for a wheelchair comes from the Sit clip: hips and legs only, so the arms and head still wave, talk and look around
    this.bones = {}; this.root.traverse((o) => { if (o.isBone) this.bones[o.name] = o; });
    const sit = gltf.animations.find((c) => /_Sit$/.test(c.name)); this.seat = [];
    if (sit) for (const t of sit.tracks) { const [bone, prop] = t.name.split('.'); if (/^(pelvis|thigh|calf|foot|ball)/.test(bone) && this.bones[bone] && (prop === 'quaternion' || prop === 'position')) this.seat.push([this.bones[bone], prop, Array.from(t.values.slice(0, prop === 'position' ? 3 : 4))]); }
    if (opts.aid) this.setAid(opts.aid);
  }

  /** A mobility aid the player can choose: 'chair' (wheelchair), 'crutches', or none. */
  setAid(kind) {
    if (this.aidObj) { this.root.remove(this.aidObj); this.aidObj.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    this.aidObj = null; this.aid = kind === 'chair' || kind === 'crutches' ? kind : null;
    if (!this.aid) { this.mixer.update(0); return; }
    const mat = (c, r = 0.55, m = 0.1) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    const steel = mat(0x9aa3ad, 0.35, 0.6), dark = mat(0x23262b, 0.8), grip = mat(0x2f6fd0, 0.6);
    const add = (g, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    const G = new THREE.Group(); G.name = 'mobility-aid';
    if (this.aid === 'chair') {
      this._applySeat(); this.root.updateWorldMatrix(true, true);
      const pv = this.bones.pelvis ? this.root.worldToLocal(this.bones.pelvis.getWorldPosition(new THREE.Vector3())) : new THREE.Vector3(0, 0.4, 0);
      const sy = Math.max(0.22, pv.y - 0.09), R = Math.min(0.3, sy + 0.04), zc = pv.z;
      add(G, new THREE.BoxGeometry(0.4, 0.05, 0.38), grip, 0, sy, zc + 0.08);                       // seat
      add(G, new THREE.BoxGeometry(0.4, 0.36, 0.04), grip, 0, sy + 0.22, zc - 0.13);                // back rest
      for (const sx of [-1, 1]) {
        add(G, new THREE.BoxGeometry(0.03, 0.03, 0.4), steel, sx * 0.2, sy - 0.04, zc + 0.08);       // seat rails
        add(G, new THREE.BoxGeometry(0.03, 0.5, 0.03), steel, sx * 0.2, sy + 0.2, zc - 0.15);        // back posts
        add(G, new THREE.BoxGeometry(0.03, 0.03, 0.1), dark, sx * 0.2, sy + 0.45, zc - 0.2);         // push handles
        add(G, new THREE.BoxGeometry(0.03, sy - 0.06, 0.03), steel, sx * 0.17, (sy + 0.06) / 2, zc + 0.27);   // front legs
        add(G, new THREE.BoxGeometry(0.13, 0.02, 0.1), dark, sx * 0.1, 0.07, zc + 0.36);              // foot plates
        add(G, new THREE.BoxGeometry(0.03, 0.03, 0.12), steel, sx * 0.17, 0.08, zc + 0.31);
        const w = new THREE.Group(); w.position.set(sx * 0.25, R, zc - 0.02); G.add(w);              // big wheel: tyre, push rim, spokes
        const tyre = add(w, new THREE.TorusGeometry(R - 0.025, 0.025, 8, 28), dark, 0, 0, 0); tyre.rotation.y = Math.PI / 2;
        const rim = add(w, new THREE.TorusGeometry(R - 0.07, 0.012, 6, 24), steel, sx * 0.035, 0, 0); rim.rotation.y = Math.PI / 2;
        for (let k = 0; k < 4; k++) { const sp = add(w, new THREE.BoxGeometry(0.012, (R - 0.03) * 2, 0.012), steel, 0, 0, 0); sp.rotation.x = k * Math.PI / 4; }
        add(w, new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10), steel, 0, 0, 0).rotation.z = Math.PI / 2;
        (this.wheels = sx < 0 ? [w] : [...this.wheels, w]);
        const c = add(G, new THREE.CylinderGeometry(0.06, 0.06, 0.03, 14), dark, sx * 0.17, 0.06, zc + 0.27); c.rotation.z = Math.PI / 2;   // small front wheel
      }
      add(G, new THREE.BoxGeometry(0.5, 0.03, 0.03), steel, 0, R, zc - 0.02);                        // axle
    } else {
      this.crutch = [];
      for (const side of ['l', 'r']) {
        const c = new THREE.Group(); G.add(c);
        const pole = add(c, new THREE.CylinderGeometry(0.014, 0.014, 1, 8), steel, 0, -0.5, 0);       // from the hand down to the ground (scaled each frame)
        const tip = add(c, new THREE.CylinderGeometry(0.022, 0.026, 0.04, 8), dark, 0, -1, 0);
        add(c, new THREE.CylinderGeometry(0.014, 0.014, 0.2, 8), steel, 0, 0.1, -0.02).rotation.x = -0.12;   // upper part along the forearm
        add(c, new THREE.BoxGeometry(0.03, 0.03, 0.11), dark, 0, 0, 0.035);                            // hand grip
        const cuff = add(c, new THREE.TorusGeometry(0.04, 0.012, 6, 14, Math.PI * 1.5), grip, 0, 0.2, 0); cuff.rotation.x = Math.PI / 2; cuff.rotation.z = Math.PI * 0.75;
        this.crutch.push({ g: c, pole, tip, hand: this.bones['hand_' + side], sx: side === 'l' ? 1 : -1 });
      }
    }
    this.aidObj = G; this.root.add(G);
  }
  _applySeat() { for (const [b, prop, v] of this.seat) b[prop].fromArray(v); }

  play(name, fade = 0.25, speed = 1) {
    const a = this.actions[name];
    if (!a) return;
    a.timeScale = speed;
    if (this.current === a) return;
    a.reset().setEffectiveWeight(1).fadeIn(fade).play();
    if (this.current) this.current.fadeOut(fade);
    this.current = a; this.currentName = name;
  }

  /** Locomotion from ground speed (m/s). Picks clip and scales playback so feet don't slide. */
  locomote(speed, dt) {
    this.speed = speed;
    if (this.lock) return;
    if (speed < 0.15) this.play('Idle', 0.3);
    else if (speed < 2.4) { this.play('Walk', 0.25); this.current.timeScale = Math.max(0.6, speed / CLIP_SPEED.Walk); }
    else if (speed < 4.6) { this.play('Run', 0.2); this.current.timeScale = speed / CLIP_SPEED.Run; }
    else { this.play('Sprint', 0.2); this.current.timeScale = speed / CLIP_SPEED.Sprint; }
  }

  oneShot(name, then = 'Idle') {
    const a = this.actions[name];
    if (!a) return;
    this.lock = true;
    this.play(name, 0.15);
    const done = (e) => { if (e.action === a) { this.mixer.removeEventListener('finished', done); this.lock = false; this.play(then, 0.3); } };
    this.mixer.addEventListener('finished', done);
  }

  setOutfit({ jacket, hoodie, fur }) {
    this.outfit = { jacket, hoodie, fur };
    this.root.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material, n = m.name || '', base = m.userData.base;
      if (/Clothing_Black|Clothing_Red|MAT_REAL_Red$/.test(n) && /Jacket/.test(o.name + (o.parent ? o.parent.name : '')) && jacket !== undefined) m.color.setHex(jacket);
      else if (/Clothing_(Cream|Pink)/.test(n) && hoodie !== undefined) m.color.setHex(hoodie);
      else if (/Fur_/.test(n) && fur !== undefined) m.color.copy(base).multiply(new THREE.Color(fur));
    });
  }

  expression(name, hold = 2.5) { this.expr = { name, w: this.expr.name === name ? this.expr.w : 0, target: 1, hold }; }

  _setMorph(name, w) {
    for (const m of this.morphMeshes) { const i = m.morphTargetDictionary[name]; if (i !== undefined) m.morphTargetInfluences[i] = w; }
  }

  update(dt) {
    this.mixer.update(dt);
    if (this.aid === 'chair') {   // seated: hips and legs stay in the chair; the wheels turn with the ground speed
      this._applySeat();
      if (this.wheels) for (const w of this.wheels) w.rotation.x += (this.speed || 0) * dt / 0.28;
    } else if (this.aid === 'crutches' && this.crutch) {   // each crutch stands under its hand and reaches the ground
      this.root.updateWorldMatrix(true, false); const v = this._v || (this._v = new THREE.Vector3());
      for (const c of this.crutch) { if (!c.hand) continue; this.root.worldToLocal(c.hand.getWorldPosition(v)); const hgt = Math.max(0.15, v.y);
        c.g.position.set(v.x + c.sx * 0.02, hgt, v.z); c.pole.scale.y = hgt; c.pole.position.y = -hgt / 2; c.tip.position.y = -hgt + 0.02; }
    }
    // expression envelope
    const e = this.expr;
    if (e.name) {
      if (e.hold !== undefined && e.hold !== Infinity) { e.hold -= dt; if (e.hold <= 0) e.target = 0; }
      e.w += (e.target - e.w) * Math.min(1, dt * 6);
      this._setMorph(e.name, e.w);
      if (e.target === 0 && e.w < 0.01) { this._setMorph(e.name, 0); this.expr = { name: null, w: 0, target: 0 }; }
    }
    // blink
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blinkW = 1; this.blinkT = 2.5 + Math.random() * 3.5; }
    this.blinkW = Math.max(0, this.blinkW - dt * 7);
    const b = Math.sin(Math.min(1, this.blinkW) * Math.PI);
    this._setMorph('Blink_L', b); this._setMorph('Blink_R', b);
  }
}
