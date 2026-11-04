# REAL — Learn • Live • Grow

*Start with almost nothing. Build something that's yours.*

REAL is a cinematic 3D open-world educational life-simulation RPG. You play an anthropomorphic animal (your REAL), rebuilding life in a modern city after being removed from The Club. You learn by living.

This repository is the **3D production source** for REAL: Blender sources, script-driven asset pipelines, verified exports for Unreal Engine 5, and production documentation.

> **Status:** Blender-side production, phases 0–3 (first pass). There is **no playable Unreal build yet**, because Unreal Engine isn't available in the production environment. See [`Documentation/05_ProductionStatus.md`](Documentation/05_ProductionStatus.md) for what exists and what doesn't.

## What's here

| Path | Contents |
|---|---|
| `Tools/` | Blender Python build scripts. Every asset is generated, so it can be rebuilt and reviewed |
| `Blender/` | `.blend` sources: `Characters/Fox`, `Buildings` (city kit), `Interiors` (starter apartment), `World/StartingDistrict` (Fresh Mart, district) |
| `Blender/Exports/` | FBX (for Unreal) and GLB (web/preview) exports |
| `Renders/` | Review renders: turnaround, expressions, animation sheet, environments |
| `Tests/` | `verify_exports.py` (re-import checks), `web_glb_check.js` (three.js/WebGL check), JSON reports |
| `References/Concept/` | Approved concept sheets, the source of truth for the art direction |
| `Documentation/` | Tool audit, conventions, Unreal asset contract, decision log, status |

## Rebuild everything

```bash
python3 -m venv /opt/realbpy && /opt/realbpy/bin/pip install bpy==5.1.2
/opt/realbpy/bin/python Tools/build_all.py            # build, export, render, verify
/opt/realbpy/bin/python Tools/build_all.py build_fox  # just one step
```

Desktop Blender 5.1+ works too: `blender -b -P Tools/build_fox.py`.
