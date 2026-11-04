# Phase 0 — Tool Audit

Audited on 2026-11-04 in the cloud production container (Linux, 4 vCPU, 15 GB RAM, no GPU).

| Capability | Status | Notes |
|---|---|---|
| Blender | ✅ **Blender 5.1.2** as the `bpy` Python module | Installed from PyPI into `/opt/realbpy` (venv). Headless — no GUI and no Computer Use. |
| Blender Python | ✅ | Every asset is produced by a script in `Tools/`, so any build can be rerun exactly. |
| Render: Cycles (CPU) | ✅ | Used for every preview render. OpenImageDenoise works. |
| Render: EEVEE / Workbench | ❌ | Both need a GPU/OpenGL context, which this container doesn't have. |
| FBX export | ✅ | `io_scene_fbx`, with Unreal-oriented settings (see Conventions). |
| glTF/GLB export | ✅ | `io_scene_gltf2`. Used for web previews and to check exports by re-importing them. |
| Blender MCP / GUI / Computer Use | ❌ | Not attached to this session. |
| **Unreal Engine 5** | ❌ **Not available** | No UE install, no Epic account, and the download hosts are blocked by the network policy. UE5 also needs a GPU workstation. |
| Filesystem / terminal / git | ✅ | The repo is `beech80/real-game-`, working branch `claude/real-game-production-xbixza`. |
| Chromium + Playwright | ✅ | Can load the exported GLBs in a WebGL page to check that they work outside Blender. |

## What this means for production

Under directive §1 and §20, Unreal is not available here, so this environment does:

1. **All Blender-side production.** Models, materials, rigs, animations and environments, all saved as `.blend` sources.
2. **Verified exports.** FBX files for Unreal and GLB files for previews. Each export is re-imported and checked automatically (`Tests/verify_exports.py`).
3. **Unreal asset contracts.** These set out naming, sockets, collision, skeleton, morph targets and animation conventions (see `Documentation/03_UnrealAssetContract.md`), so the UE5 integration is mechanical.

Nothing in this repository is a playable Unreal game yet. See `Documentation/05_ProductionStatus.md` for exactly what exists.

## How to reproduce

```bash
python3 -m venv /opt/realbpy && /opt/realbpy/bin/pip install bpy==5.1.2
/opt/realbpy/bin/python Tools/build_all.py        # rebuilds every asset, export and render
/opt/realbpy/bin/python Tests/verify_exports.py   # re-imports exports and checks them
```

With a desktop Blender 5.1+, the same scripts run with `blender -b -P Tools/<script>.py`.
