// Record the narrator: node gen.mjs <worker> <workers>. Resumable: skips clips already made.
// Each sentence → clips/<id>.mp3 (24 kHz mono, 24 kbps) using Kokoro's af_heart voice at a kid-friendly pace.
import { KokoroTTS } from 'kokoro-js';
import { env } from '@huggingface/transformers';
import fs from 'fs'; import crypto from 'crypto'; import { execFileSync } from 'child_process';
env.allowRemoteModels = false; env.localModelPath = new URL('./models/', import.meta.url).pathname;
const DIR = new URL('./', import.meta.url).pathname, W = +process.argv[2] || 0, N = +process.argv[3] || 1;
const VOICE = process.env.VOICE || 'af_heart', SPEED = +(process.env.SPEED || 0.95);
fs.mkdirSync(DIR + 'clips', { recursive: true });
const all = JSON.parse(fs.readFileSync(DIR + (process.env.LIST || 'sentences.json')));
const id = (k) => crypto.createHash('sha1').update(k).digest('hex').slice(0, 14);
const mine = all.filter((_, i) => i % N === W).filter(([k]) => !fs.existsSync(`${DIR}clips/${id(k)}.mp3`));
console.log(`worker ${W}/${N}: ${mine.length} to make`);
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
let n = 0, secs = 0; const t0 = Date.now();
for (const [k, text] of mine) {
  try {
    const a = await tts.generate(text, { voice: VOICE, speed: SPEED });
    const wav = `${DIR}clips/${id(k)}.${W}.wav`; await a.save(wav);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '24000', '-b:a', '24k', `${DIR}clips/${id(k)}.mp3`]);
    fs.unlinkSync(wav); secs += a.audio.length / a.sampling_rate; n++;
    if (n % 50 === 0) console.log(`worker ${W}: ${n}/${mine.length} · ${(secs / 60).toFixed(1)} min of audio in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  } catch (e) { console.log('skip', JSON.stringify(text).slice(0, 80), e.message); }
}
console.log(`worker ${W} done: ${n} clips`);
