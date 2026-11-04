"""
PROP_REAL — furniture, appliances, store fixtures and gameplay props.

Each builder returns ONE joined object, pivot at bottom-centre, front facing -Y.
Interaction sockets are created by the environment scripts (they know context).
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import real_lib as R

J = R.join


def _p(parts, name, coll=None):
    ob = J(parts, name)
    if coll:
        R.link(ob, coll)
    return ob


# --------------------------------------------------------------------------- home
def bed(coll=None):
    p = [R.box("t", (1.5, 2.1, 0.3), (0, 0, 0.1), "MAT_REAL_Wood"),
         R.box("t", (1.45, 2.0, 0.22), (0, 0.02, 0.4), "MAT_REAL_White"),
         R.box("t", (1.5, 1.35, 0.08), (0, -0.35, 0.6), "MAT_REAL_FabricBlue", bevel=0.03),   # duvet
         R.box("t", (0.6, 0.38, 0.14), (-0.36, 0.78, 0.62), "MAT_REAL_Cream", bevel=0.05),
         R.box("t", (0.6, 0.38, 0.14), (0.36, 0.78, 0.62), "MAT_REAL_Cream", bevel=0.05),
         R.box("t", (1.6, 0.1, 1.1), (0, 1.07, 0), "MAT_REAL_Wood"),
         R.box("t", (0.3, 0.3, 0.06), (-0.3, -0.5, 0.68), "MAT_REAL_Gold")]   # crown cushion accent
    for x in (-0.7, 0.7):
        for y in (-1.0, 1.0):
            p.append(R.box("t", (0.06, 0.06, 0.1), (x, y, 0), "MAT_REAL_Wood"))
    return _p(p, "PROP_REAL_Bed_Starter", coll)


def couch(coll=None):
    p = [R.box("t", (1.9, 0.85, 0.42), (0, 0, 0.0), "MAT_REAL_FabricGrey", bevel=0.04),
         R.box("t", (1.9, 0.22, 0.45), (0, 0.32, 0.42), "MAT_REAL_FabricGrey", bevel=0.05),
         R.box("t", (0.2, 0.85, 0.25), (-0.85, 0, 0.42), "MAT_REAL_FabricGrey", bevel=0.05),
         R.box("t", (0.2, 0.85, 0.25), (0.85, 0, 0.42), "MAT_REAL_FabricGrey", bevel=0.05),
         R.box("t", (0.5, 0.15, 0.4), (-0.45, 0.18, 0.45), "MAT_REAL_Gold", bevel=0.05, rot=(math.radians(-15), 0, 0))]
    return _p(p, "PROP_REAL_Couch_Starter", coll)


def table(coll=None, w=1.0, d=0.7, name="PROP_REAL_Table_Dining"):
    h = R.SCALE["table_h"]
    p = [R.box("t", (w, d, 0.04), (0, 0, h - 0.04), "MAT_REAL_WoodLight")]
    for x in (-w / 2 + 0.05, w / 2 - 0.05):
        for y in (-d / 2 + 0.05, d / 2 - 0.05):
            p.append(R.box("t", (0.04, 0.04, h - 0.04), (x, y, 0), "MAT_REAL_MetalFrame"))
    return _p(p, name, coll)


def chair(coll=None):
    s = R.SCALE["seat_h"]
    p = [R.box("t", (0.42, 0.42, 0.04), (0, 0, s), "MAT_REAL_WoodLight"),
         R.box("t", (0.42, 0.04, 0.42), (0, 0.19, s), "MAT_REAL_WoodLight")]
    for x in (-0.18, 0.18):
        for y in (-0.18, 0.18):
            p.append(R.box("t", (0.03, 0.03, s), (x, y, 0), "MAT_REAL_MetalFrame"))
    return _p(p, "PROP_REAL_Chair", coll)


def coffee_table(coll=None):
    p = [R.box("t", (0.9, 0.5, 0.05), (0, 0, 0.38), "MAT_REAL_Wood"),
         R.box("t", (0.8, 0.4, 0.02), (0, 0, 0.12), "MAT_REAL_Wood")]
    for x in (-0.4, 0.4):
        p.append(R.box("t", (0.04, 0.45, 0.38), (x, 0, 0), "MAT_REAL_MetalFrame"))
    return _p(p, "PROP_REAL_CoffeeTable", coll)


def fridge(coll=None):
    p = [R.box("t", (0.7, 0.7, 1.8), (0, 0, 0), "MAT_REAL_White", bevel=0.02),
         R.box("t", (0.68, 0.02, 0.01), (0, -0.36, 1.2), "MAT_REAL_MetalFrame"),
         R.box("t", (0.03, 0.04, 0.4), (0.28, -0.38, 1.3), "MAT_REAL_Metal"),
         R.box("t", (0.03, 0.04, 0.5), (0.28, -0.38, 0.6), "MAT_REAL_Metal"),
         R.box("t", (0.12, 0.01, 0.12), (-0.15, -0.36, 1.45), "MAT_REAL_Gold")]   # magnet: rent reminder
    return _p(p, "PROP_REAL_Fridge", coll)


def kitchen_counter(coll=None, length=2.4, sink=True, stove=True):
    h = R.SCALE["counter_h"]
    p = [R.box("t", (length, 0.6, h - 0.04), (0, 0, 0), "MAT_REAL_White"),
         R.box("t", (length + 0.02, 0.64, 0.04), (0, -0.02, h - 0.04), "MAT_REAL_ConcreteDark"),
         # upper cabinets
         R.box("t", (length, 0.35, 0.7), (0, 0.12, 1.5), "MAT_REAL_White"),
         R.box("t", (length, 0.02, 0.6), (0, 0.32, h), "MAT_REAL_TileWhite")]
    n = int(length / 0.6)
    for i in range(n):
        x = -length / 2 + 0.3 + i * 0.6
        p.append(R.box("t", (0.56, 0.01, 0.7), (x, -0.305, 0.08), "MAT_REAL_WoodLight"))
        p.append(R.box("t", (0.12, 0.02, 0.02), (x, -0.32, 0.65), "MAT_REAL_Metal"))
        p.append(R.box("t", (0.56, 0.01, 0.6), (x, -0.06, 1.55), "MAT_REAL_WoodLight"))
    if sink:
        p.append(R.box("t", (0.5, 0.4, 0.02), (-length / 2 + 0.6, 0, h + 0.001), "MAT_REAL_Metal"))
        p.append(R.cylinder("t", 0.015, 0.3, (-length / 2 + 0.6, 0.22, h), "MAT_REAL_Metal", 8))
        p.append(R.box("t", (0.03, 0.18, 0.03), (-length / 2 + 0.6, 0.13, h + 0.28), "MAT_REAL_Metal"))
    if stove:
        p.append(R.box("t", (0.6, 0.55, 0.02), (length / 2 - 0.5, 0, h), "MAT_REAL_MetalFrame"))
        for dx in (-0.14, 0.14):
            for dy in (-0.12, 0.12):
                p.append(R.cylinder("t", 0.09, 0.012, (length / 2 - 0.5 + dx, dy, h + 0.02), "MAT_REAL_Rubber", 12))
        # pan
        p.append(R.cylinder("t", 0.12, 0.05, (length / 2 - 0.36, -0.12, h + 0.03), "MAT_REAL_MetalFrame", 14))
    # microwave
    p.append(R.box("t", (0.5, 0.35, 0.3), (0.1, 0.05, h), "MAT_REAL_MetalFrame"))
    p.append(R.box("t", (0.3, 0.01, 0.2), (0.02, -0.13, h + 0.05), "MAT_REAL_ScreenEmit"))
    return _p(p, "PROP_REAL_KitchenCounter", coll)


def wardrobe(coll=None):
    p = [R.box("t", (1.2, 0.6, 2.0), (0, 0, 0), "MAT_REAL_WoodLight"),
         R.box("t", (0.01, 0.01, 1.9), (0, -0.305, 0.05), "MAT_REAL_Wood"),
         R.box("t", (0.02, 0.03, 0.3), (-0.06, -0.32, 1.0), "MAT_REAL_Metal"),
         R.box("t", (0.02, 0.03, 0.3), (0.06, -0.32, 1.0), "MAT_REAL_Metal")]
    return _p(p, "PROP_REAL_Wardrobe", coll)


def desk(coll=None):
    h = R.SCALE["table_h"]
    p = [R.box("t", (1.2, 0.6, 0.04), (0, 0, h - 0.04), "MAT_REAL_Wood"),
         R.box("t", (0.4, 0.55, h - 0.04), (0.38, 0, 0), "MAT_REAL_Wood"),
         R.box("t", (0.04, 0.55, h - 0.04), (-0.58, 0, 0), "MAT_REAL_Wood"),
         # laptop
         R.box("t", (0.34, 0.24, 0.015), (-0.15, -0.05, h), "MAT_REAL_MetalFrame"),
         R.box("t", (0.34, 0.015, 0.22), (-0.15, 0.07, h), "MAT_REAL_MetalFrame", rot=(math.radians(-12), 0, 0)),
         R.box("t", (0.3, 0.005, 0.18), (-0.15, 0.06, h + 0.02), "MAT_REAL_ScreenEmit", rot=(math.radians(-12), 0, 0)),
         # mug + bills stack
         R.cylinder("t", 0.04, 0.1, (0.25, -0.1, h), "MAT_REAL_White", 12),
         R.box("t", (0.21, 0.29, 0.02), (0.3, 0.12, h), "MAT_REAL_Cream"),
         R.box("t", (0.21, 0.29, 0.005), (0.32, 0.1, h + 0.02), "MAT_REAL_White", rot=(0, 0, 0.2))]
    return _p(p, "PROP_REAL_Desk_Study", coll)


def lamp_floor(coll=None):
    p = [R.cylinder("t", 0.15, 0.03, (0, 0, 0), "MAT_REAL_MetalFrame", 12),
         R.cylinder("t", 0.015, 1.5, (0, 0, 0), "MAT_REAL_MetalFrame", 8),
         R.cylinder("t", 0.2, 0.3, (0, 0, 1.4), "MAT_REAL_LampEmit", 14, radius2=0.14)]
    return _p(p, "PROP_REAL_FloorLamp", coll)


def plant(coll=None, name="PROP_REAL_HousePlant"):
    p = [R.cylinder("t", 0.16, 0.3, (0, 0, 0), "MAT_REAL_Cream", 12, radius2=0.2)]
    for (x, y, z, s) in [(0, 0, 0.5, 0.22), (0.1, 0.05, 0.65, 0.17), (-0.1, -0.04, 0.62, 0.16), (0, 0.1, 0.75, 0.14)]:
        p.append(R.sphere("t", s, (x, y, z), "MAT_REAL_Leaf", 10, 6))
    return _p(p, name, coll)


def rug(coll=None):
    p = [R.box("t", (2.0, 1.4, 0.01), (0, 0, 0), "MAT_REAL_NavyLight"),
         R.box("t", (1.7, 1.1, 0.012), (0, 0, 0), "MAT_REAL_Cream")]
    return _p(p, "PROP_REAL_Rug", coll)


def toilet(coll=None):
    p = [R.box("t", (0.38, 0.5, 0.4), (0, 0, 0), "MAT_REAL_White", bevel=0.05),
         R.box("t", (0.4, 0.18, 0.4), (0, 0.24, 0.4), "MAT_REAL_White", bevel=0.03)]
    return _p(p, "PROP_REAL_Toilet", coll)


def shower(coll=None):
    p = [R.box("t", (0.9, 0.9, 0.06), (0, 0, 0), "MAT_REAL_TileWhite"),
         R.box("t", (0.9, 0.02, 2.0), (0, -0.44, 0.06), "MAT_REAL_Glass"),
         R.cylinder("t", 0.1, 0.02, (0, 0.35, 1.95), "MAT_REAL_Metal", 12)]
    return _p(p, "PROP_REAL_Shower", coll)


def bath_sink(coll=None):
    p = [R.box("t", (0.6, 0.45, 0.8), (0, 0, 0), "MAT_REAL_WoodLight"),
         R.box("t", (0.45, 0.35, 0.05), (0, 0, 0.8), "MAT_REAL_White"),
         R.box("t", (0.5, 0.02, 0.7), (0, 0.22, 1.1), "MAT_REAL_Glass")]   # mirror
    return _p(p, "PROP_REAL_BathroomSink", coll)


def poster(text, coll=None, name="PROP_REAL_Poster"):
    p = [R.box("t", (0.7, 0.03, 1.0), (0, 0, 0), "MAT_REAL_Navy"),
         R.text_mesh("t", text, 0.1, (0, -0.02, 0.5), mat="MAT_REAL_Cream"),
         R.box("t", (0.14, 0.01, 0.05), (0, -0.02, 0.88), "MAT_REAL_Gold")]
    return _p(p, name, coll)


def shelf_unit(coll=None):
    p = [R.box("t", (0.9, 0.3, 0.03), (0, 0, z), "MAT_REAL_WoodLight") for z in (0.0, 0.5, 1.0, 1.5)]
    p += [R.box("t", (0.03, 0.3, 1.55), (x, 0, 0), "MAT_REAL_WoodLight") for x in (-0.45, 0.45)]
    random.seed(4)
    for z in (0.03, 0.53, 1.03):
        for i in range(4):
            c = random.choice(["MAT_REAL_Red", "MAT_REAL_Teal", "MAT_REAL_Cream", "MAT_REAL_FabricBlue"])
            p.append(R.box("t", (0.15, 0.22, 0.3), (-0.3 + i * 0.2, 0, z), c))
    return _p(p, "PROP_REAL_StorageShelf", coll)


def backpack(coll=None):
    p = [R.box("t", (0.32, 0.18, 0.42), (0, 0, 0), "MAT_REAL_Clothing_Black", bevel=0.06),
         R.box("t", (0.24, 0.06, 0.18), (0, -0.1, 0.06), "MAT_REAL_Clothing_Black", bevel=0.03),
         R.box("t", (0.08, 0.01, 0.05), (0, -0.135, 0.3), "MAT_REAL_Gold")]
    return _p(p, "PROP_REAL_Backpack", coll)


def phone(coll=None):
    """Player phone — the hub of every app (Bank, Jobs, Map, Messages, Bills, Learn...)."""
    p = [R.box("t", (0.075, 0.009, 0.155), (0, 0, 0), "MAT_REAL_MetalFrame", bevel=0.004),
         R.box("t", (0.068, 0.002, 0.145), (0, -0.0055, 0.005), "MAT_REAL_ScreenEmit")]
    return _p(p, "PROP_REAL_Phone", coll)


def door_interior(coll=None, name="PROP_REAL_Door_Interior"):
    p = [R.box("t", (0.9, 0.05, 2.1), (0.45, 0, 0), "MAT_REAL_WoodLight"),
         R.cylinder("t", 0.025, 0.08, (0.8, -0.05, 1.0), "MAT_REAL_Metal", 8, pivot="center", rot=(math.radians(90), 0, 0))]
    ob = _p(p, name, coll)   # pivot at hinge (x=0) so it can rotate open in-engine
    return ob


# --------------------------------------------------------------------------- store
PRODUCT_COLORS = [((0.85, 0.15, 0.1), "Red"), ((0.95, 0.75, 0.1), "Yellow"), ((0.1, 0.45, 0.8), "Blue"),
                  ((0.15, 0.6, 0.25), "Green"), ((0.95, 0.5, 0.1), "Orange"), ((0.9, 0.9, 0.85), "White"),
                  ((0.55, 0.2, 0.55), "Purple"), ((0.6, 0.35, 0.15), "Brown")]


def product_mats():
    return [R.custom_mat(f"MAT_REAL_Pack_{n}", c, rough=0.45) for c, n in PRODUCT_COLORS]


def grocery_shelf(coll=None, length=4.0, seed=0, name=None):
    """Double-sided gondola shelf, 1.7 m tall, stocked with packaging blocks."""
    random.seed(seed)
    mats = product_mats()
    p = [R.box("t", (length, 0.9, 0.12), (0, 0, 0), "MAT_REAL_White"),
         R.box("t", (length, 0.06, 1.7), (0, 0, 0), "MAT_REAL_White"),
         R.box("t", (0.05, 0.95, 1.75), (-length / 2, 0, 0), "MAT_REAL_FreshMartGreen"),
         R.box("t", (0.05, 0.95, 1.75), (length / 2, 0, 0), "MAT_REAL_FreshMartGreen")]
    for side in (-1, 1):
        for z in (0.12, 0.52, 0.92, 1.32):
            p.append(R.box("t", (length, 0.42, 0.025), (0, side * 0.24, z), "MAT_REAL_White"))
            p.append(R.box("t", (length, 0.01, 0.05), (0, side * 0.455, z - 0.02), "MAT_REAL_Gold"))  # price rail
            x = -length / 2 + 0.12
            while x < length / 2 - 0.15:
                w = random.choice([0.08, 0.12, 0.16, 0.2])
                h = random.choice([0.18, 0.24, 0.3, 0.33])
                n = max(1, int(0.18 / w))
                m = random.choice(mats)
                for k in range(2):
                    ob = R.box("t", (w - 0.01, 0.17, h), (x + w / 2, side * (0.13 + k * 0.18), z + 0.025), None)
                    ob.data.materials.append(m)
                    p.append(ob)
                x += w + 0.01
    return _p(p, name or f"PROP_REAL_GroceryShelf_{int(length)}m", coll)


def fridge_case(coll=None, length=4.0, seed=1):
    random.seed(seed)
    mats = product_mats()
    p = [R.box("t", (length, 0.85, 2.2), (0, 0, 0), "MAT_REAL_White"),
         R.box("t", (length - 0.1, 0.02, 1.7), (0, -0.43, 0.25), "MAT_REAL_GlassLit"),
         R.box("t", (length, 0.9, 0.3), (0, 0, 2.2), "MAT_REAL_FreshMartGreen")]
    for i in range(int(length / 0.8) + 1):
        p.append(R.box("t", (0.04, 0.05, 1.7), (-length / 2 + i * 0.8, -0.44, 0.25), "MAT_REAL_MetalFrame"))
    for z in (0.35, 0.8, 1.25, 1.65):
        x = -length / 2 + 0.1
        while x < length / 2 - 0.12:
            m = random.choice(mats)
            ob = R.box("t", (0.09, 0.09, 0.22), (x, -0.36, z), None)
            ob.data.materials.append(m)
            p.append(ob)
            x += 0.12
    return _p(p, f"PROP_REAL_FridgeCase_{int(length)}m", coll)


def produce_stand(coll=None, seed=2):
    random.seed(seed)
    fruit = [R.custom_mat("MAT_REAL_Food_Apple", (0.75, 0.08, 0.06), 0.4),
             R.custom_mat("MAT_REAL_Food_Orange", (0.95, 0.5, 0.05), 0.5),
             R.custom_mat("MAT_REAL_Food_Lime", (0.4, 0.75, 0.15), 0.5),
             R.custom_mat("MAT_REAL_Food_Banana", (0.95, 0.8, 0.2), 0.5)]
    p = [R.box("t", (2.4, 1.2, 0.7), (0, 0, 0), "MAT_REAL_Wood")]
    for i in range(4):
        for j in range(2):
            cx, cy = -0.9 + i * 0.6, -0.27 + j * 0.54
            p.append(R.box("t", (0.55, 0.5, 0.14), (cx, cy, 0.7), "MAT_REAL_WoodLight", rot=(math.radians(-8), 0, 0)))
            m = fruit[(i + j * 2) % 4]
            for a in range(4):
                for b in range(3):
                    s = R.sphere("t", 0.05, (cx - 0.18 + a * 0.12, cy - 0.15 + b * 0.13, 0.86 + random.random() * 0.03), None, 8, 5)
                    s.data.materials.append(m)
                    p.append(s)
    return _p(p, "PROP_REAL_ProduceStand", coll)


def checkout(coll=None):
    h = R.SCALE["counter_h"]
    p = [R.box("t", (2.6, 0.75, h), (0, 0, 0), "MAT_REAL_FreshMartGreen"),
         R.box("t", (2.6, 0.78, 0.04), (0, 0, h), "MAT_REAL_White"),
         R.box("t", (1.6, 0.45, 0.02), (-0.4, 0, h + 0.04), "MAT_REAL_Rubber"),       # conveyor
         R.box("t", (0.35, 0.35, 0.01), (0.65, 0, h + 0.04), "MAT_REAL_GlassLit"),     # scanner window
         # register / POS screen
         R.box("t", (0.38, 0.32, 0.12), (1.0, 0.18, h + 0.04), "MAT_REAL_MetalFrame"),
         R.box("t", (0.06, 0.06, 0.25), (1.0, 0.25, h + 0.16), "MAT_REAL_MetalFrame"),
         R.box("t", (0.36, 0.04, 0.26), (1.0, 0.22, h + 0.4), "MAT_REAL_MetalFrame", rot=(math.radians(15), 0, 0)),
         R.box("t", (0.32, 0.01, 0.22), (1.0, 0.195, h + 0.42), "MAT_REAL_ScreenEmit", rot=(math.radians(15), 0, 0)),
         # card terminal
         R.box("t", (0.09, 0.14, 0.04), (0.65, -0.28, h + 0.04), "MAT_REAL_MetalFrame"),
         # lane light
         R.cylinder("t", 0.03, 1.4, (1.25, 0.32, h), "MAT_REAL_MetalFrame", 8),
         R.box("t", (0.22, 0.06, 0.18), (1.25, 0.32, h + 1.4), "MAT_REAL_FreshMartLeaf"),
         R.box("t", (0.2, 0.2, 0.01), (-0.9, -0.39, 0.5), "MAT_REAL_Gold")]                 # crown badge
    return _p(p, "PROP_REAL_Checkout_Register", coll)


def basket(coll=None):
    p = [R.box("t", (0.45, 0.3, 0.02), (0, 0, 0), "MAT_REAL_FreshMartGreen")]
    for (sx, sy, x, y) in ((0.45, 0.02, 0, -0.15), (0.45, 0.02, 0, 0.15), (0.02, 0.3, -0.225, 0), (0.02, 0.3, 0.225, 0)):
        p.append(R.box("t", (sx, sy, 0.22), (x, y, 0), "MAT_REAL_FreshMartGreen"))
    p.append(R.box("t", (0.02, 0.3, 0.02), (0, 0, 0.3), "MAT_REAL_MetalFrame"))
    return _p(p, "PROP_REAL_ShoppingBasket", coll)


def basket_stack(coll=None):
    parts = [R.box("t", (0.5, 0.35, 0.1), (0, 0, 0), "MAT_REAL_MetalFrame")]
    for i in range(5):
        b = basket()
        b.location = (0, 0, 0.1 + i * 0.06)
        parts.append(b)
    for o in parts:
        R.apply_transforms(o, loc=True)
    return _p(parts, "PROP_REAL_BasketStack", coll)


def cart(coll=None):
    p = [R.box("t", (0.55, 0.9, 0.02), (0, 0, 0.45), "MAT_REAL_Metal")]
    for (sx, sy, x, y) in ((0.55, 0.02, 0, -0.45), (0.55, 0.02, 0, 0.45), (0.02, 0.9, -0.275, 0), (0.02, 0.9, 0.275, 0)):
        p.append(R.box("t", (sx, sy, 0.45), (x, y, 0.45), "MAT_REAL_Metal"))
    p.append(R.box("t", (0.6, 0.04, 0.04), (0, 0.55, 1.0), "MAT_REAL_FreshMartGreen"))
    for x in (-0.22, 0.22):
        p.append(R.box("t", (0.02, 0.15, 0.45), (x, 0.5, 0.5), "MAT_REAL_Metal"))
        for y in (-0.38, 0.38):
            p.append(R.cylinder("t", 0.06, 0.04, (x, y, 0.06), "MAT_REAL_Rubber", 10, pivot="center", rot=(0, math.radians(90), 0)))
            p.append(R.box("t", (0.02, 0.02, 0.4), (x, y, 0.06), "MAT_REAL_Metal"))
    return _p(p, "PROP_REAL_ShoppingCart", coll)


def manager_desk(coll=None):
    d = desk()
    mon = [R.box("t", (0.55, 0.04, 0.34), (0, 0.15, R.SCALE["table_h"] + 0.15), "MAT_REAL_MetalFrame"),
           R.box("t", (0.5, 0.01, 0.29), (0, 0.128, R.SCALE["table_h"] + 0.175), "MAT_REAL_ScreenEmit"),
           R.box("t", (0.06, 0.06, 0.15), (0, 0.18, R.SCALE["table_h"]), "MAT_REAL_MetalFrame"),
           R.box("t", (0.22, 0.3, 0.005), (-0.4, -0.1, R.SCALE["table_h"]), "MAT_REAL_White")]   # schedule sheet
    return _p([d] + mon, "PROP_REAL_ManagerStation", coll)


def time_clock(coll=None):
    p = [R.box("t", (0.3, 0.12, 0.4), (0, 0, 1.2), "MAT_REAL_MetalFrame"),
         R.box("t", (0.2, 0.01, 0.1), (0, -0.065, 1.45), "MAT_REAL_ScreenEmit"),
         R.box("t", (0.6, 0.04, 0.6), (0.55, 0, 1.1), "MAT_REAL_Cream")]   # notice board: training checklist
    return _p(p, "PROP_REAL_TimeClock", coll)


def lockers(coll=None, n=5):
    p = []
    for i in range(n):
        p.append(R.box("t", (0.38, 0.45, 1.8), (-n * 0.2 + i * 0.4 + 0.2, 0, 0), "MAT_REAL_Teal"))
        p.append(R.box("t", (0.2, 0.01, 0.05), (-n * 0.2 + i * 0.4 + 0.2, -0.23, 1.5), "MAT_REAL_MetalFrame"))
    return _p(p, "PROP_REAL_Lockers", coll)


def stock_pallet(coll=None, seed=7):
    random.seed(seed)
    mats = product_mats()
    p = [R.box("t", (1.2, 1.0, 0.14), (0, 0, 0), "MAT_REAL_WoodLight")]
    for i in range(3):
        for j in range(2):
            for k in range(random.randint(2, 4)):
                ob = R.box("t", (0.38, 0.48, 0.3), (-0.4 + i * 0.4, -0.25 + j * 0.5, 0.14 + k * 0.31), "MAT_REAL_Wood")
                p.append(ob)
    return _p(p, "PROP_REAL_StockPallet", coll)


def grocery_bag(coll=None):
    p = [R.box("t", (0.3, 0.18, 0.36), (0, 0, 0), "MAT_REAL_Cream"),
         R.box("t", (0.12, 0.01, 0.12), (0, -0.095, 0.15), "MAT_REAL_FreshMartGreen"),
         R.sphere("t", 0.07, (-0.06, 0, 0.38), "MAT_REAL_Food_Apple" if "MAT_REAL_Food_Apple" in bpy.data.materials else "MAT_REAL_Red", 8, 5),
         R.box("t", (0.06, 0.06, 0.2), (0.07, 0.02, 0.3), "MAT_REAL_White")]
    return _p(p, "PROP_REAL_GroceryBag", coll)


def hanging_sign(text, coll=None, name="PROP_REAL_AisleSign", w=1.6, mat="MAT_REAL_FreshMartGreen"):
    p = [R.box("t", (w, 0.04, 0.45), (0, 0, 0), mat),
         R.text_mesh("t", text, 0.17, (0, -0.025, 0.225), mat="MAT_REAL_SignWhiteEmit"),
         R.text_mesh("t", text, 0.17, (0, 0.025, 0.225), rot=(math.radians(90), 0, math.radians(180)), mat="MAT_REAL_SignWhiteEmit"),
         R.box("t", (0.01, 0.01, 0.8), (-w / 2 + 0.1, 0, 0.45), "MAT_REAL_MetalFrame"),
         R.box("t", (0.01, 0.01, 0.8), (w / 2 - 0.1, 0, 0.45), "MAT_REAL_MetalFrame")]
    return _p(p, name, coll)


def price_tag_board(coll=None):
    """Math-challenge prop: big price board ($ readable at gameplay distance)."""
    p = [R.box("t", (0.9, 0.04, 0.6), (0, 0, 0), "MAT_REAL_White"),
         R.text_mesh("t", "TODAY\n$2.49", 0.13, (0, -0.025, 0.3), mat="MAT_REAL_Red")]
    return _p(p, "PROP_REAL_PriceBoard", coll)
