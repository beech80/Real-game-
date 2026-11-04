"""
REAL — shared Blender pipeline library.

Every build script in Tools/ imports this module. It owns:
  * scene setup / reset
  * the REAL material library (MAT_REAL_*)
  * low-level mesh builders (bmesh based, so they work headless)
  * naming + collection conventions
  * render preview helpers (Cycles CPU — EEVEE needs a GPU context)
  * validation (transforms, UVs, normals, naming)
  * export (glTF binary + FBX, Unreal-oriented settings)

Units: 1 Blender unit = 1 metre. Z up, -Y forward (Blender default).
Unreal import: FBX exported with scale 1.0 and "FBX Units Scale" so 1 m -> 100 uu.
"""
import bpy
import bmesh
import math
import os
import json
from mathutils import Vector, Matrix, Euler

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BLEND_DIR = os.path.join(ROOT, "Blender")
EXPORT_DIR = os.path.join(ROOT, "Blender", "Exports")
RENDER_DIR = os.path.join(ROOT, "Renders")

# ---------------------------------------------------------------------------
# Scale contract (see Documentation/ProductionConventions.md)
# ---------------------------------------------------------------------------
SCALE = {
    "player_height": 1.45,       # m, top of head (ears excluded)
    "head_height": 0.38,         # m  -> ~3.8 heads tall
    "door_w": 1.10, "door_h": 2.20,
    "floor_h": 3.20,             # storey height, slab to slab
    "slab": 0.20,
    "wall_t": 0.20,
    "module": 4.0,               # facade grid module
    "counter_h": 0.85,
    "table_h": 0.72,
    "seat_h": 0.42,
    "sidewalk_h": 0.15,
    "lane_w": 3.5,
}

# ---------------------------------------------------------------------------
# REAL palette — sampled from References/Concept/*.png
# ---------------------------------------------------------------------------
PALETTE = {
    "navy":        (0.040, 0.055, 0.110),
    "navy_light":  (0.090, 0.120, 0.220),
    "gold":        (0.910, 0.620, 0.150),
    "cream":       (0.900, 0.860, 0.780),
    "white":       (0.880, 0.880, 0.880),
    "black_cloth": (0.030, 0.030, 0.035),
    "fox_orange":  (0.880, 0.270, 0.070),
    "fox_cream":   (0.950, 0.880, 0.780),
    "fox_dark":    (0.100, 0.050, 0.035),
    "freshmart_green": (0.060, 0.330, 0.140),
    "freshmart_leaf":  (0.330, 0.700, 0.200),
    "brick":       (0.420, 0.170, 0.110),
    "brick_dark":  (0.240, 0.100, 0.075),
    "concrete":    (0.520, 0.510, 0.490),
    "concrete_dark": (0.300, 0.300, 0.300),
    "asphalt":     (0.060, 0.060, 0.065),
    "road_line":   (0.900, 0.880, 0.800),
    "road_yellow": (0.900, 0.650, 0.100),
    "wood":        (0.420, 0.250, 0.130),
    "wood_light":  (0.650, 0.460, 0.280),
    "metal":       (0.600, 0.610, 0.630),
    "metal_dark":  (0.150, 0.155, 0.165),
    "glass":       (0.300, 0.420, 0.500),
    "grass":       (0.130, 0.300, 0.080),
    "leaf":        (0.110, 0.330, 0.090),
    "bark":        (0.180, 0.110, 0.070),
    "plaster":     (0.780, 0.740, 0.680),
    "plaster_warm": (0.820, 0.680, 0.540),
    "teal":        (0.050, 0.350, 0.400),
    "red":         (0.700, 0.080, 0.060),
    "purple_dusk": (0.300, 0.200, 0.450),
    "fabric_blue": (0.120, 0.180, 0.350),
    "fabric_grey": (0.350, 0.350, 0.380),
    "tile_white":  (0.820, 0.830, 0.830),
    "rubber":      (0.020, 0.020, 0.020),
}

