"""
DST_REAL_StartingDistrict — District 1 blockout-to-dressing pass.

Street plan (metres, origin = Main St x Fresh Ave intersection):
    Main St   runs along X (y = 0), Fresh Ave runs along Y (x = 0). Road 8 m curb-to-curb, 4 m sidewalks.
    NW block : Starter Apartments (5 storeys, lobby + Daily Grind coffee shop)  + Career Center
    NE block : Fresh Mart + parking lot
    SW block : Main St Diner (entry restaurant), Thread & Co (basic clothing), Grow Gym
    SE block : Brighter Park + bus stop
    North    : skyline backdrop and The Club on the hill, framed down Fresh Ave.

Buildings are assembled from KIT_REAL instances (shared mesh data -> instanced static meshes in Unreal).
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix
import real_lib as R
import build_city_kit as K
import build_fresh_mart as FM
import build_starter_apartment as APT

M = R.SCALE["module"]
H = R.SCALE["floor_h"]
HALF_ROAD = K.ROAD_W / 2
LOT = HALF_ROAD + K.SW_W        # 8 m: where building lots start
EXTENT = 72


def xf(origin, rot, local):
    c, s = math.cos(rot), math.sin(rot)
    return Vector((origin[0] + local[0] * c - local[1] * s, origin[1] + local[0] * s + local[1] * c, local[2]))


class Builder:
    def __init__(self, kit, coll):
        self.k = kit
        self.c = coll
        self.n = 0

    def put(self, piece, name, loc, rot):
        self.n += 1
        return R.instance(self.k[piece], f"{name}_{self.n:04d}", loc, rot, self.c)

    def building(self, name, origin, rot, nx, ny, floors, var, ground, lit_rate=0.35, seed=0, roof=True):
        """ground: list (len nx) of 'door'|'store:<awning>'|'window'|'plain' for the front ground floor."""
        rnd = random.Random(seed)
        W, D = nx * M, ny * M
        bc = R.coll(name, self.c)
        prev, self.c = self.c, bc
        for f in range(floors):
            z = f * H
            for i in range(nx):
                lx = -W / 2 + M / 2 + i * M
                if f == 0:
                    g = ground[i]
                    if g == "door":
                        pc = f"KIT_Wall_4m_Door_{var}"
                    elif g.startswith("store"):
                        pc = f"KIT_Storefront_4m_{var}_{g.split(':')[1]}"
                    elif g == "plain":
                        pc = f"KIT_Wall_4m_Plain_{var}"
                    else:
                        pc = f"KIT_Wall_4m_Window_{var}"
                else:
                    pc = f"KIT_Wall_4m_Window{'Lit' if rnd.random() < lit_rate else ''}_{var}"
                self.put(pc, f"BLD_{name}_Front", xf(origin, rot, (lx, 0, z)), rot)
                back = f"KIT_Wall_4m_Window{'Lit' if rnd.random() < lit_rate * 0.6 else ''}_{var}" if f > 0 else f"KIT_Wall_4m_Plain_{var}"
                self.put(back, f"BLD_{name}_Back", xf(origin, rot, (lx, D, z)), rot + math.pi)
            for j in range(ny):
                ly = M / 2 + j * M
                for sx, sr in ((-W / 2, -math.pi / 2), (W / 2, math.pi / 2)):
                    pc = f"KIT_Wall_4m_Window{'Lit' if rnd.random() < lit_rate else ''}_{var}" if (f > 0 and j % 2 == 0) else f"KIT_Wall_4m_Plain_{var}"
                    self.put(pc, f"BLD_{name}_Side", xf(origin, rot, (sx, ly, z)), rot + sr)
            for (cx, cy) in ((-W / 2, 0), (W / 2, 0), (-W / 2, D), (W / 2, D)):
                self.put(f"KIT_Corner_{var}", f"BLD_{name}_Corner", xf(origin, rot, (cx, cy, z)), rot)
        top = floors * H
        if roof:
            for i in range(nx):
                for j in range(ny):
                    self.put("KIT_RoofCap_4x4", f"BLD_{name}_Roof", xf(origin, rot, (-W / 2 + M / 2 + i * M, M / 2 + j * M, top - 0.2)), rot)
            for i in range(nx):
                lx = -W / 2 + M / 2 + i * M
                self.put(f"KIT_RoofParapet_4m_{var}", f"BLD_{name}_Parapet", xf(origin, rot, (lx, 0, top)), rot)
                self.put(f"KIT_RoofParapet_4m_{var}", f"BLD_{name}_Parapet", xf(origin, rot, (lx, D, top)), rot + math.pi)
            for j in range(ny):
                ly = M / 2 + j * M
                self.put(f"KIT_RoofParapet_4m_{var}", f"BLD_{name}_Parapet", xf(origin, rot, (-W / 2, ly, top)), rot - math.pi / 2)
                self.put(f"KIT_RoofParapet_4m_{var}", f"BLD_{name}_Parapet", xf(origin, rot, (W / 2, ly, top)), rot + math.pi / 2)
        for i in range(nx):
            for j in range(ny):
                self.put("KIT_Floor_4x4", f"BLD_{name}_Floor", xf(origin, rot, (-W / 2 + M / 2 + i * M, M / 2 + j * M, 0)), rot)
        self.c = prev
        return bc

    def store_sign(self, name, text, origin, rot, module_i, nx, mat="MAT_REAL_SignWhiteEmit", size=0.42, z=None):
        W = nx * M
        lx = -W / 2 + M / 2 + module_i * M
        loc = xf(origin, rot, (lx, -0.04, (H - 0.35) if z is None else z))
        t = R.text_mesh(name, text, size, loc, rot=(math.radians(90), 0, rot), mat=mat, extrude=0.03, collection=self.c)
        return t


def roads(b):
    rc = R.coll("DST_REAL_Roads", b.c)
    prev, b.c = b.c, rc
    n = int(EXTENT / 8)
    for i in range(n):
        d = HALF_ROAD + 3.0 + 4.0 + i * 8.0 - 4.0
        if d + 4 > EXTENT + 4:
            break
        for s in (1, -1):
            b.put("KIT_Road_Straight_8m", "KIT_MainSt", (s * (d + 1.5), 0, 0), 0)
            b.put("KIT_Road_Straight_8m", "KIT_FreshAve", (0, s * (d + 1.5), 0), math.pi / 2)
    b.put("KIT_Road_Intersection_4Way", "KIT_Intersection", (0, 0, 0), 0)
    for s in (1, -1):
        b.put("KIT_Road_Crosswalk", "KIT_Crosswalk", (s * (HALF_ROAD + 1.5), 0, 0), 0)
        b.put("KIT_Road_Crosswalk", "KIT_Crosswalk", (0, s * (HALF_ROAD + 1.5), 0), math.pi / 2)
    # sidewalks: along Main St (both sides) and Fresh Ave (both sides)
    sw_mid = HALF_ROAD + K.SW_W / 2
    for i in range(int((EXTENT - LOT) / 4) + 1):
        d = LOT + 2 + i * 4
        for sx in (1, -1):
            for sy in (1, -1):
                # along Main St: curb faces the road (pieces' curb is at local -Y)
                b.put("KIT_Sidewalk_4m", "KIT_SW_Main", (sx * d, sy * sw_mid, 0), 0 if sy > 0 else math.pi)
                b.put("KIT_Sidewalk_4m", "KIT_SW_Fresh", (sx * sw_mid, sy * d, 0), -math.pi / 2 if sx > 0 else math.pi / 2)
    for sx in (1, -1):
        for sy in (1, -1):
            b.put("KIT_Sidewalk_Corner", "KIT_SW_Corner", (sx * sw_mid, sy * sw_mid, 0), 0)
    b.c = prev


def lots(b):
    lc = R.coll("DST_REAL_Lots", b.c)
    size = EXTENT - LOT
    for sx in (1, -1):
        for sy in (1, -1):
            mat = "MAT_REAL_Grass" if (sx > 0 and sy < 0) else "MAT_REAL_ConcreteDark"
            R.box(f"KIT_Lot_{'E' if sx > 0 else 'W'}{'N' if sy > 0 else 'S'}", (size, size, 0.12),
                  (sx * (LOT + size / 2), sy * (LOT + size / 2), 0), mat, collection=lc)
    # ground plane beyond the district (sells distance)
    R.box("KIT_Ground_Outer", (600, 600, 0.1), (0, 0, -0.12), "MAT_REAL_ConcreteDark", collection=lc)


def furniture(b, sockets):
    fc = R.coll("DST_REAL_StreetFurniture", b.c)
    prev, b.c = b.c, fc
    edge = HALF_ROAD + 0.6
    for i in range(int((EXTENT - LOT) / 16) + 1):
        d = LOT + 6 + i * 16
        for s in (1, -1):
            b.put("PROP_REAL_StreetLight", "PROP_StreetLight", (s * d, edge, 0.15), math.pi / 2 * 0 + math.pi)
            b.put("PROP_REAL_StreetLight", "PROP_StreetLight", (s * d, -edge, 0.15), 0 + 0)
            b.put("PROP_REAL_StreetLight", "PROP_StreetLight", (edge, s * d, 0.15), -math.pi / 2 + math.pi)
            b.put("PROP_REAL_StreetLight", "PROP_StreetLight", (-edge, s * d, 0.15), math.pi / 2 - math.pi)
    # street lights: arm points toward the road (+X local) — rotate so arm hangs over carriageway
    for o in fc.objects:
        if "StreetLight" in o.name:
            x, y = o.location.x, o.location.y
            if abs(y) < abs(x):     # Main St lights: arm toward y=0
                o.rotation_euler.z = -math.pi / 2 if y > 0 else math.pi / 2
            else:                   # Fresh Ave lights: arm toward x=0
                o.rotation_euler.z = math.pi if x > 0 else 0
    trees_at = []
    for i in range(int((EXTENT - LOT) / 12)):
        d = LOT + 12 + i * 12
        for s in (1, -1):
            trees_at += [(s * d, HALF_ROAD + 1.4), (s * d, -HALF_ROAD - 1.4), (HALF_ROAD + 1.4, s * d), (-HALF_ROAD - 1.4, s * d)]
    for k, (x, y) in enumerate(trees_at):
        b.put("PROP_REAL_Tree_A" if k % 3 else "PROP_REAL_Tree_B", "PROP_Tree", (x, y, 0.15), k * 0.7)
    # banners (key art), signs, bins, hydrants
    for (x, y, r) in ((LOT + 1.0, LOT + 0.6, 0), (-LOT - 1.0, LOT + 0.6, math.pi), (-LOT - 1.0, -LOT - 0.6, math.pi),
                      (LOT + 1.0, -LOT - 0.6, 0)):
        b.put("PROP_REAL_BannerPole", "PROP_Banner", (x, y, 0.15), r)
    b.put("PROP_REAL_StreetSign_MainFresh", "PROP_StreetSign", (HALF_ROAD + 0.8, HALF_ROAD + 0.8, 0.15), 0)
    for (x, y) in ((14, -HALF_ROAD - 0.8), (-14, HALF_ROAD + 0.8), (30, HALF_ROAD + 0.8), (-30, -HALF_ROAD - 0.8)):
        b.put("PROP_REAL_TrashBin", "PROP_TrashBin", (x, y, 0.15), 0)
    for (x, y) in ((HALF_ROAD + 0.7, 20), (-HALF_ROAD - 0.7, -26)):
        b.put("PROP_REAL_FireHydrant", "PROP_Hydrant", (x, y, 0.15), 0)
    # bus stop on Main St (south side, SE block) — the player's ARRIVAL point
    b.put("PROP_REAL_BusStop", "PROP_BusStop", (22, -HALF_ROAD - 2.3, 0.15), math.pi)
    sockets += [("SOCKET_Spawn_DistrictArrival", (22, -HALF_ROAD - 1.2, 0.15), 90, {"event": "Cinematic_Arrival"}),
                ("SOCKET_Interact_BusStop", (22, -HALF_ROAD - 1.6, 0.15), 0, {"action": "Travel:Bus", "edu": "Reading:Schedule;Math:Time"})]
    b.c = prev


def park(b, sockets):
    pc = R.coll("DST_REAL_BrighterPark", b.c)
    prev, b.c = b.c, pc
    cx, cy = LOT + 30, -LOT - 30
    # crossing paths
    R.box("DST_Park_Path_A", (60, 3, 0.02), (cx, cy, 0.12), "MAT_REAL_Sidewalk", collection=pc)
    R.box("DST_Park_Path_B", (3, 60, 0.02), (cx, cy, 0.12), "MAT_REAL_Sidewalk", collection=pc)
    # fountain plaza
    R.cylinder("DST_Park_Plaza", 7, 0.03, (cx, cy, 0.12), "MAT_REAL_Sidewalk", 40, collection=pc)
    R.cylinder("PROP_REAL_Fountain_Basin", 3.2, 0.6, (cx, cy, 0.14), "MAT_REAL_Concrete", 32, collection=pc)
    R.cylinder("PROP_REAL_Fountain_Water", 2.9, 0.02, (cx, cy, 0.66), "MAT_REAL_Glass", 32, collection=pc)
    R.cylinder("PROP_REAL_Fountain_Column", 0.4, 1.8, (cx, cy, 0.6), "MAT_REAL_Concrete", 16, collection=pc)
    R.cylinder("PROP_REAL_Fountain_Crown", 0.6, 0.35, (cx, cy, 2.4), "MAT_REAL_Gold", 16, radius2=0.25, collection=pc)
    rnd = random.Random(3)
    for k in range(26):
        a = rnd.uniform(0, 2 * math.pi); r = rnd.uniform(10, 27)
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        if abs(x - cx) < 3 or abs(y - cy) < 3:
            continue
        b.put("PROP_REAL_Tree_B" if k % 2 else "PROP_REAL_Tree_A", "PROP_ParkTree", (x, y, 0.12), a)
    for k, (dx, dy, r) in enumerate(((5, 4.2, math.pi), (-5, 4.2, math.pi), (5, -4.2, 0), (-5, -4.2, 0))):
        b.put("PROP_REAL_Bench", "PROP_ParkBench", (cx + dx, cy + dy, 0.12), r)
        sockets.append((f"SOCKET_Interact_ParkBench_{k+1:02d}", (cx + dx, cy + dy - 0.6 * (1 if r == 0 else -1), 0.12),
                        0 if r == 0 else 180, {"action": "Sit;Relax", "anim": "ANIM_REAL_Sit"}))
    b.put("PROP_REAL_TrashBin", "PROP_ParkBin", (cx + 7.5, cy + 2, 0.12), 0)
    t = R.text_mesh("PROP_REAL_Sign_BrighterPark", "BRIGHTER PARK", 0.5, (LOT + 4, -LOT - 0.6, 1.4), rot=(math.radians(90), 0, 0),
                    mat="MAT_REAL_Gold", collection=pc)
    R.box("PROP_REAL_Sign_BrighterPark_Board", (4.6, 0.2, 1.0), (LOT + 4, -LOT - 0.4, 0.9), "MAT_REAL_Navy", collection=pc)
    R.box("PROP_REAL_Sign_BrighterPark_Post", (0.2, 0.2, 0.9), (LOT + 4, -LOT - 0.4, 0.0), "MAT_REAL_MetalFrame", collection=pc)
    sockets.append(("SOCKET_Interact_ParkJog", (cx, cy - 8, 0.12), 0, {"action": "Exercise:Jog"}))
    b.c = prev


def parking(b):
    pc = R.coll("DST_REAL_FreshMartParking", b.c)
    prev, b.c = b.c, pc
    R.box("DST_FreshMart_ParkingLot", (34, 17.5, 0.03), (36, LOT + 8.75, 0.12), "MAT_REAL_Asphalt", collection=pc)
    for i in range(12):
        b.put("KIT_ParkingLine", "KIT_ParkLine", (22 + i * 2.6, LOT + 13.5, 0.155), 0)
        b.put("KIT_ParkingLine", "KIT_ParkLine", (22 + i * 2.6, LOT + 4.0, 0.155), 0)
    for (x, y) in ((24, LOT + 9), (48, LOT + 9)):
        b.put("PROP_REAL_Planter", "PROP_Planter", (x, y, 0.15), 0)
    b.c = prev


def district():
    R.reset_scene()
    dc = R.coll("DST_REAL_StartingDistrict")
    kc, kit = K.build_kit()
    kc.hide_render = True
    kc.hide_viewport = True
    for o in kit.values():
        o.location = (0, 0, -100)
    b = Builder(kit, dc)
    sockets = []
    roads(b)
    lots(b)
    furniture(b, sockets)
    park(b, sockets)
    parking(b)

    bc = R.coll("DST_REAL_Buildings", dc)
    b.c = bc
    # --- NW: Starter Apartments (front on Main St, facing -Y -> rot pi so it faces the road at y<lot)
    o = (-24, LOT + 0.0)
    b.building("BLD_REAL_StarterApartments", o, 0, 6, 3, 5, "Brick",
               ["store:Teal", "store:Teal", "door", "window", "window", "plain"], seed=1)
    # NOTE local front faces -Y; Main St is at y=0 < LOT -> rot 0 is correct for north blocks.
    b.store_sign("PROP_REAL_Sign_DailyGrind", "DAILY GRIND  COFFEE", o, 0, 0.5, 6, mat="MAT_REAL_SignWhiteEmit", size=0.38)
    b.store_sign("PROP_REAL_Sign_Apartments", "THE STARTER  •  APARTMENTS", o, 0, 3.5, 6, mat="MAT_REAL_GoldEmit", size=0.3, z=2.9)
    sockets += [("SOCKET_Door_ApartmentLobby", xf(o, 0, (-2, -0.6, 0.15)), 180, {"travel": "ENV_REAL_StarterApartment"}),
                ("SOCKET_Door_CoffeeShop", xf(o, 0, (-8, -0.6, 0.15)), 180, {"business": "DailyGrind", "jobs": "Barista"})]
    # NW: Career Center
    o2 = (-56, LOT)
    b.building("BLD_REAL_CareerCenter", o2, 0, 4, 3, 2, "Plaster", ["window", "door", "store:Navy", "window"], seed=2)
    b.store_sign("PROP_REAL_Sign_CareerCenter", "CAREER CENTER", o2, 0, 1.5, 4, mat="MAT_REAL_GoldEmit", size=0.5, z=H + 0.9)
    sockets.append(("SOCKET_Door_CareerCenter", xf(o2, 0, (-2, -0.6, 0.15)), 180,
                    {"action": "Jobs:Apply", "edu": "Writing:Application;Reading:JobPosting"}))
    # --- SW: Diner, Thread & Co, Grow Gym — face +Y toward Main St -> rot pi
    for (name, x, nx, floors, var, ground, sign, signmat, sk) in (
            ("BLD_REAL_MainStDiner", -18, 3, 2, "Warm", ["store:Red", "door", "store:Red"], "MAIN ST DINER", "MAT_REAL_SignWhiteEmit", "Diner"),
            ("BLD_REAL_ThreadAndCo", -34, 3, 3, "BrickDark", ["store:Navy", "door", "store:Navy"], "THREAD & CO", "MAT_REAL_GoldEmit", "Clothing"),
            ("BLD_REAL_GrowGym", -54, 4, 2, "Concrete", ["store:Teal", "store:Teal", "door", "store:Teal"], "GROW GYM", "MAT_REAL_SignWhiteEmit", "Gym")):
        og = (x, -LOT)
        b.building(name, og, math.pi, nx, 3, floors, var, ground, seed=len(name))
        b.store_sign(f"PROP_REAL_Sign_{sk}", sign, og, math.pi, nx // 2 if nx % 2 else nx / 2 - 0.5, nx, mat=signmat, size=0.45)
        door_i = ground.index("door")
        sockets.append((f"SOCKET_Door_{sk}", xf(og, math.pi, (-nx * M / 2 + M / 2 + door_i * M, -0.6, 0.15)), 0,
                        {"business": sk, "jobs": {"Diner": "Server;Cook", "Clothing": "Retail", "Gym": "FrontDesk"}[sk]}))
    # --- North: filler mid-rise along Fresh Ave to frame the view toward The Club
    filler = [((-14, 44), 0, 3, 4, 6, "Concrete"), ((14, 44), 0, 3, 4, 7, "BrickDark"), ((-14, 64), 0, 3, 3, 9, "Plaster"),
              ((16, 64), 0, 3, 3, 8, "Warm"), ((-40, 44), 0, 5, 4, 4, "Brick"), ((40, 46), 0, 5, 4, 5, "Concrete")]
    for i, (oo, r, nx, ny, fl, var) in enumerate(filler):
        if abs(oo[0]) < 20:
            # beside Fresh Ave: front faces the avenue, depth extends away from it
            rot = math.pi / 2 if oo[0] < 0 else -math.pi / 2
            loc = (-LOT if oo[0] < 0 else LOT, oo[1])
        else:
            rot, loc = 0.0, oo
        b.building(f"BLD_REAL_Filler_{i+1:02d}", loc, rot, nx, ny, fl, var,
                   ["store:Navy"] * nx if fl < 8 else ["window"] * nx, seed=40 + i)

    # --- NE: Fresh Mart
    fmc = R.coll("ENV_REAL_FreshMart", dc)
    before = set(bpy.data.objects)
    FM.build_fresh_mart(fmc)
    new = [o for o in bpy.data.objects if o not in before]
    R.group_under(new, "ENV_REAL_FreshMart_Root", (36, LOT + 17.5, 0.12), 0, fmc)
    sockets.append(("SOCKET_Door_FreshMart", (44, LOT + 17.0, 0.15), 180, {"travel": "ENV_REAL_FreshMart:Interior", "jobs": "Cashier;Stocker"}))

    # --- backdrop: skyline + The Club on the hill (north, framed by Fresh Ave)
    bd = R.coll("DST_REAL_Backdrop", dc)
    sky, club = APT.city_backdrop(bd, y0=150, seed=5)
    # The Club landmark: built at (8, y0+70, 5); scale 2.5 and shift so it sits ~300 m north on its hill,
    # rising above the skyline at the end of Fresh Ave (visible from the Starting District, directive s10).
    club.scale = (2.5, 2.5, 2.5)
    club.location = (-20, 300 - 2.5 * (150 + 70), 10)
    # wander/nav hint points along sidewalks for NPC routines
    k = 0
    for d in range(12, EXTENT, 10):
        for (x, y) in ((d, 6), (-d, 6), (d, -6), (-d, -6), (6, d), (-6, d), (6, -d), (-6, -d)):
            k += 1
            sockets.append((f"SOCKET_NPC_Wander_{k:03d}", (x, y, 0.15), 0, {"routine": "Sidewalk"}))
    sockets.append(("SOCKET_NPC_Jax_Hangout", (12, 7.0, 0.15), 200, {"npc": "CHR_REAL_Jax"}))
    mc = R.coll("DST_REAL_Sockets", dc)
    for n, loc, rz, props in sockets:
        R.marker(n, tuple(loc), (0, 0, math.radians(rz)), n.split("_")[1], mc, props)
    return dc


def street_lights_real(dc):
    """Real light sources for renders (Unreal places its own via the lamp sockets)."""
    lc = R.coll("DST_REAL_RenderLights", dc)
    for o in list(bpy.data.collections["DST_REAL_StreetFurniture"].objects):
        if "StreetLight" in o.name:
            p = o.matrix_world @ Vector((1.2, 0, 5.1))
            R.point_light(f"LGT_{o.name}", tuple(p), 600, (1.0, 0.75, 0.45), 0.3, lc)


if __name__ == "__main__":
    dc = district()
    street_lights_real(dc)
    R.setup_world("sunset", 1.0)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH" and o.visible_get() and not o.name.startswith("UCX_")]
    rep = R.validate_scene(meshes)
    rep["mesh_objects"] = len(meshes)
    rep["unique_meshes"] = len({o.data.name for o in meshes})
    rep["sockets"] = len([o for o in bpy.context.scene.objects if o.name.startswith("SOCKET_")])
    rep["socket_names_sample"] = sorted(o.name for o in bpy.context.scene.objects if o.name.startswith("SOCKET_Door"))
    R.write_report("district_validation.json", rep)
    print("DISTRICT objects", rep["mesh_objects"], "unique meshes", rep["unique_meshes"], "errors", rep["errors"][:5])
    R.save_blend("World/StartingDistrict/DST_REAL_StartingDistrict.blend")
    exp = [o for o in bpy.context.scene.objects if o.type in ("MESH", "EMPTY") and o.visible_get()]
    R.export_glb("Environments/DST_REAL_StartingDistrict.glb", [o for o in exp if not o.name.startswith("UCX_")])
    R.setup_render((1600, 900), samples=24)
    cams = [("CAM_DST_Aerial", (70, -70, 55), (2, 8, 0), 30, "district_aerial.png"),
            ("CAM_DST_FreshAve_Club", (3.5, -30, 1.7), (-4, 120, 18), 24, "district_freshave_club.png"),
            ("CAM_DST_MainSt", (-6, -5.5, 1.6), (-60, 6, 6), 24, "district_mainst.png"),
            ("CAM_DST_FreshMart", (20, 2, 2.2), (40, 30, 3), 26, "district_freshmart.png")]
    for n, loc, tgt, lens, fn in cams:
        cam = R.camera(n, loc, tgt, lens)
        R.render(cam, os.path.join(R.RENDER_DIR, fn))
