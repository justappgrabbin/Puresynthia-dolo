#!/usr/bin/env python3
"""
Synthia AutoWriter: probabilistic pre-pass, deterministic post-pass.

The server can ask Trident/LLM for the pre-pass: intent, code direction, and
repair suggestions. This local post-pass writes files, checks structure, runs
build/test validation when available, retries repairs, and emits a report.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import time
from pathlib import Path
from typing import Dict, List, Tuple


def safe_name(text: str) -> str:
    text = re.sub(r"[^A-Za-z0-9._-]+", "-", text.lower()).strip("-")
    return text[:48] or "synthia-written-app"


def sh(cmd: List[str], cwd: Path, timeout: int = 240) -> Tuple[int, str, str]:
    p = subprocess.Popen(cmd, cwd=str(cwd), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
      out, err = p.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
      p.kill()
      out, err = p.communicate()
      return 124, out, err + "\n[TIMEOUT]"
    return p.returncode, out, err


def html_escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def extract_json_object(text: str):
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        pass
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.I)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except Exception:
            pass
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except Exception:
            return None
    return None


def safe_rel_path(raw: str) -> Path | None:
    rel = str(raw or "").replace("\\", "/").strip().lstrip("/")
    if not rel or "\x00" in rel:
        return None
    blocked_parts = {"..", ".", "node_modules", ".git", "data", "logs"}
    parts = [part for part in rel.split("/") if part]
    if not parts or any(part in blocked_parts for part in parts):
        return None
    suffix = Path(parts[-1]).suffix.lower()
    allowed = {
        ".html", ".css", ".js", ".mjs", ".json", ".md", ".txt",
        ".ts", ".tsx", ".jsx", ".py", ".sh", ".yml", ".yaml"
    }
    if suffix and suffix not in allowed:
        return None
    return Path(*parts)


def materialize_llm_files(target: Path, llm_note: str) -> Dict:
    payload = extract_json_object(llm_note)
    files = payload.get("files") if isinstance(payload, dict) else None
    if not isinstance(files, list):
        return {"used": False, "reason": "no files array from Trident"}
    written = []
    target.mkdir(parents=True, exist_ok=True)
    for item in files:
        if not isinstance(item, dict):
            continue
        rel = safe_rel_path(item.get("path") or item.get("file") or item.get("name"))
        if not rel:
            continue
        content = item.get("content")
        if content is None:
            content = item.get("body", "")
        out = target / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(str(content), encoding="utf-8")
        written.append(str(rel).replace("\\", "/"))
    if not written:
        return {"used": False, "reason": "Trident files were empty or unsafe"}
    (target / "synthia-write.json").write_text(json.dumps({
        "source": "trident-files",
        "created_at": int(time.time()),
        "files": written,
        "notes": payload.get("notes") if isinstance(payload, dict) else None
    }, indent=2), encoding="utf-8")
    return {"used": True, "files": written, "notes": payload.get("notes") if isinstance(payload, dict) else None}


def write_scaffold(target: Path, prompt: str, llm_note: str = "") -> None:
    target.mkdir(parents=True, exist_ok=True)
    title = "Synthia Build"
    words = re.findall(r"[A-Za-z0-9]+", prompt)
    if words:
        title = " ".join(words[:5]).title()
    features = [
        "Local phone-first dashboard",
        "Sandboxed generated source",
        "Rollback-ready promotion",
        "Probabilistic pre-pass plus deterministic validation",
    ]
    if "terminal" in prompt.lower():
        features.append("Terminal launch path")
    if "upload" in prompt.lower() or "ingest" in prompt.lower():
        features.append("Upload and ingest flow")
    if "github" in prompt.lower():
        features.append("GitHub approval workflow")

    feature_items = "\n".join(f"<li>{html_escape(item)}</li>" for item in features)
    note = html_escape(llm_note[:1200]) if llm_note else "No Trident pre-pass was supplied; local post-pass scaffold used."
    prompt_safe = html_escape(prompt)

    (target / "index.html").write_text(f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{html_escape(title)}</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <main class="shell">
    <section class="top">
      <p class="eyebrow">Synthia wrote this from a pre-pass</p>
      <h1>{html_escape(title)}</h1>
      <p>{prompt_safe}</p>
    </section>
    <section class="panel">
      <h2>Generated Capabilities</h2>
      <ul>{feature_items}</ul>
    </section>
    <section class="panel">
      <h2>Builder Note</h2>
      <pre>{note}</pre>
    </section>
    <nav>
      <a href="/dashboard">Dashboard</a>
      <a href="/builder-admin">Admin</a>
      <a href="/terminal-ui">Terminal</a>
    </nav>
  </main>
  <script src="./main.js"></script>
</body>
</html>
""", encoding="utf-8")

    (target / "style.css").write_text("""* { box-sizing: border-box; }
body { margin: 0; min-height: 100svh; background: #07090c; color: #eef3f7; font: 15px/1.45 system-ui, -apple-system, Segoe UI, sans-serif; }
.shell { width: min(900px, 100%); margin: 0 auto; padding: 18px; display: grid; gap: 12px; }
.top { min-height: 34svh; display: grid; align-content: end; padding: 28px 0; border-bottom: 1px solid #26313b; }
.eyebrow { margin: 0 0 8px; color: #20d6a4; text-transform: uppercase; letter-spacing: .08em; font-size: 12px; }
h1 { margin: 0; font-size: clamp(30px, 7vw, 54px); line-height: 1.02; letter-spacing: 0; }
h2 { margin: 0 0 8px; font-size: 15px; color: #9aa6b2; text-transform: uppercase; letter-spacing: .06em; }
p { color: #c4cdd6; }
.panel { border: 1px solid #26313b; border-radius: 8px; background: #10151b; padding: 14px; }
ul { margin: 0; padding-left: 20px; }
li { margin: 6px 0; }
pre { margin: 0; white-space: pre-wrap; word-break: break-word; color: #c4cdd6; }
nav { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
a { min-height: 44px; display: grid; place-items: center; border-radius: 6px; border: 1px solid #24584a; color: #eef3f7; text-decoration: none; background: #12201d; }
@media (max-width: 560px) { nav { grid-template-columns: 1fr; } }
""", encoding="utf-8")

    (target / "main.js").write_text("""document.documentElement.dataset.synthiaGenerated = "true";
console.log("Synthia generated app is alive.");
""", encoding="utf-8")

    (target / "synthia-write.json").write_text(json.dumps({
        "prompt": prompt,
        "llm_note_present": bool(llm_note),
        "created_at": int(time.time()),
        "entry": "index.html",
    }, indent=2), encoding="utf-8")


