"""
REAL species builder — all nine REALs (+ story characters) from the Fox pipeline.

Every species shares: the skeleton (SKEL_REAL_Humanoid), proportions, rig, skinning method,
12 animations, 22 morph targets, and the layered outfit system. Species identity comes from:
head colouring, muzzle/beak/trunk/rostrum, ears, cheek fluff/mane, tail, accessories, palette.

    python Tools/build_species.py Cat            # one
    python Tools/build_species.py all            # the nine REALs + Jax
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector, Matrix
import real_lib as R
import build_fox as F

HC = F.HEAD_C


def lin(c):
    return R.srgb_to_lin(c)


def mat(name, srgb, rough=0.75, emit=None):
    if name in bpy.data.materials:
        return name
    R.MATERIAL_DEFS[name] = dict(color=lin(srgb), rough=rough)
    return name


# ---------------------------------------------------------------- generic part makers
def tag(o, group="head"):
    F.vgroup_all(o, group)
    R.ensure_uv(o)
    return o


def ear_pointy(rad=0.085, length=1.0, thick=0.045, inner=True, tip_dark=True, outward=0.0):
    def make():
        parts = []
        for s, side in ((1, "l"), (-1, "r")):
            base = Vector(F.BONE[f"ear_01_{side}"][1]) + Vector((0, 0, -0.04))
            tip0 = Vector(F.BONE[f"ear_02_{side}"][2])
            axis = (tip0 - base)
            axis = Vector((axis.x + outward * s, axis.y, axis.z)) * length
            L = axis.length
            rot = Vector((0, 0, 1)).rotation_difference(axis.normalized()).to_matrix()
            layers = [(rad, thick, 0.0, F.MAIN, "outer")]
            if inner:
                layers.append((rad * 0.68, thick * 0.45, -0.022, F.SEC, "inner"))
            for (r_, th, off, m, nm) in layers:
                bm = bmesh.new()
                bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=r_, radius2=0.004,
                                      depth=L * (1 if nm == "outer" else 0.86))
                for v in bm.verts:
                    z = v.co.z + L * (0.5 if nm == "outer" else 0.43)
                    bulge = 1.0 + 0.25 * math.sin(math.pi * min(1, max(0, z / L)))
                    v.co = base + rot @ Vector((v.co.x * bulge, v.co.y * (th / r_), z)) + Vector((0, off, 0))
                o = F.mesh_obj(f"t_ear_{nm}_{side}", bm, [m, F.DARK])
                if nm == "outer" and tip_dark:
                    F.assign_mat_by(o, lambda c, n, b=base, L=L: 1 if (c - b).length > L * 0.72 else 0)
                F.smooth(o)
                _ear_weights(o, side, base, axis)
                parts.append(o)
        return parts
    return make


def _ear_weights(o, side, base, axis):
    L = axis.length
    g1 = o.vertex_groups.new(name=f"ear_01_{side}"); g2 = o.vertex_groups.new(name=f"ear_02_{side}")
    gh = o.vertex_groups.new(name="head")
    for v in o.data.vertices:
        t = (v.co - base).dot(axis.normalized()) / max(L, 1e-4)
        w2 = min(1, max(0, (t - 0.35) / 0.3)); wh = min(1, max(0, (0.18 - t) / 0.18))
        g2.add([v.index], w2, "REPLACE"); g1.add([v.index], max(0.0, 1 - w2 - wh), "REPLACE"); gh.add([v.index], wh, "REPLACE")
    R.ensure_uv(o)


def ear_blob(center_off, radii, rot_euler=(0, 0, 0), m_outer=None, m_inner=None, inner_scale=0.7, tilt_axis="Y"):
    """Ellipsoid ears: floppy (dog), round (lion), flat discs (elephant), sideways leaves (cow)."""
    def make():
        parts = []
        for s, side in ((1, "l"), (-1, "r")):
            base = Vector(F.BONE[f"ear_01_{side}"][1])
            c = Vector((center_off[0] * s, center_off[1], center_off[2])) + HC
            rot = (Matrix.Rotation(rot_euler[1] * s, 3, "Y") @ Matrix.Rotation(rot_euler[0], 3, "X")
                   @ Matrix.Rotation(rot_euler[2] * s, 3, "Z"))
            o = F.ellipsoid(f"t_ear_{side}", c, radii, m_outer or F.MAIN, 20, 12, rot)
            axis = (c - base) * 2
            _ear_weights(o, side, base, axis)
            parts.append(o)
            if m_inner:
                ci = c + rot @ Vector((0, -radii[1] * 0.45, 0))
                oi = F.ellipsoid(f"t_eari_{side}", ci, (radii[0] * inner_scale, radii[1] * 0.5, radii[2] * inner_scale),
                                 m_inner, 16, 10, rot)
                _ear_weights(oi, side, base, axis)
                parts.append(oi)
        return parts
    return make


def tufts(specs):
    """specs: list of (pos, dir, radius, length, material)"""
    def make():
        out = []
        for (pos, d, r, L, m) in specs:
            bm = bmesh.new()
            bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=r, radius2=0.003, depth=L)
            rot = Vector((0, 0, 1)).rotation_difference(Vector(d).normalized()).to_matrix()
            for v in bm.verts:
                v.co = Vector(pos) + rot @ Vector((v.co.x, v.co.y * 0.6, v.co.z + L / 2))
            o = F.mesh_obj("t_tuft", bm, [m])
            F.smooth(o)
            out.append(o)
        return out
    return make


def muzzle_fn(radii=(0.07, 0.075, 0.048), fwd=0.15, down=0.085, taper=0.35, m=None, lift=0.012):
    def make():
        c = Vector((0, HC.y - fwd, HC.z - down))
        mz = F.ellipsoid("t_muzzle", c, radii, m or F.SEC, 24, 12)
        for v in mz.data.vertices:
            if v.co.y < c.y:
                k = (c.y - v.co.y) / radii[1]
                v.co.x = c.x + (v.co.x - c.x) * (1 - taper * k)
                v.co.z = c.z + (v.co.z - c.z) * (1 - 0.2 * k) + lift * k
        return mz
    return make


def head_colors(rule):
    """rule(center, normal) -> 0 main / 1 sec / 2 dark"""
    def make():
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=24, radius=1.0, calc_uvs=True)
        for v in bm.verts:
            x, y, z = v.co
            cheek = 1.0 + 0.10 * max(0.0, 1 - abs(z + 0.25) * 2.2)
            top = 1.0 - 0.06 * max(0.0, z)
            yy = y * (0.92 if y > 0 else 1.0)
            v.co = Vector((x * F.HEAD_R.x * cheek, yy * F.HEAD_R.y, z * F.HEAD_R.z * top)) + HC
        ob = F.mesh_obj("t_head", bm, [F.MAIN, F.SEC, F.DARK])
        F.assign_mat_by(ob, rule)
        F.smooth(ob)
        return ob
    return make


LOWER_FRONT = lambda c, n: 1 if (c.z < HC.z - 0.045 and c.y < 0.06) else 0
ALL_MAIN = lambda c, n: 0


def tail_chain(pts, radii, tip_from=None, tuft=None, extra=None):
    def make():
        edges = [(i, i + 1) for i in range(len(pts) - 1)]
        t = F.skin_chain(f"SK_REAL_{F.SPECIES}_Tail", pts, radii, edges, subsurf=2)
        for m in (F.MAIN, F.SEC, F.DARK):
            t.data.materials.append(R.get_mat(m))
        if tip_from is not None:
            F.assign_mat_by(t, lambda c, n: tip_from[1] if c.z > tip_from[0] else 0)
        parts = [t]
        if tuft:
            pos, r, m = tuft
            parts.append(F.ellipsoid("t_tuft", pos, (r, r, r * 1.3), m, 14, 8))
        if extra:
            parts += extra()
        for p in parts:
            R.ensure_uv(p)
        out = R.join(parts, f"SK_REAL_{F.SPECIES}_Tail") if len(parts) > 1 else t
        F.smooth(out)
        return out
    return make


THIN_TAIL = ([(0, 0.08, 0.6), (0, 0.18, 0.55), (0, 0.28, 0.6), (0, 0.33, 0.72), (0, 0.32, 0.86), (0, 0.27, 0.95)],
             [(0.03, 0.03), (0.028, 0.028), (0.026, 0.026), (0.024, 0.024), (0.022, 0.022), (0.016, 0.016)])


def cap(color_mat, brim_mat=None, backwards=False, logo=True):
    """Baseball cap (key art: dog, bird, dolphin, elephant, Jax)."""
    def make(fp):
        top = HC + Vector((0, 0.01, 0.1))
        dome = F.ellipsoid("t_cap", top, (0.235, 0.215, 0.14), color_mat, 28, 14)
        for v in dome.data.vertices:
            if v.co.z < top.z - 0.02:
                v.co.z = top.z - 0.02 + (v.co.z - top.z + 0.02) * 0.2
        sgn = 1 if backwards else -1
        brim = F.ellipsoid("t_brim", HC + Vector((0, sgn * 0.2, 0.085)), (0.15, 0.12, 0.014), brim_mat or color_mat, 20, 6)
        parts = [tag(dome), tag(brim)]
        if logo:
            parts.append(tag(F.crown_mesh((0, top.y - 0.205, top.z + 0.02), 0.06, "MAT_REAL_Clothing_Gold")))
        return parts
    return make


def beanie(color_mat):
    def make(fp):
        top = HC + Vector((0, 0.01, 0.105))
        d = F.ellipsoid("t_beanie", top, (0.24, 0.22, 0.15), color_mat, 28, 14)
        for v in d.data.vertices:
            if v.co.z < top.z - 0.01:
                v.co.z = top.z - 0.01 + (v.co.z - top.z + 0.01) * 0.25
        band = F.ellipsoid("t_band", top + Vector((0, 0, -0.015)), (0.245, 0.225, 0.04), color_mat, 28, 6)
        return [tag(d), tag(band)]
    return make


def headphones(m):
    def make(fp):
        out = []
        for s in (1, -1):
            out.append(tag(F.ellipsoid("t_cup", HC + Vector((0.225 * s, 0.0, -0.01)), (0.03, 0.06, 0.07), m, 16, 8)))
        pts = [HC + Vector((0.23 * math.cos(a), 0.0, 0.2 * math.sin(a) + 0.02)) for a in [math.radians(x) for x in range(0, 181, 15)]]
        out.append(tag(F.tube("t_band", pts, 0.014, m, 8, taper=False)))
        return out
    return make


def whiskers(fp):
    out = []
    for s in (1, -1):
        for k in range(3):
            p0, _ = fp.hit(0.045 * s, HC.z - 0.085 - k * 0.012, 0.0)
            if p0 is None:
                continue
            pts = [p0 + Vector((0.11 * s * t, -0.01 * t, (0.012 - 0.012 * k) * t)) for t in (0, 0.35, 0.7, 1.0)]
            out.append(tag(F.tube("t_wh", pts, 0.0022, "MAT_REAL_White", 5, taper=True)))
    return out


def horns(m):
    def make(fp):
        out = []
        for s in (1, -1):
            base = HC + Vector((0.11 * s, 0.0, 0.15))
            bm = bmesh.new()
            bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.028, radius2=0.006, depth=0.09)
            rot = Vector((0, 0, 1)).rotation_difference(Vector((0.7 * s, -0.1, 0.7)).normalized()).to_matrix()
            for v in bm.verts:
                v.co = base + rot @ Vector((v.co.x, v.co.y, v.co.z + 0.045))
            o = F.mesh_obj("t_horn", bm, [m]); F.smooth(o)
            out.append(tag(o))
        return out
    return make


def beak(m):
    def make(fp):
        p, n = fp.hit(0, HC.z - 0.06, -0.01)
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.055, radius2=0.004, depth=0.11)
        rot = Vector((0, 0, 1)).rotation_difference(Vector((0, -1, -0.18)).normalized()).to_matrix()
        for v in bm.verts:
            v.co = p + rot @ Vector((v.co.x, v.co.y * 0.75, v.co.z + 0.05))
        o = F.mesh_obj("t_beak", bm, [m]); F.smooth(o)
        return [tag(o)]
    return make


def trunk(m):
    def make(fp):
        p, n = fp.hit(0, HC.z - 0.07, -0.02)
        pts = [p + Vector((0, -0.06 * t - 0.03 * t * t, -0.2 * t * t + 0.02 * t)) for t in [i / 7 for i in range(8)]]
        pts.append(pts[-1] + Vector((0, -0.04, 0.01)))
        bm = bmesh.new()
        rings = []
        for i, c in enumerate(pts):
            r = 0.05 - 0.025 * i / (len(pts) - 1)
            tdir = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
            side = tdir.cross(Vector((1, 0, 0))).normalized()
            up = Vector((1, 0, 0))
            ring = [bm.verts.new(c + (up * math.cos(a) + side * math.sin(a)) * r) for a in [2 * math.pi * k / 12 for k in range(12)]]
            rings.append(ring)
        for i in range(len(rings) - 1):
            for k in range(12):
                bm.faces.new((rings[i][k], rings[i][(k + 1) % 12], rings[i + 1][(k + 1) % 12], rings[i + 1][k]))
        bm.faces.new(list(reversed(rings[-1])))
        o = F.mesh_obj("t_trunk", bm, [m]); F.smooth(o)
        tusks = []
        for s in (1, -1):
            bm2 = bmesh.new()
            bmesh.ops.create_cone(bm2, cap_ends=True, segments=10, radius1=0.014, radius2=0.003, depth=0.06)
            rot = Vector((0, 0, 1)).rotation_difference(Vector((0.2 * s, -0.8, -0.4)).normalized()).to_matrix()
            base = p + Vector((0.045 * s, 0.01, -0.04))
            for v in bm2.verts:
                v.co = base + rot @ Vector((v.co.x, v.co.y, v.co.z + 0.03))
            t = F.mesh_obj("t_tusk", bm2, ["MAT_REAL_Cream"]); F.smooth(t)
            tusks.append(tag(t))
        return [tag(o)] + tusks
    return make


def mane(m, ring=True, crest=False):
    def make(fp):
        specs = []
        if ring:
            for i in range(22):
                a = 2 * math.pi * i / 22
                x, z = math.cos(a), math.sin(a)
                if z < -0.85:
                    continue
                pos = HC + Vector((0.2 * x, 0.06, 0.19 * z - 0.01))
                specs.append((tuple(pos), (x, 0.35, z), 0.075, 0.13, m))
            for i in range(9):
                a = math.radians(-60 + i * 15)
                specs.append((tuple(HC + Vector((0.18 * math.sin(a), 0.15, 0.12 * math.cos(a)))), (math.sin(a), 0.8, 0.2), 0.08, 0.12, m))
        if crest:
            for i in range(9):
                t = i / 8
                pos = HC + Vector((0, -0.12 + 0.3 * t, 0.2 - 0.33 * t * t))
                specs.append((tuple(pos), (0.2 * (-1) ** i, 0.5 + 0.5 * t, 0.6 - t), 0.04, 0.11, m))
        return [tag(o) for o in tufts(specs)()]
    return make


def dorsal_fin():
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.09, radius2=0.005, depth=0.16)
    rot = Vector((0, 0, 1)).rotation_difference(Vector((0, 0.8, 0.6)).normalized()).to_matrix()
    for v in bm.verts:
        v.co = Vector((0, 0.16, 0.86)) + rot @ Vector((v.co.x * 0.25, v.co.y, v.co.z + 0.08))
    o = F.mesh_obj(f"SK_REAL_{F.SPECIES}_Fin", bm, [F.MAIN]); F.smooth(o); R.ensure_uv(o)
    return [o]


def wing_feathers():
    out = []
    for s, side in ((1, "l"), (-1, "r")):
        e = Vector(F.BONE[f"lowerarm_{side}"][1]); w = Vector(F.BONE[f"lowerarm_{side}"][2])
        for k in range(3):
            c = e.lerp(w, 0.25 + 0.3 * k) + Vector((0.0, 0.045, -0.02))
            rot = Vector((0, 0, -1)).rotation_difference((w - e).normalized()).to_matrix()
            out.append(F.ellipsoid(f"t_feather", c, (0.012, 0.03, 0.08), F.MAIN, 10, 6, rot))
    o = R.join(out, f"SK_REAL_{F.SPECIES}_WingFeathers"); F.smooth(o); R.ensure_uv(o)
    return [o]


# ---------------------------------------------------------------- species table
def species_table():
    T = {}
    T["Cat"] = dict(colors=((0.48, 0.48, 0.53), (0.93, 0.93, 0.93), (0.16, 0.16, 0.18)),
                    head=LOWER_FRONT, muzzle=dict(radii=(0.055, 0.05, 0.04), fwd=0.17, down=0.09, taper=0.2),
                    ears=ear_pointy(rad=0.075, length=0.82, outward=0.02), fluff="cheeks_small",
                    tail=tail_chain(*THIN_TAIL, tip_from=(0.84, 2)), extras=[whiskers, beanie("MAT_REAL_Clothing_Black")],
                    outfit=("MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Cream", "MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Gold"))
    T["Dog"] = dict(colors=((0.72, 0.47, 0.27), (0.95, 0.88, 0.76), (0.35, 0.2, 0.1)),
                    head=LOWER_FRONT, muzzle=dict(radii=(0.075, 0.085, 0.058), fwd=0.15, down=0.09, taper=0.15, lift=0.0),
                    ears=ear_blob((0.245, 0.02, -0.04), (0.045, 0.085, 0.14), (0.12, 0.3, 0.0), m_outer="MAT_REAL_Fur_Dog_Dark"),
                    fluff=None,
                    tail=tail_chain([(0, 0.08, 0.6), (0, 0.15, 0.62), (0, 0.2, 0.7), (0, 0.21, 0.78)],
                                    [(0.04, 0.04), (0.045, 0.045), (0.04, 0.04), (0.02, 0.02)], tip_from=(0.75, 1)),
                    extras=[cap("MAT_REAL_Clothing_Black", backwards=True)],
                    outfit=("MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Cream", "MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Gold"))
    T["Horse"] = dict(colors=((0.48, 0.28, 0.15), (0.86, 0.76, 0.62), (0.08, 0.06, 0.05)),
                      head=ALL_MAIN, muzzle=dict(radii=(0.085, 0.13, 0.075), fwd=0.15, down=0.1, taper=0.1, lift=0.0),
                      ears=ear_pointy(rad=0.05, length=0.7, tip_dark=False), fluff=None,
                      tail=tail_chain([(0, 0.1, 0.6), (0, 0.2, 0.58), (0, 0.28, 0.5), (0, 0.32, 0.38), (0, 0.33, 0.28)],
                                      [(0.04, 0.04), (0.06, 0.06), (0.07, 0.07), (0.06, 0.06), (0.025, 0.025)], tip_from=(0.0, 2)),
                      extras=[mane("MAT_REAL_Fur_Horse_Dark", ring=False, crest=True)],
                      outfit=("MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Cream", "MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Gold"))
    T["Bird"] = dict(colors=((0.25, 0.5, 0.88), (0.95, 0.95, 0.97), (0.08, 0.12, 0.28)),
                     head=LOWER_FRONT, muzzle=dict(radii=(0.04, 0.03, 0.03), fwd=0.12, down=0.08, taper=0.0),
                     ears=lambda: [], fluff="crest",
                     tail=tail_chain([(0, 0.08, 0.6), (0, 0.16, 0.56), (0, 0.24, 0.52)],
                                     [(0.03, 0.03), (0.06, 0.02), (0.08, 0.015)]),
                     extras=[beak(mat("MAT_REAL_Beak", (0.97, 0.68, 0.15), 0.4)), headphones("MAT_REAL_Clothing_Black")],
                     body_extras=[wing_feathers],
                     outfit=("MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Cream", "MAT_REAL_Clothing_Black", "MAT_REAL_Red"))
    T["Elephant"] = dict(colors=((0.56, 0.58, 0.63), (0.7, 0.72, 0.76), (0.32, 0.33, 0.37)),
                         head=ALL_MAIN, muzzle=dict(radii=(0.06, 0.05, 0.045), fwd=0.15, down=0.08, taper=0.0),
                         ears=ear_blob((0.235, 0.05, 0.0), (0.03, 0.15, 0.17), (0.0, 0.0, -0.35), m_inner="MAT_REAL_Ear_Pink"),
                         fluff=None,
                         tail=tail_chain(*THIN_TAIL, tuft=((0, 0.27, 0.97), 0.03, "MAT_REAL_Fur_Elephant_Dark")),
                         extras=[trunk("MAT_REAL_Fur_Elephant_Main"), cap("MAT_REAL_Clothing_Black")],
                         outfit=("MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Cream", "MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Gold"))
    T["Lion"] = dict(colors=((0.88, 0.62, 0.3), (0.96, 0.88, 0.72), (0.55, 0.3, 0.12)),
                     head=LOWER_FRONT, muzzle=dict(radii=(0.075, 0.075, 0.055), fwd=0.15, down=0.09, taper=0.15),
                     ears=ear_blob((0.15, 0.04, 0.17), (0.045, 0.025, 0.045), (0, 0, 0), m_inner="MAT_REAL_Fur_Lion_Dark"),
                     fluff=None,
                     tail=tail_chain(*THIN_TAIL, tuft=((0, 0.27, 0.97), 0.045, "MAT_REAL_Fur_Lion_Dark")),
                     extras=[mane("MAT_REAL_Fur_Lion_Dark", ring=True)],
                     outfit=("MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Cream", "MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Gold"))

    def cow_rule(c, n):
        r = math.sin(c.x * 31 + 1.3) * math.sin(c.y * 23) + math.sin(c.z * 27 + c.x * 9)
        if c.z < HC.z - 0.05 and c.y < 0.0:
            return 0
        return 2 if r > 0.75 else 0
    T["Cow"] = dict(colors=((0.95, 0.95, 0.93), (0.96, 0.72, 0.74), (0.08, 0.08, 0.09)),
                    head=cow_rule, muzzle=dict(radii=(0.095, 0.08, 0.06), fwd=0.14, down=0.1, taper=0.05, lift=0.0),
                    ears=ear_blob((0.235, 0.02, 0.09), (0.08, 0.02, 0.035), (0, 0, 0.2), m_inner="MAT_REAL_Ear_Pink"),
                    fluff="forelock",
                    tail=tail_chain(*THIN_TAIL, tuft=((0, 0.27, 0.97), 0.035, "MAT_REAL_Fur_Cow_Dark")),
                    extras=[horns("MAT_REAL_Cream")],
                    outfit=("MAT_REAL_Clothing_Black", mat("MAT_REAL_Clothing_Pink", (0.95, 0.68, 0.75), 0.85),
                            "MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Gold"))
    T["Dolphin"] = dict(colors=((0.38, 0.6, 0.82), (0.9, 0.94, 0.97), (0.12, 0.22, 0.38)),
                        head=LOWER_FRONT, muzzle=dict(radii=(0.05, 0.13, 0.04), fwd=0.17, down=0.09, taper=0.35, lift=0.0, m="MAIN"),
                        ears=lambda: [], fluff=None,
                        tail=tail_chain([(0, 0.08, 0.58), (0, 0.18, 0.5), (0, 0.26, 0.45)],
                                        [(0.06, 0.06), (0.045, 0.04), (0.025, 0.02)],
                                        extra=lambda: [F.ellipsoid("t_fluke", (0.08 * s, 0.3, 0.44), (0.09, 0.05, 0.015), F.MAIN, 14, 6)
                                                       for s in (1, -1)]),
                        extras=[cap(mat("MAT_REAL_Clothing_Blue", (0.3, 0.55, 0.9), 0.7), "MAT_REAL_White")],
                        body_extras=[dorsal_fin],
                        outfit=("MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Cream", mat("MAT_REAL_Clothing_Denim", (0.35, 0.5, 0.75), 0.8),
                                "MAT_REAL_Clothing_Gold"))
    # Story character — Jax: charismatic grey cat, red cap, red/black jacket (from the gameplay key art).
    T["Jax"] = dict(colors=((0.32, 0.32, 0.36), (0.78, 0.78, 0.8), (0.1, 0.1, 0.12)),
                    head=LOWER_FRONT, muzzle=dict(radii=(0.055, 0.05, 0.04), fwd=0.17, down=0.09, taper=0.2),
                    ears=ear_pointy(rad=0.078, length=0.9, outward=0.03), fluff="cheeks_small",
                    tail=tail_chain(*THIN_TAIL, tip_from=(0.84, 2)),
                    extras=[whiskers, cap("MAT_REAL_Red", "MAT_REAL_Clothing_Black")],
                    outfit=("MAT_REAL_Red", "MAT_REAL_Clothing_Black", "MAT_REAL_Clothing_Black", "MAT_REAL_Red"))
    return T


def fluff_for(kind):
    if kind == "cheeks_small":
        sp = []
        for s in (1, -1):
            sp += [((0.2 * s, -0.02, HC.z - 0.085), (0.75 * s, -0.1, -0.45), 0.04, 0.08, F.SEC),
                   ((0.18 * s, 0.0, HC.z - 0.13), (0.55 * s, 0.0, -0.8), 0.035, 0.07, F.SEC)]
        sp += [((0.0, -0.14, HC.z + 0.15), (0.1, -0.7, 0.55), 0.035, 0.07, F.MAIN)]
        return tufts(sp)
    if kind == "crest":
        return tufts([((0.0, -0.05, HC.z + 0.18), (0, -0.3 + 0.3 * k, 1.0), 0.04, 0.12 - 0.02 * k, F.MAIN) for k in range(3)])
    if kind == "forelock":
        return tufts([((0.0, -0.13, HC.z + 0.15), (0.1, -0.7, 0.55), 0.05, 0.1, F.DARK),
                      ((0.05, -0.12, HC.z + 0.14), (0.35, -0.7, 0.45), 0.04, 0.08, F.DARK)])
    return lambda: []


def configure(name):
    spec = species_table()[name]
    F.SPECIES = name
    main, sec, dark = spec["colors"]
    F.MAIN = mat(f"MAT_REAL_Fur_{name}_Main", main)
    F.SEC = mat(f"MAT_REAL_Fur_{name}_Sec", sec)
    F.DARK = mat(f"MAT_REAL_Fur_{name}_Dark", dark)
    mat("MAT_REAL_Ear_Pink", (0.93, 0.62, 0.66))
    F.JACKET, F.HOODIE, F.PANTS, F.ACCENT = spec["outfit"]
    F.head_base = head_colors(spec["head"])
    mz = dict(spec["muzzle"])
    if mz.get("m") == "MAIN":
        mz["m"] = F.MAIN
    F.muzzle = muzzle_fn(**mz)
    F.ears = spec["ears"]
    F.fluff = fluff_for(spec["fluff"])
    F.tail = spec["tail"]
    F.EXTRA_PARTS = spec.get("extras", [])
    F.BODY_EXTRAS = spec.get("body_extras", [])
    F._L.clear()


def produce(name, render=True):
    R.reset_scene()
    configure(name)
    arm, meshes, keys = F.build_fox()
    bpy.context.scene.render.fps = F.FPS
    acts = [F.make_action(arm, f"ANIM_REAL_{name}_{nm}", n, fn, loop).name for nm, n, fn, loop in F.ANIMS]
    deform = F.verify_deformation(arm, meshes)
    rep = R.validate_scene(meshes)
    rep.update({"triangles": R.tri_count(meshes), "bones": len(arm.data.bones), "shape_keys": keys, "actions": acts,
                "deformation_tests": deform})
    R.write_report(f"{name.lower()}_validation.json", rep)
    print("SPECIES", name, rep["triangles"], "tris", len(acts), "actions", "errors", rep["errors"])
    R.save_blend(f"Characters/{name}/CHR_REAL_{name}.blend")
    R.export_fbx(f"Characters/SK_REAL_{name}.fbx", [arm] + meshes, armature=True, animations=True)
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in [arm] + meshes:
        o.select_set(True)
    p = os.path.join(R.EXPORT_DIR, "Characters", f"SK_REAL_{name}.glb")
    bpy.ops.export_scene.gltf(filepath=p, export_format="GLB", use_selection=True, export_animations=True,
                              export_animation_mode="ACTIONS", export_morph=True, export_skins=True, export_yup=True)
    if render:
        F.studio()
        R.setup_render((700, 900), samples=16)
        cam = R.camera("CAM_hero", (1.3, -2.9, 1.05), (0, 0, 0.8), lens=50)
        R.render(cam, os.path.join(R.RENDER_DIR, "Characters", name, f"{name}_hero.png"))


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "Cat"
    names = ["Cat", "Dog", "Horse", "Bird", "Elephant", "Lion", "Cow", "Dolphin", "Jax"] if which == "all" else which.split(",")
    for n in names:
        produce(n)
