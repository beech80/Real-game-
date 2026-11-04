"""
Export verification — re-imports every exported asset into a CLEAN scene and checks it
against the asset contract. Exit code 1 on any failure.

    /opt/realbpy/bin/python Tests/verify_exports.py
"""
import sys, os, json, glob
import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EXP = os.path.join(ROOT, "Blender", "Exports")
results, failures = {}, []


def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def check(name, cond, msg):
    results.setdefault(name, []).append(("PASS" if cond else "FAIL") + ": " + msg)
    if not cond:
        failures.append(f"{name}: {msg}")


def import_any(path):
    if path.endswith(".fbx"):
        bpy.ops.import_scene.fbx(filepath=path, use_custom_props=True)
    else:
        bpy.ops.import_scene.gltf(filepath=path)


# ---------------------------------------------------------------- character
FOX_CONTRACT = dict(min_bones=29, required_bones=["root", "pelvis", "spine_01", "spine_02", "neck_01", "head",
                                                   "upperarm_l", "lowerarm_l", "hand_l", "thigh_r", "calf_r", "foot_r",
                                                   "tail_01", "tail_04", "ear_01_l"],
                    actions=["Idle", "Walk", "Run", "Sprint", "Jump", "Sit", "Drive", "PhoneUse", "Wave", "Talk", "Pickup", "Carry"],
                    morphs=["Happy", "Excited", "Sad", "Angry", "Surprised", "Worried", "Confused", "Focused", "Tired",
                            "Thinking", "Confident", "Blink_L", "Blink_R", "Mouth_Open"],
                    height=(1.5, 1.7), max_tris=40000)

for ext in ("fbx", "glb"):
    p = os.path.join(EXP, "Characters", f"SK_REAL_Fox.{ext}")
    key = f"SK_REAL_Fox.{ext}"
    if not os.path.exists(p):
        check(key, False, "file missing")
        continue
    clean()
    import_any(p)
    arms = [o for o in bpy.data.objects if o.type == "ARMATURE"]
    # ignore importer helpers (glTF importer puts its bone-display Icosphere in 'glTF_not_exported')
    meshes = [o for o in bpy.data.objects if o.type == "MESH"
              and not any(c.name == "glTF_not_exported" for c in o.users_collection)]
    check(key, len(arms) == 1, f"one armature (found {len(arms)})")
    if arms:
        names = {b.name for b in arms[0].data.bones}
        check(key, len(names) >= FOX_CONTRACT["min_bones"], f"bone count {len(names)}")
        miss = [b for b in FOX_CONTRACT["required_bones"] if b not in names]
        check(key, not miss, f"required bones present (missing {miss})")
    acts = [a.name for a in bpy.data.actions]
    for a in FOX_CONTRACT["actions"]:
        check(key, any(a in n for n in acts), f"action {a}")
    morphs = set()
    for m in meshes:
        if m.data.shape_keys:
            morphs |= {k.name for k in m.data.shape_keys.key_blocks}
    for k in FOX_CONTRACT["morphs"]:
        check(key, k in morphs, f"morph {k}")
    skinned = [m for m in meshes if any(md.type == "ARMATURE" for md in m.modifiers) or m.parent in arms]
    check(key, len(skinned) == len(meshes) and meshes, f"all meshes skinned ({len(skinned)}/{len(meshes)})")
    dg = bpy.context.evaluated_depsgraph_get()
    zs, tris = [], 0
    for m in meshes:
        ev = m.evaluated_get(dg); me = ev.to_mesh()
        zs += [(m.matrix_world @ v.co).z for v in me.vertices]
        tris += sum(len(p.vertices) - 2 for p in me.polygons)
        ev.to_mesh_clear()
    h = max(zs) - min(zs)
    lo, hi = FOX_CONTRACT["height"]
    check(key, lo <= h <= hi, f"height {h:.3f} m within {lo}-{hi} (unit scale)")
    check(key, abs(min(zs)) < 0.02, f"feet on ground (min z {min(zs):.3f})")
    check(key, tris <= FOX_CONTRACT["max_tris"], f"triangles {tris} <= {FOX_CONTRACT['max_tris']}")
    mats = {s.material.name for m in meshes for s in m.material_slots if s.material}
    check(key, all(n.startswith("MAT_REAL_") for n in mats), f"material naming ({len(mats)} mats)")

