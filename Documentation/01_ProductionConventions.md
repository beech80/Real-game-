# REAL — Production Conventions

## Units, axes, scale

* **1 Blender unit = 1 metre.** Z is up and characters face **−Y**, which is Blender's front view.
* FBX export uses `apply_unit_scale=True` and `FBX_SCALE_UNITS`, with forward −Y and up Z. In Unreal, import with *Convert Scene* on: 1 m = 100 uu.
* glTF export uses Y-up, which is the glTF standard.

### Character scale (approved style: short, anime-influenced)

| Measure | Value |
|---|---|
| Player height (top of skull) | **1.45 m** |
| Head height | ~0.38–0.40 m → **≈3.7–3.8 heads tall** |
| Fox with ears | ~1.62 m |
| Hip (pelvis) height | 0.56 m |
| Shoe length | 0.31 m (deliberately oversized, a REAL silhouette signature) |

### World scale

The world uses real-world metric architecture. The REALs are short, but the city has to read as believable (70% believable / 30% stylised).

| Element | Value |
|---|---|
| Facade module | **4.0 m** grid |
| Storey height | 3.2 m (slab to slab) |
| Wall thickness | 0.2 m |
| Door | 1.1 × 2.2 m (kit storefront doors are 1.54 × 2.5 m) |
| Counter | 0.85 m |
| Table | 0.72 m |
| Seat | 0.42 m (matches the Fox sit pose: pelvis drop 0.135 m) |
| Road | 8 m curb-to-curb (2 × 3.5 m lanes + 1 m) |
| Sidewalk | 4 m wide, 0.15 m curb |

## Pivots

* **Kit pieces:** bottom-centre of the outer facade line. They snap on the 4 m grid with 90° rotations, facade facing −Y and interior +Y.
* **Props:** bottom-centre, front facing −Y.
* **Doors:** the hinge edge, so the door rotates open in-engine.
* **Characters:** the origin is between the feet (the `root` bone).

## Naming

| Prefix | Use | Example |
|---|---|---|
| `CHR_` | Character source collection | `CHR_REAL_Fox` |
| `SK_` | Skeletal mesh parts and armature object | `SK_REAL_Fox`, `SK_REAL_Fox_Head` |
| `RIG_` | Armature data | `RIG_REAL_Fox` |
| `ANIM_` | Actions | `ANIM_REAL_Fox_Walk` |
| `CLO_` | Clothing meshes (skinned) | `CLO_REAL_Fox_Jacket_Casual` |
| `ENV_` | Environment / level-piece collections & meshes | `ENV_REAL_FreshMart_Shell` |
| `DST_` | District level collections | `DST_REAL_StartingDistrict` |
| `BLD_` | Assembled building collections / instances | `BLD_REAL_StarterApartments` |
| `KIT_` | Modular kit piece (static mesh) | `KIT_Wall_4m_Window_Brick` |
| `PROP_` | Props / furniture / street furniture | `PROP_REAL_Checkout_Register` |
| `VEH_` | Vehicles | `VEH_REAL_StarterCar` |
| `MAT_` | Materials | `MAT_REAL_Fur_FoxOrange` |
| `UCX_` | Unreal convex collision (`UCX_<Mesh>_NN`) | `UCX_PROP_REAL_Checkout_01_00` |
| `SOCKET_` | Gameplay markers (empties with custom props) | `SOCKET_Interact_Register_01` |
| `LGT_` / `CAM_` | Lights / cameras (render only) | `CAM_FM_Interior` |
| `TMP_` | Temporary; never exported | `TMP_Floor` |

Facade variants append the material: `_Brick`, `_BrickDark`, `_Plaster`, `_Warm`, `_Concrete`. Storefronts also append the awning: `KIT_Storefront_4m_Brick_Navy`.

## Materials

There is one library, defined in `Tools/real_lib.py` → `MATERIAL_DEFS`. Every material is a single Principled BSDF with a palette colour, roughness, metallic and emission. This keeps them **1:1 exportable to FBX and glTF** and maps directly onto a single Unreal master material (`M_REAL_Master`) with parameters.

The palette was sampled from the approved concept sheets: navy `#0A0E1C`, crown gold `#E89E26`, fox orange `#E04512`, Fresh Mart green `#0F5424`, and so on. Values are authored in display space and converted to linear when the materials are built.

The look is flat-colour stylised for now. Texture passes (baked tileables for brick, paving, asphalt and fabric) are planned for Phase 9 and must not change any material names.

## Gameplay sockets

These are empties named `SOCKET_<Kind>_<Purpose>[_NN]`. Their custom properties travel through FBX/glTF extras:

| Property | Meaning |
|---|---|
| `real_marker` | Kind: `Interact`, `Spawn`, `Door`, `NPC` |
| `action` | Gameplay verb, e.g. `Work:Cashier`, `Sleep`, `PayBills`, `Travel:Bus` |
| `edu` | Learning hooks, e.g. `Math:MakingChange;Reading:Labels` |
| `anim` | Animation the player uses at this socket |
| `npc` / `event` / `travel` / `jobs` / `business` | Extra context |

The socket's **−Y axis is the facing direction** the character should take when using it.

## Collision

* Props with gameplay collision get `UCX_` boxes, generated from their bounds (`R.make_ucx`).
* Architecture shells use *complex-as-simple* in Unreal until per-module simplified hulls are authored (Phase 9).

## File layout

See `Blender/` (sources), `Blender/Exports/` (FBX/GLB), `Tools/` (build scripts), `Tests/` (verification and reports) and `Renders/` (preview images). Original `.blend` files are versioned in git. A build script overwrites its own output only, never a hand-edited file. If a file gets hand-edited, rename it with `_HAND` so the scripts don't overwrite it.