# Material definitions: name -> dict(color, rough, metal, emit, emit_strength, alpha, transmission)
MATERIAL_DEFS = {
    # Architecture
    "MAT_REAL_Brick":          dict(color="brick", rough=0.85),
    "MAT_REAL_BrickDark":      dict(color="brick_dark", rough=0.85),
    "MAT_REAL_Concrete":       dict(color="concrete", rough=0.9),
    "MAT_REAL_ConcreteDark":   dict(color="concrete_dark", rough=0.9),
    "MAT_REAL_Plaster":        dict(color="plaster", rough=0.8),
    "MAT_REAL_PlasterWarm":    dict(color="plaster_warm", rough=0.8),
    "MAT_REAL_Asphalt":        dict(color="asphalt", rough=0.95),
    "MAT_REAL_RoadLine":       dict(color="road_line", rough=0.7),
    "MAT_REAL_RoadYellow":     dict(color="road_yellow", rough=0.7),
    "MAT_REAL_Sidewalk":       dict(color="concrete", rough=0.85),
    "MAT_REAL_Glass":          dict(color="glass", rough=0.05, metal=0.0, alpha=0.35),
    "MAT_REAL_GlassLit":       dict(color="cream", rough=0.2, emit="cream", emit_strength=2.5),
    "MAT_REAL_MetalFrame":     dict(color="metal_dark", rough=0.35, metal=1.0),
    "MAT_REAL_Metal":          dict(color="metal", rough=0.3, metal=1.0),
    "MAT_REAL_Wood":           dict(color="wood", rough=0.6),
    "MAT_REAL_WoodLight":      dict(color="wood_light", rough=0.6),
    "MAT_REAL_Grass":          dict(color="grass", rough=0.95),
    "MAT_REAL_Leaf":           dict(color="leaf", rough=0.8),
    "MAT_REAL_Bark":           dict(color="bark", rough=0.9),
    "MAT_REAL_TileWhite":      dict(color="tile_white", rough=0.3),
    "MAT_REAL_Rubber":         dict(color="rubber", rough=0.9),
    # Brand
    "MAT_REAL_Navy":           dict(color="navy", rough=0.5),
    "MAT_REAL_NavyLight":      dict(color="navy_light", rough=0.5),
    "MAT_REAL_Gold":           dict(color="gold", rough=0.25, metal=1.0),
    "MAT_REAL_GoldEmit":       dict(color="gold", rough=0.4, emit="gold", emit_strength=4.0),
    "MAT_REAL_FreshMartGreen": dict(color="freshmart_green", rough=0.5),
    "MAT_REAL_FreshMartLeaf":  dict(color="freshmart_leaf", rough=0.5, emit="freshmart_leaf", emit_strength=3.0),
    "MAT_REAL_SignWhiteEmit":  dict(color="white", rough=0.5, emit="white", emit_strength=4.0),
    "MAT_REAL_LampEmit":       dict(color="cream", rough=0.5, emit="cream", emit_strength=12.0),
    "MAT_REAL_ScreenEmit":     dict(color="teal", rough=0.3, emit="teal", emit_strength=2.0),
    "MAT_REAL_Red":            dict(color="red", rough=0.5),
    "MAT_REAL_Teal":           dict(color="teal", rough=0.5),
    "MAT_REAL_Cream":          dict(color="cream", rough=0.6),
    "MAT_REAL_White":          dict(color="white", rough=0.5),
    "MAT_REAL_FabricBlue":     dict(color="fabric_blue", rough=0.9),
    "MAT_REAL_FabricGrey":     dict(color="fabric_grey", rough=0.9),
    # Characters
    "MAT_REAL_Fur_FoxOrange":  dict(color="fox_orange", rough=0.75),
    "MAT_REAL_Fur_FoxCream":   dict(color="fox_cream", rough=0.75),
    "MAT_REAL_Fur_FoxDark":    dict(color="fox_dark", rough=0.75),
    "MAT_REAL_Clothing_Black": dict(color="black_cloth", rough=0.8),
    "MAT_REAL_Clothing_Cream": dict(color="cream", rough=0.85),
    "MAT_REAL_Clothing_Gold":  dict(color="gold", rough=0.5),
    "MAT_REAL_Shoe_White":     dict(color="white", rough=0.5),
    "MAT_REAL_Shoe_Sole":      dict(color="white", rough=0.6),
    "MAT_REAL_Eye_Iris":       dict(color=(0.32, 0.12, 0.03), rough=0.35, emit=(0.32, 0.12, 0.03), emit_strength=0.25),
    "MAT_REAL_Eye_Sclera":     dict(color="white", rough=0.1),
    "MAT_REAL_Eye_Pupil":      dict(color="rubber", rough=0.05),
    "MAT_REAL_Eye_Highlight":  dict(color="white", rough=0.1, emit="white", emit_strength=3.0),
    "MAT_REAL_Nose":           dict(color="rubber", rough=0.25),
    "MAT_REAL_Mouth":          dict(color="fox_dark", rough=0.6),
}


