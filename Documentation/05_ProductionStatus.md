# REAL — Production Status

*Updated 2026-11-04. This document tells you what exists, what was verified and how, and what does not exist yet.*

## Built this cycle (Blender-side, script-generated, verified)

| Asset | Source | Exports | Verification | Quality level |
|---|---|---|---|---|
| **Fox REAL** (`CHR_REAL_Fox`) | `Blender/Characters/Fox/CHR_REAL_Fox.blend` | `SK_REAL_Fox.fbx`, `.glb` | Re-import (FBX and GLB): 30 bones, 12 actions, 22 morphs, all parts skinned, 1.59 m with ears, feet on the ground, 19,988 tris. Also loaded in **three.js / WebGL** with clips and morphs played (`Tests/reports/web_fox_*.png`) | **First production pass.** It matches the concept palette, outfit and proportions and is fully rigged, animated and expressive. It is not final art: no sculpt detail, fur cards or textures yet |
| Fox rig | same | — | Automated deformation tests: squat 2.27×, elbows 1.51×, neck 2.0× ✅; arms-up 4.24× ❌ (known issue) | Production-usable, except for overhead arm poses |
| Fox expressions | head shape keys | morph targets | Rendered sheet `Renders/Characters/Fox/Fox_expressions.png` | All 11 expressions plus Neutral are readable; subtle at distance |
| Fox animations | 12 actions | baked in FBX/GLB | Contact sheet `Fox_animations.png`; played back in three.js | Procedural first pass. Locomotion reads well; gestures need hand-keyed polish |
| **City kit** (71 pieces) | `Blender/Buildings/KIT_REAL_CityKit.blend` | `Exports/Kit/*.glb` + combined FBX | Every piece re-imported: one mesh each, bottom pivot, UVs, materials | Production-usable modular blockout-plus |
| **Starter apartment** | `Blender/Interiors/ENV_REAL_StarterApartment.blend` | FBX + GLB | 11 gameplay sockets present after FBX/GLB re-import, custom props survive, footprint to scale | Furnished, lit, game-ready layout; flat-colour materials |
| **Fresh Mart** (exterior + full interior + back-of-house) | `Blender/World/StartingDistrict/ENV_REAL_FreshMart.blend` | FBX + GLB | 29 sockets, UCX collision present, footprint to scale | Complete store layout; flat-colour materials |
| **Starting District** | `Blender/World/StartingDistrict/DST_REAL_StartingDistrict.blend` | GLB | 1,801 placed objects, 124 unique meshes (instanced), 0 validation errors, renders | Dressed blockout: every required §10 location type is present as an exterior |

Run `Tests/verify_exports.py` for **105/105 checks passed** (`Tests/reports/export_verification.json`).

## Starting District coverage (directive §10)

| Required | Status |
|---|---|
| Starter apartment building + interior | ✅ exterior (5 storeys) + full interior |
| Fresh Mart | ✅ exterior + interior |
| Entry-level restaurant | ⚠️ exterior only (Main St Diner) |
| Coffee shop | ⚠️ exterior only (Daily Grind, apartment ground floor) |
| Park | ✅ Brighter Park: paths, fountain, benches, trees |
| Gym | ⚠️ exterior only (Grow Gym) |
| Bus stop | ✅ the player's arrival point |
| Career center | ⚠️ exterior only |
| Clothing store | ⚠️ exterior only (Thread & Co) |
| Roads, sidewalks, lights, benches, bins, signs, parking | ✅ |

## Not done yet

* **No Unreal project and no playable game.** UE5 is not available in this environment. The integration plan is in `03_UnrealAssetContract.md`.
* The other **eight species** (Cat, Dog, Horse, Bird, Elephant, Lion, Cow, Dolphin). The pipeline in `build_fox.py` is parameterised for them, but they aren't built.
* **Jax.** Waiting on approved design/species (directive §18).
* NPC system, vehicles, Midtown, Opportunity District, The Heights, The Club (playable), career kits, business-ownership kits, phone UI mockups, cinematics.
* Textures (everything is flat colour), LODs, per-module collision hulls.
* Interiors for the diner, coffee shop, gym, career center and clothing store.

## Next milestones (proposed order)

1. Fix the Fox shoulder (widen the A-pose) and exaggerate the expressions 1.5×. Hero render of the Fox in the apartment and Fresh Mart.
2. Parameterise the species pipeline. Build the **Cat** next (the closest anatomy), then Dog, Horse and Lion, then the special-anatomy Bird, Elephant, Cow and Dolphin, each with extra bone chains.
3. Coffee shop and diner interiors (career kits), and the starter car and bus.
4. NPC base variant system (outfit and colour variation on the shared skeleton).
5. Textures pass (baked tileables), LODs, collision hulls.
6. With UE5 access: import per the contract, build the Third Person playable slice (apartment → street → Fresh Mart first shift).

## Decisions waiting on you

* Approve or rename the placeholder business names (D-015).
* Jax: species and a reference image.
* Unreal: a machine with UE5 (and Blender GUI/MCP if available) connected to this project, to start Phase 4 integration.
