# REAL — Unreal Engine 5 Asset Contract

Unreal is not available in the production container (see `00_ToolAudit.md`). This contract defines exactly how every Blender export maps into UE5, so integration is mechanical and testable. **None of the Unreal steps below have been executed or verified yet.**

## Project setup (when UE5 is available)

* UE 5.4+ and a C++ project `REAL` created from the Third Person template.
* Content root `/Game/REAL/` mirroring `Blender/`: `Characters/`, `Environments/`, `Kit/`, `Props/`, `Materials/`, `Animations/`.
* Master material `M_REAL_Master`, with parameters BaseColor (vector), Roughness, Metallic, EmissiveColor and EmissiveStrength. Every `MAT_REAL_*` becomes a Material Instance `MI_REAL_*` using the values in `Tools/real_lib.py` → `MATERIAL_DEFS` (linear colours). A script can generate them from that table.

## Characters — `Blender/Exports/Characters/SK_REAL_<Species>.fbx`

| Setting | Value |
|---|---|
| Import as | Skeletal Mesh, *Import Morph Targets* ✔, *Import Animations* ✔ |
| Convert Scene | ✔ (forward −Y, up Z, metres → cm) |
| Skeleton | Create `SKEL_REAL_Humanoid` from the Fox, then reuse it for every species that shares the core chain |
| Bone names | Unreal 5 mannequin names (`pelvis`, `spine_01`, `upperarm_l`, `calf_r`…), so IK Retargeter maps the core chain to UE5 Manny automatically |
| Extra chains | `tail_01..04`, `ear_01/02_l/r`. Species variants add `trunk_*`, `wing_*`, `mane_*`, `fin_*` |
| Root | `root` at the origin between the feet. All animations are **in place** (no root motion). Locomotion speed comes from the Character Movement Component |
| Mesh parts | Body, Head (morph targets), Hands, Shoes, Tail, and the clothing meshes `CLO_*`. All are skinned to one skeleton, so they import as a single Skeletal Mesh with material slots |

### Morph targets (on the head)

* **Expressions:** `Happy Excited Sad Angry Surprised Worried Confused Focused Tired Thinking Confident`. Neutral is the basis.
* **Utility:** `Blink_L Blink_R Look_Left Look_Right Look_Up Look_Down Mouth_Open Mouth_Smile Mouth_Frown Mouth_Narrow Mouth_Wide`. The Mouth_* targets are the foundation for viseme lip sync.
* The Animation Blueprint drives them through curves. Use the `Expression` enum → `SetMorphTarget` with blend times. Blink comes from a random timer at 2–6 s.

### Animation set (`ANIM_REAL_<Species>_<Name>`, 30 fps)

| Name | Loop | Use |
|---|---|---|
| Idle | ✔ | Locomotion blend space at 0 |
| Walk | ✔ | Blend space at ~1.2 m/s |
| Run | ✔ | ~3.5 m/s |
| Sprint | ✔ | ~5.5 m/s |
| Jump | — | Split into start / loop / land in the anim graph |
| Sit | ✔ | Chairs and benches (seat 0.42 m, pelvis offset baked) |
| Drive | ✔ | Vehicle seat pose |
| PhoneUse | ✔ | Player phone UI open (attach the phone to the `hand_r` socket) |
| Wave | — | Greeting montage |
| Talk | ✔ | Conversation idle (NPC dialogue) |
| Pickup | — | Interaction montage (stocking shelves, items) |
| Carry | ✔ | Upper-body layered (boxes, grocery bags) |

Not yet authored: turn-in-place, sit-down / stand-up transitions, the shopping-cart push, exercise loops, the work actions (scan, stock) and the facial animation curves.

### Skeletal mesh sockets to create in UE

| Socket | Bone | Offset (cm) | Use |
|---|---|---|---|
| `SOCKET_Hand_R` | hand_r | (0, −3, −6) | Phone, scanner, items |
| `SOCKET_Hand_L` | hand_l | (0, −3, −6) | Bags |
| `SOCKET_Back` | spine_02 | (0, 15, 0) | Backpack |
| `SOCKET_Head_Top` | head | (0, 0, 20) | Hats / caps |

## Environments — `Blender/Exports/Environments/*.fbx`

| Setting | Value |
|---|---|
| Import as | Static Meshes, *Combine Meshes* ✗ (keeps props separate) |
| Collision | `UCX_<Mesh>_NN` children are picked up automatically. Shells use *Use Complex As Simple* |
| Lights | Not exported. Place UE lights at the `PROP_REAL_*Light*` / emissive panel locations |

### Gameplay sockets → actors

Every `SOCKET_*` empty carries custom properties (FBX user properties / glTF extras). An editor utility (`EUW_REAL_SocketSpawner`) should:

1. Iterate the imported empties.
2. Spawn the Blueprint for each `real_marker` kind:
   * `Interact` → `BP_REAL_Interactable`, which reads `action`, `edu` and `anim`
   * `Spawn` → `PlayerStart` / `BP_REAL_SpawnPoint`
   * `Door` → `BP_REAL_Door`, which reads `travel` and `access`
   * `NPC` → `BP_REAL_NPCRoutinePoint`, which reads `npc`, `routine` and `queue`
3. Face the actor along the socket's −Y axis.

`edu` tags (`Math:MakingChange`, `Reading:Labels`, `Finance:Budget`, …) route into the learning-activity system, so education stays embedded in play.

### Modular kit — `Blender/Exports/Kit/KIT_*.glb` and `KIT_REAL_CityKit_All.fbx`

* Pivot at the bottom-centre of the outer facade line, on a 4 m grid with 3.2 m storeys.
* Import as instanced static meshes. District scenes place kit pieces as linked duplicates (shared mesh), which map 1:1 to Unreal ISM / HISM, or to Packed Level Actors per building.

## Districts — `Blender/Exports/Environments/DST_REAL_StartingDistrict.glb`

A layout reference. Rebuild it in UE with the Level Instance per building approach: Fresh Mart, the Starter Apartments, then filler. Use World Partition for the five districts.