def srgb_to_lin(c):
    """Palette values are authored in display space; convert to linear."""
    def f(x):
        return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return tuple(f(v) for v in c)


def _col(key_or_tuple):
    if isinstance(key_or_tuple, str):
        return srgb_to_lin(PALETTE[key_or_tuple])
    return key_or_tuple


def get_mat(name):
    """Return (creating on demand) a REAL library material."""
    m = bpy.data.materials.get(name)
    if m:
        return m
    d = MATERIAL_DEFS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    c = _col(d["color"])
    bsdf.inputs["Base Color"].default_value = (*c, 1.0)
    bsdf.inputs["Roughness"].default_value = d.get("rough", 0.5)
    bsdf.inputs["Metallic"].default_value = d.get("metal", 0.0)
    if "emit" in d:
        bsdf.inputs["Emission Color"].default_value = (*_col(d["emit"]), 1.0)
        bsdf.inputs["Emission Strength"].default_value = d.get("emit_strength", 1.0)
    if "alpha" in d:
        bsdf.inputs["Alpha"].default_value = d["alpha"]
        try:
            m.surface_render_method = "BLENDED"
        except Exception:
            pass
    m.diffuse_color = (*c, 1.0)
    return m


def custom_mat(name, color, rough=0.6, metal=0.0, emit=None, emit_strength=0.0):
    """Ad-hoc material outside the library (e.g. product packaging colours)."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    MATERIAL_DEFS[name] = dict(color=color, rough=rough, metal=metal)
    if emit:
        MATERIAL_DEFS[name].update(emit=emit, emit_strength=emit_strength)
    return get_mat(name)


# ---------------------------------------------------------------------------
# Scene / collections
# ---------------------------------------------------------------------------
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.unit_settings.system = "METRIC"
    s.unit_settings.scale_length = 1.0
    return s


def coll(name, parent=None):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        (parent or bpy.context.scene.collection).children.link(c)
    return c


def link(obj, collection=None):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


# ---------------------------------------------------------------------------
# Mesh builders (bmesh — no operator context needed)
# ---------------------------------------------------------------------------
def _finish(bm, name, mat, collection, loc, rot):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    if mat is not None:
        me.materials.append(get_mat(mat) if isinstance(mat, str) else mat)
    ob = bpy.data.objects.new(name, me)
    (collection or bpy.context.scene.collection).objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    return ob


def _box_uv(bm, scale=1.0):
    """World-size box projection UVs: 1 UV unit = 1 m / scale. Keeps texel density consistent."""
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            co = l.vert.co
            if ax == 0:
                u, v = co.y, co.z
            elif ax == 1:
                u, v = co.x, co.z
            else:
                u, v = co.x, co.y
            l[uv].uv = (u / scale, v / scale)


def box(name, size, loc=(0, 0, 0), mat=None, pivot="bottom", rot=(0, 0, 0), collection=None, bevel=0.0):
    """Axis-aligned box. pivot: 'bottom' (bottom-centre), 'center', or 'corner' (min corner)."""
    sx, sy, sz = size
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    off = {"bottom": Vector((0, 0, 0.5)), "center": Vector((0, 0, 0)), "corner": Vector((0.5, 0.5, 0.5))}[pivot]
    for v in bm.verts:
        v.co = Vector(((v.co.x + off.x) * sx, (v.co.y + off.y) * sy, (v.co.z + off.z) * sz))
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=2, affect="EDGES", profile=0.5)
    bm.normal_update()
    _box_uv(bm)
    return _finish(bm, name, mat, collection, loc, rot)


def cylinder(name, radius, depth, loc=(0, 0, 0), mat=None, segments=16, pivot="bottom", rot=(0, 0, 0),
             collection=None, radius2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segments,
                          radius1=radius, radius2=radius if radius2 is None else radius2, depth=depth)
    if pivot == "bottom":
        bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, depth / 2))
    bm.normal_update()
    _box_uv(bm)
    return _finish(bm, name, mat, collection, loc, rot)


def sphere(name, radius, loc=(0, 0, 0), mat=None, segments=16, rings=8, collection=None, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=rings, radius=radius, calc_uvs=True)
    for v in bm.verts:
        v.co = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2]))
    for f in bm.faces:
        f.smooth = True
    bm.normal_update()
    return _finish(bm, name, mat, collection, loc, (0, 0, 0))


def text_mesh(name, body, size=0.5, loc=(0, 0, 0), rot=(math.radians(90), 0, 0), mat=None,
              extrude=0.01, align="CENTER", collection=None):
    """Signage text converted to real mesh geometry (exportable)."""
    cu = bpy.data.curves.new(name + "_crv", "FONT")
    cu.body = body
    cu.size = size
    cu.extrude = extrude
    cu.align_x = align
    cu.align_y = "CENTER"
    tmp = bpy.data.objects.new(name + "_tmp", cu)
    bpy.context.scene.collection.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    me.name = name
    if mat:
        me.materials.clear()
        me.materials.append(get_mat(mat) if isinstance(mat, str) else mat)
    ob = bpy.data.objects.new(name, me)
    (collection or bpy.context.scene.collection).objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    ensure_uv(ob)
    return ob


def ensure_uv(ob):
    if ob.type == "MESH" and not ob.data.uv_layers:
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        _box_uv(bm)
        bm.to_mesh(ob.data)
        bm.free()


def join(objs, name):
    """Join objects into one mesh (bmesh-free path using data API)."""
    objs = [o for o in objs if o is not None]
    if not objs:
        return None
    base = objs[0]
    with bpy.context.temp_override(active_object=base, selected_editable_objects=objs, object=base):
        bpy.ops.object.join()
    # Bake the base part's transform so the result's pivot is the builder origin (0,0,0).
    base.data.transform(base.matrix_basis)
    base.matrix_basis = Matrix.Identity(4)
    base.name = name
    base.data.name = name
    return base


def apply_transforms(ob, loc=False, rot=True, scale=True):
    mw = ob.matrix_basis.copy()
    loc_v, rot_q, scl = mw.decompose()
    m = Matrix.Identity(4)
    if scale:
        m = Matrix.Diagonal((*scl, 1.0)) @ m
    if rot:
        m = rot_q.to_matrix().to_4x4() @ m
    if loc:
        m = Matrix.Translation(loc_v) @ m
    if ob.type == "MESH":
        ob.data.transform(m)
    keep_loc = Vector((0, 0, 0)) if loc else loc_v
    keep_rot = rot_q.to_euler() if not rot else Euler((0, 0, 0))
    keep_scl = Vector((1, 1, 1)) if scale else scl
    ob.location = keep_loc
    ob.rotation_euler = keep_rot
    ob.scale = keep_scl


def set_origin_bottom_center(ob):
    me = ob.data
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; zs = [v.co.z for v in me.vertices]
    c = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
    me.transform(Matrix.Translation(-c))
    ob.location = ob.matrix_world @ c


def marker(name, loc, rot=(0, 0, 0), kind="Interact", collection=None, props=None, size=0.25):
    """Gameplay marker empty. Unreal side: spawn interaction component at this socket.
    Naming: SOCKET_<Kind>_<Purpose>. Custom properties travel with FBX/glTF extras."""
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "ARROWS"
    e.empty_display_size = size
    e.location = loc
    e.rotation_euler = rot
    e["real_marker"] = kind
    for k, v in (props or {}).items():
        e[k] = v
    (collection or bpy.context.scene.collection).objects.link(e)
    return e


def make_ucx(ob, collection=None, pad=0.0):
    """Unreal convex collision proxy: UCX_<MeshName>_00 box from the object's local bbox."""
    bb = [Vector(c) for c in ob.bound_box]
    mn = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
    mx = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    size = (mx - mn) + Vector((pad, pad, pad))
    u = box(f"UCX_{ob.name}_00", tuple(size), tuple((mn + mx) / 2), "MAT_REAL_ConcreteDark", pivot="center",
            collection=collection or ob.users_collection[0])
    u.parent = ob
    u.display_type = "WIRE"
    u.hide_render = True
    return u


