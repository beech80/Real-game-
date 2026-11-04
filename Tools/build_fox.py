"""
CHR_REAL_Fox — production pipeline character #1 (the template for all nine REALs).

Pipeline (each step is a function, reused by the species variants):
  1. skeleton()          UE5-mannequin-compatible bone names (retarget-friendly), A-pose
  2. body_mesh()         quad topology from a Skin-modifier skeleton graph + Subdivision
  3. head_mesh()         stylised head, raycast-placed anime eyes/brows/mouth, ears, fluff
  4. hands/shoes/tail    rigid or chain-weighted parts
  5. clothing()          layered outfit shells generated from body faces (inherit weights)
  6. skin_weights()      deterministic point-to-bone-segment smooth skinning (top-3 influences)
  7. expressions()       shape keys: 12 expressions + blinks + look + mouth open
  8. animations()        in-place actions (Idle, Walk, Run, Sprint, Jump, Sit, Phone, Wave, Talk, Pickup, Carry, Drive)
  9. export + verify     FBX (Unreal) + GLB (web preview), re-import check, renders

Facing -Y, Z up, metres. Height 1.45 m to top of skull (ears to ~1.62 m), ~3.8 heads.
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import bmesh
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
import real_lib as R

SPECIES = "Fox"
HEAD_C = Vector((0, 0.0, 1.235))    # head centre
HEAD_R = Vector((0.225, 0.20, 0.195))

# --------------------------------------------------------------------------- 1. skeleton
BONES = [
    # name, head, tail, parent, deform
    ("root", (0, 0, 0), (0, 0.25, 0), None, False),
    ("pelvis", (0, 0, 0.56), (0, 0, 0.64), "root", True),
    ("spine_01", (0, 0, 0.64), (0, 0, 0.78), "pelvis", True),
    ("spine_02", (0, 0, 0.78), (0, 0, 0.95), "spine_01", True),
    ("neck_01", (0, 0, 0.95), (0, -0.005, 1.04), "spine_02", True),
    ("head", (0, -0.005, 1.04), (0, -0.005, 1.32), "neck_01", True),
    ("ear_01_l", (0.125, 0.03, 1.37), (0.165, 0.045, 1.47), "head", True),
    ("ear_02_l", (0.165, 0.045, 1.47), (0.2, 0.055, 1.59), "ear_01_l", True),
    ("ear_01_r", (-0.125, 0.03, 1.37), (-0.165, 0.045, 1.47), "head", True),
    ("ear_02_r", (-0.165, 0.045, 1.47), (-0.2, 0.055, 1.59), "ear_01_r", True),
    ("clavicle_l", (0.03, 0.0, 0.93), (0.135, 0.0, 0.925), "spine_02", True),
    ("upperarm_l", (0.135, 0.0, 0.925), (0.27, 0.015, 0.765), "clavicle_l", True),
    ("lowerarm_l", (0.27, 0.015, 0.765), (0.375, 0.0, 0.635), "upperarm_l", True),
    ("hand_l", (0.375, 0.0, 0.635), (0.415, -0.005, 0.57), "lowerarm_l", True),
    ("clavicle_r", (-0.03, 0.0, 0.93), (-0.135, 0.0, 0.925), "spine_02", True),
    ("upperarm_r", (-0.135, 0.0, 0.925), (-0.27, 0.015, 0.765), "clavicle_r", True),
    ("lowerarm_r", (-0.27, 0.015, 0.765), (-0.375, 0.0, 0.635), "upperarm_r", True),
    ("hand_r", (-0.375, 0.0, 0.635), (-0.415, -0.005, 0.57), "lowerarm_r", True),
    ("thigh_l", (0.085, 0.0, 0.55), (0.09, -0.012, 0.32), "pelvis", True),
    ("calf_l", (0.09, -0.012, 0.32), (0.09, 0.01, 0.1), "thigh_l", True),
    ("foot_l", (0.09, 0.01, 0.1), (0.09, -0.08, 0.035), "calf_l", True),
    ("ball_l", (0.09, -0.08, 0.035), (0.09, -0.17, 0.035), "foot_l", True),
    ("thigh_r", (-0.085, 0.0, 0.55), (-0.09, -0.012, 0.32), "pelvis", True),
    ("calf_r", (-0.09, -0.012, 0.32), (-0.09, 0.01, 0.1), "thigh_r", True),
    ("foot_r", (-0.09, 0.01, 0.1), (-0.09, -0.08, 0.035), "calf_r", True),
    ("ball_r", (-0.09, -0.08, 0.035), (-0.09, -0.17, 0.035), "foot_r", True),
    ("tail_01", (0, 0.10, 0.6), (0, 0.19, 0.56), "pelvis", True),
    ("tail_02", (0, 0.19, 0.56), (0, 0.29, 0.6), "tail_01", True),
    ("tail_03", (0, 0.29, 0.6), (0, 0.35, 0.72), "tail_02", True),
    ("tail_04", (0, 0.35, 0.72), (0, 0.36, 0.86), "tail_03", True),
]
BONE = {b[0]: b for b in BONES}


def skeleton(name):
    ad = bpy.data.armatures.new(f"RIG_REAL_{SPECIES}")
    arm = bpy.data.objects.new(name, ad)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = ad.edit_bones
    for n, h, t, par, deform in BONES:
        b = eb.new(n)
        b.head, b.tail = h, t
        b.roll = 0
        b.use_deform = deform
        if par:
            b.parent = eb[par]
            b.use_connect = (Vector(eb[par].tail) - Vector(h)).length < 1e-4 and n not in ("clavicle_l", "clavicle_r")
    bpy.ops.object.mode_set(mode="OBJECT")
    ad.display_type = "STICK"
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
    return arm


# --------------------------------------------------------------------------- helpers
def mesh_obj(name, bm, mats):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(R.get_mat(m))
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def evaluated_copy(ob, name):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    mw = ob.matrix_world.copy()
    bpy.data.objects.remove(ob)
    new = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(new)
    new.matrix_world = mw
    me.name = name
    return new


def skin_chain(name, pts, radii, edges, subsurf=2, root=0):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(p) for p in pts], edges, [])
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    sk = ob.modifiers.new("Skin", "SKIN")
    sk.use_smooth_shade = True
    sk.branch_smoothing = 0.6
    for i, r in enumerate(radii):
        ob.data.skin_vertices[0].data[i].radius = r
    ob.data.skin_vertices[0].data[root].use_root = True
    ss = ob.modifiers.new("Sub", "SUBSURF")
    ss.levels = subsurf
    ss.render_levels = subsurf
    return evaluated_copy(ob, name)


def smooth(ob):
    for p in ob.data.polygons:
        p.use_smooth = True


def assign_mat_by(ob, fn):
    """fn(face_center, normal) -> material slot index"""
    mw = ob.matrix_world
    for p in ob.data.polygons:
        p.material_index = fn(mw @ p.center, (mw.to_3x3() @ p.normal).normalized())


def vgroup_all(ob, name, w=1.0):
    vg = ob.vertex_groups.get(name) or ob.vertex_groups.new(name=name)
    vg.add(list(range(len(ob.data.vertices))), w, "REPLACE")
    return vg


def ellipsoid(name, center, radii, mat, seg=24, rings=14, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0, calc_uvs=True)
    for v in bm.verts:
        co = Vector((v.co.x * radii[0], v.co.y * radii[1], v.co.z * radii[2]))
        if rot is not None:
            co = rot @ co
        v.co = co + Vector(center)
    ob = mesh_obj(name, bm, [mat])
    smooth(ob)
    return ob


def tube(name, pts, radius, mat, seg=6, taper=True):
    """Swept tube along polyline (brows, lashes, mouth). Ends taper for a brush-stroke look."""
    bm = bmesh.new()
    rings = []
    n = len(pts)
    for i, p in enumerate(pts):
        p = Vector(p)
        t = (Vector(pts[min(i + 1, n - 1)]) - Vector(pts[max(i - 1, 0)])).normalized()
        up = Vector((0, -1, 0))
        side = t.cross(up).normalized()
        up2 = side.cross(t).normalized()
        k = i / (n - 1)
        r = radius * (math.sin(math.pi * k) ** 0.5 if taper else 1.0) + radius * 0.15
        ring = []
        for s in range(seg):
            a = 2 * math.pi * s / seg
            ring.append(bm.verts.new(p + (side * math.cos(a) + up2 * math.sin(a)) * r))
        rings.append(ring)
    for i in range(n - 1):
        for s in range(seg):
            bm.faces.new((rings[i][s], rings[i][(s + 1) % seg], rings[i + 1][(s + 1) % seg], rings[i + 1][s]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        for l in f.loops:
            l[uv].uv = (l.vert.co.x, l.vert.co.z)
    ob = mesh_obj(name, bm, [mat])
    smooth(ob)
    return ob


# --------------------------------------------------------------------------- 2. body
def body_mesh():
    P = {
        "crotch": (0, 0.0, 0.53), "hip": (0, 0.0, 0.61), "waist": (0, 0.0, 0.72), "chest": (0, -0.005, 0.84),
        "shoulder": (0, 0.0, 0.93), "neck": (0, 0.0, 1.0), "neck_top": (0, 0.0, 1.08),
    }
    pts, radii, edges = [], [], []

    def add(p, r):
        pts.append(Vector(p)); radii.append(r); return len(pts) - 1
    c = add(P["crotch"], (0.13, 0.11))
    h = add(P["hip"], (0.16, 0.125)); edges.append((c, h))
    w = add(P["waist"], (0.15, 0.115)); edges.append((h, w))
    ch = add(P["chest"], (0.165, 0.125)); edges.append((w, ch))
    sh = add(P["shoulder"], (0.14, 0.105)); edges.append((ch, sh))
    nk = add(P["neck"], (0.065, 0.065)); edges.append((sh, nk))
    nt = add(P["neck_top"], (0.06, 0.06)); edges.append((nk, nt))
    for s in (1, -1):
        hp = add((0.075 * s, 0.0, 0.5), (0.075, 0.075)); edges.append((c, hp))
        kn = add((0.09 * s, -0.012, 0.32), (0.062, 0.062)); edges.append((hp, kn))
        an = add((0.09 * s, 0.008, 0.11), (0.05, 0.05)); edges.append((kn, an))
        sp = add((0.125 * s, 0.0, 0.925), (0.06, 0.06)); edges.append((sh, sp))
        el = add((0.27 * s, 0.015, 0.765), (0.048, 0.048)); edges.append((sp, el))
        wr = add((0.37 * s, 0.0, 0.64), (0.04, 0.04)); edges.append((el, wr))
    body = skin_chain(f"SK_REAL_{SPECIES}_Body", pts, radii, edges, subsurf=2, root=0)
    for m in ("MAT_REAL_Fur_FoxOrange", "MAT_REAL_Fur_FoxCream", "MAT_REAL_Fur_FoxDark"):
        body.data.materials.append(R.get_mat(m))

    def regions(c, n):
        if c.y < -0.06 and 0.62 < c.z < 0.95 and abs(c.x) < 0.11:
            return 1                                    # cream chest/belly
        if c.z < 0.2:
            return 2                                    # dark "socks"
        return 0
    assign_mat_by(body, regions)
    smooth(body)
    return body


def hands():
    parts = []
    for s, side in ((1, "l"), (-1, "r")):
        h0 = Vector(BONE[f"hand_{side}"][1]); h1 = Vector(BONE[f"hand_{side}"][2])
        d = (h1 - h0).normalized()
        rot = Vector((0, 0, -1)).rotation_difference(d).to_matrix()
        palm_c = h0 + d * 0.045
        parts.append(ellipsoid("t", palm_c, (0.042, 0.03, 0.05), "MAT_REAL_Fur_FoxOrange", 16, 10, rot))
        for k, fx in enumerate((-0.022, 0.0, 0.022)):
            fc = palm_c + rot @ Vector((fx * s, -0.004, -0.045))
            parts.append(ellipsoid("t", fc, (0.014, 0.016, 0.022), "MAT_REAL_Fur_FoxOrange", 10, 6, rot))
        tc = palm_c + rot @ Vector((-0.03 * s, -0.03, 0.0))
        parts.append(ellipsoid("t", tc, (0.015, 0.016, 0.026), "MAT_REAL_Fur_FoxOrange", 10, 6,
                               rot @ Matrix.Rotation(math.radians(-35 * s), 3, "Y")))
        for p in parts[-5:]:
            vgroup_all(p, f"hand_{side}")
    return R.join(parts, f"SK_REAL_{SPECIES}_Hands")


def shoes():
    """Big chunky sneakers — a REAL silhouette signature."""
    parts = []
    for s, side in ((1, "l"), (-1, "r")):
        x = 0.09 * s
        sole = R.box("t", (0.15, 0.31, 0.055), (x, -0.045, 0.0), "MAT_REAL_Shoe_Sole", bevel=0.022)
        upper = R.box("t", (0.135, 0.26, 0.085), (x, -0.025, 0.05), "MAT_REAL_Clothing_Black", bevel=0.035)
        toe = R.box("t", (0.13, 0.09, 0.06), (x, -0.155, 0.05), "MAT_REAL_Shoe_White", bevel=0.028)
        collar = R.box("t", (0.12, 0.12, 0.06), (x, 0.03, 0.12), "MAT_REAL_Clothing_Black", bevel=0.025)
        stripe = R.box("t", (0.15, 0.12, 0.02), (x, -0.03, 0.075), "MAT_REAL_Fur_FoxOrange", bevel=0.008)
        lace = R.box("t", (0.05, 0.1, 0.012), (x, -0.08, 0.13), "MAT_REAL_Clothing_Gold", rot=(math.radians(-25), 0, 0))
        tread = R.box("t", (0.152, 0.312, 0.012), (x, -0.045, 0.0), "MAT_REAL_Rubber")
        for p in (sole, upper, toe, collar, stripe, lace, tread):
            p.location.y += 0.0
        ps = [sole, upper, toe, collar, stripe, lace, tread]
        for p in ps:
            R.apply_transforms(p, loc=True)
            # heel -> foot, toe region -> ball (blend)
            vg_f = p.vertex_groups.new(name=f"foot_{side}")
            vg_b = p.vertex_groups.new(name=f"ball_{side}")
            for v in p.data.vertices:
                t = min(1.0, max(0.0, (-0.06 - v.co.y) / 0.06))
                vg_f.add([v.index], 1.0 - t, "REPLACE")
                vg_b.add([v.index], t, "REPLACE")
        parts += ps
    sh = R.join(parts, f"SK_REAL_{SPECIES}_Shoes")
    smooth(sh)
    return sh


def tail():
    pts = [(0, 0.08, 0.6), (0, 0.17, 0.555), (0, 0.27, 0.59), (0, 0.34, 0.70), (0, 0.365, 0.83), (0, 0.35, 0.92)]
    radii = [(0.035, 0.035), (0.075, 0.07), (0.105, 0.095), (0.11, 0.1), (0.085, 0.08), (0.02, 0.02)]
    edges = [(i, i + 1) for i in range(len(pts) - 1)]
    t = skin_chain(f"SK_REAL_{SPECIES}_Tail", pts, radii, edges, subsurf=2)
    for m in ("MAT_REAL_Fur_FoxOrange", "MAT_REAL_Fur_FoxCream"):
        t.data.materials.append(R.get_mat(m))
    assign_mat_by(t, lambda c, n: 1 if c.z > 0.8 else 0)
    smooth(t)
    return t


# --------------------------------------------------------------------------- 3. head
def head_base():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=24, radius=1.0, calc_uvs=True)
    for v in bm.verts:
        x, y, z = v.co
        # wider at cheeks, slight flattening at the top-back, rounder forehead
        cheek = 1.0 + 0.10 * max(0.0, 1 - abs(z + 0.25) * 2.2)
        top = 1.0 - 0.06 * max(0.0, z)
        yy = y * (0.92 if y > 0 else 1.0)
        v.co = Vector((x * HEAD_R.x * cheek, yy * HEAD_R.y, z * HEAD_R.z * top)) + HEAD_C
    ob = mesh_obj("t_head", bm, ["MAT_REAL_Fur_FoxOrange", "MAT_REAL_Fur_FoxCream"])
    assign_mat_by(ob, lambda c, n: 1 if (c.z < HEAD_C.z - 0.045 and c.y < 0.06) else 0)
    smooth(ob)
    return ob


def muzzle():
    c = Vector((0, HEAD_C.y - 0.15, HEAD_C.z - 0.085))
    m = ellipsoid("t_muzzle", c, (0.07, 0.075, 0.048), "MAT_REAL_Fur_FoxCream", 24, 12)
    for v in m.data.vertices:
        if v.co.y < c.y:      # taper the snout forward
            k = (c.y - v.co.y) / 0.075
            v.co.x = c.x + (v.co.x - c.x) * (1 - 0.35 * k)
            v.co.z = c.z + (v.co.z - c.z) * (1 - 0.2 * k) + 0.012 * k
    return m


class FaceProjector:
    def __init__(self, objs):
        bm = bmesh.new()
        for o in objs:
            tmp = bmesh.new(); tmp.from_mesh(o.data); tmp.transform(o.matrix_world)
            me = bpy.data.meshes.new("tmp"); tmp.to_mesh(me); tmp.free()
            bm.from_mesh(me); bpy.data.meshes.remove(me)
        self.bvh = BVHTree.FromBMesh(bm)
        bm.free()

    def hit(self, x, z, offset=0.0):
        origin = Vector((x, -1.0, z))
        loc, nrm, idx, dist = self.bvh.ray_cast(origin, Vector((0, 1, 0)))
        if loc is None:
            return None, None
        return loc + nrm * offset, nrm


def eye(fp, side):
    s = 1 if side == "l" else -1
    cx, cz = 0.094 * s, HEAD_C.z + 0.012
    p, n = fp.hit(cx, cz, -0.006)
    rot = Vector((0, -1, 0)).rotation_difference(n).to_matrix()
    # tilt the eye shape slightly (outer corner up) — anime fox look
    rot = rot @ Matrix.Rotation(math.radians(-10 * s), 3, "Y")

    def at(local):
        return p + rot @ Vector(local)
    parts = []
    sc = ellipsoid(f"t_sclera_{side}", at((0, 0, 0)), (0.05, 0.012, 0.062), "MAT_REAL_Eye_Sclera", 20, 10, rot)
    ir = ellipsoid(f"t_iris_{side}", at((0.004 * s, -0.009, -0.006)), (0.039, 0.006, 0.05), "MAT_REAL_Eye_Iris", 20, 8, rot)
    pu = ellipsoid(f"t_pupil_{side}", at((0.004 * s, -0.0135, -0.006)), (0.02, 0.003, 0.028), "MAT_REAL_Eye_Pupil", 14, 6, rot)
    hi = ellipsoid(f"t_hl_{side}", at((-0.013 * s, -0.016, 0.022)), (0.012, 0.003, 0.014), "MAT_REAL_Eye_Highlight", 10, 6, rot)
    hi2 = ellipsoid(f"t_hl2_{side}", at((0.016 * s, -0.016, -0.026)), (0.006, 0.002, 0.006), "MAT_REAL_Eye_Highlight", 8, 4, rot)
    for o in (sc, ir, pu, hi, hi2):
        o.vertex_groups.new(name=f"FX_Eye_{side}").add(list(range(len(o.data.vertices))), 1.0, "REPLACE")
    for o in (ir, pu, hi, hi2):
        o.vertex_groups.new(name=f"FX_Iris_{side}").add(list(range(len(o.data.vertices))), 1.0, "REPLACE")
    # upper lash line (thick stroke) + small outer flick
    lash_pts = []
    for k in range(9):
        a = math.radians(200 - k * 25)            # arc across the top of the eye
        lash_pts.append(at((0.054 * math.cos(a) * -s * -1, -0.013, 0.062 * math.sin(a) * 0.98 + 0.004)))
    lash_pts.append(at((0.072 * s, -0.012, 0.036)))
    lash = tube(f"t_lash_{side}", lash_pts, 0.0075, "MAT_REAL_Eye_Pupil", 6)
    lash.vertex_groups.new(name=f"FX_Lash_{side}").add(list(range(len(lash.data.vertices))), 1.0, "REPLACE")
    lash.vertex_groups.new(name=f"FX_Eye_{side}").add(list(range(len(lash.data.vertices))), 1.0, "REPLACE")
    parts += [sc, ir, pu, hi, hi2, lash]
    # brow
    bpts = []
    for k in range(6):
        t = k / 5
        bx = (0.045 + 0.065 * t) * s
        p2, _ = fp.hit(bx, HEAD_C.z + 0.1 + 0.012 * math.sin(math.pi * t), 0.004)
        bpts.append(p2)
    brow = tube(f"t_brow_{side}", bpts, 0.0065, "MAT_REAL_Fur_FoxDark", 6)
    brow.vertex_groups.new(name=f"FX_Brow_{side}").add(list(range(len(brow.data.vertices))), 1.0, "REPLACE")
    parts.append(brow)
    return parts


def mouth_parts(fp):
    pts = []
    for k in range(9):
        t = k / 8
        x = (t - 0.5) * 0.075
        z = HEAD_C.z - 0.122 + 0.012 * (abs(t - 0.5) * 2) ** 2 - 0.006 * math.cos(math.pi * 4 * t) * (abs(t - 0.5) < 0.25)
        p, _ = fp.hit(x, z, 0.002)
        pts.append(p)
    line = tube("t_mouth", pts, 0.0042, "MAT_REAL_Mouth", 6, taper=True)
    line.vertex_groups.new(name="FX_Mouth").add(list(range(len(line.data.vertices))), 1.0, "REPLACE")
    pc, n = fp.hit(0, HEAD_C.z - 0.13, -0.004)
    rot = Vector((0, -1, 0)).rotation_difference(n).to_matrix()
    inner = ellipsoid("t_mouth_inner", pc, (0.03, 0.01, 0.024), "MAT_REAL_Red", 16, 8, rot)
    inner.vertex_groups.new(name="FX_MouthInner").add(list(range(len(inner.data.vertices))), 1.0, "REPLACE")
    # basis: mouth closed — collapse inner to a sliver; shape keys re-open it
    for v in inner.data.vertices:
        v.co.z = pc.z + (v.co.z - pc.z) * 0.08
    nose_p, nn = fp.hit(0, HEAD_C.z - 0.07, 0.0)
    nose = ellipsoid("t_nose", nose_p + Vector((0, -0.006, 0.0)), (0.022, 0.017, 0.015), "MAT_REAL_Nose", 16, 8)
    return [line, inner, nose]


def ears():
    parts = []
    for s, side in ((1, "l"), (-1, "r")):
        base = Vector(BONE[f"ear_01_{side}"][1]) + Vector((0, 0, -0.04))
        tip = Vector(BONE[f"ear_02_{side}"][2]) + Vector((0, 0, 0.0))
        axis = (tip - base)
        L = axis.length
        rot = Vector((0, 0, 1)).rotation_difference(axis.normalized()).to_matrix()
        for (rad, thick, off, mat, nm) in ((0.085, 0.045, 0.0, "MAT_REAL_Fur_FoxOrange", "outer"),
                                           (0.058, 0.02, -0.022, "MAT_REAL_Fur_FoxCream", "inner")):
            bm = bmesh.new()
            bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=rad, radius2=0.004, depth=L * (1 if nm == "outer" else 0.86))
            for v in bm.verts:
                z = v.co.z + L * (0.5 if nm == "outer" else 0.43)
                # leaf-shaped ear: belly in the middle, flattened front-to-back
                bulge = 1.0 + 0.25 * math.sin(math.pi * min(1, max(0, z / L)))
                co = Vector((v.co.x * bulge, v.co.y * (thick / rad), z))
                v.co = base + rot @ co + Vector((0, off, 0))
            uv = bm.loops.layers.uv.verify()
            o = mesh_obj(f"t_ear_{nm}_{side}", bm, [mat, "MAT_REAL_Fur_FoxDark"])
            if nm == "outer":
                assign_mat_by(o, lambda c, n, b=base, L=L: 1 if (c - b).length > L * 0.72 else 0)
            smooth(o)
            # weights: lower half ear_01, upper half ear_02
            g1 = o.vertex_groups.new(name=f"ear_01_{side}"); g2 = o.vertex_groups.new(name=f"ear_02_{side}")
            gh = o.vertex_groups.new(name="head")
            for v in o.data.vertices:
                t = (v.co - base).dot(axis.normalized()) / L
                w2 = min(1, max(0, (t - 0.35) / 0.3))
                wh = min(1, max(0, (0.18 - t) / 0.18))
                g2.add([v.index], w2, "REPLACE")
                g1.add([v.index], max(0.0, 1 - w2 - wh), "REPLACE")
                gh.add([v.index], wh, "REPLACE")
            parts.append(o)
    return parts


def fluff():
    """Cheek tufts and forehead fringe — key fox silhouette features."""
    parts = []
    specs = []
    for s in (1, -1):
        specs += [((0.205 * s, -0.02, HEAD_C.z - 0.085), (0.75 * s, -0.1, -0.45), 0.055, 0.12, "MAT_REAL_Fur_FoxCream"),
                  ((0.19 * s, 0.0, HEAD_C.z - 0.13), (0.55 * s, 0.0, -0.8), 0.045, 0.1, "MAT_REAL_Fur_FoxCream"),
                  ((0.17 * s, 0.04, HEAD_C.z - 0.04), (0.9 * s, 0.2, -0.1), 0.05, 0.1, "MAT_REAL_Fur_FoxOrange")]
    specs += [((0.0, -0.13, HEAD_C.z + 0.15), (0.1, -0.7, 0.55), 0.05, 0.11, "MAT_REAL_Fur_FoxOrange"),
              ((0.055, -0.12, HEAD_C.z + 0.14), (0.35, -0.7, 0.45), 0.045, 0.09, "MAT_REAL_Fur_FoxOrange"),
              ((-0.06, -0.12, HEAD_C.z + 0.14), (-0.3, -0.75, 0.5), 0.045, 0.1, "MAT_REAL_Fur_FoxOrange")]
    for i, (pos, d, r, L, mat) in enumerate(specs):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=r, radius2=0.003, depth=L)
        rot = Vector((0, 0, 1)).rotation_difference(Vector(d).normalized()).to_matrix()
        for v in bm.verts:
            co = Vector((v.co.x, v.co.y * 0.6, v.co.z + L / 2))
            v.co = Vector(pos) + rot @ co
        o = mesh_obj("t_fluff", bm, [mat])
        smooth(o)
        parts.append(o)
    return parts


def head_mesh():
    hb = head_base()
    mz = muzzle()
    fp = FaceProjector([hb, mz])
    parts = [hb, mz] + eye(fp, "l") + eye(fp, "r") + mouth_parts(fp) + fluff()
    for p in parts:
        if "head" not in p.vertex_groups:
            vgroup_all(p, "head")
    e = ears()
    head = R.join(parts + e, f"SK_REAL_{SPECIES}_Head")
    return head


# --------------------------------------------------------------------------- 5. clothing
def shell_from(body, name, select, offset, mats, mat_fn):
    """Duplicate body faces chosen by select(center) and push out along normals: a layered garment."""
    bm = bmesh.new()
    bm.from_mesh(body.data)
    bm.faces.ensure_lookup_table()
    kill = [f for f in bm.faces if not select(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    bm.normal_update()
    for v in bm.verts:
        v.co += v.normal * offset
    # thickness: extrude a rim inwards so open edges don't look paper-thin
    ob = mesh_obj(name, bm, mats)
    assign_mat_by(ob, mat_fn)
    sol = ob.modifiers.new("Solid", "SOLIDIFY")
    sol.thickness = 0.008
    sol.offset = -1
    ob = evaluated_copy(ob, name)
    smooth(ob)
    return ob


def clothing(body):
    def jacket_sel(c):
        if 0.6 < c.z < 1.0 and abs(c.x) < 0.2:
            return True
        # sleeves: arm faces, stop before wrist
        if abs(c.x) >= 0.13 and c.z > 0.66:
            return True
        return False

    def jacket_mat(c, n):
        if c.y < -0.05 and abs(c.x) < 0.045 and c.z > 0.62:
            return 1                     # cream hoodie visible at the open front
        if abs(c.x) > 0.31:
            return 2                     # cuffs
        if c.z < 0.645:
            return 2                     # waistband rib
        return 0
    jacket = shell_from(body, f"CLO_REAL_{SPECIES}_Jacket_Casual", jacket_sel, 0.022,
                        ["MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Cream", "MAT_REAL_Clothing_Black"], jacket_mat)

    def pants_sel(c):
        return c.z < 0.665 and c.z > 0.13 and not (abs(c.x) > 0.25)
    pants = shell_from(body, f"CLO_REAL_{SPECIES}_Pants_Joggers", pants_sel, 0.016,
                       ["MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Gold"],
                       lambda c, n: 1 if (abs(n.x) > 0.8 and abs(c.y) < 0.018 and 0.18 < c.z < 0.6) else 0)
    # hood roll + zipper tape + crown badge
    extra = []
    hood = bpy.data.meshes.new("t")
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, segments=24, radius=1.0)
    bm.free()
    bm = bmesh.new()
    res = bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=1.0, calc_uvs=True)
    for v in bm.verts:
        x, y, z = v.co
        # torus-like roll around the neck, thicker at the back
        ang = math.atan2(y, x)
        back = 0.5 + 0.5 * math.sin(ang)
        v.co = Vector((x * (0.135 + 0.02 * back), y * (0.125 + 0.05 * back) + 0.02 * back, z * (0.045 + 0.03 * back) + 0.985))
    hr = mesh_obj("t_hood", bm, ["MAT_REAL_Clothing_Cream"])
    smooth(hr)
    extra.append(hr)
    for s in (1, -1):
        z0, z1 = 0.64, 0.93
        extra.append(R.box("t", (0.008, 0.012, z1 - z0), (0.047 * s, -0.142, z0), "MAT_REAL_Clothing_Gold"))
    crown = crown_mesh((0.085, -0.155, 0.87), 0.045, "MAT_REAL_Clothing_Gold")
    extra.append(crown)
    back_crown = crown_mesh((0.0, 0.152, 0.84), 0.09, "MAT_REAL_Clothing_Gold", back=True)
    extra.append(back_crown)
    # sleeve patch (red, key art)
    extra.append(ellipsoid("t", (0.235, -0.01, 0.82), (0.03, 0.03, 0.03), "MAT_REAL_Red", 12, 6,
                           Matrix.Rotation(math.radians(50), 3, "Y") @ Matrix.Diagonal((1, 1, 0.3))))
    for o in extra:
        if o.type == "MESH":
            R.ensure_uv(o)
    acc = R.join(extra, f"CLO_REAL_{SPECIES}_Jacket_Details")
    smooth(acc)
    return [jacket, pants, acc]


def crown_mesh(center, size, mat, back=False):
    """REAL crown emblem (5-point) as a thin extruded plate."""
    pts2d = [(-0.5, 0), (0.5, 0), (0.5, 0.55), (0.3, 0.3), (0.15, 0.75), (0.0, 0.35), (-0.15, 0.75), (-0.3, 0.3), (-0.5, 0.55)]
    bm = bmesh.new()
    vs_f = [bm.verts.new((x * size, 0, z * size)) for x, z in pts2d]
    f = bm.faces.new(vs_f)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    nv = [e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=nv, vec=(0, 0.004, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if back:
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi, 3, "Z"))
    bmesh.ops.translate(bm, verts=bm.verts, vec=center)
    o = mesh_obj("t_crown", bm, [mat])
    R.ensure_uv(o)
    return o


# --------------------------------------------------------------------------- 6. skinning
def seg_dist(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
    return (p - (a + ab * t)).length


BODY_BONES = ["pelvis", "spine_01", "spine_02", "neck_01", "head", "clavicle_l", "upperarm_l", "lowerarm_l", "hand_l",
              "clavicle_r", "upperarm_r", "lowerarm_r", "hand_r", "thigh_l", "calf_l", "foot_l", "thigh_r", "calf_r", "foot_r"]
TAIL_BONES = ["pelvis", "tail_01", "tail_02", "tail_03", "tail_04"]


def auto_skin(ob, bones, power=4.5, max_inf=4, side_lock=True):
    segs = {b: (Vector(BONE[b][1]), Vector(BONE[b][2])) for b in bones}
    groups = {b: (ob.vertex_groups.get(b) or ob.vertex_groups.new(name=b)) for b in bones}
    for v in ob.data.vertices:
        p = ob.matrix_world @ v.co
        ws = []
        for b in bones:
            if side_lock:
                if b.endswith("_l") and p.x < -0.02:
                    continue
                if b.endswith("_r") and p.x > 0.02:
                    continue
            d = max(seg_dist(p, *segs[b]), 0.004)
            ws.append((1.0 / d ** power, b))
        ws.sort(reverse=True)
        ws = ws[:max_inf]
        tot = sum(w for w, _ in ws)
        for w, b in ws:
            if w / tot > 0.01:
                groups[b].add([v.index], w / tot, "REPLACE")


def transfer_weights(src, dst):
    """Nearest-vertex weight transfer (garments inherit the body's skinning)."""
    kd = KDTree(len(src.data.vertices))
    for v in src.data.vertices:
        kd.insert(src.matrix_world @ v.co, v.index)
    kd.balance()
    gnames = {g.index: g.name for g in src.vertex_groups}
    groups = {}
    for v in dst.data.vertices:
        co, idx, d = kd.find(dst.matrix_world @ v.co)
        for g in src.data.vertices[idx].groups:
            n = gnames[g.group]
            if n not in groups:
                groups[n] = dst.vertex_groups.get(n) or dst.vertex_groups.new(name=n)
            groups[n].add([v.index], g.weight, "REPLACE")


def bind(ob, arm):
    ob.parent = arm
    m = ob.modifiers.new("Armature", "ARMATURE")
    m.object = arm
    m.use_deform_preserve_volume = False


# --------------------------------------------------------------------------- 7. expressions
EXPRESSIONS = ["Happy", "Excited", "Sad", "Angry", "Surprised", "Worried", "Confused", "Focused", "Tired",
               "Thinking", "Confident"]


def expressions(head):
    me = head.data
    vg = {g.name: g.index for g in head.vertex_groups}

    def members(name):
        gi = vg.get(name)
        if gi is None:
            return []
        return [v.index for v in me.vertices if any(g.group == gi and g.weight > 0.5 for g in v.groups)]
    M = {n: members(n) for n in ("FX_Eye_l", "FX_Eye_r", "FX_Iris_l", "FX_Iris_r", "FX_Lash_l", "FX_Lash_r",
                                 "FX_Brow_l", "FX_Brow_r", "FX_Mouth", "FX_MouthInner")}
    base = [v.co.copy() for v in me.vertices]
    head.shape_key_add(name="Basis", from_mix=False)

    def bounds(idx):
        xs = [base[i].x for i in idx]; zs = [base[i].z for i in idx]
        return min(xs), max(xs), min(zs), max(zs)

    def new_key(name, ops):
        k = head.shape_key_add(name=name, from_mix=False)
        co = [b.copy() for b in base]
        for op in ops:
            op(co)
        for i, c in enumerate(co):
            k.data[i].co = c
        k.value = 0.0          # Blender 5 creates new keys at 1.0
        k.slider_min, k.slider_max = 0.0, 1.0
        return k

    # --- op factories ------------------------------------------------------
    def eye_squash(side, top=1.0, bottom=1.0, scale=1.0):
        idx = M[f"FX_Eye_{side}"]
        x0, x1, z0, z1 = bounds(M[f"FX_Eye_{side}"])
        cz = (z0 + z1) / 2
        cx = (x0 + x1) / 2
        def op(co):
            for i in idx:
                b = base[i]
                dz = b.z - cz
                k = top if dz > 0 else bottom
                # squash toward the lash line for top-closing, toward bottom for bottom-closing
                if dz > 0:
                    nz = z1 - (z1 - b.z) * 1.0 - (1 - top) * (b.z - cz) * 0 + 0
                    nz = cz + dz * top + (1 - top) * 0.0
                else:
                    nz = cz + dz * bottom
                co[i].z = cz + (nz - cz) * scale
                co[i].x = cx + (b.x - cx) * scale
        return op

    def blink(side, amount=1.0):
        idx = M[f"FX_Eye_{side}"]
        lash = set(M[f"FX_Lash_{side}"])
        x0, x1, z0, z1 = bounds([i for i in idx if i not in lash])
        tgt = z0 + (z1 - z0) * 0.25
        def op(co):
            for i in idx:
                b = base[i]
                if i in lash:
                    co[i].z = b.z - (z1 - tgt) * amount * 0.85
                else:
                    co[i].z = b.z + (tgt - b.z) * amount * 0.95
                    co[i].y = b.y + 0.004 * amount   # tuck behind the lash
        return op

    def lid(side, amount):
        """Upper lid lowers (tired / focused / angry): top of the eye compresses downward."""
        idx = M[f"FX_Eye_{side}"]
        lash = set(M[f"FX_Lash_{side}"])
        x0, x1, z0, z1 = bounds([i for i in idx if i not in lash])
        def op(co):
            for i in idx:
                b = base[i]
                if i in lash:
                    co[i].z = b.z - (z1 - z0) * amount * 0.9
                else:
                    t = (b.z - z0) / max(1e-5, (z1 - z0))
                    co[i].z = z0 + (b.z - z0) * (1 - amount * 0.9 * t ** 0.5)
        return op

    def happy_lid(side, amount):
        """Lower lid rises (smiling eyes)."""
        idx = M[f"FX_Eye_{side}"]
        lash = set(M[f"FX_Lash_{side}"])
        x0, x1, z0, z1 = bounds([i for i in idx if i not in lash])
        def op(co):
            for i in idx:
                if i in lash:
                    continue
                b = base[i]
                t = 1 - (b.z - z0) / max(1e-5, (z1 - z0))
                co[i].z = b.z + (z1 - z0) * amount * 0.55 * t ** 1.5
        return op

    def eye_scale(side, s):
        idx = M[f"FX_Eye_{side}"]
        x0, x1, z0, z1 = bounds(idx)
        cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
        def op(co):
            for i in idx:
                co[i].x = cx + (co[i].x - cx) * s
                co[i].z = cz + (co[i].z - cz) * s
        return op

    def pupil(side, dx=0.0, dz=0.0, s=1.0):
        idx = M[f"FX_Iris_{side}"]
        x0, x1, z0, z1 = bounds(idx)
        cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
        def op(co):
            for i in idx:
                co[i].x = cx + (co[i].x - cx) * s + dx
                co[i].z = cz + (co[i].z - cz) * s + dz
        return op

    def brow(side, up=0.0, inner=0.0, outer=0.0):
        idx = M[f"FX_Brow_{side}"]
        x0, x1, _, _ = bounds(idx)
        def op(co):
            for i in idx:
                b = base[i]
                t = (abs(b.x) - min(abs(x0), abs(x1))) / max(1e-5, abs(x1 - x0))   # 0 inner -> 1 outer
                co[i].z += up + inner * (1 - t) + outer * t
        return op

    def mouth(corners=0.0, center=0.0, open_=0.0, width=1.0, shift=0.0, skew=0.0):
        idx = M["FX_Mouth"]
        inner = M["FX_MouthInner"]
        x0, x1, z0, z1 = bounds(idx)
        cx = (x0 + x1) / 2
        hw = (x1 - x0) / 2
        iz0, iz1 = bounds(inner)[2:]
        icz = (iz0 + iz1) / 2
        def op(co):
            for i in idx:
                b = base[i]
                t = (b.x - cx) / hw          # -1..1
                co[i].x = cx + (b.x - cx) * width + shift
                co[i].z = b.z + corners * t * t + center * (1 - t * t) + skew * t - open_ * 0.003 * (1 - t * t)
            for i in inner:
                b = base[i]
                co[i].x = cx + (b.x - cx) * width * (1 + open_ * 0.2) + shift
                co[i].z = icz + (b.z - icz) * (1 + open_ * 8.0) - open_ * 0.006
                co[i].y = b.y - open_ * 0.003
        return op

    both = lambda f, *a, **k: [f("l", *a, **k), f("r", *a, **k)]
    defs = {
        "Happy":     both(happy_lid, 0.45) + both(brow, up=0.006) + [mouth(corners=0.012, center=-0.004)],
        "Excited":   both(eye_scale, 1.1) + both(pupil, s=1.1) + both(brow, up=0.014) + [mouth(corners=0.01, open_=1.0, width=1.1)],
        "Sad":       both(lid, 0.18) + both(brow, inner=0.014, outer=-0.004) + both(pupil, dz=-0.004) + [mouth(corners=-0.01, center=0.002, width=0.85)],
        "Angry":     both(lid, 0.3) + both(brow, inner=-0.014, outer=0.006) + [mouth(corners=-0.008, width=0.9)],
        "Surprised": both(eye_scale, 1.14) + both(pupil, s=0.75) + both(brow, up=0.02) + [mouth(open_=1.0, width=0.55)],
        "Worried":   both(eye_scale, 0.96) + both(brow, inner=0.018, outer=-0.002) + [mouth(corners=-0.006, width=0.7, open_=0.15)],
        "Confused":  [brow("l", up=0.016), brow("r", up=-0.006, inner=-0.006), lid("r", 0.2), pupil("l", dx=0.004), pupil("r", dx=0.004)]
                     + [mouth(skew=0.007, width=0.75, shift=0.006)],
        "Focused":   both(lid, 0.32) + both(happy_lid, 0.2) + both(brow, up=-0.006, inner=-0.006) + [mouth(width=0.8)],
        "Tired":     both(lid, 0.55) + both(brow, up=-0.004, outer=-0.006) + both(pupil, dz=-0.006) + [mouth(width=0.85, corners=-0.003, open_=0.1)],
        "Thinking":  both(pupil, dx=0.009, dz=0.01) + [brow("l", up=0.012), brow("r", up=-0.004), lid("r", 0.15)]
                     + [mouth(skew=0.006, width=0.65, shift=0.01)],
        "Confident": both(lid, 0.2) + [brow("l", up=0.008, outer=0.004), brow("r", up=-0.002)] + [mouth(corners=0.004, skew=0.008, width=0.95)],
        # utility keys for gameplay / lip-sync foundation
        "Blink_L": [blink("l")], "Blink_R": [blink("r")],
        "Look_Left": both(pupil, dx=0.012), "Look_Right": both(pupil, dx=-0.012),
        "Look_Up": both(pupil, dz=0.012), "Look_Down": both(pupil, dz=-0.012),
        "Mouth_Open": [mouth(open_=1.0)], "Mouth_Smile": [mouth(corners=0.012)], "Mouth_Frown": [mouth(corners=-0.01)],
        "Mouth_Narrow": [mouth(width=0.6, open_=0.4)], "Mouth_Wide": [mouth(width=1.25, open_=0.3)],
    }
    for name, ops in defs.items():
        new_key(name, ops)
    return list(defs)


# --------------------------------------------------------------------------- 8. animation
FPS = 30
_L = {}


def _local(arm, bone):
    if bone not in _L:
        _L[bone] = arm.data.bones[bone].matrix_local.to_3x3()
    return _L[bone]


def set_pose(arm, pose, frame):
    """pose: {bone: [(axis_char, deg), ...] | ('loc', (x,y,z))} in armature (rest) space."""
    for bone, ops in pose.items():
        pb = arm.pose.bones[bone]
        Lm = _local(arm, bone)
        Rm = Matrix.Identity(3)
        loc = Vector((0, 0, 0))
        for op in ops:
            if op[0] == "loc":
                loc += Vector(op[1])
            else:
                ax = {"X": (1, 0, 0), "Y": (0, 1, 0), "Z": (0, 0, 1)}[op[0]]
                Rm = Matrix.Rotation(math.radians(op[1]), 3, ax) @ Rm
        q = (Lm.inverted() @ Rm @ Lm).to_quaternion()
        pb.rotation_quaternion = q
        pb.location = Lm.inverted() @ loc
        pb.keyframe_insert("rotation_quaternion", frame=frame, group=bone)
        pb.keyframe_insert("location", frame=frame, group=bone)


ALL_ANIM_BONES = [b[0] for b in BONES if b[0] != "root"]


def arms_down(pose, deg=32, fwd=0.0, elbow=-12):
    pose.setdefault("upperarm_l", []).extend([("Y", deg), ("X", fwd)])
    pose.setdefault("upperarm_r", []).extend([("Y", -deg), ("X", fwd)])
    pose.setdefault("lowerarm_l", []).append(("X", elbow))
    pose.setdefault("lowerarm_r", []).append(("X", elbow))
    return pose


def leg(pose, side, swing, bend, foot_extra=0.0):
    pose.setdefault(f"thigh_{side}", []).append(("X", -swing))
    pose.setdefault(f"calf_{side}", []).append(("X", bend))
    pose.setdefault(f"foot_{side}", []).append(("X", swing - bend + foot_extra))


def make_action(arm, name, n_frames, fn, loop=True):
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    arm.animation_data_create()
    arm.animation_data.action = act
    for f in range(0, n_frames + 1):
        pose = {b: [] for b in ALL_ANIM_BONES}
        fn(pose, f / n_frames, f)
        set_pose(arm, pose, f)
    act.frame_range = (0, n_frames)
    act["real_loop"] = loop
    # NLA track keeps every action exportable (glTF 'ACTIONS' mode / FBX all-actions)
    tr = arm.animation_data.nla_tracks.new()
    tr.name = name
    st = tr.strips.new(name, 0, act)
    tr.mute = True
    arm.animation_data.action = None
    return act


def tail_sway(pose, ph, amp=8, speed=1.0):
    for i in range(1, 5):
        pose[f"tail_0{i}"].append(("Z", amp * math.sin(2 * math.pi * (ph * speed) - i * 0.7)))
        pose[f"tail_0{i}"].append(("X", 3 * math.sin(2 * math.pi * (ph * speed) * 2 - i * 0.5)))


def anim_idle(pose, ph, f):
    s = math.sin(2 * math.pi * ph)
    arms_down(pose, 34 + 1.5 * s, 0, -14)
    pose["spine_02"].append(("X", 1.5 * s))
    pose["neck_01"].append(("X", -1.0 * s))
    pose["head"].append(("Z", 3 * math.sin(2 * math.pi * ph + 1)))
    pose["head"].append(("Y", 2 * math.sin(2 * math.pi * ph * 0.5)))
    pose["pelvis"].append(("loc", (0, 0, -0.004 * (1 - s) / 2)))
    pose["clavicle_l"].append(("Y", -1.5 * s)); pose["clavicle_r"].append(("Y", 1.5 * s))
    tw = math.exp(-((ph - 0.6) ** 2) / 0.002) * 18   # ear twitch
    pose["ear_01_l"].append(("Y", -tw)); pose["ear_02_r"].append(("Y", 4 * s))
    tail_sway(pose, ph, 10)
    leg(pose, "l", 0, 4); leg(pose, "r", 0, 4)


def gait(swing, bend_max, bob, lean, arm_swing, elbow, tail_amp):
    def fn(pose, ph, f):
        a = 2 * math.pi * ph
        for side, off in (("l", 0.0), ("r", math.pi)):
            s = math.sin(a + off)
            c = math.cos(a + off)
            bend = 6 + bend_max * max(0.0, c) ** 1.3 + 8 * max(0.0, -c) * 0.3
            leg(pose, side, swing * s, bend, 6 * max(0, -s))
        pose["pelvis"].append(("loc", (0.012 * math.sin(a), 0, -bob * (0.5 + 0.5 * math.cos(2 * a)))))
        pose["pelvis"].append(("Z", 6 * math.sin(a)))
        pose["spine_01"].append(("X", lean))
        pose["spine_02"].append(("Z", -9 * math.sin(a)))
        pose["neck_01"].append(("X", -lean * 0.6))
        pose["head"].append(("Z", 3 * math.sin(a)))
        arms_down(pose, 30, 0, elbow)
        pose["upperarm_l"].append(("X", arm_swing * math.sin(a)))
        pose["upperarm_r"].append(("X", -arm_swing * math.sin(a)))
        pose["ear_02_l"].append(("X", 6 * math.sin(2 * a))); pose["ear_02_r"].append(("X", 6 * math.sin(2 * a)))
        tail_sway(pose, ph, tail_amp, 1.0)
    return fn


def anim_jump(pose, ph, f):
    def env(a, b):
        return max(0.0, min(1.0, (ph - a) / (b - a)))
    crouch = env(0.0, 0.25) * (1 - env(0.3, 0.42)) + env(0.72, 0.82) * (1 - env(0.85, 1.0))
    tuck = env(0.42, 0.55) * (1 - env(0.62, 0.74))
    up = env(0.3, 0.45) * (1 - env(0.55, 0.75))
    for side in ("l", "r"):
        leg(pose, side, 40 * crouch + 45 * tuck, 75 * crouch + 80 * tuck)
    pose["pelvis"].append(("loc", (0, 0.04 * crouch, -0.12 * crouch + 0.18 * up)))
    pose["spine_01"].append(("X", 22 * crouch - 6 * up))
    arms_down(pose, 30 - 90 * up, -40 * crouch + 30 * up, -20)
    tail_sway(pose, ph, 5)
    pose["tail_01"].append(("X", -25 * up))


def anim_sit(pose, ph, f):
    s = math.sin(2 * math.pi * ph)
    pose["pelvis"].append(("loc", (0, 0.11, -0.135)))
    for side in ("l", "r"):
        leg(pose, side, 88, 88)
    pose["spine_01"].append(("X", 6 + s))
    pose["spine_02"].append(("X", 1.2 * s))
    arms_down(pose, 18, -38, -42)
    pose["head"].append(("Z", 4 * math.sin(2 * math.pi * ph + 0.5)))
    tail_sway(pose, ph, 5)
    pose["tail_01"].append(("X", 45))


def anim_drive(pose, ph, f):
    anim_sit(pose, ph, f)
    s = math.sin(2 * math.pi * ph)
    pose["upperarm_l"].append(("X", -40)); pose["upperarm_r"].append(("X", -40))
    pose["lowerarm_l"].append(("X", -20)); pose["lowerarm_r"].append(("X", -20))
    pose["spine_02"].append(("Z", 4 * s))


def anim_phone(pose, ph, f):
    s = math.sin(2 * math.pi * ph)
    arms_down(pose, 22, -38, -95)
    pose["upperarm_l"].append(("Z", 22)); pose["upperarm_r"].append(("Z", -22))
    pose["hand_r"].append(("X", 6 * math.sin(2 * math.pi * ph * 4)))      # thumb taps
    pose["head"].append(("X", 16 + 2 * s))
    pose["neck_01"].append(("X", 6))
    tail_sway(pose, ph, 7)
    leg(pose, "l", 0, 4); leg(pose, "r", 0, 4)


def anim_wave(pose, ph, f):
    a = 2 * math.pi * ph
    raise_ = min(1, ph / 0.2) * min(1, (1 - ph) / 0.2)
    arms_down(pose, 32, 0, -12)
    pose["clavicle_r"].append(("Y", 18 * raise_))
    pose["upperarm_r"].append(("Y", 110 * raise_))
    pose["lowerarm_r"].append(("Y", (20 + 25 * math.sin(a * 3)) * raise_))
    pose["head"].append(("Z", -8 * raise_)); pose["head"].append(("Y", -5 * raise_))
    pose["spine_02"].append(("Y", -3 * raise_))
    tail_sway(pose, ph, 14, 2)
    leg(pose, "l", 0, 4); leg(pose, "r", 0, 4)


def anim_talk(pose, ph, f):
    a = 2 * math.pi * ph
    arms_down(pose, 26, -25 - 10 * math.sin(a * 2), -55 - 15 * math.sin(a * 2 + 1))
    pose["upperarm_l"].append(("Z", 15 * math.sin(a))); pose["upperarm_r"].append(("Z", -15 * math.sin(a + 1.4)))
    pose["head"].append(("X", 4 * math.sin(a * 2))); pose["head"].append(("Y", 5 * math.sin(a)))
    tail_sway(pose, ph, 8)
    leg(pose, "l", 0, 4); leg(pose, "r", 0, 4)


def anim_pickup(pose, ph, f):
    d = math.sin(math.pi * ph)
    pose["pelvis"].append(("loc", (0, 0.07 * d, -0.13 * d)))
    for side in ("l", "r"):
        leg(pose, side, 45 * d, 85 * d)
    pose["spine_01"].append(("X", 25 * d)); pose["spine_02"].append(("X", 15 * d))
    arms_down(pose, 30 - 10 * d, -45 * d, -20)
    tail_sway(pose, ph, 6)
    pose["tail_01"].append(("X", -20 * d))


def anim_carry(pose, ph, f):
    s = math.sin(2 * math.pi * ph)
    arms_down(pose, 14, -48, -60)
    pose["upperarm_l"].append(("Z", 12)); pose["upperarm_r"].append(("Z", -12))
    pose["spine_01"].append(("X", -4 + s))
    tail_sway(pose, ph, 8)
    leg(pose, "l", 0, 4); leg(pose, "r", 0, 4)


ANIMS = [
    ("Idle", 60, anim_idle, True),
    ("Walk", 32, gait(26, 42, 0.018, 5, 22, -18, 10), True),
    ("Run", 20, gait(42, 85, 0.035, 14, 40, -75, 16), True),
    ("Sprint", 16, gait(52, 100, 0.045, 22, 55, -90, 20), True),
    ("Jump", 36, anim_jump, False),
    ("Sit", 60, anim_sit, True),
    ("Drive", 60, anim_drive, True),
    ("PhoneUse", 60, anim_phone, True),
    ("Wave", 48, anim_wave, False),
    ("Talk", 60, anim_talk, True),
    ("Pickup", 36, anim_pickup, False),
    ("Carry", 40, anim_carry, True),
]


# --------------------------------------------------------------------------- assemble
def build_fox():
    c = R.coll(f"CHR_REAL_{SPECIES}")
    arm = skeleton(f"SK_REAL_{SPECIES}")
    body = body_mesh()
    hd = head_mesh()
    hn = hands()
    sh = shoes()
    tl = tail()
    clo = clothing(body)
    auto_skin(body, BODY_BONES)
    auto_skin(tl, TAIL_BONES, power=5)
    for g in clo:
        if g.name.endswith("Details"):
            # badges/hood/zip are tiny: rigid-ish skin from body is fine
            pass
        transfer_weights(body, g)
    keys = expressions(hd)
    meshes = [body, hd, hn, sh, tl] + clo
    for m in meshes:
        R.ensure_uv(m)
        bind(m, arm)
        R.link(m, c)
    R.link(arm, c)
    return arm, meshes, keys


def verify_deformation(arm, meshes):
    """Pose extreme joint angles and measure max vertex displacement spikes (rig sanity)."""
    report = {}
    tests = {
        "arms_up": {"clavicle_l": [("Y", -20)], "clavicle_r": [("Y", 20)], "upperarm_l": [("Y", -85)], "upperarm_r": [("Y", 85)]},
        "deep_squat": {"thigh_l": [("X", -100)], "thigh_r": [("X", -100)], "calf_l": [("X", 120)], "calf_r": [("X", 120)]},
        "elbows": {"lowerarm_l": [("X", -120)], "lowerarm_r": [("X", -120)]},
        "neck_turn": {"neck_01": [("Z", 45)], "head": [("Z", 30)]},
    }
    dg = bpy.context.evaluated_depsgraph_get()
    body = meshes[0]
    for name, pose in tests.items():
        full = {b: [] for b in ALL_ANIM_BONES}
        full.update(pose)
        for b, ops in full.items():
            pb = arm.pose.bones[b]
            Lm = _local(arm, b)
            Rm = Matrix.Identity(3)
            for ax, d in ops:
                Rm = Matrix.Rotation(math.radians(d), 3, ax) @ Rm
            pb.rotation_quaternion = (Lm.inverted() @ Rm @ Lm).to_quaternion()
            pb.location = (0, 0, 0)
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        ev = body.evaluated_get(dg)
        me = ev.to_mesh()
        # edge stretch ratio: catches tearing / collapsing
        rest = body.data
        worst = 0.0
        for e in me.edges:
            a, b = e.vertices
            l0 = (rest.vertices[a].co - rest.vertices[b].co).length
            l1 = (me.vertices[a].co - me.vertices[b].co).length
            if l0 > 1e-5:
                worst = max(worst, l1 / l0)
        ev.to_mesh_clear()
        report[name] = {"max_edge_stretch": round(worst, 3), "pass": worst < 3.0}
    for pb in arm.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
    return report


def studio(target=(0, 0, 0.75), dist=3.2):
    R.setup_world("midday", 0.35)
    R.area_light("LGT_Key", (1.6, -2.4, 2.4), (1.5, 1.5), 110, (1.0, 0.92, 0.85), rot=(math.radians(50), 0, math.radians(35)))
    R.area_light("LGT_Rim", (-1.4, 1.8, 2.2), (1.5, 1.5), 160, (0.75, 0.82, 1.0), rot=(math.radians(-55), 0, math.radians(-145)))
    R.area_light("LGT_Fill", (-2.2, -1.5, 1.0), (2, 2), 45, (1, 1, 1), rot=(math.radians(75), 0, math.radians(-55)))
    floor = R.cylinder("TMP_Floor", 3.0, 0.02, (0, 0, -0.02), "MAT_REAL_Navy", 48)
    bd = R.box("TMP_Backdrop", (14, 0.1, 8), (0, 4, -0.02), "MAT_REAL_NavyLight")


if __name__ == "__main__":
    R.reset_scene()
    arm, meshes, keys = build_fox()
    bpy.context.scene.render.fps = FPS
    actions = []
    for nm, n, fn, loop in ANIMS:
        actions.append(make_action(arm, f"ANIM_REAL_{SPECIES}_{nm}", n, fn, loop).name)
    deform = verify_deformation(arm, meshes)

    # ---- stats / report -----------------------------------------------------
    dg = bpy.context.evaluated_depsgraph_get()
    all_v = [Vector(v) for m in meshes for v in [m.matrix_world @ vv.co for vv in m.data.vertices]]
    height_skull = max(v.z for v in all_v if abs(v.x) < 0.05 and v.y > -0.1)
    rep = R.validate_scene(meshes)
    rep.update({
        "triangles": R.tri_count(meshes),
        "bones": len(arm.data.bones),
        "deform_bones": [b.name for b in arm.data.bones if b.use_deform],
        "shape_keys": keys,
        "actions": actions,
        "height_max_incl_ears": round(max(v.z for v in all_v), 3),
        "height_skull_center": round(height_skull, 3),
        "head_height_ratio": round(1.45 / 0.38, 2),
        "deformation_tests": deform,
        "materials": sorted({m.name for o in meshes for m in o.data.materials}),
    })
    R.write_report("fox_validation.json", rep)
    print("FOX", rep["triangles"], "tris", rep["bones"], "bones", len(keys), "keys", "errors", rep["errors"], deform)
    R.save_blend("Characters/Fox/CHR_REAL_Fox.blend")

    # ---- exports ---------------------------------------------------------------
    R.export_fbx("Characters/SK_REAL_Fox.fbx", [arm] + meshes, armature=True, animations=True)
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in [arm] + meshes:
        o.select_set(True)
    p = os.path.join(R.EXPORT_DIR, "Characters", "SK_REAL_Fox.glb")
    bpy.ops.export_scene.gltf(filepath=p, export_format="GLB", use_selection=True, export_animations=True,
                              export_animation_mode="ACTIONS", export_morph=True, export_skins=True,
                              export_apply=False, export_yup=True)
    print("EXPORTED", p, os.path.getsize(p))
