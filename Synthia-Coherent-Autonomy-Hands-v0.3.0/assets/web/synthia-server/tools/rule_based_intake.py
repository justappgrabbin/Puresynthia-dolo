#!/usr/bin/env python3
"""Rule-based intake pre-pass for Synthia Seedbox Swarm."""

from __future__ import annotations

import argparse
import json
import shutil
import time
from pathlib import Path


def load_rules(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def has_project_marker(path: Path, markers: list[str]) -> bool:
    if path.is_file():
        return path.name in markers
    return any((path / marker).exists() for marker in markers)


def copy_any(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        stamped = f"{target.stem}-{int(time.time())}{target.suffix}"
        target = target.with_name(stamped)
    if source.is_dir():
        shutil.copytree(source, target, dirs_exist_ok=True)
    else:
        shutil.copy2(source, target)


def manifest_copy(source: Path, staging: Path, manifest_name: str) -> list[dict]:
    manifest_path = source / manifest_name if source.is_dir() else None
    if not manifest_path or not manifest_path.exists():
        return []
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    placements = []
    for entry in manifest.get("files", []):
        src_rel = entry.get("source") or entry.get("path")
        dst_rel = entry.get("target") or entry.get("where")
        if not src_rel or not dst_rel:
            continue
        src = source / src_rel
        if not src.exists():
            continue
        dst = staging / "manifest" / dst_rel
        copy_any(src, dst)
        placements.append({"source": str(src), "target": str(dst), "rule": "manifest"})
    return placements


def terms_for(path: Path) -> str:
    try:
        sample = path.read_text(encoding="utf-8", errors="ignore")[:4096] if path.is_file() else ""
    except OSError:
        sample = ""
    return f"{path.name}\n{sample}".lower()


def rule_destination(path: Path, rules: dict) -> tuple[str, str]:
    text = terms_for(path)
    for organ in rules.get("organs", []):
        if any(str(term).lower() in text for term in organ.get("what", [])):
            return organ.get("where", "review"), organ.get("id", "organ-rule")
    ext_map = rules.get("extensions", {})
    if path.is_file() and path.suffix.lower() in ext_map:
        return ext_map[path.suffix.lower()], f"extension:{path.suffix.lower()}"
    return rules.get("unknown_destination", "review"), "unknown-review"


def run(drop: Path, staging: Path, rules_path: Path, report_path: Path) -> dict:
    rules = load_rules(rules_path)
    markers = rules.get("project_markers", [])
    manifest_name = rules.get("manifest_name", "synthia-manifest.json")
    report = {"ok": True, "drop": str(drop), "staging": str(staging), "rules": str(rules_path), "placements": []}
    staging.mkdir(parents=True, exist_ok=True)
    if not drop.exists():
        report["ok"] = False
        report["error"] = "drop directory not found"
    else:
        for item in drop.iterdir():
            manifest_placements = manifest_copy(item, staging, manifest_name)
            if manifest_placements:
                report["placements"].extend(manifest_placements)
                continue
            if has_project_marker(item, markers):
                target = staging / "projects" / item.stem
                copy_any(item, target)
                report["placements"].append({"source": str(item), "target": str(target), "rule": "complete-project"})
                continue
            destination, rule_id = rule_destination(item, rules)
            target = staging / destination / item.name
            copy_any(item, target)
            report["placements"].append({"source": str(item), "target": str(target), "rule": rule_id})
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--drop", required=True)
    parser.add_argument("--staging", required=True)
    parser.add_argument("--rules", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()
    run(Path(args.drop), Path(args.staging), Path(args.rules), Path(args.report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
