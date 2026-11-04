"""Rebuild every REAL asset, export and review render in dependency order, then verify."""
import subprocess, sys, os, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PY = sys.executable
STEPS = [
    ["Tools/build_city_kit.py"],
    ["Tools/build_starter_apartment.py"],
    ["Tools/build_fresh_mart.py"],
    ["Tools/build_fox.py"],
    ["Tools/render_character.py", "Fox", "all", "16"],
    ["Tools/build_starting_district.py"],
    ["Tests/verify_exports.py"],
]
only = sys.argv[1:]
for step in STEPS:
    if only and not any(o in step[0] for o in only):
        continue
    t = time.time()
    r = subprocess.run([PY] + step, cwd=ROOT)
    print(f"[build_all] {' '.join(step)} -> exit {r.returncode} ({time.time() - t:.0f}s)")
    if r.returncode:
        sys.exit(r.returncode)
