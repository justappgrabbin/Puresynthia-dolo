#!/usr/bin/env python3
"""
Tiny HTTP adapter for stellarproximology/Trident.

The upstream Trident MCP server is stdio/FastMCP. Synthia's phone server needs
a simple local HTTP target, so this adapter exposes a small JSON API and calls
the same Trident tool functions directly.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RUNTIME = Path(__file__).resolve().parent / "runtime"
sys.path.insert(0, str(RUNTIME))
os.chdir(RUNTIME)

from mcp_server import (  # noqa: E402
    trident_add_chunk,
    trident_generate,
    trident_list_chunks,
    trident_router,
    trident_search_rag,
)


def read_json(handler):
    length = int(handler.headers.get("content-length") or 0)
    if not length:
        return {}
    raw = handler.rfile.read(length).decode("utf-8")
    return json.loads(raw) if raw else {}


class Handler(BaseHTTPRequestHandler):
    def send_json(self, payload, status=200):
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ("/", "/health"):
            self.send_json({
                "ok": True,
                "service": "trident-http-adapter",
                "upstream": "stellarproximology/Trident",
                "tools": [
                    "trident_generate",
                    "trident_add_chunk",
                    "trident_search_rag",
                    "trident_router",
                    "trident_list_chunks",
                ],
            })
        elif self.path == "/chunks":
            self.send_json(trident_list_chunks())
        else:
            self.send_json({"error": "not found"}, 404)

    def do_POST(self):
        try:
            payload = read_json(self)
            if self.path == "/generate":
                self.send_json(trident_generate(
                    prompt=payload.get("prompt", ""),
                    head=payload.get("head"),
                    max_tokens=int(payload.get("max_tokens", 64)),
                    temperature=float(payload.get("temperature", 0.8)),
                    rag_query=payload.get("rag_query"),
                ))
            elif self.path == "/rag/add":
                self.send_json(trident_add_chunk(
                    text=payload.get("text", ""),
                    source=payload.get("source", "synthia"),
                    head_tag=payload.get("head_tag", "any"),
                ))
            elif self.path == "/rag/search":
                self.send_json(trident_search_rag(
                    query=payload.get("query", ""),
                    top_k=int(payload.get("top_k", 3)),
                    head_tag=payload.get("head_tag"),
                ))
            elif self.path == "/router":
                self.send_json(trident_router(payload.get("query", "")))
            elif self.path == "/tools/call":
                name = payload.get("name")
                args = payload.get("arguments") or {}
                if name == "trident_generate":
                    self.send_json(trident_generate(**args))
                elif name == "trident_add_chunk":
                    self.send_json(trident_add_chunk(**args))
                elif name == "trident_search_rag":
                    self.send_json(trident_search_rag(**args))
                elif name == "trident_router":
                    self.send_json(trident_router(**args))
                elif name == "trident_list_chunks":
                    self.send_json(trident_list_chunks(**args))
                else:
                    self.send_json({"error": f"unknown tool: {name}"}, 400)
            else:
                self.send_json({"error": "not found"}, 404)
        except Exception as exc:
            self.send_json({"error": str(exc), "type": exc.__class__.__name__}, 500)

    def log_message(self, fmt, *args):
        print("[trident-http]", fmt % args)


if __name__ == "__main__":
    port = int(os.environ.get("TRIDENT_HTTP_PORT", "8787"))
    host = os.environ.get("TRIDENT_HTTP_HOST", "127.0.0.1")
    print(f"TRIDENT HTTP adapter listening on http://{host}:{port}")
    ThreadingHTTPServer((host, port), Handler).serve_forever()