def repair_project(target: Path, repairs: List[str]) -> None:
    if not (target / "index.html").exists():
        (target / "index.html").write_text("<!doctype html><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><h1>Synthia repaired missing index.html</h1>", encoding="utf-8")
        repairs.append("created missing index.html")
    if not (target / "style.css").exists():
        (target / "style.css").write_text("body{font-family:system-ui;margin:24px;background:#07090c;color:#eef3f7}", encoding="utf-8")
        repairs.append("created missing style.css")
    if not (target / "main.js").exists():
        (target / "main.js").write_text("console.log('synthia repaired runtime ready')", encoding="utf-8")
        repairs.append("created missing main.js")


def validate_project(target: Path) -> Dict:
    report: Dict = {"checks": [], "ok": True}
    for rel in ["index.html", "style.css", "main.js"]:
        exists = (target / rel).exists()
        report["checks"].append({"file": rel, "exists": exists})
        report["ok"] = report["ok"] and exists
    if (target / "package.json").exists():
        code, out, err = sh(["npm", "run", "build"], cwd=target, timeout=600)
        report["npm_build"] = {"code": code, "stdout_tail": out[-2000:], "stderr_tail": err[-2000:]}
        report["ok"] = report["ok"] and code == 0
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--reports", required=True)
    parser.add_argument("--llm-note", default="")
    parser.add_argument("--max-rounds", type=int, default=3)
    args = parser.parse_args()

    out_root = Path(args.out)
    reports = Path(args.reports)
    reports.mkdir(parents=True, exist_ok=True)
    target = out_root / f"selfwrite-{int(time.time())}-{safe_name(args.prompt)}"
    generation = materialize_llm_files(target, args.llm_note)
    if not generation.get("used"):
        write_scaffold(target, args.prompt, args.llm_note)

    rounds = []
    repairs: List[str] = []
    for i in range(max(1, args.max_rounds)):
        repair_project(target, repairs)
        check = validate_project(target)
        rounds.append({"round": i + 1, "check": check, "repairs": list(repairs)})
        if check.get("ok"):
            break

    final = {
        "status": "ready" if rounds[-1]["check"].get("ok") else "needs-review",
        "project_dir": str(target),
        "prompt": args.prompt,
        "generation": generation,
        "repairs": repairs,
        "rounds": rounds,
    }
    report_path = reports / f"{target.name}.selfwrite.report.json"
    report_path.write_text(json.dumps(final, indent=2), encoding="utf-8")
    print(json.dumps({"project_dir": str(target), "report_path": str(report_path), "status": final["status"]}, indent=2))


if __name__ == "__main__":
    main()
