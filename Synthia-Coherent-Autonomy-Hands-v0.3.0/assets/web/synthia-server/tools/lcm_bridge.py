#!/usr/bin/env python3
import importlib.util
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engines" / "mlcm (1).py"
DATA_DIR = ROOT / "data" / "lcm"


def load_model():
    spec = importlib.util.spec_from_file_location("synthia_mlcm", ENGINE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.MetaLanguageContactModel(str(DATA_DIR))


def main():
    raw = sys.stdin.read()
    payload = json.loads(raw or "{}")
    action = payload.get("action", "query")
    text = payload.get("text", "")
    source = payload.get("source", "synthia")
    model = load_model()

    if action == "status":
        result = model.status()
    elif action == "ingest_file":
        result = model.ingest_file(payload.get("path", ""), payload.get("content"), payload.get("metadata"))
    elif action == "process":
        result = model.process_text(text, source=source)
    else:
        result = model.query(text)

    print(json.dumps({"ok": True, "action": action, "result": result}, default=str))


if __name__ == "__main__":
    main()
