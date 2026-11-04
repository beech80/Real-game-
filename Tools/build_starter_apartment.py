"""
ENV_REAL_StarterApartment — the player's first home (8 m x 6 m studio, 3rd floor).

Zones: Entry, Living, Kitchen, Sleeping, Bathroom, Storage.
Sockets (SOCKET_Interact_*) mark where Unreal spawns interaction components.
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import real_lib as R
import build_props as P

W, D, H = 8.0, 6.0, 2.9
T = 0.15


def walls(c):
    parts = [
        R.box("t", (W, D, 0.1), (0, D / 2, -0.1), "MAT_REAL_WoodLight"),               # floor
        R.box("t", (W, D, 0.1), (0, D / 2, H), "MAT_REAL_Plaster"),                    # ceiling
        R.box("t", (T, D, H), (-W / 2 - T / 2, D / 2, 0), "MAT_REAL_PlasterWarm"),     # west
        R.box("t", (T, D, H), (W / 2 + T / 2, D / 2, 0), "MAT_REAL_Plaster"),          # east
    ]
    # south wall (entry) with door opening at x=+2.6
    dx, dw = 2.6, 1.0
    parts += [R.box("t", (dx - dw / 2 + W / 2, T, H), ((-W / 2 + dx - dw / 2) / 2, -T / 2, 0), "MAT_REAL_Plaster"),
              R.box("t", (W / 2 - dx - dw / 2, T, H), ((W / 2 + dx + dw / 2) / 2, -T / 2, 0), "MAT_REAL_Plaster"),
              R.box("t", (dw, T, H - 2.1), (dx, -T / 2, 2.1), "MAT_REAL_Plaster")]
    # north wall (city view) with two tall windows
    win = [(-1.6, 2.2), (1.9, 2.4)]
    xs = [-W / 2]
    for cx, ww in win:
        xs += [cx - ww / 2, cx + ww / 2]
    xs.append(W / 2)
    for i in range(0, len(xs), 2):
        a, b = xs[i], xs[i + 1]
        parts.append(R.box("t", (b - a, T, H), ((a + b) / 2, D + T / 2, 0), "MAT_REAL_PlasterWarm"))
    for cx, ww in win:
        parts += [R.box("t", (ww, T, 0.5), (cx, D + T / 2, 0), "MAT_REAL_PlasterWarm"),
                  R.box("t", (ww, T, 0.3), (cx, D + T / 2, H - 0.3), "MAT_REAL_PlasterWarm"),
                  R.box("t", (ww, 0.02, H - 0.8), (cx, D + 0.1, 0.5), "MAT_REAL_Glass"),
                  R.box("t", (ww, 0.25, 0.05), (cx, D - 0.05, 0.47), "MAT_REAL_Wood"),      # sill
                  R.box("t", (0.05, 0.06, H - 0.8), (cx, D + 0.08, 0.5), "MAT_REAL_MetalFrame"),
                  R.box("t", (ww, 0.06, 0.05), (cx, D + 0.08, 0.5), "MAT_REAL_MetalFrame"),
                  R.box("t", (ww, 0.06, 0.05), (cx, D + 0.08, H - 0.35), "MAT_REAL_MetalFrame")]
    # bathroom partition: x in [-4,-1.8], y in [0,2.3]
    bx, by = -1.8, 2.3
    parts += [R.box("t", (0.1, by - 0.0, H), (bx, by / 2, 0), "MAT_REAL_Plaster"),
              R.box("t", (bx + W / 2 - 0.9, 0.1, H), ((-W / 2 + bx - 0.9) / 2, by, 0), "MAT_REAL_Plaster"),
              R.box("t", (0.9, 0.1, H - 2.1), (bx - 0.45, by, 2.1), "MAT_REAL_Plaster"),
              R.box("t", (2.2, 2.3, 0.01), (-2.9, 1.15, 0.0), "MAT_REAL_TileWhite")]          # bath floor tile
    # skirting
    parts.append(R.box("t", (W, 0.02, 0.1), (0, D - 0.01, 0), "MAT_REAL_Wood"))
    ob = R.join(parts, "ENV_REAL_StarterApartment_Shell")
    R.link(ob, c)
    return ob


def place(builder, loc, rot_z=0.0, c=None, name=None):
    ob = builder()
    ob.location = loc
    ob.rotation_euler = (0, 0, math.radians(rot_z))
    if name:
        ob.name = name
    R.link(ob, c)
    return ob


def build_apartment(c=None):
    c = c or R.coll("ENV_REAL_StarterApartment")
    pc = R.coll("ENV_REAL_StarterApartment_Props", c)
    mc = R.coll("ENV_REAL_StarterApartment_Sockets", c)
    shell = walls(c)
    O = {}
    O["bed"] = place(P.bed, (3.1, 4.75, 0), 180 + 90, pc)
    O["nightstand"] = place(lambda: R.box("t", (0.45, 0.4, 0.5), (0, 0, 0), "MAT_REAL_Wood"), (3.6, 3.3, 0), 0, pc, "PROP_REAL_Nightstand")
    O["lamp_bed"] = place(P.lamp_floor, (3.65, 5.75, 0), 0, pc, "PROP_REAL_FloorLamp_Bed")
    O["kitchen"] = place(P.kitchen_counter, (-3.65, 4.2, 0), -90, pc)
    O["fridge"] = place(P.fridge, (-3.6, 5.55, 0), -90, pc)
    O["table"] = place(lambda: P.table(w=0.9, d=0.7), (-1.9, 4.3, 0), 0, pc)
    O["chair1"] = place(P.chair, (-1.9, 3.75, 0), 180, pc, "PROP_REAL_Chair_01")
    O["chair2"] = place(P.chair, (-1.9, 4.85, 0), 0, pc, "PROP_REAL_Chair_02")
    O["couch"] = place(P.couch, (0.55, 2.0, 0), 180, pc)
    O["rug"] = place(P.rug, (0.55, 3.0, 0), 0, pc)
    O["coffee"] = place(P.coffee_table, (0.55, 3.0, 0), 0, pc)
    O["desk"] = place(P.desk, (0.2, 5.6, 0), 180, pc)
    O["desk_chair"] = place(P.chair, (0.2, 5.0, 0), 180, pc, "PROP_REAL_Chair_Desk")
    O["wardrobe"] = place(P.wardrobe, (3.6, 1.0, 0), 90, pc)
    O["storage"] = place(P.shelf_unit, (-1.2, 0.25, 0), 180, pc)
    O["plant1"] = place(P.plant, (-0.8, 5.7, 0), 0, pc, "PROP_REAL_HousePlant_01")
    O["plant2"] = place(P.plant, (2.0, 0.4, 0), 0, pc, "PROP_REAL_HousePlant_02")
    O["poster"] = place(lambda: P.poster("A Better\nYou\nLives\nHere."), (-3.9, 2.9, 1.2), -90, pc)
    O["backpack"] = place(P.backpack, (1.55, 2.0, 0), 25, pc)
    O["phone"] = place(P.phone, (0.35, 2.9, 0.43), 70, pc)
    O["phone"].rotation_euler = (math.radians(90), 0, math.radians(70))
    O["toilet"] = place(P.toilet, (-3.6, 0.5, 0), -90, pc)
    O["shower"] = place(P.shower, (-3.45, 1.75, 0), 0, pc)
    O["sink"] = place(P.bath_sink, (-2.35, 0.3, 0), 180, pc)
    O["door_bath"] = place(P.door_interior, (-2.7, 2.3, 0), 0, pc, "PROP_REAL_Door_Bathroom")
    O["door_entry"] = place(P.door_interior, (2.1, 0.0, 0), 0, pc, "PROP_REAL_Door_ApartmentEntry")
    O["mat"] = place(lambda: R.box("t", (0.9, 0.6, 0.01), (0, 0, 0), "MAT_REAL_Navy"), (2.6, 0.5, 0), 0, pc, "PROP_REAL_DoorMat")
    # ceiling light fixtures
    for i, (x, y) in enumerate([(0.5, 3.2), (-2.0, 4.3), (2.8, 4.6)]):
        place(lambda: R.cylinder("t", 0.25, 0.05, (0, 0, 0), "MAT_REAL_LampEmit", 16), (x, y, H - 0.05), 0, pc, f"PROP_REAL_CeilingLight_{i+1:02d}")

    # ---- gameplay sockets --------------------------------------------------
    S = [("SOCKET_Spawn_PlayerHome", (2.6, 0.9, 0), 0, "Spawn", {}),
         ("SOCKET_Interact_Sleep", (2.2, 4.75, 0), -90, "Interact", {"action": "Sleep", "anim": "ANIM_REAL_Sit_Bed"}),
         ("SOCKET_Interact_Eat", (-1.9, 3.75, 0), 0, "Interact", {"action": "Eat", "anim": "ANIM_REAL_Sit_Chair"}),
         ("SOCKET_Interact_Cook", (-3.0, 3.8, 0), -90, "Interact", {"action": "Cook", "edu": "Math:Measurement"}),
         ("SOCKET_Interact_Fridge", (-3.0, 5.55, 0), -90, "Interact", {"action": "OpenInventory_Food"}),
         ("SOCKET_Interact_Bills", (0.2, 5.0, 0), 0, "Interact", {"action": "PayBills", "edu": "Finance:Budget;Reading"}),
         ("SOCKET_Interact_Wardrobe", (3.0, 1.0, 0), -90, "Interact", {"action": "ChangeOutfit"}),
         ("SOCKET_Interact_Storage", (-1.2, 0.8, 0), 180, "Interact", {"action": "Storage"}),
         ("SOCKET_Interact_Phone", (0.55, 2.1, 0), 180, "Interact", {"action": "UsePhone", "anim": "ANIM_REAL_Sit_Phone"}),
         ("SOCKET_Interact_Shower", (-3.45, 1.0, 0), 0, "Interact", {"action": "Hygiene"}),
         ("SOCKET_Interact_ExitDoor", (2.6, 0.3, 0), 180, "Interact", {"action": "TravelTo:StartingDistrict"})]
    for n, loc, rz, kind, props in S:
        R.marker(n, loc, (0, 0, math.radians(rz)), kind, mc, props)
    return c, shell, O


def city_backdrop(c, y0=60, seed=11):
    """Low-cost skyline cards behind the window + The Club on its hill (silhouette-level)."""
    import random
    random.seed(seed)
    parts = []
    for i in range(40):
        x = -70 + i * 3.6 + random.uniform(-1, 1)
        h = random.uniform(10, 55)
        w = random.uniform(2.5, 5)
        y = y0 + random.uniform(0, 30)
        parts.append(R.box("t", (w, w, h), (x, y, -20), "MAT_REAL_NavyLight"))
        for k in range(int(h / 4)):
            if random.random() < 0.45:
                parts.append(R.box("t", (w * 0.6, 0.05, 0.6), (x, y - w / 2 - 0.03, -20 + 2 + k * 4), "MAT_REAL_GlassLit"))
    ob = R.join(parts, "ENV_REAL_SkylineBackdrop")
    R.link(ob, c)
    club = club_silhouette(c, (8, y0 + 70, 5))
    return ob, club


def club_silhouette(c, loc):
    """The Club — far-LOD silhouette used as a skyline landmark from lower districts."""
    x, y, z = loc
    parts = [R.sphere("t", 30, (x, y, z - 28), "MAT_REAL_Leaf", 24, 12, scale=(1.4, 1, 0.7)),    # hill
             R.box("t", (26, 12, 9), (x, y, z), "MAT_REAL_Plaster"),
             R.box("t", (10, 10, 22), (x, y - 1, z), "MAT_REAL_Plaster"),
             R.cylinder("t", 4.2, 6, (x, y - 1, z + 22), "MAT_REAL_Plaster", 16),
             R.cylinder("t", 4.6, 4, (x, y - 1, z + 28), "MAT_REAL_Gold", 16, radius2=0.5),
             R.box("t", (6, 0.3, 6), (x, y - 6.2, z + 12), "MAT_REAL_Navy"),
             R.box("t", (3, 0.3, 1.2), (x, y - 6.4, z + 14), "MAT_REAL_GoldEmit")]
    for dx in (-11, 11):
        parts.append(R.box("t", (4, 8, 14), (x + dx, y, z), "MAT_REAL_Plaster"))
        parts.append(R.cylinder("t", 2.2, 3, (x + dx, y, z + 14), "MAT_REAL_Gold", 12, radius2=0.3))
    for i in range(9):
        parts.append(R.box("t", (1.2, 0.2, 3.2), (x - 12 + i * 3, y - 6.1, z + 2.5), "MAT_REAL_GlassLit"))
    ob = R.join(parts, "ENV_REAL_ClubExterior_FarLOD")
    R.link(ob, c)
    return ob


def light_interior(c):
    lc = R.coll("ENV_REAL_StarterApartment_Lights", c)
    R.point_light("LGT_Apt_Main", (0.5, 3.2, H - 0.3), 120, collection=lc, radius=0.4)
    R.point_light("LGT_Apt_Kitchen", (-2.0, 4.3, H - 0.3), 90, collection=lc, radius=0.4)
    R.point_light("LGT_Apt_BedLamp", (3.65, 5.75, 1.6), 60, color=(1, 0.7, 0.45), collection=lc)
    R.point_light("LGT_Apt_Desk", (0.2, 5.4, 1.3), 25, color=(0.6, 0.9, 1.0), collection=lc)
    R.point_light("LGT_Apt_Bath", (-2.9, 1.1, H - 0.3), 50, color=(0.95, 0.95, 1.0), collection=lc)
    R.area_light("LGT_Apt_WindowFill", (0, D - 0.2, 1.6), (6, 2), 220, (1.0, 0.65, 0.45), rot=(math.radians(-90), 0, 0), collection=lc)


if __name__ == "__main__":
    R.reset_scene()
    c, shell, O = build_apartment()
    bd = R.coll("ENV_REAL_Backdrop")
    city_backdrop(bd)
    light_interior(c)
    R.setup_world("sunset", 1.0)
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH" and not o.name.startswith("ENV_REAL_Skyline") and "FarLOD" not in o.name]
    rep = R.validate_scene(objs)
    rep["triangles"] = R.tri_count(objs)
    rep["sockets"] = sorted(o.name for o in bpy.context.scene.objects if o.name.startswith("SOCKET_"))
    R.write_report("apartment_validation.json", rep)
    print("errors", rep["errors"], "tris", rep["triangles"])
    R.save_blend("Interiors/ENV_REAL_StarterApartment.blend")
    exp = [o for o in bpy.context.scene.objects if o.users_collection[0].name.startswith("ENV_REAL_StarterApartment")
           and o.type in ("MESH", "EMPTY")]
    R.export_glb("Environments/ENV_REAL_StarterApartment.glb", exp)
    R.export_fbx("Environments/ENV_REAL_StarterApartment.fbx", exp)
    R.setup_render((1600, 900), samples=32)
    cam = R.camera("CAM_Apt_Hero", (-1.4, 1.9, 1.6), (2.2, 5.4, 0.85), lens=20)
    R.render(cam, os.path.join(R.RENDER_DIR, "apartment_hero.png"))
    cam2 = R.camera("CAM_Apt_Kitchen", (2.8, 2.3, 1.6), (-3.2, 4.6, 0.9), lens=22)
    R.render(cam2, os.path.join(R.RENDER_DIR, "apartment_kitchen.png"), samples=32)
