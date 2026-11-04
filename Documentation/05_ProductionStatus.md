# REAL — Production Status

*Updated 2026-11-04.*

## ▶ Playable now

**REAL runs as a mobile/web game.** It is three.js (WebGL) built on the Blender assets in this repository.

* **Hosted (private to the owner):** https://claude.ai/artifact/7fMdK6schjkVDJoyrhcmow
* **Installable PWA build:** `Game/` → `npm install && ./prep_assets.sh && npm run build`, then host `Game/dist/`. On a phone, use *Add to Home Screen*.

### Verified by automated playtests (headless Chromium, iPhone 13 emulation)

| Test | Result |
|---|---|
| `Game/tests/playtest.cjs` (title → creator → intro → play) | ✅ 0 console errors, both the standalone and hosted builds |
| `Game/tests/story.cjs` (all of Day 1 through the real UI) | ✅ Application, cursive signature, hired, manager, clock-in, 2 register customers with exact change, wrong-aisle feedback, stocking, inventory, pay stub, Jax + think-it-through, groceries, apartment, eat, pay rent, sleep, Day 2, phone. 0 errors |
| `Game/tests/visual.cjs` (high graphics) | ✅ Day, sunset and night street; Fresh Mart at night; store interior |
| `Tests/verify_exports.py` (Blender FBX/GLB re-import) | ✅ 105/105 |

Not yet verified: frame rate on real phone hardware. The container has no GPU. Graphics presets (low/medium/high) are in the phone's Settings app, and phones default to medium.

## What's in the game

* **9 playable REALs** plus Jax, each with 12 animations and 22 facial morphs. Character creator with fur tone, jacket, hoodie and name.
* **Starting District:** the apartment building, Fresh Mart (full interior), Career Center, Daily Grind, Main St Diner, Thread & Co, Grow Gym, Brighter Park, the bus stop, traffic with signals, residents of every species, and The Club on the hill.
* **Story slice:** expulsion → $100 → job → first paycheck → Jax → home → rent. Then an open daily loop: shifts, bills, groceries, second job via Jax's tip, shopping, wardrobe, gym, park and Learn quizzes.
* **Education embedded in play:** reading, writing, cursive, math (change, time, multiplication, fractions, percentages), money (gross/net, budgeting, 50/30/20, late fees, price per meal) and critical thinking (Jax, ads, urgency).
* **Systems:** day/night clock, energy/hunger/mood, skill XP and levels, bank ledger, messages, goals, autosave.

## Production assets (Blender)

As before: the city kit (71 pieces), apartment, Fresh Mart, Starting District, and now all nine species plus Jax (`Tools/build_species.py`). Lineup render: `Renders/Characters/REAL_Lineup.png`.

## Known gaps / next

1. Real-device performance pass (LODs for residents, instanced trees).
2. Interiors for the diner, coffee shop, gym, clothing store and career center. They are currently menu interactions at the doors.
3. Expressions during dialogue: the morph targets exist, but only Jax and a few story beats drive them.
4. Midtown and the other districts, vehicles you can own, and business ownership. These are teased on the bus schedule and the Goals app.
5. Fox shoulder stretch in overhead arm poses (4.24×, see the decision log).
6. Audio: synthesized SFX and music only. No voice.
7. GitHub push is blocked: the Claude GitHub App has no access to `beech80/Real-game-`. Commits are local until access is fixed.
