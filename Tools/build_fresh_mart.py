"""
ENV_REAL_FreshMart — the player's first workplace.

Footprint 28 m x 22 m, single tall storey (5.5 m), storefront faces -Y.
Sales floor y in [0,18]; back-of-house (stockroom, employee area, manager office) y in [18,22].
Work activities (Unreal side) are bound to SOCKET_Interact_* markers:
  Register (scan + make change: Math), StockShelf (stocking: Reading labels / Counting),
  InventoryCount (Math), TimeClock (Time / Reading), Training board (Reading), ManagerStation (dialogue).
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import real_lib as R
import build_props as P

W, D, HT = 28.0, 22.0, 5.5
BOH = 18.0      # back-of-house partition line
T = 0.3


def shell(c):
    p = [R.box("t", (W, D, 0.1), (0, D / 2, -0.1), "MAT_REAL_TileWhite"),
         R.box("t", (W, D, 0.3), (0, D / 2, HT), "MAT_REAL_ConcreteDark"),          # roof slab
         R.box("t", (W - 0.6, D - 0.6, 0.02), (0, D / 2, HT - 0.02), "MAT_REAL_White"),   # ceiling
         R.box("t", (T, D, HT), (-W / 2 + T / 2, D / 2, 0), "MAT_REAL_Brick"),
         R.box("t", (T, D, HT), (W / 2 - T / 2, D / 2, 0), "MAT_REAL_Brick"),
         R.box("t", (W, T, HT), (0, D - T / 2, 0), "MAT_REAL_Brick")]
    # parapet
    for (sx, sy, x, y) in ((W, 0.3, 0, D - 0.15), (0.3, D, -W / 2 + 0.15, D / 2), (0.3, D, W / 2 - 0.15, D / 2)):
        p.append(R.box("t", (sx, sy, 0.9), (x, y, HT + 0.3), "MAT_REAL_BrickDark"))
    # storefront: piers every 4 m, glass between, entrance bay at x in [6,10]
    for i in range(8):
        x = -W / 2 + i * 4.0
        p.append(R.box("t", (0.6, 0.56, 3.85), (x + 0.3 if i == 0 else x, 0.22, 0), "MAT_REAL_BrickDark"))
    p.append(R.box("t", (0.6, 0.56, 3.85), (W / 2 - 0.3, 0.22, 0), "MAT_REAL_BrickDark"))
    for i in range(7):
        x0 = -W / 2 + i * 4.0 + 0.3
        x1 = x0 + 3.7
        cx = (x0 + x1) / 2 - 0.0
        if 6.0 <= cx <= 10.0:   # entrance bay: sliding doors
            p += [R.box("t", (1.7, 0.06, 2.6), (cx - 0.88, 0.25, 0), "MAT_REAL_Glass"),
                  R.box("t", (1.7, 0.06, 2.6), (cx + 0.88, 0.25, 0), "MAT_REAL_Glass"),
                  R.box("t", (3.6, 0.3, 0.25), (cx, 0.25, 2.6), "MAT_REAL_MetalFrame"),
                  R.box("t", (3.4, 0.02, 0.9), (cx, 0.25, 2.85), "MAT_REAL_Glass")]
        else:
            p += [R.box("t", (3.4, 0.3, 0.5), (cx, 0.3, 0), "MAT_REAL_BrickDark"),
                  R.box("t", (3.4, 0.03, 3.25), (cx, 0.3, 0.5), "MAT_REAL_Glass"),
                  R.box("t", (3.4, 0.12, 0.06), (cx, 0.3, 2.3), "MAT_REAL_MetalFrame")]
        p.append(R.box("t", (3.4, 0.12, 0.08), (cx, 0.3, 3.75), "MAT_REAL_MetalFrame"))
    # sign band
    p += [R.box("t", (W + 0.1, 0.5, 2.85), (0, 0.2, 3.85), "MAT_REAL_FreshMartGreen"),
          R.box("t", (W + 0.2, 0.7, 0.15), (0, 0.25, HT + 1.2), "MAT_REAL_Gold"),
          R.box("t", (W, 0.1, 0.06), (0, -0.02, 3.85), "MAT_REAL_Gold")]
    # back-of-house partition with two doors (stockroom x=4, office x=10)
    xs = [-W / 2 + T, 3.4, 4.6, 9.4, 10.6, W / 2 - T]
    for i in range(0, len(xs), 2):
        a, b = xs[i], xs[i + 1]
        p.append(R.box("t", (b - a, 0.2, HT), ((a + b) / 2, BOH, 0), "MAT_REAL_Plaster"))
    for dx in (4.0, 10.0):
        p.append(R.box("t", (1.2, 0.2, HT - 2.3), (dx, BOH, 2.3), "MAT_REAL_Plaster"))
    p.append(R.box("t", (0.2, D - BOH, HT), (7.0, (BOH + D) / 2, 0), "MAT_REAL_Plaster"))   # office wall
    # interior wall lining (plaster) over the exterior brick
    p += [R.box("t", (0.04, D - 0.6, HT), (-W / 2 + T + 0.02, D / 2, 0), "MAT_REAL_Plaster"),
          R.box("t", (0.04, D - 0.6, HT), (W / 2 - T - 0.02, D / 2, 0), "MAT_REAL_Plaster"),
          R.box("t", (0.05, BOH - 0.6, 0.3), (-W / 2 + T + 0.05, BOH / 2 + 0.3, 2.6), "MAT_REAL_FreshMartGreen"),
          R.box("t", (0.05, BOH - 0.6, 0.3), (W / 2 - T - 0.05, BOH / 2 + 0.3, 2.6), "MAT_REAL_FreshMartGreen")]
    # interior wainscot / brand stripe
    p.append(R.box("t", (W - 0.7, 0.02, 0.3), (0, BOH - 0.11, 2.6), "MAT_REAL_FreshMartGreen"))
    ob = R.join(p, "ENV_REAL_FreshMart_Shell")
    R.link(ob, c)
    return ob


def signage(c):
    p = [R.text_mesh("t", "FRESH MART", 1.25, (1.0, -0.11, 5.85), mat="MAT_REAL_SignWhiteEmit", extrude=0.08),
         R.text_mesh("t", "Good Food  •  Stronger People  •  Brighter Futures", 0.32, (1.0, -0.11, 4.45),
                     mat="MAT_REAL_Cream", extrude=0.02)]
    # leaf logo: two flattened ellipsoids
    for (dx, rz, mat) in ((-0.35, 35, "MAT_REAL_FreshMartLeaf"), (0.35, -35, "MAT_REAL_FreshMartLeaf")):
        s = R.sphere("t", 0.6, (-4.2 + dx, -0.15, 5.85), mat, 16, 8, scale=(0.45, 0.12, 1.0))
        s.rotation_euler = (0, math.radians(rz), 0)
        p.append(s)
    ob = R.join(p, "ENV_REAL_FreshMart_SignExterior")
    R.link(ob, c)
    return ob


def place(builder, loc, rot_z=0.0, c=None, name=None, ucx=True):
    ob = builder()
    ob.location = loc
    ob.rotation_euler = (0, 0, math.radians(rot_z))
    if name:
        ob.name = name
        ob.data.name = name
    R.link(ob, c)
    if ucx:
        R.make_ucx(ob, c)
    return ob


def build_fresh_mart(c=None):
    c = c or R.coll("ENV_REAL_FreshMart")
    pc = R.coll("ENV_REAL_FreshMart_Props", c)
    mc = R.coll("ENV_REAL_FreshMart_Sockets", c)
    sh = shell(c)
    sg = signage(c)
    out = [sh, sg]
    sockets = []

    # Checkout lanes (cashier stands on +X side after -90 rot)
    for i, x in enumerate((-10.5, -6.5, -2.5)):
        o = place(P.checkout, (x, 5.0, 0), -90, pc, f"PROP_REAL_Checkout_{i+1:02d}")
        sockets.append((f"SOCKET_Interact_Register_{i+1:02d}", (x + 0.75, 4.0, 0), 90,
                        {"action": "Work:Cashier", "edu": "Math:MakingChange;Math:Addition"}))
        sockets.append((f"SOCKET_NPC_CustomerQueue_{i+1:02d}", (x - 0.8, 3.0, 0), -90, {"queue": i + 1}))
    # Aisles — five gondolas along Y
    aisles = ["1  BREAD & CEREAL", "2  CANNED GOODS", "3  PASTA & RICE", "4  SNACKS", "5  HOUSEHOLD"]
    for i, x in enumerate((-11.0, -7.5, -4.0, -0.5, 3.0)):
        place(lambda s=i: P.grocery_shelf(length=8.0, seed=s, name=f"PROP_REAL_GroceryShelf_Aisle{s+1}"),
              (x, 12.0, 0), 90, pc, f"PROP_REAL_GroceryShelf_Aisle{i+1}")
        place(lambda t=aisles[i]: P.hanging_sign(t, w=2.6, name="PROP_REAL_AisleSign"), (x + 1.75, 8.2, 3.6), 0, pc,
              f"PROP_REAL_AisleSign_{i+1:02d}", ucx=False)
        sockets.append((f"SOCKET_Interact_StockShelf_A{i+1}", (x + 1.0, 10.0, 0), 90,
                        {"action": "Work:Stocking", "edu": "Reading:Labels;Math:Counting", "aisle": i + 1}))
        sockets.append((f"SOCKET_NPC_CustomerBrowse_A{i+1}", (x + 1.7, 14.0, 0), 0, {}))
    # Produce
    place(lambda: P.produce_stand(seed=3), (8.5, 8.0, 0), 0, pc, "PROP_REAL_ProduceStand_01")
    place(lambda: P.produce_stand(seed=5), (8.5, 11.5, 0), 0, pc, "PROP_REAL_ProduceStand_02")
    place(lambda: P.hanging_sign("PRODUCE", w=2.4), (8.5, 9.8, 3.6), 0, pc, "PROP_REAL_Sign_Produce", ucx=False)
    sockets.append(("SOCKET_Interact_ProduceRestock", (8.5, 6.9, 0), 0, {"action": "Work:Produce", "edu": "Math:Weight"}))
    place(P.price_tag_board, (10.5, 8.0, 0.9), 0, pc, "PROP_REAL_PriceBoard_Produce", ucx=False)
    # Fridges: back wall + right wall
    for i, x in enumerate((-10.0, -6.0, -2.0)):
        place(lambda s=i: P.fridge_case(length=4.0, seed=10 + s), (x, BOH - 0.55, 0), 0, pc, f"PROP_REAL_FridgeCase_{i+1:02d}")
    place(lambda: P.hanging_sign("DAIRY", w=2.0), (-6.0, BOH - 1.6, 3.6), 0, pc, "PROP_REAL_Sign_Dairy", ucx=False)
    for i, y in enumerate((9.0, 13.0)):
        place(lambda s=i: P.fridge_case(length=4.0, seed=20 + s), (W / 2 - 0.75, y, 0), -90, pc, f"PROP_REAL_FridgeCase_Drinks_{i+1:02d}")
    sockets.append(("SOCKET_Interact_FridgeRestock", (-6.0, BOH - 2.0, 0), 0, {"action": "Work:Restock", "edu": "Reading:Dates"}))
    # Wall banners (key art)
    for (txt, loc, rz, nm) in (("FRESH FOOD\nBRIGHTER DAYS", (-W / 2 + 0.35, 6.5, 3.2), 90, "PROP_REAL_Banner_FreshFood"),
                               ("HEALTHY PEOPLE\nHAPPIER\nTOMORROWS", (W / 2 - 0.35, 5.0, 3.0), -90, "PROP_REAL_Banner_Healthy")):
        def mk(t=txt):
            return R.join([R.box("t", (3.0, 0.05, 1.5), (0, 0, 0), "MAT_REAL_FreshMartGreen"),
                           R.text_mesh("t", t, 0.28, (0, -0.04, 0.75), mat="MAT_REAL_SignWhiteEmit")], "tmp")
        place(mk, loc, rz, pc, nm, ucx=False)
    # Entry: baskets + carts
    place(P.basket_stack, (11.5, 2.0, 0), 0, pc, "PROP_REAL_BasketStack_01")
    sockets.append(("SOCKET_Interact_BasketPickup", (11.5, 2.8, 0), 180, {"action": "Shop:TakeBasket"}))
    for i in range(3):
        place(P.cart, (13.0 - 0.0, 1.6 + i * 0.35, 0), 90, pc, f"PROP_REAL_ShoppingCart_In{i+1:02d}")
    # Back of house: stockroom (x<7)
    for i, (x, y) in enumerate(((-11.0, 20.0), (-8.0, 20.2), (-5.0, 19.8), (0.0, 20.2))):
        place(lambda s=i: P.stock_pallet(seed=30 + s), (x, y, 0), 0, pc, f"PROP_REAL_StockPallet_{i+1:02d}")
    sockets.append(("SOCKET_Interact_InventoryCount", (-8.0, 19.1, 0), 0, {"action": "Work:Inventory", "edu": "Math:Multiplication;Math:Counting"}))
    place(P.lockers, (2.8, D - 0.6, 0), 180, pc, "PROP_REAL_Lockers_Staff")
    place(P.time_clock, (5.6, BOH + 0.15, 0), 180, pc, "PROP_REAL_TimeClock", ucx=False)
    sockets.append(("SOCKET_Interact_TimeClock", (5.6, BOH + 0.8, 0), 180, {"action": "Work:ClockInOut", "edu": "Math:Time"}))
    sockets.append(("SOCKET_Interact_TrainingBoard", (6.15, BOH + 0.8, 0), 180, {"action": "Learn:Training", "edu": "Reading:Instructions"}))
    place(lambda: P.table(w=1.2, d=0.8, name="PROP_REAL_Table_Break"), (4.5, 20.4, 0), 0, pc, "PROP_REAL_Table_Break")
    place(P.chair, (4.0, 21.0, 0), 0, pc, "PROP_REAL_Chair_Break_01")
    place(P.chair, (5.0, 19.8, 0), 180, pc, "PROP_REAL_Chair_Break_02")
    # Manager office (x>7)
    place(P.manager_desk, (10.5, 20.8, 0), 180, pc, "PROP_REAL_ManagerStation")
    place(P.chair, (10.5, 21.4, 0), 0, pc, "PROP_REAL_Chair_Manager")
    place(P.shelf_unit, (13.2, 19.5, 0), 90, pc, "PROP_REAL_OfficeShelf")
    place(lambda: P.poster("SMALL STEPS\nLEAD TO\nBIG THINGS"), (7.15, 20.5, 1.2), 90, pc, "PROP_REAL_Poster_SmallSteps", ucx=False)
    sockets.append(("SOCKET_Interact_ManagerStation", (10.5, 19.9, 0), 0, {"action": "Talk:Manager", "edu": "Reading:Schedule"}))
    sockets.append(("SOCKET_NPC_Manager_Idle", (-4.5, 6.8, 0), 180, {"npc": "NPC_REAL_FreshMartManager"}))
    sockets.append(("SOCKET_NPC_Jax_Appear", (9.5, 1.2, 0), 160, {"npc": "CHR_REAL_Jax", "event": "JaxEncounter_FirstPaycheck"}))
    sockets.append(("SOCKET_Spawn_StoreEntry", (8.0, 1.5, 0), 0, {}))
    sockets.append(("SOCKET_Door_Entry", (8.0, 0.25, 0), 0, {"type": "AutoSliding"}))
    sockets.append(("SOCKET_Door_Stockroom", (4.0, BOH, 0), 0, {"type": "Swing", "access": "Employee"}))
    sockets.append(("SOCKET_Door_Office", (10.0, BOH, 0), 0, {"type": "Swing", "access": "Employee"}))
    # Ceiling light panels (emissive) — real lights are placed in-engine
    lp = []
    for ix in range(6):
        for iy in range(4):
            lp.append(R.box("t", (2.4, 0.5, 0.05), (-10 + ix * 4, 3 + iy * 4, HT - 0.1), "MAT_REAL_LampEmit"))
    lpo = R.join(lp, "PROP_REAL_FreshMart_CeilingPanels")
    R.link(lpo, pc)
    for n, loc, rz, props in sockets:
        R.marker(n, loc, (0, 0, math.radians(rz)), n.split("_")[1], mc, props)
    return c


def store_lights(c):
    lc = R.coll("ENV_REAL_FreshMart_Lights", c)
    for ix in range(3):
        for iy in range(3):
            R.area_light(f"LGT_FM_{ix}{iy}", (-9 + ix * 9, 3.5 + iy * 5.5, HT - 0.3), (5, 4), 520,
                         (1.0, 0.95, 0.88), collection=lc)


if __name__ == "__main__":
    R.reset_scene()
    c = build_fresh_mart()
    store_lights(c)
    R.coll("ENV_REAL_FreshMart_Context")
    R.box("ENV_REAL_FreshMart_ContextGround", (80, 60, 0.1), (0, -10, -0.2), "MAT_REAL_Asphalt",
          collection=bpy.data.collections["ENV_REAL_FreshMart_Context"])
    R.setup_world("sunset")
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH" and not o.name.startswith("UCX_")]
    rep = R.validate_scene(objs)
    rep["triangles"] = R.tri_count(objs)
    rep["sockets"] = sorted(o.name for o in bpy.context.scene.objects if o.name.startswith("SOCKET_"))
    rep["ucx_count"] = len([o for o in bpy.context.scene.objects if o.name.startswith("UCX_")])
    R.write_report("freshmart_validation.json", rep)
    print("errors", rep["errors"], "tris", rep["triangles"], "sockets", len(rep["sockets"]))
    R.save_blend("World/StartingDistrict/ENV_REAL_FreshMart.blend")
    exp = [o for o in bpy.context.scene.objects if o.type in ("MESH", "EMPTY") and "Context" not in o.name]
    R.export_glb("Environments/ENV_REAL_FreshMart.glb", [o for o in exp if not o.name.startswith("UCX_")])
    R.export_fbx("Environments/ENV_REAL_FreshMart.fbx", exp)
    R.setup_render((1600, 900), samples=32)
    cam = R.camera("CAM_FM_Exterior", (-6, -22, 4.0), (2, 0, 4.0), lens=26)
    R.render(cam, os.path.join(R.RENDER_DIR, "freshmart_exterior.png"))
    cam2 = R.camera("CAM_FM_Interior", (-12.5, 1.2, 2.2), (2, 14, 1.0), lens=18)
    R.render(cam2, os.path.join(R.RENDER_DIR, "freshmart_interior.png"))
