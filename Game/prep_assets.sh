#!/usr/bin/env bash
# Prepare runtime assets: dedup + weld + quantize (KHR_mesh_quantization, decoded natively by three.js),
# resample animations, then gzip -9. The game inflates them with DecompressionStream (no WASM needed).
set -euo pipefail
cd "$(dirname "$0")"
GT=node_modules/.bin/gltf-transform
EXP=../Blender/Exports
RAW=raw_assets            # Tools/export_game.py writes district.raw.glb / apartment.raw.glb into public/assets
OUT=public/assets
mkdir -p "$OUT/chars" .tmp
for f in district apartment; do
  src="$OUT/$f.raw.glb"; [ -f "$src" ] || src=".tmp/none"
  if [ -f "$src" ]; then mkdir -p $RAW; mv "$src" "$RAW/$f.glb"; fi
  [ -f "$RAW/$f.glb" ] || { echo "missing $RAW/$f.glb"; exit 1; }
  $GT dedup "$RAW/$f.glb" .tmp/a.glb >/dev/null
  $GT weld .tmp/a.glb .tmp/b.glb >/dev/null
  $GT quantize .tmp/b.glb .tmp/c.glb >/dev/null
  gzip -9 -c .tmp/c.glb > "$OUT/$f.glb.gz"
done
for s in Fox Cat Dog Horse Bird Elephant Lion Cow Dolphin Jax; do
  $GT dedup "$EXP/Characters/SK_REAL_$s.glb" .tmp/a.glb >/dev/null
  $GT resample .tmp/a.glb .tmp/b.glb >/dev/null
  $GT quantize .tmp/b.glb .tmp/c.glb >/dev/null
  gzip -9 -c .tmp/c.glb > "$OUT/chars/$s.glb.gz"
done
rm -rf .tmp "$OUT"/*.glb "$OUT"/chars/*.glb
du -ch "$OUT"/*.gz "$OUT"/chars/*.gz | tail -1
ls -la "$OUT" "$OUT/chars" | awk '{print $5, $9}' | grep gz
