"""
REAL visual development: Fox v2 look-dev proposal.
Renders the CURRENT Fox and a PROPOSED v2 look from identical cameras, saves a side-by-side comparison,
and writes the proposal to a SEPARATE file (Blender/Characters/Fox/CHR_REAL_Fox_v2_lookdev.blend).
The production file is never modified. Nothing is applied to other characters until approved.

v2 changes (non-destructive):
  * smoother silhouettes: subdivision on head, body, hands, tail and clothing (render level 2)
  * fur shading: soft sheen, light subsurface, tonal gradient (deeper on top, warmer below), subtle fuzz bump
  * eyes: glossy coated corneas, warm iris gradient, brighter catchlights
  * clothing: woven-fabric bump and sheen, near-black instead of pure black, metallic gold trims
  * lighting: warm key, cool rim, soft fill, gentle AO (cinematic, readable)
Usage: python Tools/lookdev_fox.py [samples]
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import real_lib as R

samples = int(sys.argv[1]) if len(sys.argv) > 1 else 32
SRC = os.path.join(R.BLEND_DIR, "Characters", "Fox", "CHR_REAL_Fox.blend")
OUT = os.path.join(R.RENDER_DIR, "LookDev")
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=SRC)
import build_fox as F

for ob in bpy.data.objects:
    if ob.type == "ARMATURE" and ob.animation_data: ob.animation_data.action = None
F.studio()
R.setup_render((900, 1100), samples=samples)
CAMS = {
    "hero": (R.camera("CAM_hero", (1.7, -2.75, 1.15), (0, 0, 0.78), lens=50), (900, 1100)),
    "face": (R.camera("CAM_face", (0.42, -1.3, 1.32), (0, 0, 1.22), lens=85), (900, 900)),
}

def shoot(tag):
    files = {}
    for k, (cam, res) in CAMS.items():
        f = os.path.join(OUT, f"fox_{tag}_{k}.png"); R.render(cam, f, res=res); files[k] = f
    return files

before = shoot("current")

# ------------------------------------------------------------------------------------------- v2 look
def nodes_of(m):
    m.use_nodes = True; nt = m.node_tree; return nt, nt.nodes, nt.links
def principled(m):
    return next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
def setin(b, name, v):
    for key in ([name] if isinstance(name, str) else name):
        if key in b.inputs: b.inputs[key].default_value = v; return

def fur(mat, top_mul=0.72, belly_mul=1.12, sheen=(1.0, 0.85, 0.7)):
    nt, N, L = nodes_of(mat); b = principled(mat); base = tuple(b.inputs["Base Color"].default_value)
    tex = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(tex.outputs["Object"], sep.inputs[0])
    mr = N.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = 0.2; mr.inputs["From Max"].default_value = 1.45; L.new(sep.outputs["Z"], mr.inputs["Value"])
    ramp = N.new("ShaderNodeValToRGB"); L.new(mr.outputs["Result"], ramp.inputs["Fac"])
    ramp.color_ramp.elements[0].color = tuple(min(1, c * belly_mul) for c in base[:3]) + (1,)
    ramp.color_ramp.elements[1].color = tuple(c * top_mul for c in base[:3]) + (1,)
    noise = N.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 140; noise.inputs["Detail"].default_value = 6
    L.new(tex.outputs["Object"], noise.inputs["Vector"])
    mix = N.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs["Factor"].default_value = 0.12
    L.new(ramp.outputs["Color"], mix.inputs[6]); L.new(noise.outputs["Color"], mix.inputs[7]); L.new(mix.outputs[2], b.inputs["Base Color"])
    bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.06; L.new(noise.outputs["Fac"], bump.inputs["Height"]); L.new(bump.outputs["Normal"], b.inputs["Normal"])
    setin(b, "Roughness", 0.55); setin(b, ["Sheen Weight", "Sheen"], 0.08); setin(b, "Sheen Tint", sheen + (1,) if "Sheen Tint" in b.inputs and len(b.inputs["Sheen Tint"].default_value) == 4 else 0.5)
    setin(b, ["Subsurface Weight", "Subsurface"], 0.06); setin(b, "Subsurface Radius", (0.06, 0.03, 0.02))

def fabric(mat, color=None, sheen=0.35, metal=0.0, rough=0.78, scale=420):
    nt, N, L = nodes_of(mat); b = principled(mat)
    if color: b.inputs["Base Color"].default_value = color
    tex = N.new("ShaderNodeTexCoord"); wave1 = N.new("ShaderNodeTexWave"); wave1.inputs["Scale"].default_value = scale; wave2 = N.new("ShaderNodeTexWave"); wave2.bands_direction = "Y"; wave2.inputs["Scale"].default_value = scale
    for w in (wave1, wave2): L.new(tex.outputs["Object"], w.inputs["Vector"])
    add = N.new("ShaderNodeMath"); add.operation = "ADD"; L.new(wave1.outputs["Fac"], add.inputs[0]); L.new(wave2.outputs["Fac"], add.inputs[1])
    bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.08; L.new(add.outputs[0], bump.inputs["Height"]); L.new(bump.outputs["Normal"], b.inputs["Normal"])
    setin(b, "Roughness", rough); setin(b, ["Sheen Weight", "Sheen"], sheen); setin(b, "Metallic", metal)

M = bpy.data.materials
fur(M["MAT_REAL_Fur_FoxOrange"], 0.8, 1.05); fur(M["MAT_REAL_Fur_FoxCream"], 0.92, 1.05, (1, 1, 1)); fur(M["MAT_REAL_Fur_FoxDark"], 1.0, 1.6)
fabric(M["MAT_REAL_Clothing_Black"], (0.008, 0.008, 0.01, 1), 0.0, 0, 0.62); fabric(M["MAT_REAL_Clothing_Cream"], None, 0.4, 0, 0.85, 300)
fabric(M["MAT_REAL_Clothing_Gold"], None, 0.0, 0.55, 0.35, 600)
for nm, rough, coat in (("MAT_REAL_Nose", 0.22, 0.6), ("MAT_REAL_Eye_Pupil", 0.05, 1.0), ("MAT_REAL_Eye_Sclera", 0.12, 1.0)):
    b = principled(M[nm]); setin(b, "Roughness", rough); setin(b, ["Coat Weight", "Clearcoat"], coat)
ib = principled(M["MAT_REAL_Eye_Iris"]); ib.inputs["Base Color"].default_value = (0.55, 0.24, 0.05, 1); setin(ib, ["Coat Weight", "Clearcoat"], 1.0); setin(ib, "Roughness", 0.1)
hb = principled(M["MAT_REAL_Eye_Highlight"]); setin(hb, ["Emission Color", "Emission"], (1, 1, 1, 1)); setin(hb, "Emission Strength", 2.5)
for nm in ("MAT_REAL_Shoe_White", "MAT_REAL_Shoe_Sole"): fabric(M[nm], (0.86, 0.85, 0.82, 1), 0.2, 0, 0.55, 200)

for ob in bpy.data.objects:
    if ob.type == "MESH" and (ob.name.startswith("SK_REAL_Fox") or ob.name.startswith("CLO_REAL_Fox")):
        sd = ob.modifiers.new("LOOKDEV_Subsurf", "SUBSURF"); sd.levels = 1; sd.render_levels = 1; sd.use_limit_surface = False
        if ob.name.endswith("_Head"):   # keep the stylized spikes and cheek tufts crisp: crease their sharp edges
            import bmesh
            bm = bmesh.new(); bm.from_mesh(ob.data); bm.edges.ensure_lookup_table()
            sharp = [e.index for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > math.radians(55)]
            bm.free()
            attr = ob.data.attributes.get("crease_edge") or ob.data.attributes.new("crease_edge", "FLOAT", "EDGE")
            for i in sharp: attr.data[i].value = 1.0
        for p in ob.data.polygons: p.use_smooth = True

# cinematic light: warmer key, stronger cool rim, softer fill, gentle AO
for l in bpy.data.objects:
    if l.type == "LIGHT":
        if l.name == "LGT_Key": l.data.energy *= 1.15; l.data.color = (1.0, 0.88, 0.76)
        if l.name == "LGT_Rim": l.data.energy *= 1.5; l.data.color = (0.66, 0.78, 1.0)
        if l.name == "LGT_Fill": l.data.energy *= 0.8
sc = bpy.context.scene
try: sc.view_settings.look = "AgX - Base Contrast"
except Exception: pass

after = shoot("v2")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(R.BLEND_DIR, "Characters", "Fox", "CHR_REAL_Fox_v2_lookdev.blend"), copy=True)

# ------------------------------------------------------------------------------------------- comparison sheet
try:
    from PIL import Image, ImageDraw, ImageFont
    def font(n):
        for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",):
            if os.path.exists(f): return ImageFont.truetype(f, n)
        return ImageFont.load_default()
    for k in CAMS:
        a, b = Image.open(before[k]).convert("RGB"), Image.open(after[k]).convert("RGB")
        W, H = a.size; sheet = Image.new("RGB", (W * 2 + 30, H + 90), (20, 26, 44)); sheet.paste(a, (10, 80)); sheet.paste(b, (W + 20, 80))
        d = ImageDraw.Draw(sheet); d.text((20, 22), "CURRENT", fill=(220, 225, 240), font=font(38)); d.text((W + 30, 22), "PROPOSED v2 (for approval)", fill=(233, 169, 58), font=font(38))
        sheet.save(os.path.join(OUT, f"fox_compare_{k}.png")); print("SHEET", os.path.join(OUT, f"fox_compare_{k}.png"))
except Exception as e:
    print("PIL comparison skipped:", e)
print("LOOKDEV DONE")
