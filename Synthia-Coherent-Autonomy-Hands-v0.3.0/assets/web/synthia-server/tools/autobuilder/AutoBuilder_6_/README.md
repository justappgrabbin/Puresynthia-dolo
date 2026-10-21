# AutoBuilder (local)

This is a **non-AI** "autobuilder" for your app-maker: drop in an app (zip/folder/git URL) and it:

- normalizes into `projects/<name>-<timestamp>/`
- detects stacks (Node / Python, etc.)
- runs deterministic install + build steps
- emits:
  - `projects/.../autobuilder.metadata.json`
  - `reports/...report.json`

## Install

### Node projects
You need Node 18+ and *one* package manager:
- npm (default)
- pnpm (if `pnpm-lock.yaml` exists)
- yarn (if `yarn.lock` exists)

### Python projects (optional)
Python 3.10+ for venv + requirements.

## Use

```bash
python autobuilder.py ingest /path/to/app.zip
python autobuilder.py ingest /path/to/folder
python autobuilder.py ingest https://github.com/user/repo.git
```

## Plug into your app-maker

Your app-maker can watch `projects/` and read `autobuilder.metadata.json` to auto-register.

## What this is NOT
- It doesn't "invent code" like an LLM agent.
- It *does* give you the missing piece most builders need: **reliable ingestion + build normalization**.

If you want an actual coding agent *without Claude*, pair this with:
- `aider` + a local model via `ollama` (qwen2.5-coder / deepseek-coder), or
- OpenAI API if you want cloud but not Anthropic.
