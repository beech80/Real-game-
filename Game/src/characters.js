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
  }

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
