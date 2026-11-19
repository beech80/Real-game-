// The MP3 packs (public/voice/p<n>.mp3 + manifest "c"), made from the same full-quality masters as the Opus packs.
// iPhones and iPads before iOS 18.4 can't play Ogg Opus, so they read these instead: they used to hold the first, rougher
// recording. Same short silences as the Opus clips (and the same start trims, so the word timings fit both).
// node packmp3.mjs        (run after packopus.mjs TRIMSIL=1, which writes trims.json; GAME=<path to Game/> outside the repo)
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
import fs from 'fs'; import crypto from 'crypto'; import { spawn } from 'child_process'; import os from 'os';
const DIR = new URL('./', import.meta.url).pathname, GAME = process.env.GAME || new URL('../../', import.meta.url).pathname, OUT = GAME + 'public/voice/';
const { voiceId } = await import(GAME + 'src/readalong.js');
const KBPS = process.env.KBPS || '32', N = +(process.env.PACKS || 54), SR = 24000;
const LISTS = 'sentences.json few_en.json new_en.json r2_en.json words.json new_w.json r2_w.json r3_en.json r4_en.json sentences_es.json few_es.json new_es.json r2_es.json r3_es.json r4_es.json words_es.json words_es_tpl.json'.split(' ').filter((f) => fs.existsSync(DIR + f));
const sha = (k) => crypto.createHash('sha1').update(k).digest('hex').slice(0, 14);
const TRIM = 'silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.03,areverse';
fs.mkdirSync(DIR + 'mp3t', { recursive: true });
const run = (args, input) => new Promise((res, rej) => { const p = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'ignore'] }); const out = []; p.stdout.on('data', (d) => out.push(d)); p.on('error', rej); p.on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res(Buffer.concat(out)))); p.stdin.on('error', () => {}); p.stdin.end(input || undefined); });
const seen = new Set(), jobs = [];
for (const f of LISTS) for (const [k] of JSON.parse(fs.readFileSync(DIR + f))) { const id = voiceId(k); if (seen.has(id)) continue; const src = `${DIR}hq/${sha(k)}.flac`; if (!fs.existsSync(src)) continue; seen.add(id); jobs.push({ id, k, src, out: `${DIR}mp3t/${sha(k)}.mp3`, msf: `${DIR}mp3t/${sha(k)}.ms` }); }
const todo = jobs.filter((j) => !fs.existsSync(j.out)); let done = 0;
const enc = async (j) => {
  try {   // the same trim as packopus.mjs TRIMSIL: 40 ms before the voice, 160 ms after, 5 ms fades
    const raw = await run(['-loglevel', 'error', '-i', j.src, ...(/^(w|esw):/.test(j.k) ? ['-af', TRIM] : []), '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-']);
    const x = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength - (raw.byteLength % 4))), fr = 240, e = [];
    for (let i = 0; i + fr <= x.length; i += fr) { let q = 0; for (let k = 0; k < fr; k++) q += x[i + k] * x[i + k]; e.push(Math.sqrt(q / fr)); }
    const top = Math.max(1e-6, ...e), thr = Math.max(0.004, top * 0.02);
    let a = 0; while (a < e.length - 1 && e[a] < thr) a++; let z = e.length - 1; while (z > a && e[z] < thr) z--;
    const s0 = Math.max(0, a * fr - Math.round(0.04 * SR)), s1 = Math.min(x.length, (z + 1) * fr + Math.round(0.16 * SR)), y = x.slice(s0, s1), f = Math.min(120, y.length >> 2);
    for (let i = 0; i < f; i++) { y[i] *= i / f; y[y.length - 1 - i] *= i / f; }
    await run(['-loglevel', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', KBPS + 'k', '-map_metadata', '-1', '-id3v2_version', '0', '-write_xing', '0', '-f', 'mp3', j.out + '.tmp'], Buffer.from(y.buffer));
    fs.writeFileSync(j.msf, String(Math.round(1000 * y.length / SR))); fs.renameSync(j.out + '.tmp', j.out);
  } catch (e) { console.log('failed', j.k.slice(0, 60), String(e.message).slice(0, 100)); }
  if (++done % 2000 === 0) console.log(`encoded ${done}/${todo.length}`);
};
await Promise.all([...Array(Math.max(2, os.cpus().length))].map(async () => { for (let j; (j = todo.pop());) await enc(j); }));
for (const f of fs.readdirSync(OUT)) if (/^p\d+\.mp3$/.test(f)) fs.rmSync(OUT + f);
const buckets = [...Array(N)].map(() => []); for (const j of jobs) if (fs.existsSync(j.out)) buckets[parseInt(j.id.slice(-4), 36) % N].push(j);
const c = {}; let bytes = 0, clips = 0;
for (let p = 0; p < N; p++) { const parts = []; let off = 0; for (const j of buckets[p]) { const b = fs.readFileSync(j.out); c[j.id] = [p, off, b.length, +fs.readFileSync(j.msf, 'utf8')]; parts.push(b); off += b.length; clips++; } fs.writeFileSync(`${OUT}p${p}.mp3`, Buffer.concat(parts)); bytes += off; }
const man = JSON.parse(fs.readFileSync(OUT + 'manifest.json')); man.c = c; man.n = N; fs.writeFileSync(OUT + 'manifest.json', JSON.stringify(man));
console.log(`${clips} MP3 clips · ${N} packs · ${(bytes / 1048576).toFixed(1)} MB`);
