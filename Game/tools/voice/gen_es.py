# Record Heart's Spanish voice with Piper (es_MX-claude-high). Resumable: skips clips already made.
# python gen_es.py sentences_es.json   (or words_es.json)
import json, sys, os, hashlib, wave, subprocess
from piper import PiperVoice
D = os.path.dirname(os.path.abspath(__file__))
LIST = sys.argv[1] if len(sys.argv) > 1 else 'sentences_es.json'
voice = PiperVoice.load(os.path.join(D, 'piper', 'es_MX-claude-high.onnx'))
items = json.load(open(os.path.join(D, LIST)))
os.makedirs(os.path.join(D, 'clips'), exist_ok=True)
sha = lambda k: hashlib.sha1(k.encode()).hexdigest()[:14]
todo = [(k, t) for k, t in items if not os.path.exists(os.path.join(D, 'clips', sha(k) + '.mp3'))]
print(f'{len(todo)} to make', flush=True)
for n, (k, t) in enumerate(todo, 1):
    wav = os.path.join(D, 'clips', sha(k) + '.es.wav')
    try:
        with wave.open(wav, 'wb') as wf:
            voice.synthesize_wav(t, wf)
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '24000', '-b:a', '24k', os.path.join(D, 'clips', sha(k) + '.mp3')], check=True)
        os.remove(wav)
    except Exception as e:
        print('skip', t[:60], e, flush=True)
    if n % 100 == 0: print(f'{n}/{len(todo)}', flush=True)
print('done', flush=True)
