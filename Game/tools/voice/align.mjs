// Listen to every recorded sentence (Whisper, word timestamps) to learn two things:
//   1. when Heart starts each word, so the read-along highlight can follow her voice    -> align/<sha>.json
//   2. which words she may be saying wrong (what was heard differs from the text)       -> shown by alignreport.mjs
// Resumable. node align.mjs [worker] [workers]      LANG_=es for the Spanish lists.
import { pipeline, env } from '@huggingface/transformers';
import fs from 'fs'; import crypto from 'crypto'; import { execFileSync } from 'child_process';
const DIR = new URL('./', import.meta.url).pathname, W = +process.argv[2] || 0, N = +process.argv[3] || 1, ES = process.env.LANG_ === 'es';
env.cacheDir = DIR + 'models/';
const LISTS = (process.env.LISTS || (ES ? 'sentences_es.json few_es.json new_es.json r2_es.json r3_es.json' : 'sentences.json few_en.json new_en.json r2_en.json r3_en.json')).split(' ').filter((f) => fs.existsSync(DIR + f));
const sha = (k) => crypto.createHash('sha1').update(k).digest('hex').slice(0, 14);
const OUTD = process.env.OUTD || 'align'; fs.mkdirSync(DIR + OUTD, { recursive: true });
const seen = new Set(), all = [];
for (const f of LISTS) for (const [k, t] of JSON.parse(fs.readFileSync(DIR + f))) { if (/^(esw|w):/.test(k) || seen.has(k) || ES !== /^es:/.test(k)) continue; seen.add(k); if (fs.existsSync(`${DIR}hq/${sha(k)}.flac`)) all.push([k, t]); }
const FORCE = !!process.env.FORCE;
const mine = all.filter((_, i) => i % N === W).filter(([k]) => FORCE || !fs.existsSync(`${DIR}${OUTD}/${sha(k)}.json`));
if (process.env.REV) mine.reverse();
console.log(`worker ${W}/${N}: ${mine.length} of ${all.length} to hear`);
const asr = await pipeline('automatic-speech-recognition', process.env.MODEL || (ES ? 'onnx-community/whisper-base_timestamped' : 'onnx-community/whisper-base.en_timestamped'), { dtype: process.env.DTYPE || 'q8', device: 'cpu' });
let n = 0; const t0 = Date.now();
for (const [k, t] of mine) {
  if (!FORCE && fs.existsSync(`${DIR}${OUTD}/${sha(k)}.json`)) continue;   // another listener got there first
  try {
    const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', `${DIR}hq/${sha(k)}.flac`, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
    const pcm = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
    const out = await asr(pcm, { return_timestamps: 'word', ...(ES ? { language: 'spanish', task: 'transcribe' } : {}) });
    fs.writeFileSync(`${DIR}${OUTD}/${sha(k)}.json`, JSON.stringify({ k, t, d: +(pcm.length / 16000).toFixed(2), w: (out.chunks || []).map((c) => [c.text.trim(), +(c.timestamp[0] || 0).toFixed(2), +(c.timestamp[1] == null ? pcm.length / 16000 : c.timestamp[1]).toFixed(2)]) }));
    if (++n % 200 === 0) console.log(`worker ${W}: ${n}/${mine.length} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  } catch (e) { console.log('skip', t.slice(0, 60), String(e.message).slice(0, 100)); }
}
console.log(`worker ${W} done: ${n}`);
