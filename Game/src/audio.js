// REAL — audio: synthesized SFX + generative lo-fi soundtrack (no files to download).
export class Audio {
  constructor() { this.ctx = null; this.on = true; try { this.on = localStorage.getItem('real.sound') !== 'off'; } catch (e) {} }
  start() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = this.on ? 0.8 : 0; this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.22;
    this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
    this.musicBus.connect(lp); lp.connect(this.master);
    this._music();
  }
  toggle() { this.on = !this.on; try { localStorage.setItem('real.sound', this.on ? 'on' : 'off'); } catch (e) {} if (this.master) this.master.gain.value = this.on ? 0.8 : 0; return this.on; }
  tone(f, t0, dur, type = 'sine', vol = 0.2, bus) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || this.sfxBus || this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  /** Wind across the empty fields (Chapter 1). level 0..1, smoothed. */
  wind(level) {
    if (!this.ctx) return;
    if (!this.windNode) {
      const c = this.ctx, len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      let b = 0; for (let i = 0; i < len; i++) { b = 0.985 * b + 0.015 * (Math.random() * 2 - 1); d[i] = b * 3; }
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.6;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.13; const lg = c.createGain(); lg.gain.value = 220; lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
      this.windGain = c.createGain(); this.windGain.gain.value = 0;
      src.connect(bp); bp.connect(this.windGain); this.windGain.connect(this.master); src.start(); this.windNode = src;
    }
    const g = this.windGain.gain; g.value += ((level ? 0.5 : 0) - g.value) * 0.02;
    if (this.musicBus) this.musicBus.gain.value += ((level ? 0.06 : 0.22) - this.musicBus.gain.value) * 0.02;
  }
  play(name) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime;
    const S = {
      click: () => this.tone(880, t, 0.06, 'triangle', 0.08),
      scan: () => { this.tone(1760, t, 0.09, 'square', 0.05); },
      coin: () => { this.tone(1318, t, 0.12, 'triangle', 0.12); this.tone(1975, t + 0.07, 0.3, 'triangle', 0.1); },
      cash: () => { [1046, 1318, 1568, 2093].forEach((f, i) => this.tone(f, t + i * 0.06, 0.35, 'triangle', 0.1)); },
      good: () => { this.tone(659, t, 0.15, 'sine', 0.15); this.tone(988, t + 0.1, 0.3, 'sine', 0.15); },
      bad: () => { this.tone(220, t, 0.18, 'sawtooth', 0.06); this.tone(185, t + 0.12, 0.25, 'sawtooth', 0.06); },
      level: () => { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.09, 0.4, 'triangle', 0.12)); },
      door: () => { this.tone(330, t, 0.25, 'sine', 0.1); this.tone(247, t + 0.1, 0.3, 'sine', 0.08); },
      phone: () => { this.tone(1200, t, 0.05, 'sine', 0.08); this.tone(1600, t + 0.06, 0.08, 'sine', 0.08); },
      whoosh: () => { const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noise; src.playbackRate.value = 0.35; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(600, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 0.14); const g = c.createGain(); g.gain.value = 0.12; src.connect(bp); bp.connect(g); g.connect(this.sfxBus); src.start(t); },
      step: () => { const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noise; src.playbackRate.value = 0.5 + Math.random() * 0.2; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; const g = c.createGain(); g.gain.value = 0.05; src.connect(lp); lp.connect(g); g.connect(this.sfxBus); src.start(t); },
      reward: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, t + i * 0.07, 0.5, 'triangle', 0.1)); [1568, 2093].forEach((f, i) => this.tone(f, t + 0.42 + i * 0.05, 0.6, 'sine', 0.06)); },
      register: () => { this.tone(1567, t, 0.07, 'square', 0.05); this.tone(2093, t + 0.08, 0.12, 'square', 0.05); },
      msg: () => { this.tone(1046, t, 0.12, 'sine', 0.1); this.tone(1568, t + 0.12, 0.2, 'sine', 0.1); },
    };
    S[name] && S[name]();
  }
  // ---------------------------------------------------------------------------------- the soundtrack
  // Original generative music, made live (nothing to download). Each mood has its own chords, tempo and
  // instruments; moving between places crossfades at the next bar. Volumes: music / sounds / Heart's voice.
  static MOODS = {
    city: { bpm: 76, chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], keys: 'triangle', hats: 0, kick: 0, lead: 0.5, vol: 1 },
    midtown: { bpm: 96, chords: [[48, 52, 55, 59], [45, 48, 52, 55], [50, 53, 57, 60], [43, 47, 50, 53]], keys: 'square', hats: 0, kick: 0, lead: 0.7, vol: 0.85 },
    heights: { bpm: 68, chords: [[50, 54, 57, 61], [47, 50, 54, 57], [43, 47, 50, 54], [45, 49, 52, 55]], keys: 'sine', hats: 0, kick: 0, lead: 0.8, vol: 1 },
    wild: { bpm: 52, chords: [[48, 50, 55, 62], [43, 45, 50, 57], [45, 47, 52, 59], [41, 43, 48, 55]], keys: 'sine', hats: 0, kick: 0, lead: 0.25, vol: 0.9, pad: 1 },
    club: { bpm: 88, chords: [[50, 53, 57, 60, 64], [43, 47, 53, 57, 64], [48, 52, 55, 59, 62], [45, 49, 55, 58, 64]], keys: 'triangle', hats: 0, kick: 0, lead: 0.6, vol: 0.9, swing: 1 },
    indoor: { bpm: 72, chords: [[53, 57, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 60]], keys: 'triangle', hats: 0, kick: 0, lead: 0.35, vol: 0.75 },
    night: { bpm: 62, chords: [[45, 48, 52, 55], [41, 45, 48, 52], [48, 52, 55, 59], [43, 47, 50, 52]], keys: 'sine', hats: 0, kick: 0, lead: 0.3, vol: 0.7, pad: 1 },
    lesson: { bpm: 64, chords: [[48, 52, 55, 59], [53, 57, 60, 64], [45, 48, 52, 55], [50, 53, 57, 62]], keys: 'sine', hats: 0, kick: 0, lead: 0.15, vol: 0.5, pad: 1 },
  };
  setMood(m) { if (!Audio.MOODS[m] || m === this.wantMood) return; this.wantMood = m; }
  vol() { try { return Object.assign({ music: 0.8, sfx: 0.9, voice: 1 }, JSON.parse(localStorage.getItem('real.vol') || '{}')); } catch (e) { return { music: 0.8, sfx: 0.9, voice: 1 }; } }
  setVol(k, v) { const V = this.vol(); V[k] = Math.max(0, Math.min(1, v)); try { localStorage.setItem('real.vol', JSON.stringify(V)); } catch (e) {} this.applyVol(); }
  applyVol() { if (!this.ctx) return; const V = this.vol(), t = this.ctx.currentTime; this.musicBus.gain.setTargetAtTime(0.26 * V.music * ((Audio.MOODS[this.mood] || {}).vol || 1), t, 0.3); this.sfxBus.gain.setTargetAtTime(V.sfx, t, 0.05); }
  _kick(t) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18); g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + 0.25); }
  _hat(t, v) { const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise; const g = c.createGain(); g.gain.value = v; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6500; s.connect(hp); hp.connect(g); g.connect(this.musicBus); s.start(t); }
  _pad(f, t, dur, v) { const c = this.ctx; for (const det of [-6, 6]) { const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; lp.type = 'lowpass'; lp.frequency.value = 900; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(lp); lp.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + dur + 0.1); } }
  _music() {
    const c = this.ctx, mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
    this.noise = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate); const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    this.mood = this.wantMood || 'city'; this.applyVol();
    let bar = 0, next = c.currentTime + 0.2, lastNote = 72;
    const sched = () => {
      while (next < c.currentTime + 1.5) {
        if (this.wantMood && this.wantMood !== this.mood) {   // crossfade: dip, switch on the bar line, rise
          const t0 = next; this.musicBus.gain.setTargetAtTime(0.0001, t0 - 0.9, 0.25);
          this.mood = this.wantMood; const V = this.vol(); this.musicBus.gain.setTargetAtTime(0.26 * V.music * (Audio.MOODS[this.mood].vol || 1), t0 + 0.1, 0.6); bar = 0;
        }
        const M = Audio.MOODS[this.mood], beat = 60 / M.bpm, ch = M.chords[bar % M.chords.length];
        if (M.pad) ch.forEach((m) => this._pad(mtof(m), next, beat * 4.2, 0.018));
        else ch.forEach((m, i) => this.tone(mtof(m + 12), next + i * (M.swing ? 0.03 : 0.015), beat * 3.6, M.keys, M.keys === 'square' ? 0.018 : 0.045, this.musicBus));
        this._pad(mtof(ch[0] - 12), next, beat * 4.2, 0.05);   // a soft, slow bass under the chords: no drum, no thump
        
        if (M.kick) for (const k of [0, 2]) this._kick(next + k * beat);
        if (M.hats) for (let k = 0; k < 8; k++) this._hat(next + k * beat / 2 + (k % 2 ? (M.swing ? beat * 0.16 : 0.03) : 0), k % 2 ? 0.014 : 0.026);
        // a gentle melody that wanders over the chord (pentatonic, mostly steps)
        const scale = [0, 2, 4, 7, 9].map((x) => ch[0] + 24 + x);
        for (let k = 0; k < 4; k++) if (Math.random() < M.lead) {
          const near = scale.concat(scale.map((x) => x + 12)).sort((a, b) => Math.abs(a - lastNote) - Math.abs(b - lastNote)).slice(0, 4); lastNote = near[Math.floor(Math.random() * near.length)];
          this.tone(mtof(lastNote), next + k * beat + (Math.random() < 0.3 ? beat / 2 : 0), beat * 0.9, 'sine', 0.035, this.musicBus);
        }
        next += beat * 4; bar++;
      }
      setTimeout(sched, 400);
    };
    sched();
  }
}
