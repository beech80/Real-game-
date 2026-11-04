# REAL — Art Direction & Visual Style Guide (draft for approval)

**Goal:** REAL should look like REAL, not like Roblox, Pixar or Nintendo. The aim is premium stylized graphics, roughly **70% believable / 30% stylized**.

**Status:** this guide and the Fox v2 look-dev (`Renders/LookDev/fox_compare_*.png`) are a **proposal**. Nothing is applied to the other eight characters or to the city until it is approved.

## Why the current look reads as "Roblox-like"

| Cause | Fix in v2 |
|---|---|
| Every surface is one flat color | Tonal gradients, soft sheen and subtle surface detail (fur fuzz, fabric weave) |
| Low-subdivision meshes show facets | Subdivision on characters (level 2 for renders, level 1 for the game LOD) |
| Pure black and saturated primaries | Near-blacks (#060607), warm creams and a curated palette per district |
| Flat lighting | Warm key, cool rim, soft fill, gentle ambient occlusion |
| Eyes are flat discs | Glossy coated corneas, an iris gradient and bright catchlights |

## Characters

- **Proportions:** large expressive head (about 40% of height), compact body, short limbs. Keep the current silhouettes.
- **Shapes:** round and soft; no hard box edges on characters. Species features (ears, tails, trunk, wings, mane, dolphin fin) are the most recognizable shapes, so exaggerate them slightly.
- **Fur:** principled shading with sheen 0.5–0.6, a light subsurface (0.05) and a gradient (deeper on top, lighter underneath). Use noise breakup at about 12% strength.
- **Eyes:** coat 1.0, low roughness, and one emissive catchlight per eye at the upper-camera side.
- **Clothing:** modern streetwear. Fabric bump and sheen 0.3–0.4; trims are metallic 0.6.
- **The Dolphin** is a land-based resident: it walks, works, wears clothing and drives.
- **Budget:** 6–10k triangles per character for the game LOD, about 25k for cinematics. One material per surface type.

## World

- **Architecture:** modern and believable, slightly simplified: brick, plaster and glass with real-world proportions (3.5 m floors, 1.5 m windows).
- **Districts:**

| District | Palette | Materials | Signage |
|---|---|---|---|
| Starting District | Warm brick, green awnings | Worn paving | Hand-painted |
| Midtown | Red and tan brick, brass | Mid-rise | Lit storefronts |
| Opportunity District | Glass, steel, teal | Towers | Clean sans-serif |
| The Heights | Limestone, gold, deep navy | Ornate cornices | Parks |
| The Club | Navy and gold, marble | Chandeliers | Visible from selected streets |

- **Props:** every street needs layers: trees, lamps, benches, signs, parked cars and people.
- **Lighting:** a warm sun, cool skylight, clear time of day, and lit windows and lamps at night.

## Color palette (core)

| Name | Hex |
|---|---|
| REAL Navy | `#14204A` |
| REAL Gold | `#E8A33A` |
| Fresh Green | `#2F8F5A` |
| Signal Red | `#D23B2A` |
| Sky Blue | `#2A9FD6` |
| Cream | `#E6DCCB` |
| Charcoal | `#2A2D33` |

## UI

Dark glass panels with gold accents. Barlow Condensed for headings, Barlow for body text. Large touch targets (at least 44 px), with a maximum of one primary button per sheet.

## Approval workflow (from the production directive)

1. **Done:** upgrade the Fox look → render before and after with matching cameras (`Renders/LookDev/`).
2. **Waiting on you:** review and approve or adjust.
3. **After approval:** apply the approved standard to the game Fox (export LOD), then one Starting District street. Render before and after again.
4. **Then:** roll out to the remaining eight characters and the districts.

The original production files are never overwritten. The proposal lives in `Blender/Characters/Fox/CHR_REAL_Fox_v2_lookdev.blend`.
