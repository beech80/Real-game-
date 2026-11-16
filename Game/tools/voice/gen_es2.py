# Re-record Heart's Spanish voice (Piper es_MX-claude-high) as lossless masters: hq/<id>.flac. Resumable.
# python gen_es2.py sentences_es.json words_es.json ...
import json, sys, os, hashlib, wave, subprocess
from piper import PiperVoice
D = os.path.dirname(os.path.abspath(__file__))
voice = PiperVoice.load(os.path.join(D, 'piper', 'es_MX-claude-high.onnx'))
os.makedirs(os.path.join(D, 'hq'), exist_ok=True)
sha = lambda k: hashlib.sha1(k.encode()).hexdigest()[:14]
seen, items = set(), []
for f in sys.argv[1:]:
    p = os.path.join(D, f)
    if not os.path.exists(p): continue
    for k, t in json.load(open(p)):
        if k in seen or not k.startswith(('es:', 'esw:')): continue
        seen.add(k); items.append((k, t))
todo = [(k, t) for k, t in items if not os.path.exists(os.path.join(D, 'hq', sha(k) + '.flac'))]
print(f'{len(todo)} of {len(items)} to make', flush=True)
for n, (k, t) in enumerate(todo, 1):
    wav = os.path.join(D, 'hq', sha(k) + '.es.wav'); out = os.path.join(D, 'hq', sha(k) + '.flac')
    try:
        with wave.open(wav, 'wb') as wf:
            voice.synthesize_wav(t, wf)
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-c:a', 'flac', out + '.tmp.flac'], check=True)
        os.replace(out + '.tmp.flac', out); os.remove(wav)
    except Exception as e:
        print('skip', t[:60], e, flush=True)
    if n % 500 == 0: print(f'{n}/{len(todo)}', flush=True)
print('done', flush=True)