def group_under(objs, name, loc=(0, 0, 0), rot_z=0.0, collection=None):
    """Parent top-level objects under a root empty and move the whole group."""
    root = bpy.data.objects.new(name, None)
    root.empty_display_type = "PLAIN_AXES"
    (collection or bpy.context.scene.collection).objects.link(root)
    for o in objs:
        if o.parent is None and o is not root:
            o.parent = root
    root.location = loc
    root.rotation_euler = (0, 0, rot_z)
    return root


def parent_keep(child, parent):
    mw = child.matrix_world.copy()
    child.parent = parent
    child.matrix_world = mw


# ---------------------------------------------------------------------------
# Instancing — modular kit pieces placed as linked duplicates (shared mesh)
# ---------------------------------------------------------------------------
def instance(src, name, loc, rot_z=0.0, collection=None, scale=(1, 1, 1)):
    ob = bpy.data.objects.new(name, src.data)
    ob.location = loc
    ob.rotation_euler = (0, 0, rot_z)
    ob.scale = scale
    for k in src.keys():
        ob[k] = src[k]
    (collection or bpy.context.scene.collection).objects.link(ob)
    return ob


# ---------------------------------------------------------------------------
# Lighting / render
# ---------------------------------------------------------------------------
def setup_world(preset="sunset", strength=1.0):
    s = bpy.context.scene
    w = bpy.data.worlds.new("WLD_REAL_" + preset)
    s.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    sky = nt.nodes.new("ShaderNodeTexSky")
    presets = {
        "sunset":   dict(elev=6, rot=200, strength=0.9, sun_strength=3.0, sun_color=(1.0, 0.62, 0.38)),
        "midday":   dict(elev=55, rot=150, strength=1.0, sun_strength=4.0, sun_color=(1.0, 0.96, 0.9)),
        "morning":  dict(elev=18, rot=100, strength=1.0, sun_strength=3.0, sun_color=(1.0, 0.85, 0.7)),
        "night":    dict(elev=-4, rot=200, strength=0.08, sun_strength=0.0, sun_color=(0.5, 0.6, 1.0)),
        "interior": dict(elev=30, rot=160, strength=0.4, sun_strength=2.0, sun_color=(1.0, 0.85, 0.7)),
    }
    p = presets[preset]
    try:
        sky.sky_type = "NISHITA"
    except Exception:
        pass
    try:
        sky.sun_elevation = math.radians(max(p["elev"], -2))
        sky.sun_rotation = math.radians(p["rot"])
        sky.sun_disc = False
    except Exception:
        pass
    bg.inputs["Strength"].default_value = p["strength"] * strength
    nt.links.new(sky.outputs[0], bg.inputs[0])
    nt.links.new(bg.outputs[0], out.inputs[0])
    if p["sun_strength"] > 0:
        sd = bpy.data.lights.new("LGT_Sun", "SUN")
        sd.energy = p["sun_strength"]
        sd.color = p["sun_color"]
        sd.angle = math.radians(2.0)
        sun = bpy.data.objects.new("LGT_Sun", sd)
        s.collection.objects.link(sun)
        sun.rotation_euler = Euler((math.radians(90 - p["elev"]), 0, math.radians(p["rot"] + 180)))
    return w


