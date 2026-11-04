# REAL — the playable game (mobile + web)

A 3D third-person life sim that runs in any modern phone or desktop browser and installs to the home screen as an app (PWA). It is built with three.js on top of the Blender assets in `../Blender`.

## Play

* **Phone:** drag on the left half of the screen to walk (push to the edge, or tap **RUN**, to run). Drag on the right half to look around. Tap the gold button to interact, and 📱 to open your phone.
* **Desktop:** use WASD or the arrow keys to move and Shift to run. Drag the mouse to look and use the scroll wheel to zoom. Press E or Space to interact, and P or Tab for the phone.
* **Install on a phone:** open the hosted build, then choose *Share → Add to Home Screen* (iOS) or *Install app* (Android). It runs fullscreen and works offline after the first load.

## What's in the slice

| System | What it does |
|---|---|
| **9 playable REALs** | Fox, Cat, Dog, Horse, Bird, Elephant, Lion, Cow and Dolphin. Every species can follow every path. Character creator with fur tone, jacket, hoodie and name |
| **Starting District** | Walkable city with traffic and working signals, a city bus, 10–16 residents of every species walking the sidewalks, and The Club on the hill |
| **Story** | Expelled from The Club with $100, then: Career Center application → hired at Fresh Mart → first shift → first paycheck → Jax's temptation → groceries → first night home → rent day. Jax comes back with genuinely good advice (a second job at Daily Grind) |
| **Learning built into living** | Job board *reading*, application *writing*, a traced *cursive* signature, time-clock *math*, making change from a cash drawer, reading aisle signs to stock shelves, inventory *multiplication*, a pay stub with gross pay, FICA and net pay, budget shopping with price per meal, recipe *fractions*, bills and the 50/30/20 rule, and *critical thinking* with Jax |
| **Life sim** | Clock (1 s = 1 game minute), day/night lighting, energy, hunger, mood, pantry, wardrobe, late fees, day summaries, skill XP and levels |
| **Phone** | Bank, Jobs, Map, Messages, Bills, Learn, Goals, Stats, Club and Settings (graphics quality, sound, save) |
| **Save** | Autosaves in the browser (every 20 s, after shifts and when you sleep) |

## Build

```bash
npm install
./prep_assets.sh        # compress the Blender exports -> public/assets/*.glb.gz (quantized, gzip)
npm run build           # -> dist/ (installable PWA) and dist/artifact.html (hosted page)
node tests/playtest.cjs # smoke test: title -> creator -> intro -> play, with screenshots
node tests/story.cjs    # plays Day 1 end to end through the real UI
```

Asset pipeline: `Tools/export_game.py` (Blender) → `prep_assets.sh` (gltf-transform: dedup, weld, quantize, resample; then gzip -9). The game inflates the assets with the browser's built-in `DecompressionStream`, so no WebAssembly decoder is needed.

## Code map

`src/engine.js` (renderer, sky, day/night, bloom, procedural textures) · `world.js` (level loading, static batching, collision) · `characters.js` · `controls.js` (touch joystick, camera, player) · `city.js` (pedestrians, traffic, story NPCs) · `game.js` (state, story, interactions, phone) · `activities.js` (learning activities) · `ui.js` · `audio.js` (synthesized SFX and lo-fi music).
