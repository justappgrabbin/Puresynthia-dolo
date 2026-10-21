
#!/usr/bin/env python3
"""
AutoBuilder: local, non-AI "coder agent substitute" for ingesting apps and producing a build-ready project bundle.

What it does:
- Accepts ZIPs, folders, or git URLs
- Normalizes into /projects/<name>/
- Detects stacks (Node/Vite/Express, Python) via file markers
- Runs deterministic install/build steps (npm/pnpm/yarn, pip)
- Emits a build report + normalized metadata for your app-maker to consume

No Claude. No cloud. Just repeatable plumbing.

Usage:
  python autobuilder.py ingest /path/to/app.zip
  python autobuilder.py ingest /path/to/folder
  python autobuilder.py ingest https://github.com/user/repo.git

Config:
  Optional builder.json next to this file. See README.
"""
from __future__ import annotations

import argparse
import dataclasses
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent
DEFAULT_PROJECTS = ROOT / "projects"
DEFAULT_INCOMING = ROOT / "incoming"
DEFAULT_REPORTS = ROOT / "reports"

STACK_MARKERS = {
    "node": ["package.json"],
    "python": ["requirements.txt", "pyproject.toml", "Pipfile", "setup.py"],
    "docker": ["Dockerfile", "docker-compose.yml", "compose.yml"],
    "flutter": ["pubspec.yaml"],
    "android": ["AndroidManifest.xml", "build.gradle", "settings.gradle"],
}

NODE_LOCKS = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock"]