def setup_render(res=(1280, 720), samples=48, exposure=0.0):
    s = bpy.context.scene
    s.render.engine = "CYCLES"
    s.cycles.device = "CPU"
    s.cycles.samples = samples
    s.cycles.use_denoising = True
    try:
        s.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        pass
    s.cycles.max_bounces = 6
    s.render.resolution_x, s.render.resolution_y = res
    s.render.resolution_percentage = 100
    s.render.image_settings.file_format = "PNG"
    try:
        s.view_settings.view_transform = "AgX"
        s.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        try:
            s.view_settings.view_transform = "Filmic"
        except Exception:
            pass
    s.view_settings.exposure = exposure


def camera(name, loc, target, lens=35, collection=None):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.clip_end = 2000
    cam = bpy.data.objects.new(name, cd)
    (collection or bpy.context.scene.collection).objects.link(cam)
    cam.location = loc
    d = Vector(target) - Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return cam


def render(cam, path, res=None, samples=None):
    s = bpy.context.scene
    s.camera = cam
    if res:
        s.render.resolution_x, s.render.resolution_y = res
    if samples:
        s.cycles.samples = samples
    os.makedirs(os.path.dirname(path), exist_ok=True)
    s.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("RENDERED", path)


def point_light(name, loc, energy=200, color=(1, 0.85, 0.65), radius=0.2, collection=None):
    ld = bpy.data.lights.new(name, "POINT")
    ld.energy = energy
    ld.color = color
    ld.shadow_soft_size = radius
    ob = bpy.data.objects.new(name, ld)
    (collection or bpy.context.scene.collection).objects.link(ob)
    ob.location = loc
    return ob


