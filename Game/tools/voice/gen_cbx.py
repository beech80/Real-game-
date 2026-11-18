# Record Heart's English lines with Chatterbox (MIT licence), a more natural voice model than Kokoro.
# Lossless masters in cbx_hq/<id>.flac, same ids as hq/. Resumable; several workers can share the list.
# python gen_cbx.py <worker> <workers> [lists...]     EXAG / CFG set the expression (defaults 0.5 / 0.5)
import sys, os, json, hashlib, subprocess, time, torch, torchaudio
from chatterbox.tts import ChatterboxTTS
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, 'cbx_hq'); os.makedirs(OUT, exist_ok=True)
W, N = int(sys.argv[1]), int(sys.argv[2]); LISTS = sys.argv[3:] or ['sentences.json', 'few_en.json', 'new_en.json', 'r2_en.json', 'r3_en.json', 'r4_en.json']
EXAG, CFG = float(os.environ.get('EXAG', 0.5)), float(os.environ.get('CFG', 0.5))
torch.set_num_threads(int(os.environ.get('THREADS', 2)))
sha = lambda k: hashlib.sha1(k.encode()).hexdigest()[:14]
seen, items = set(), []
for f in LISTS:
    p = os.path.join(D, f)
    if not os.path.exists(p): continue
    for k, t in json.load(open(p)):
        if k in seen or k.startswith(('es:', 'esw:')): continue
        seen.add(k); items.append((k, t))
mine = [x for i, x in enumerate(items) if i % N == W and not os.path.exists(os.path.join(OUT, sha(x[0]) + '.flac'))]
print(f'worker {W}/{N}: {len(mine)} of {len(items)} to make', flush=True)
m = ChatterboxTTS.from_pretrained(device='cpu')
RESPELL = [('Okafor', 'O-kah-for')]
n, t0, secs = 0, time.time(), 0.0
for k, t in mine:
    out = os.path.join(OUT, sha(k) + '.flac')
    if os.path.exists(out): continue
    try:
        txt = t
        for a, b in RESPELL: txt = txt.replace(a, b)
        wav = m.generate(txt, exaggeration=EXAG, cfg_weight=CFG)
        tmp = out + f'.{W}.wav'; torchaudio.save(tmp, wav, m.sr)
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp, '-ac', '1', '-ar', '24000', '-c:a', 'flac', '-sample_fmt', 's16', out + f'.{W}.flac'], check=True)
        os.replace(out + f'.{W}.flac', out); os.remove(tmp); n += 1; secs += wav.shape[-1] / m.sr
        if n % 50 == 0: print(f'worker {W}: {n}/{len(mine)} · {secs / 60:.1f} min of audio in {(time.time() - t0) / 60:.1f} min', flush=True)
    except Exception as e:
        print('skip', t[:60], e, flush=True)
print(f'worker {W} done: {n}', flush=True)
