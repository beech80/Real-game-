"""
Character review renders: turnaround, expression sheet, animation pose sheet, deformation tests.
Usage: python Tools/render_character.py <Species> [turn|expr|anim|deform|all] [samples]
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector
import real_lib as R

species = sys.argv[1] if len(sys.argv) > 1 else "Fox"
mode = sys.argv[2] if len(sys.argv) > 2 else "all"
samples = int(sys.argv[3]) if len(sys.argv) > 3 else 24
bpy.ops.wm.open_mainfile(filepath=os.path.join(R.BLEND_DIR, "Characters", species, f"CHR_REAL_{species}.blend"))
import build_fox as F

arm = bpy.data.objects[f"SK_REAL_{species}"]
head = bpy.data.objects[f"SK_REAL_{species}_Head"]
out = os.path.join(R.RENDER_DIR, "Characters", species)
os.makedirs(out, exist_ok=True)
F.studio()
R.setup_render((900, 1100), samples=samples)


def set_action(name, frame):
    arm.animation_data.action = bpy.data.actions[name] if name else None
    bpy.context.scene.frame_set(frame)


def reset_keys():
    for kb in head.data.shape_keys.key_blocks:
        kb.value = 0.0


def composite(files, cols, path, labels=None):
    """Tile PNGs into a contact sheet using Blender's image API (no PIL dependency)."""
    imgs = [bpy.data.images.load(f) for f in files]
    w, h = imgs[0].size
    rows = (len(imgs) + cols - 1) // cols
    sheet = bpy.data.images.new("sheet", w * cols, h * rows, alpha=False)
    import array
    px = array.array("f", [0.02, 0.03, 0.06, 1.0] * (w * cols * h * rows))
    for k, im in enumerate(imgs):
        src = array.array("f", [0.0] * (w * h * 4))
        im.pixels.foreach_get(src)
        cx, cy = k % cols, rows - 1 - k // cols
        for y in range(h):
            d0 = ((cy * h + y) * w * cols + cx * w) * 4
            px[d0:d0 + w * 4] = src[y * w * 4:(y + 1) * w * 4]
    sheet.pixels.foreach_set(px)
    sheet.filepath_raw = path
    sheet.file_format = "PNG"
    sheet.save()
    print("SHEET", path)


if mode in ("turn", "all"):
    set_action(None, 0)
    files = []
    for name, ang in (("front", 0), ("three_quarter", 35), ("side", 90), ("back", 180)):
        a = math.radians(ang)
        loc = (3.2 * math.sin(a), -3.2 * math.cos(a), 1.0)
        cam = R.camera(f"CAM_{name}", loc, (0, 0, 0.8), lens=50)
        f = os.path.join(out, f"turn_{name}.png")
        R.render(cam, f)
        files.append(f)
    composite(files, 4, os.path.join(out, f"{species}_turnaround.png"))

if mode in ("expr", "all"):
    set_action(None, 0)
    R.setup_render((600, 600), samples=samples)
    cam = R.camera("CAM_face", (0.35, -1.25, 1.3), (0, 0, 1.24), lens=85)
    files = []
    for k in ["Neutral"] + F.EXPRESSIONS:
        reset_keys()
        if k != "Neutral":
            head.data.shape_keys.key_blocks[k].value = 1.0
        f = os.path.join(out, f"expr_{k}.png")
        R.render(cam, f)
        files.append(f)
    reset_keys()
    composite(files, 6, os.path.join(out, f"{species}_expressions.png"))

if mode in ("anim", "all"):
    R.setup_render((500, 650), samples=max(12, samples // 2))
    cam = R.camera("CAM_anim", (2.4, -2.6, 1.0), (0, 0, 0.7), lens=50)
    files = []
    picks = [("Idle", 0), ("Walk", 0), ("Walk", 8), ("Run", 5), ("Sprint", 4), ("Jump", 6), ("Jump", 17),
             ("Sit", 0), ("Drive", 0), ("PhoneUse", 10), ("Wave", 22), ("Talk", 15), ("Pickup", 18), ("Carry", 0)]
    for nm, fr in picks:
        set_action(f"ANIM_REAL_{species}_{nm}", fr)
        f = os.path.join(out, f"anim_{nm}_{fr:02d}.png")
        R.render(cam, f)
        files.append(f)
    set_action(None, 0)
    composite(files, 7, os.path.join(out, f"{species}_animations.png"))

if mode in ("deform",):
    R.setup_render((600, 700), samples=samples)
    cam = R.camera("CAM_def", (1.6, -2.6, 1.0), (0, 0, 0.8), lens=50)
    files = []
    tests = {"arms_up": {"clavicle_l": [("Y", -20)], "clavicle_r": [("Y", 20)], "upperarm_l": [("Y", -85)], "upperarm_r": [("Y", 85)]},
             "deep_squat": {"thigh_l": [("X", -100)], "thigh_r": [("X", -100)], "calf_l": [("X", 120)], "calf_r": [("X", 120)]},
             "elbows": {"lowerarm_l": [("X", -120)], "lowerarm_r": [("X", -120)]}}
    arm.animation_data.action = None
    for n, pose in tests.items():
        full = {b: [] for b in F.ALL_ANIM_BONES}
        full.update(pose)
        for b, ops in full.items():
            pb = arm.pose.bones[b]
            from mathutils import Matrix
            Lm = arm.data.bones[b].matrix_local.to_3x3()
            Rm = Matrix.Identity(3)
            for ax, d in ops:
                Rm = Matrix.Rotation(math.radians(d), 3, ax) @ Rm
            pb.rotation_quaternion = (Lm.inverted() @ Rm @ Lm).to_quaternion()
            pb.location = (0, 0, 0)
        f = os.path.join(out, f"deform_{n}.png")
        R.render(cam, f)
        files.append(f)
    composite(files, 3, os.path.join(out, f"{species}_deformation.png"))