def area_light(name, loc, size=(2, 2), energy=300, color=(1, 0.9, 0.8), rot=(0, 0, 0), collection=None):
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = "RECTANGLE"
    ld.size, ld.size_y = size
    ld.energy = energy
    ld.color = color
    ob = bpy.data.objects.new(name, ld)
    (collection or bpy.context.scene.collection).objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    return ob


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
NAME_PREFIXES = ("CHR_", "SK_", "RIG_", "ANIM_", "ENV_", "PROP_", "VEH_", "MAT_", "KIT_", "BLD_", "SM_",
                 "SOCKET_", "LGT_", "CAM_", "UCX_", "FX_", "MRK_", "CLO_", "NPC_", "TMP_", "DST_", "INT_")


def validate_scene(objects=None, require_uv=True):
    """Returns dict report. Errors block export; warnings are logged."""
    errors, warnings = [], []
    objs = objects or list(bpy.context.scene.objects)
    for ob in objs:
        if not ob.name.startswith(NAME_PREFIXES):
            warnings.append(f"naming: {ob.name}")
        if ob.type != "MESH":
            continue
        me = ob.data
        if any(abs(s - 1.0) > 1e-4 for s in ob.scale) and ob.data.users == 1:
            warnings.append(f"unapplied scale: {ob.name} {tuple(round(s,3) for s in ob.scale)}")
        if require_uv and not me.uv_layers:
            errors.append(f"no UVs: {ob.name}")
        if not me.materials or any(m is None for m in me.materials):
            errors.append(f"missing material: {ob.name}")
        if len(me.polygons) == 0:
            errors.append(f"empty mesh: {ob.name}")
    return {"errors": errors, "warnings": warnings, "object_count": len(objs)}


def tri_count(objs=None):
    dg = bpy.context.evaluated_depsgraph_get()
    total = 0
    seen = set()
    for ob in (objs or bpy.context.scene.objects):
        if ob.type != "MESH":
            continue
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        total += sum(len(p.vertices) - 2 for p in me.polygons)
        ev.to_mesh_clear()
    return total


# ---------------------------------------------------------------------------
# Save / export
# ---------------------------------------------------------------------------
def save_blend(rel_path):
    p = os.path.join(BLEND_DIR, rel_path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=p, compress=True)
    print("SAVED", p)
    return p


def export_glb(rel_path, objects=None, animations=False):
    p = os.path.join(EXPORT_DIR, rel_path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    kw = dict(filepath=p, export_format="GLB", export_apply=True, export_extras=True,
              export_animations=animations, export_yup=True)
    if objects is not None:
        for o in bpy.context.scene.objects:
            o.select_set(False)
        for o in objects:
            o.select_set(True)
        kw["use_selection"] = True
    bpy.ops.export_scene.gltf(**kw)
    print("EXPORTED", p, os.path.getsize(p))
    return p


def export_fbx(rel_path, objects=None, armature=False, animations=False):
    """Unreal-oriented FBX: -Y forward is Blender native; UE imports with 'Convert Scene' on."""
    p = os.path.join(EXPORT_DIR, rel_path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    kw = dict(filepath=p, apply_unit_scale=True, apply_scale_options="FBX_SCALE_UNITS",
              axis_forward="-Y", axis_up="Z", use_mesh_modifiers=True, mesh_smooth_type="FACE",
              use_custom_props=True, add_leaf_bones=False, bake_anim=animations,
              object_types={"MESH", "EMPTY", "ARMATURE"})
    if animations:
        kw.update(bake_anim_use_all_actions=True, bake_anim_use_nla_strips=False,
                  bake_anim_force_startend_keying=True, bake_anim_simplify_factor=0.0)
    if objects is not None:
        for o in bpy.context.scene.objects:
            o.select_set(False)
        for o in objects:
            o.select_set(True)
        kw["use_selection"] = True
    bpy.ops.export_scene.fbx(**kw)
    print("EXPORTED", p, os.path.getsize(p))
    return p


def write_report(rel_path, data):
    p = os.path.join(ROOT, "Tests", "reports", rel_path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w") as f:
        json.dump(data, f, indent=2, default=str)
    print("REPORT", p)
    return p
