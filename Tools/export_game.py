"""
Game export — turns the production .blend levels into runtime data for the REAL mobile/web game.

Outputs (Game/public/assets/):
  district.glb   visible district meshes only (no UCX, sockets, lights, kit library)
  apartment.glb  starter apartment interior + backdrop
  world.json     colliders (2D plan, Blender XY metres), sockets with gameplay props, building footprints

Plan coordinates = Blender (x, y). The game maps them to three.js as (x, -y).
"""
import sys, os, math, json
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector
import real_lib as R

OUT = os.path.join(R.ROOT, "Game", "public", "assets")
os.makedirs(OUT, exist_ok=True)


def obb(ob, pad=0.0):
    """World-space 2D oriented box from an object's local bbox (rotation about Z only)."""
    bb = [Vector(c) for c in ob.bound_box]
    mn = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
    mx = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    mw = ob.matrix_world
    c = mw @ ((mn + mx) / 2)
    sx, sy, _ = mw.to_scale()
    rot = mw.to_euler().z
    return {"t": "box", "x": round(c.x, 3), "y": round(c.y, 3), "hx": round((mx.x - mn.x) / 2 * sx + pad, 3),
            "hy": round((mx.y - mn.y) / 2 * sy + pad, 3), "r": round(rot, 4), "h": round((mx.z - mn.z) * mw.to_scale().z, 2),
            "n": ob.name}


def socket_list():
    out = []
    for o in bpy.data.objects:
        if o.name.startswith("SOCKET_"):
            p = o.matrix_world.translation
            props = {k: (v if isinstance(v, (int, float, str)) else str(v)) for k, v in o.items() if not k.startswith("_")}
            out.append({"n": o.name, "x": round(p.x, 3), "y": round(p.y, 3), "z": round(p.z, 3),
                        "r": round(o.matrix_world.to_euler().z, 4), "p": props})
    return out


def wall(x0, y0, x1, y1, t=0.3, name="wall"):
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    L = math.hypot(x1 - x0, y1 - y0)
    return {"t": "box", "x": cx, "y": cy, "hx": L / 2, "hy": t / 2, "r": math.atan2(y1 - y0, x1 - x0), "h": 3, "n": name}


def strip(objs_keep):
    for o in list(bpy.data.objects):
        if o not in objs_keep:
            bpy.data.objects.remove(o, do_unlink=True)


def export(path, objs):
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True,
                              export_extras=False, export_yup=True, export_lights=False, export_cameras=False)
    print("GAME EXPORT", path, os.path.getsize(path))


world = {}

# ------------------------------------------------------------------ district
bpy.ops.wm.open_mainfile(filepath=os.path.join(R.BLEND_DIR, "World", "StartingDistrict", "DST_REAL_StartingDistrict.blend"))
LOT = 8.0
col = []
sockets = socket_list()
# building footprints (solid) — from floor tiles of each BLD collection
buildings = []
for c in bpy.data.collections:
    if c.name.startswith("BLD_REAL_") and c.objects:
        xs, ys = [], []
        for o in c.objects:
            if o.type == "MESH" and "_Floor_" in o.name:
                for v in o.data.vertices:
                    w = o.matrix_world @ v.co
                    xs.append(w.x); ys.append(w.y)
        if xs:
            b = {"t": "box", "x": (min(xs) + max(xs)) / 2, "y": (min(ys) + max(ys)) / 2, "hx": (max(xs) - min(xs)) / 2,
                 "hy": (max(ys) - min(ys)) / 2, "r": 0.0, "h": 6, "n": c.name}
            buildings.append(b)
            col.append(b)
# Fresh Mart walls (walk-in store): analytic, from build_fresh_mart constants, root at (36, LOT+17.5)
import build_fresh_mart as FM
ox, oy = 36.0, LOT + 17.5
W, D, BOH = FM.W, FM.D, FM.BOH
fm_walls = [
    wall(-W / 2, 0.25, 6.0 - 0.1, 0.25), wall(10.0 + 0.1, 0.25, W / 2, 0.25),      # storefront, entrance gap x 6..10
    wall(-W / 2 + 0.15, 0, -W / 2 + 0.15, D), wall(W / 2 - 0.15, 0, W / 2 - 0.15, D),
    wall(-W / 2, D - 0.15, W / 2, D - 0.15),
    wall(-W / 2, BOH, 3.4, BOH, 0.2), wall(4.6, BOH, 9.4, BOH, 0.2), wall(10.6, BOH, W / 2, BOH, 0.2),
    wall(7.0, BOH, 7.0, D, 0.2),
]
for w in fm_walls:
    w["x"] += ox; w["y"] += oy; w["n"] = "FreshMartWall"
    col.append(w)