def sh(cmd: List[str], cwd: Optional[Path] = None, env: Optional[Dict[str,str]] = None, timeout: int = 1800) -> Tuple[int,str,str]:
    p = subprocess.Popen(cmd, cwd=str(cwd) if cwd else None, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        out, err = p.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        p.kill()
        out, err = p.communicate()
        return 124, out, err + "\n[TIMEOUT]"
    return p.returncode, out, err

def safe_name(name: str) -> str:
    name = re.sub(r"[^a-zA-Z0-9._-]+", "-", name).strip("-")
    return name or "project"

def load_config() -> Dict:
    cfg_path = ROOT / "builder.json"
    if cfg_path.exists():
        try:
            return json.loads(cfg_path.read_text())
        except Exception:
            return {}
    return {}

def detect_stacks(project_dir: Path) -> Dict[str, List[str]]:
    hits: Dict[str, List[str]] = {}
    for dirpath, _, filenames in os.walk(project_dir):
        fn = set(filenames)
        for stack, markers in STACK_MARKERS.items():
            for m in markers:
                if m in fn:
                    hits.setdefault(stack, []).append(str(Path(dirpath) / m))
    return hits

def detect_node_pm(project_dir: Path) -> str:
    # prefer lockfile selection for determinism
    locks = {lf: (project_dir / lf).exists() for lf in NODE_LOCKS}
    if locks.get("pnpm-lock.yaml"):
        return "pnpm"
    if locks.get("yarn.lock"):
        return "yarn"
    return "npm"

def extract_zip(zip_path: Path, dest: Path) -> None:
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(dest)

def clone_git(url: str, dest: Path) -> None:
    code, out, err = sh(["git", "clone", "--depth", "1", url, str(dest)])
    if code != 0:
        raise RuntimeError(f"git clone failed: {err.strip() or out.strip()}")

def normalize_root(extracted: Path) -> Path:
    # If zip contains a single top folder, treat that as project root.
    kids = [p for p in extracted.iterdir() if p.name not in [".DS_Store", "__MACOSX"]]
    if len(kids) == 1 and kids[0].is_dir():
        return kids[0]
    return extracted

def write_json(path: Path, data: Dict) -> None:
    path.write_text(json.dumps(data, indent=2, sort_keys=True))

def run_node_build(project_dir: Path, report: Dict) -> None:
    pm = detect_node_pm(project_dir)
    report["node"]["package_manager"] = pm

    env = os.environ.copy()
    env.setdefault("CI", "1")

    # Install
    if pm == "pnpm":
        install_cmd = ["pnpm", "install", "--frozen-lockfile"]
    elif pm == "yarn":
        install_cmd = ["yarn", "install", "--frozen-lockfile"]
    else:
        # npm
        if (project_dir / "package-lock.json").exists():
            install_cmd = ["npm", "ci"]
        else:
            install_cmd = ["npm", "install"]

    code, out, err = sh(install_cmd, cwd=project_dir, env=env, timeout=1800)
    report["node"]["install"] = {"cmd": install_cmd, "code": code, "stdout_tail": out[-4000:], "stderr_tail": err[-4000:]}
    if code != 0:
        report["node"]["status"] = "install_failed"
        return

    # Build (best-effort)
    pkg = json.loads((project_dir / "package.json").read_text())
    scripts = pkg.get("scripts", {})
    build_script = "build" if "build" in scripts else None
    if not build_script:
        report["node"]["status"] = "no_build_script"
        return

    if pm == "pnpm":
        build_cmd = ["pnpm", "run", "build"]
    elif pm == "yarn":
        build_cmd = ["yarn", "build"]
    else:
        build_cmd = ["npm", "run", "build"]

    code, out, err = sh(build_cmd, cwd=project_dir, env=env, timeout=1800)
    report["node"]["build"] = {"cmd": build_cmd, "code": code, "stdout_tail": out[-4000:], "stderr_tail": err[-4000:]}
    report["node"]["status"] = "built" if code == 0 else "build_failed"

def run_python_setup(project_dir: Path, report: Dict) -> None:
    report["python"]["status"] = "skipped"
    req = project_dir / "requirements.txt"
    if not req.exists():
        return

    venv_dir = project_dir / ".venv"
    # Create venv
    code, out, err = sh([sys.executable, "-m", "venv", str(venv_dir)], cwd=project_dir, timeout=600)
    report["python"]["venv"] = {"code": code, "stderr_tail": err[-2000:], "stdout_tail": out[-2000:]}
    if code != 0:
        report["python"]["status"] = "venv_failed"
        return

    pip = venv_dir / ("Scripts/pip.exe" if os.name == "nt" else "bin/pip")
    python = venv_dir / ("Scripts/python.exe" if os.name == "nt" else "bin/python")

    # Install deps
    code, out, err = sh([str(pip), "install", "-r", str(req)], cwd=project_dir, timeout=1800)
    report["python"]["install"] = {"code": code, "stderr_tail": err[-4000:], "stdout_tail": out[-4000:]}
    if code != 0:
        report["python"]["status"] = "pip_failed"
        return

    # Run tests if present (pytest)
    if (project_dir / "pytest.ini").exists() or any(project_dir.glob("test*.py")) or (project_dir / "tests").exists():
        code, out, err = sh([str(python), "-m", "pytest", "-q"], cwd=project_dir, timeout=1800)
        report["python"]["tests"] = {"code": code, "stderr_tail": err[-4000:], "stdout_tail": out[-4000:]}
        report["python"]["status"] = "tested" if code == 0 else "tests_failed"
    else:
        report["python"]["status"] = "deps_installed"

def ingest(source: str, projects_dir: Path, reports_dir: Path) -> Path:
    projects_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    ts = time.strftime("%Y%m%d-%H%M%S")
    src = source.strip()

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)

        if re.match(r"^https?://|^git@|\.git$", src):
            name = safe_name(Path(src).stem.replace(".git",""))
            work = tmp / name
            clone_git(src, work)
            root = work
        else:
            p = Path(src).expanduser().resolve()
            if not p.exists():
                raise FileNotFoundError(p)
            name = safe_name(p.stem)
            work = tmp / name
            if p.is_file() and p.suffix.lower() == ".zip":
                extract_zip(p, work)
                root = normalize_root(work)
            elif p.is_dir():
                shutil.copytree(p, work, dirs_exist_ok=True)
                root = work
            else:
                raise ValueError(f"Unsupported source: {p}")

        # Copy to canonical project directory
        dest = projects_dir / f"{name}-{ts}"
        shutil.copytree(root, dest, dirs_exist_ok=True)

    # Analyze + build
    report = {
        "source": source,
        "project_dir": str(dest),
        "detected": detect_stacks(dest),
        "node": {},
        "python": {},
        "meta": {
            "timestamp": ts,
            "platform": {"python": sys.version, "os": os.name, "sys_platform": sys.platform},
        },
    }

    if "node" in report["detected"]:
        report["node"] = {}
        run_node_build(dest, report)
    if "python" in report["detected"]:
        report["python"] = {}
        run_python_setup(dest, report)

    # Write metadata + report
    write_json(dest / "autobuilder.metadata.json", {
        "name": dest.name,
        "source": source,
        "detected_stacks": list(report["detected"].keys()),
        "report_path": str((reports_dir / f"{dest.name}.report.json").resolve()),
    })
    report_path = reports_dir / f"{dest.name}.report.json"
    write_json(report_path, report)

    return dest

def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    ap_ing = sub.add_parser("ingest", help="Ingest a zip/folder/git repo into projects/ and attempt a build")
    ap_ing.add_argument("source", help="zip path, folder path, or git url")
    ap_ing.add_argument("--projects", default=str(DEFAULT_PROJECTS), help="projects directory")
    ap_ing.add_argument("--reports", default=str(DEFAULT_REPORTS), help="reports directory")

    args = ap.parse_args()
    cfg = load_config()

    if args.cmd == "ingest":
        projects_dir = Path(args.projects)
        reports_dir = Path(args.reports)
        try:
            dest = ingest(args.source, projects_dir, reports_dir)
            print(f"OK: {dest}")
        except Exception as e:
            print(f"ERROR: {e}", file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    main()
