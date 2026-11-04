"""
KIT_REAL — modular city kit.

Grid: 4 m facade module, 3.2 m storey. All pieces pivot at bottom-centre of their
outer face line so they snap on a 4 m grid with rotations of 90 deg.
Facade pieces face -Y (Blender front). Interior side is +Y.

Run standalone:  /opt/realbpy/bin/python Tools/build_city_kit.py
Produces: Blender/Buildings/KIT_REAL_CityKit.blend, Exports/Kit/*.glb|fbx, Renders/kit_overview.png
Imported as a module by district/building scripts via build_kit().
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector
import real_lib as R

M = R.SCALE["module"]
H = R.SCALE["floor_h"]
T = R.SCALE["wall_t"]

FACADE_MATS = {
    "Brick": "MAT_REAL_Brick",
    "BrickDark": "MAT_REAL_BrickDark",
    "Plaster": "MAT_REAL_Plaster",
    "Warm": "MAT_REAL_PlasterWarm",
    "Concrete": "MAT_REAL_Concrete",
}


def _parts_to_piece(parts, name, coll):
    ob = R.join(parts, name)
    R.link(ob, coll)
    ob["real_kit"] = True
    return ob


def wall_plain(var, coll):
    mat = FACADE_MATS[var]
    p = [R.box("t", (M, T, H), (0, T / 2, 0), mat)]
    # string course trim at slab line
    p.append(R.box("t", (M, 0.06, 0.18), (0, -0.03, H - 0.18), "MAT_REAL_ConcreteDark"))
    return _parts_to_piece(p, f"KIT_Wall_4m_Plain_{var}", coll)


def wall_window(var, coll, lit=False):
    mat = FACADE_MATS[var]
    ww, sill, head = 1.8, 0.95, 2.45
    side = (M - ww) / 2
    p = [
        R.box("t", (M, T, sill), (0, T / 2, 0), mat),
        R.box("t", (M, T, H - head), (0, T / 2, head), mat),
        R.box("t", (side, T, head - sill), (-(ww / 2 + side / 2), T / 2, sill), mat),
        R.box("t", (side, T, head - sill), ((ww / 2 + side / 2), T / 2, sill), mat),
        # frame
        R.box("t", (ww, 0.08, 0.06), (0, 0.06, sill), "MAT_REAL_MetalFrame"),
        R.box("t", (ww, 0.08, 0.06), (0, 0.06, head - 0.06), "MAT_REAL_MetalFrame"),
        R.box("t", (0.06, 0.08, head - sill), (-ww / 2 + 0.03, 0.06, sill), "MAT_REAL_MetalFrame"),
        R.box("t", (0.06, 0.08, head - sill), (ww / 2 - 0.03, 0.06, sill), "MAT_REAL_MetalFrame"),
        R.box("t", (0.05, 0.06, head - sill), (0, 0.06, sill), "MAT_REAL_MetalFrame"),
        R.box("t", (ww, 0.02, head - sill), (0, 0.08, sill), "MAT_REAL_GlassLit" if lit else "MAT_REAL_Glass"),
        # sill ledge
        R.box("t", (ww + 0.2, 0.12, 0.06), (0, -0.04, sill - 0.06), "MAT_REAL_ConcreteDark"),
        R.box("t", (M, 0.06, 0.18), (0, -0.03, H - 0.18), "MAT_REAL_ConcreteDark"),
    ]
    return _parts_to_piece(p, f"KIT_Wall_4m_Window{'Lit' if lit else ''}_{var}", coll)


def wall_door(var, coll):
    mat = FACADE_MATS[var]
    dw, dh = R.SCALE["door_w"] * 1.4, R.SCALE["door_h"] + 0.3
    side = (M - dw) / 2
    p = [
        R.box("t", (M, T, H - dh), (0, T / 2, dh), mat),
        R.box("t", (side, T, dh), (-(dw / 2 + side / 2), T / 2, 0), mat),
        R.box("t", (side, T, dh), ((dw / 2 + side / 2), T / 2, 0), mat),
        R.box("t", (dw, 0.06, dh - 0.05), (0, 0.12, 0), "MAT_REAL_Glass"),
        R.box("t", (dw + 0.1, 0.12, 0.08), (0, 0.06, dh - 0.08), "MAT_REAL_MetalFrame"),
        R.box("t", (0.06, 0.12, dh), (-dw / 2, 0.06, 0), "MAT_REAL_MetalFrame"),
        R.box("t", (0.06, 0.12, dh), (dw / 2, 0.06, 0), "MAT_REAL_MetalFrame"),
        R.box("t", (0.05, 0.12, dh), (0, 0.06, 0), "MAT_REAL_MetalFrame"),
        # canopy
        R.box("t", (dw + 0.8, 1.0, 0.12), (0, -0.5, dh + 0.25), "MAT_REAL_Navy"),
        R.box("t", (0.04, 0.04, 0.3), (0, -0.25, dh + 0.37), "MAT_REAL_LampEmit"),
        R.box("t", (M, 0.06, 0.18), (0, -0.03, H - 0.18), "MAT_REAL_ConcreteDark"),
    ]
    piece = _parts_to_piece(p, f"KIT_Wall_4m_Door_{var}", coll)
    return piece


def storefront(var, coll, awning_mat="MAT_REAL_Navy"):
    mat = FACADE_MATS[var]
    p = [
        R.box("t", (M, T, 0.4), (0, T / 2, 0), mat),                 # stall riser
        R.box("t", (M, T, 0.7), (0, T / 2, H - 0.7), mat),           # fascia band (sign zone)
        R.box("t", (0.3, T + 0.04, H), (-M / 2 + 0.15, T / 2, 0), mat),
        R.box("t", (0.3, T + 0.04, H), (M / 2 - 0.15, T / 2, 0), mat),
        R.box("t", (M - 0.6, 0.02, H - 1.1), (0, 0.1, 0.4), "MAT_REAL_Glass"),
        R.box("t", (M - 0.6, 0.06, 0.05), (0, 0.1, 0.4), "MAT_REAL_MetalFrame"),
        R.box("t", (M - 0.6, 0.06, 0.05), (0, 0.1, H - 0.75), "MAT_REAL_MetalFrame"),
        R.box("t", (0.05, 0.06, H - 1.1), (0, 0.1, 0.4), "MAT_REAL_MetalFrame"),
        # sloped awning (approximated by rotated slab)
        R.box("t", (M - 0.3, 1.2, 0.06), (0, -0.55, H - 0.85), awning_mat, rot=(math.radians(-14), 0, 0)),
        R.box("t", (M - 0.3, 0.04, 0.25), (0, -1.13, H - 1.15), awning_mat),
    ]
    tag = awning_mat.replace("MAT_REAL_", "")
    return _parts_to_piece(p, f"KIT_Storefront_4m_{var}_{tag}", coll)


def corner(var, coll):
    mat = FACADE_MATS[var]
    p = [R.box("t", (T + 0.1, T + 0.1, H), (0, 0, 0), mat, pivot="bottom"),
         R.box("t", (T + 0.16, T + 0.16, 0.18), (0, 0, H - 0.18), "MAT_REAL_ConcreteDark")]
    return _parts_to_piece(p, f"KIT_Corner_{var}", coll)


def floor_tile(coll, mat="MAT_REAL_ConcreteDark", name="KIT_Floor_4x4"):
    return _parts_to_piece([R.box("t", (M, M, R.SCALE["slab"]), (0, 0, -R.SCALE["slab"]), mat)], name, coll)


def roof_parapet(var, coll):
    mat = FACADE_MATS[var]
    p = [R.box("t", (M, T + 0.1, 0.9), (0, T / 2, 0), mat),
         R.box("t", (M, T + 0.3, 0.1), (0, T / 2, 0.9), "MAT_REAL_ConcreteDark")]
    return _parts_to_piece(p, f"KIT_RoofParapet_4m_{var}", coll)


def roof_cap(coll):
    p = [R.box("t", (M, M, 0.2), (0, 0, 0), "MAT_REAL_ConcreteDark")]
    return _parts_to_piece(p, "KIT_RoofCap_4x4", coll)


def stairs(coll, width=1.2, rise=H, steps=18):
    run = 0.28
    p = []
    for i in range(steps):
        p.append(R.box("t", (width, run, rise / steps * (i + 1)), (0, i * run + run / 2, 0), "MAT_REAL_Concrete"))
    p.append(R.box("t", (0.04, steps * run, 0.04), (width / 2, steps * run / 2, rise + 0.9),
                   "MAT_REAL_MetalFrame", rot=(math.atan2(rise, steps * run), 0, 0)))
    return _parts_to_piece(p, "KIT_Stairs_Straight_1Storey", coll)


def railing(coll):
    p = [R.box("t", (M, 0.05, 0.05), (0, 0, 1.0), "MAT_REAL_MetalFrame")]
    for i in range(9):
        p.append(R.box("t", (0.03, 0.03, 1.0), (-M / 2 + 0.25 + i * 0.44, 0, 0), "MAT_REAL_MetalFrame"))
    return _parts_to_piece(p, "KIT_Railing_4m", coll)


def balcony(coll):
    p = [R.box("t", (2.8, 1.2, 0.15), (0, -0.6, 0), "MAT_REAL_Concrete")]
    p.append(R.box("t", (2.8, 0.04, 0.9), (0, -1.18, 0.15), "MAT_REAL_Glass"))
    p.append(R.box("t", (2.9, 0.06, 0.06), (0, -1.18, 1.05), "MAT_REAL_MetalFrame"))
    return _parts_to_piece(p, "KIT_Balcony_3m", coll)


# --- Ground -----------------------------------------------------------------
ROAD_W = 2 * R.SCALE["lane_w"] + 1.0   # 8 m curb-to-curb
SW_W = 4.0                               # sidewalk width


def road_straight(coll, length=8.0):
    p = [R.box("t", (length, ROAD_W, 0.05), (0, 0, -0.05), "MAT_REAL_Asphalt")]
    # centre dashed double yellow
    p.append(R.box("t", (length, 0.12, 0.012), (0, 0.1, 0), "MAT_REAL_RoadYellow"))
    p.append(R.box("t", (length, 0.12, 0.012), (0, -0.1, 0), "MAT_REAL_RoadYellow"))
    # edge lines
    for y in (ROAD_W / 2 - 0.35, -ROAD_W / 2 + 0.35):
        p.append(R.box("t", (length, 0.12, 0.012), (0, y, 0), "MAT_REAL_RoadLine"))
    return _parts_to_piece(p, f"KIT_Road_Straight_{int(length)}m", coll)


def road_intersection(coll):
    p = [R.box("t", (ROAD_W, ROAD_W, 0.05), (0, 0, -0.05), "MAT_REAL_Asphalt")]
    # crosswalk zebra on all 4 approaches is placed by road_crosswalk
    return _parts_to_piece(p, "KIT_Road_Intersection_4Way", coll)


def road_crosswalk(coll):
    p = [R.box("t", (3.0, ROAD_W, 0.05), (0, 0, -0.05), "MAT_REAL_Asphalt")]
    for i in range(7):
        y = -ROAD_W / 2 + 0.6 + i * 1.1
        p.append(R.box("t", (2.6, 0.55, 0.012), (0, y, 0), "MAT_REAL_RoadLine"))
    return _parts_to_piece(p, "KIT_Road_Crosswalk", coll)


def sidewalk(coll, length=4.0):
    h = R.SCALE["sidewalk_h"]
    p = [R.box("t", (length, SW_W - 0.25, h), (0, 0.125, 0), "MAT_REAL_Sidewalk")]
    p.append(R.box("t", (length, 0.25, h + 0.02), (0, -SW_W / 2 + 0.125, 0), "MAT_REAL_ConcreteDark"))
    # paving joints
    for i in range(int(length / 2)):
        p.append(R.box("t", (0.03, SW_W - 0.3, 0.004), (-length / 2 + 2 * i, 0.12, h), "MAT_REAL_ConcreteDark"))
    return _parts_to_piece(p, f"KIT_Sidewalk_{int(length)}m", coll)


def sidewalk_corner(coll):
    h = R.SCALE["sidewalk_h"]
    p = [R.box("t", (SW_W, SW_W, h), (0, 0, 0), "MAT_REAL_Sidewalk")]
    return _parts_to_piece(p, "KIT_Sidewalk_Corner", coll)


def ground_lot(coll, sx, sy, mat="MAT_REAL_Grass", name=None):
    return _parts_to_piece([R.box("t", (sx, sy, 0.15), (0, 0, 0), mat)], name or f"KIT_Lot_{int(sx)}x{int(sy)}", coll)


# --- Street furniture ---------------------------------------------------------
def street_light(coll):
    p = [R.cylinder("t", 0.12, 0.3, (0, 0, 0), "MAT_REAL_MetalFrame", 12),
         R.cylinder("t", 0.06, 5.2, (0, 0, 0.3), "MAT_REAL_MetalFrame", 10),
         R.box("t", (1.4, 0.1, 0.1), (0.6, 0, 5.4), "MAT_REAL_MetalFrame"),
         R.box("t", (0.55, 0.3, 0.12), (1.2, 0, 5.3), "MAT_REAL_MetalFrame"),
         R.box("t", (0.5, 0.25, 0.03), (1.2, 0, 5.28), "MAT_REAL_LampEmit"),
         # REAL crown banner bracket
         R.box("t", (0.04, 0.6, 1.2), (0.0, -0.32, 3.6), "MAT_REAL_Navy"),
         R.box("t", (0.05, 0.3, 0.12), (0.0, -0.32, 4.5), "MAT_REAL_Gold")]
    ob = _parts_to_piece(p, "PROP_REAL_StreetLight", coll)
    return ob


def bench(coll):
    p = []
    for i in range(4):
        p.append(R.box("t", (1.8, 0.09, 0.04), (0, -0.2 + i * 0.12, 0.42), "MAT_REAL_WoodLight"))
    for i in range(2):
        p.append(R.box("t", (1.8, 0.04, 0.09), (0, 0.24, 0.55 + i * 0.13), "MAT_REAL_WoodLight"))
    for x in (-0.75, 0.75):
        p.append(R.box("t", (0.06, 0.5, 0.42), (x, 0.0, 0), "MAT_REAL_MetalFrame"))
        p.append(R.box("t", (0.06, 0.05, 0.42), (x, 0.26, 0.42), "MAT_REAL_MetalFrame"))
    return _parts_to_piece(p, "PROP_REAL_Bench", coll)


def trash_bin(coll):
    p = [R.cylinder("t", 0.28, 0.9, (0, 0, 0), "MAT_REAL_FreshMartGreen", 14),
         R.cylinder("t", 0.3, 0.08, (0, 0, 0.9), "MAT_REAL_MetalFrame", 14),
         R.box("t", (0.2, 0.02, 0.2), (0, -0.28, 0.55), "MAT_REAL_Gold")]
    return _parts_to_piece(p, "PROP_REAL_TrashBin", coll)


def hydrant(coll):
    p = [R.cylinder("t", 0.12, 0.55, (0, 0, 0), "MAT_REAL_Red", 10),
         R.sphere("t", 0.12, (0, 0, 0.55), "MAT_REAL_Red", 10, 5),
         R.cylinder("t", 0.05, 0.3, (0, 0, 0.35), "MAT_REAL_Red", 8, pivot="center", rot=(0, math.radians(90), 0))]
    return _parts_to_piece(p, "PROP_REAL_FireHydrant", coll)


def street_sign(coll, labels=("Main St", "Fresh Ave")):
    p = [R.cylinder("t", 0.05, 3.2, (0, 0, 0), "MAT_REAL_MetalFrame", 8),
         R.box("t", (1.3, 0.04, 0.28), (0.55, 0, 2.9), "MAT_REAL_FreshMartGreen"),
         R.box("t", (0.04, 1.3, 0.28), (0, 0.55, 2.55), "MAT_REAL_FreshMartGreen"),
         R.text_mesh("t", labels[0], 0.17, (0.55, -0.03, 2.9), mat="MAT_REAL_White"),
         R.text_mesh("t", labels[1], 0.17, (0.03, 0.55, 2.55), rot=(math.radians(90), 0, math.radians(90)), mat="MAT_REAL_White")]
    return _parts_to_piece(p, "PROP_REAL_StreetSign_MainFresh", coll)


def bus_stop(coll):
    p = [R.box("t", (3.6, 1.6, 0.08), (0, 0, 2.5), "MAT_REAL_Navy"),
         R.box("t", (3.4, 0.03, 2.3), (0, 0.75, 0.2), "MAT_REAL_Glass"),
         R.box("t", (0.03, 1.4, 2.3), (-1.75, 0, 0.2), "MAT_REAL_Glass"),
         R.box("t", (2.4, 0.4, 0.05), (0.2, 0.45, 0.45), "MAT_REAL_WoodLight"),
         R.box("t", (0.9, 0.08, 1.6), (1.6, 0.72, 0.5), "MAT_REAL_GlassLit"),   # ad panel
         R.text_mesh("t", "BUS", 0.25, (0, -0.81, 2.54), mat="MAT_REAL_Gold")]
    for x in (-1.75, 1.75):
        p.append(R.box("t", (0.08, 0.08, 2.5), (x, 0.75, 0), "MAT_REAL_MetalFrame"))
    p.append(R.cylinder("t", 0.04, 3.0, (2.2, -0.7, 0), "MAT_REAL_MetalFrame", 8))
    p.append(R.box("t", (0.5, 0.04, 0.5), (2.2, -0.7, 2.6), "MAT_REAL_Gold"))
    ob = _parts_to_piece(p, "PROP_REAL_BusStop", coll)
    return ob


def tree(coll, name="PROP_REAL_Tree_A", h=5.0, r=1.8):
    p = [R.cylinder("t", 0.16, h * 0.55, (0, 0, 0), "MAT_REAL_Bark", 8, radius2=0.1)]
    for (x, y, z, s) in [(0, 0, h * 0.7, 1.0), (0.6, 0.3, h * 0.6, 0.75), (-0.5, -0.4, h * 0.62, 0.7),
                         (0.1, -0.5, h * 0.82, 0.65), (-0.3, 0.5, h * 0.8, 0.6)]:
        p.append(R.sphere("t", r * s, (x, y, z), "MAT_REAL_Leaf", 10, 6, scale=(1, 1, 0.85)))
    p.append(R.cylinder("t", 0.6, 0.06, (0, 0, 0), "MAT_REAL_MetalFrame", 12))
    return _parts_to_piece(p, name, coll)


def planter(coll):
    p = [R.box("t", (1.2, 0.6, 0.55), (0, 0, 0), "MAT_REAL_ConcreteDark"),
         R.sphere("t", 0.35, (-0.3, 0, 0.6), "MAT_REAL_Leaf", 8, 5),
         R.sphere("t", 0.3, (0.25, 0.05, 0.6), "MAT_REAL_Leaf", 8, 5)]
    return _parts_to_piece(p, "PROP_REAL_Planter", coll)


def parking_line(coll):
    return _parts_to_piece([R.box("t", (0.12, 5.0, 0.01), (0, 0, 0), "MAT_REAL_RoadLine")], "KIT_ParkingLine", coll)


def banner_pole(coll):
    """REAL brand banner (key art: 'REAL — People. Better. Futures.')"""
    p = [R.cylinder("t", 0.07, 6.0, (0, 0, 0), "MAT_REAL_MetalFrame", 10),
         R.box("t", (1.0, 0.03, 2.4), (0.55, 0, 3.2), "MAT_REAL_Navy"),
         R.text_mesh("t", "REAL", 0.32, (0.55, -0.025, 5.0), mat="MAT_REAL_White"),
         R.text_mesh("t", "PEOPLE\nBETTER\nFUTURES", 0.13, (0.55, -0.025, 4.0), mat="MAT_REAL_Cream"),
         R.box("t", (0.3, 0.02, 0.1), (0.55, -0.02, 5.35), "MAT_REAL_Gold")]
    return _parts_to_piece(p, "PROP_REAL_BannerPole", coll)


def build_kit(target_coll_name="KIT_REAL_CityKit"):
    """Builds every kit piece into a hidden library collection; returns dict name->object."""
    kc = R.coll(target_coll_name)
    out = {}
    for var in FACADE_MATS:
        for f in (wall_plain, wall_window, wall_door, corner, roof_parapet):
            o = f(var, kc); out[o.name] = o
        o = wall_window(var, kc, lit=True); out[o.name] = o
        for aw in ("MAT_REAL_Navy", "MAT_REAL_FreshMartGreen", "MAT_REAL_Red", "MAT_REAL_Teal"):
            o = storefront(var, kc, aw); out[o.name] = o
    for f in (floor_tile, roof_cap, stairs, railing, balcony, road_straight, road_intersection, road_crosswalk,
              sidewalk, sidewalk_corner, street_light, bench, trash_bin, hydrant, street_sign, bus_stop,
              planter, parking_line, banner_pole):
        o = f(kc); out[o.name] = o
    o = tree(kc); out[o.name] = o
    o = tree(kc, "PROP_REAL_Tree_B", h=6.5, r=2.2); out[o.name] = o
    return kc, out


def layout_overview(pieces):
    """Lay pieces out in a grid for the kit sheet render."""
    names = sorted(pieces)
    cols = 12
    for i, n in enumerate(names):
        o = pieces[n]
        o.location = ((i % cols) * 6.0, -(i // cols) * 7.0, 0)


if __name__ == "__main__":
    R.reset_scene()
    kc, pieces = build_kit()
    rep = R.validate_scene(list(pieces.values()))
    rep["pieces"] = sorted(pieces)
    rep["piece_count"] = len(pieces)
    rep["triangles_total"] = R.tri_count(pieces.values())
    R.write_report("kit_validation.json", rep)
    print("KIT pieces:", len(pieces), "errors:", rep["errors"][:5])
    R.save_blend("Buildings/KIT_REAL_CityKit.blend")
    # per-piece exports
    for n, o in pieces.items():
        loc = o.location.copy(); o.location = (0, 0, 0)
        R.export_glb(f"Kit/{n}.glb", [o])
        o.location = loc
    R.export_fbx("Kit/KIT_REAL_CityKit_All.fbx", list(pieces.values()))
    # overview render
    layout_overview(pieces)
    R.setup_world("midday")
    R.setup_render((1600, 1000), samples=24)
    gp = R.box("TMP_Ground", (200, 200, 0.01), (30, -20, -0.06), "MAT_REAL_ConcreteDark")
    cam = R.camera("CAM_KitSheet", (33, -75, 45), (33, -22, 0), lens=40)
    R.render(cam, os.path.join(R.RENDER_DIR, "kit_overview.png"))
