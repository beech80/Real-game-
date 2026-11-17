// Re-record Heart's English voice at full quality: the full (fp32) Kokoro model, and a lossless master kept in hq/<id>.flac
// so the clips can be encoded again later without recording again. Resumable: skips masters already made.
// node gen2.mjs [worker] [workers]
import { KokoroTTS } from 'kokoro-js';
import { env } from '@huggingface/transformers';
import fs from 'fs'; import crypto from 'crypto'; import { execFileSync } from 'child_process';
env.allowRemoteModels = false; env.localModelPath = new URL('./models/', import.meta.url).pathname;
const DIR = new URL('./', import.meta.url).pathname, W = +process.argv[2] || 0, N = +process.argv[3] || 1;
const VOICE = process.env.VOICE || 'af_heart', SPEED = +(process.env.SPEED || 0.95);
fs.mkdirSync(DIR + 'hq', { recursive: true });
const LISTS = (process.env.LISTS || 'sentences.json few_en.json new_en.json r2_en.json words.json new_w.json r2_w.json r3_en.json r4_en.json').split(' ').filter((f) => fs.existsSync(DIR + f));
const id = (k) => crypto.createHash('sha1').update(k).digest('hex').slice(0, 14);
const seen = new Set(), all = [];
for (const f of LISTS) for (const [k, text] of JSON.parse(fs.readFileSync(DIR + f))) { if (/^esw?:/.test(k) || seen.has(k)) continue; seen.add(k); all.push([k, text]); }
const FORCE = !!process.env.FORCE;   // record again over an existing master (a new speed)
const mine = all.filter((_, i) => i % N === W).filter(([k]) => FORCE || !fs.existsSync(`${DIR}hq/${id(k)}.flac`));
if (process.env.REV) mine.reverse();   // a second recorder can work from the other end of the list
console.log(`worker ${W}/${N}: ${mine.length} of ${all.length} to make`);
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'fp32', device: 'cpu' });
let n = 0, secs = 0; const t0 = Date.now();
for (const [k, text] of mine) {
  if (!FORCE && fs.existsSync(`${DIR}hq/${id(k)}.flac`)) continue;   // another recorder got there first
  try {
    const a = await tts.generate(text, { voice: VOICE, speed: SPEED });
    const wav = `${DIR}hq/${id(k)}.${W}${process.env.REV ? 'r' : ''}.wav`; await a.save(wav);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-c:a', 'flac', '-sample_fmt', 's16', `${DIR}hq/${id(k)}.tmp${W}${process.env.REV ? 'r' : ''}.flac`]);
    fs.renameSync(`${DIR}hq/${id(k)}.tmp${W}${process.env.REV ? 'r' : ''}.flac`, `${DIR}hq/${id(k)}.flac`); fs.unlinkSync(wav); secs += a.audio.length / a.sampling_rate; n++;
    if (n % 200 === 0) console.log(`worker ${W}: ${n}/${mine.length} · ${(secs / 60).toFixed(1)} min of audio in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  } catch (e) { console.log('skip', JSON.stringify(text).slice(0, 80), e.message); }
}
console.log(`worker ${W} done: ${n} clips`);