# ---------------------------------------------------------------- environments
ENV = {
    "ENV_REAL_FreshMart": dict(sockets=["SOCKET_Interact_Register_01", "SOCKET_Interact_StockShelf_A1", "SOCKET_Interact_TimeClock",
                                        "SOCKET_Interact_InventoryCount", "SOCKET_Interact_ManagerStation", "SOCKET_NPC_Jax_Appear"],
                               ucx=True, size=(27, 29)),
    "ENV_REAL_StarterApartment": dict(sockets=["SOCKET_Interact_Sleep", "SOCKET_Interact_Eat", "SOCKET_Interact_Bills",
                                               "SOCKET_Interact_Wardrobe", "SOCKET_Interact_Storage", "SOCKET_Interact_Phone"],
                                      ucx=False, size=(7.9, 8.5)),
}
for env, spec in ENV.items():
    for ext in ("fbx", "glb"):
        p = os.path.join(EXP, "Environments", f"{env}.{ext}")
        key = f"{env}.{ext}"
        if not os.path.exists(p):
            check(key, False, "file missing")
            continue
        clean()
        import_any(p)
        names = [o.name for o in bpy.data.objects]
        for s in spec["sockets"]:
            check(key, any(n.startswith(s) for n in names), f"socket {s}")
        sock = [o for o in bpy.data.objects if o.name.startswith("SOCKET_")]
        if ext == "fbx":
            check(key, all("real_marker" in o.keys() for o in sock), "socket custom props survive FBX")
            if spec["ucx"]:
                check(key, any(n.startswith("UCX_") for n in names), "UCX collision present")
        meshes = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith("UCX_")]
        xs = [(o.matrix_world @ v.co).x for o in meshes for v in o.data.vertices]
        w = max(xs) - min(xs)
        lo, hi = spec["size"]
        check(key, lo <= w <= hi, f"footprint width {w:.2f} m in [{lo},{hi}] (unit scale)")
        no_uv = [o.name for o in meshes if not o.data.uv_layers]
        check(key, not no_uv, f"UVs on all meshes ({len(no_uv)} missing)")

# ---------------------------------------------------------------- kit
kit = sorted(glob.glob(os.path.join(EXP, "Kit", "*.glb")))
check("Kit", len(kit) >= 60, f"{len(kit)} kit GLBs")
bad = []
for p in kit:
    clean()
    import_any(p)
    ms = [o for o in bpy.data.objects if o.type == "MESH"]
    if len(ms) != 1:
        bad.append(os.path.basename(p))
        continue
    o = ms[0]
    zs = [(o.matrix_world @ v.co).z for v in o.data.vertices]
    name = os.path.basename(p)
    # floors/roads sit at or under z=0; everything else rests on z=0
    if not (name.startswith(("KIT_Floor", "KIT_Road", "KIT_RoofCap")) or abs(min(zs)) < 0.03):
        bad.append(f"{name} minz={min(zs):.2f}")
check("Kit", not bad, f"each piece single mesh with bottom pivot ({bad[:5]})")

summary = {"failures": failures, "results": results}
os.makedirs(os.path.join(ROOT, "Tests", "reports"), exist_ok=True)
with open(os.path.join(ROOT, "Tests", "reports", "export_verification.json"), "w") as f:
    json.dump(summary, f, indent=2)
total = sum(len(v) for v in results.values())
print(f"VERIFY: {total - len(failures)}/{total} checks passed")
for fl in failures:
    print("  FAIL", fl)
sys.exit(1 if failures else 0)