# props with UCX proxies (store fixtures)
for o in bpy.data.objects:
    if o.name.startswith("UCX_"):
        b = obb(o, 0.02)
        b["n"] = o.name[4:-3]
        col.append(b)
# street props — instanced: use name prefixes
circ = {"PROP_Tree": 0.3, "PROP_ParkTree": 0.3, "PROP_StreetLight": 0.18, "PROP_Banner": 0.12, "PROP_TrashBin": 0.32,
        "PROP_Hydrant": 0.18, "PROP_StreetSign": 0.12}
for o in bpy.data.objects:
    for pre, r in circ.items():
        if o.name.startswith(pre + "_"):
            p = o.matrix_world.translation
            col.append({"t": "circle", "x": round(p.x, 3), "y": round(p.y, 3), "r": r, "n": pre})
    if o.name.startswith(("PROP_Bench_", "PROP_ParkBench_", "PROP_BusStop_", "PROP_Planter_")):
        b = obb(o)
        b["n"] = o.name.split("_")[1]
        if "BusStop" in o.name:   # only the back glass + seat block movement; keep open front
            b["hy"] *= 0.35
        col.append(b)
for o in bpy.data.objects:
    if o.name == "PROP_REAL_Fountain_Basin":
        p = o.matrix_world.translation
        col.append({"t": "circle", "x": p.x, "y": p.y, "r": 3.25, "n": "Fountain"})
EXT = 72
world["district"] = {
    "colliders": col, "sockets": sockets, "buildings": buildings,
    "bounds": [-EXT + 1, -EXT + 1, EXT - 1, EXT - 1],
    "roads": {"half": 4.0, "extent": EXT},
    "freshmart": {"x": ox, "y": oy, "w": W, "d": D, "boh": BOH, "entrance": [ox + 6, ox + 10]},
}
keep = [o for o in bpy.context.scene.objects if o.type == "MESH" and o.visible_get()
        and not o.name.startswith(("UCX_", "TMP_"))]
export(os.path.join(OUT, "district.raw.glb"), keep)   # compressed by Game/prep_assets.sh

# ------------------------------------------------------------------ apartment
bpy.ops.wm.open_mainfile(filepath=os.path.join(R.BLEND_DIR, "Interiors", "ENV_REAL_StarterApartment.blend"))
import build_starter_apartment as APT
AW, AD = APT.W, APT.D
acol = [wall(-AW / 2 - 0.08, 0, -AW / 2 - 0.08, AD, 0.16), wall(AW / 2 + 0.08, 0, AW / 2 + 0.08, AD, 0.16),
        wall(-AW / 2, AD + 0.08, AW / 2, AD + 0.08, 0.16),
        wall(-AW / 2, -0.08, 2.1, -0.08, 0.16), wall(3.1, -0.08, AW / 2, -0.08, 0.16),
        wall(-1.8, 0, -1.8, 2.3, 0.1), wall(-AW / 2, 2.3, -2.7, 2.3, 0.1)]
for o in bpy.data.objects:
    if o.type == "MESH" and o.name.startswith("PROP_REAL_") and not any(k in o.name for k in
            ("Rug", "DoorMat", "CeilingLight", "Phone", "Poster", "Door_", "Backpack")):
        b = obb(o, 0.02)
        acol.append(b)
world["apartment"] = {"colliders": acol, "sockets": socket_list(), "bounds": [-AW / 2, 0, AW / 2, AD]}
keep = [o for o in bpy.context.scene.objects if o.type == "MESH"]
export(os.path.join(OUT, "apartment.raw.glb"), keep)

with open(os.path.join(OUT, "world.json"), "w") as f:
    json.dump(world, f, separators=(",", ":"))
print("WORLD", {k: (len(v["colliders"]), len(v["sockets"])) for k, v in world.items()})
