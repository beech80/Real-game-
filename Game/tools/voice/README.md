# Heart's voice tools

Heart's recorded voice (the files in `public/voice/`) is made with these scripts. Run them from this folder.

1. `node extract.mjs es_src.json`: list the game's English lines.
2. `node collect.mjs` and `node extra.mjs`: build `sentences.json` (every fixed English sentence, Heart's own lines first).
3. `node words.mjs`: build `words.json` (every English word, for reading word by word).
4. `node collect_es.mjs`: build `sentences_es.json` and `words_es.json` for the Spanish voice.
5. Record:
   - English: `npm install`, then put the Kokoro model in `models/` and run `node gen.mjs <worker> <workers>`. Uses the open-source Kokoro voice af_heart.
   - Spanish: `pip install piper-tts`, put `es_MX-claude-high.onnx` in `piper/`, then run `python gen_es.py sentences_es.json` and `python gen_es.py words_es.json`.
   - Both are resumable. They skip clips already in `clips/`.
6. `node pack.mjs`: pack the clips into `public/voice/p<n>.mp3` and `manifest.json`.

Clips are 24 kHz mono MP3 at 24 kbps. The game fetches only the bytes of the clip it needs (HTTP range requests). The player can also save every pack on their device: Reading voice › Save.

`extract_tpl.mjs out.json` lists the lines that are built from a pattern (`Help shoppers at the register ({0}/{1})`). Their Spanish is in `src/i18n/es_tpl.json`.

Models, clips and `node_modules` are not kept in git (see `.gitignore`).
