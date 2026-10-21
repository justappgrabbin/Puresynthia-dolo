# Third-party donor notes

This package does not vendor the Mobile MCP server or the AION application. It contains Synthia-specific implementations informed by their public architecture and capability contracts.

- Mobile MCP: Apache-2.0, commit `648a6a4b86a8501fd8ebcae923474fc5f11311f2`. Telemetry code and external controller dependencies are not included.
- AION superagente: dual MIT/Apache-2.0, commit `7d12124ce05b433ef73d6ce023bd3580ab0c02f3`. Its LLM/backend stack is not included.

Synthia's preserved authority archives remain separately hashed in `AUTHORITY-SHA256.json`.
