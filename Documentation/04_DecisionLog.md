# REAL — Decision Log

Ordinary technical decisions made autonomously under directive §31. Anything touching species, story, approved visual direction, money, publishing or security is **asked**, not decided here.

| # | Date | Decision | Why | Reversible? |
|---|---|---|---|---|
| D-001 | 2026-11-04 | Use Blender 5.1.2 as the PyPI `bpy` module (headless) | No GUI Blender or MCP in the container; `bpy` is the official Blender build as a Python module | Yes. The same scripts run in desktop Blender with `blender -b -P` |
| D-002 | 2026-11-04 | All assets are **script-generated** (`Tools/*.py`) and `.blend` sources are committed | Reproducible, reviewable in git, rebuildable after every fix; meets "do not overwrite approved assets without version control" | Yes |
| D-003 | 2026-11-04 | Cycles CPU for every preview render | EEVEE and Workbench need a GPU context that isn't available | Yes |
| D-004 | 2026-11-04 | Player height 1.45 m (skull), ≈3.8 heads; world uses real metric architecture | Matches the "3.5–4 heads" concept sheet while keeping the city believable (the 70/30 rule) | Moderate: changing it later means re-checking props |
| D-005 | 2026-11-04 | 4 m facade module, 3.2 m storey, 8 m road, 4 m sidewalk | Industry-standard modular grid; good snapping and LOD behaviour | Moderate |
| D-006 | 2026-11-04 | **Unreal 5 mannequin bone naming** for the REAL skeleton | Lets IK Retargeter map the core chain to UE5 Manny and Marketplace animations | Low cost now, high cost later, so decided early |
| D-007 | 2026-11-04 | In-place animations, `root` bone at the origin | Standard for a UE Character Movement locomotion blend space | Yes |
| D-008 | 2026-11-04 | Body built from a Skin-modifier skeleton graph + Subdivision; skin weights computed procedurally (point-to-bone-segment falloff, top 4 influences, side-locked) | Deterministic quad topology and weights without GUI weight painting; works headless | Yes. Hand weight-painting can refine the result in a later polish pass |
| D-009 | 2026-11-04 | Clothing as separate skinned shells generated from body faces, inheriting body weights by nearest-vertex transfer | This is the base of the customisation system: outfits swap as meshes on the same skeleton | Yes |
| D-010 | 2026-11-04 | Facial expressions as head morph targets (shape keys), not face bones | Works identically in FBX→UE and glTF; directive §8 allows either; easy to drive from an Anim BP | Yes. Face bones can be added later for lip sync |
| D-011 | 2026-11-04 | Flat-colour Principled materials with a single shared palette; textures deferred to Phase 9 | Exports 1:1 to FBX and glTF; maps to one UE master material; keeps a consistent stylised read | Yes. Material names are the stable contract |
| D-012 | 2026-11-04 | Gameplay hooks as `SOCKET_*` empties with custom properties (`action`, `edu`, `anim`…) | Survives FBX and glTF export; an editor utility can spawn interactables in UE | Yes |
| D-013 | 2026-11-04 | Fresh Mart at 28 × 22 m, single 5.5 m storey, back-of-house at y 18–22 m | Real neighbourhood-grocery proportions; fits the 56 m block with an 17.5 m parking lot | Yes |
| D-014 | 2026-11-04 | District 1 layout: Main St × Fresh Ave; Apartments + Career Center NW, Fresh Mart NE, Diner / Thread & Co / Grow Gym SW, Brighter Park + bus stop SE; The Club on a hill north, framed down Fresh Ave | Covers every required Starting District location; The Club is visible from the lower district, as §10 requires | Yes |
| D-015 | 2026-11-04 | Placeholder business names (Daily Grind, Main St Diner, Thread & Co, Grow Gym, Brighter Park, The Starter Apartments) | The directive specifies the location types, not their names. These are placeholders for approval | **Needs approval** |
| D-016 | 2026-11-04 | **Jax not modelled** | Directive §18: don't decide Jax's species or look without approved reference. Only socket placeholders (`SOCKET_NPC_Jax_*`) exist | — |
| D-017 | 2026-11-04 | Fox outfit and colours follow the character sheet (black jacket, cream hoodie, gold crown, joggers, chunky sneakers, amber eyes) | Approved reference image `References/Concept/REAL_CharacterSheet_v1.png` | — |
| D-018 | 2026-11-04 | **Platform pivot: mobile/web game in three.js** instead of Unreal | The user asked for a mobile app and said not to worry about Unreal. three.js runs on any phone browser, installs as a PWA, and uses the same Blender GLB exports | Yes. The Unreal contract still applies if UE work resumes |
| D-019 | 2026-11-04 | All nine species built from the Fox pipeline (shared skeleton, rig, animations, morphs) | One retargetable skeleton for everything; species identity comes from head, ears, muzzle, tail and accessories | Yes |
| D-020 | 2026-11-04 | **Jax = grey cat with a red cap and red/black jacket** | The user delegated design choices ("I trust your choices"); matches the Jax character in the gameplay key art | Yes. Rebuild with `build_species.py Jax` |
| D-021 | 2026-11-04 | Fresh Mart manager is "Rosa", a Cow in a Fresh Mart green jacket | The key art shows a Cow manager at Fresh Mart | Yes |
| D-022 | 2026-11-04 | Runtime assets: quantized + gzip (inflated by the browser's DecompressionStream); base64 `.txt` copies for the hosted build | Avoids a WebAssembly decoder (may be blocked by host CSP); the host only serves text/media types | Yes |
| D-023 | 2026-11-04 | Economy: $12/h cashier, 5-hour shift, FICA 7.65% shown on the pay stub; rent $120 due Day 3; phone bill $25 due Day 5; $15 late fee | Small, readable numbers that still teach gross vs net pay and due dates | Tunable in `game.js` / `activities.js` |

## Known issues (measured)

| Issue | Data | Plan |
|---|---|---|
| Arms-up shoulder stretch on Fox body/jacket | Max edge stretch 4.24× (pass threshold 3.0×). The worst edges are at the torso side (x ±0.13, z 0.72), where the A-posed inner arm is fused into the torso hull by the Skin modifier | Widen the A-pose and move the shoulder node out 2–3 cm in `body_mesh()` / `BONES`. A weight-only mask was tried and made it worse (6.2×), so it was reverted |
| Facial expressions read clearly in close-up but are subtle at gameplay distance | See `Renders/Characters/Fox/Fox_expressions.png` | Exaggerate brow and mouth deltas ~1.5× and add a cheek-raise for Happy |
| Materials are flat colour | — | Phase 9: baked tileable brick, paving, asphalt and fabric textures behind the same material names |
