# 🌱 Synthia Seed Box Swarm

> **Drop your files. Press go. It finishes.**

You're tired of people tearing your app apart and giving you half-finished pieces. 
This swarm **assembles your existing Synthia files into a working Android APK** — 
without deleting anything. It only adds. It only builds. It only finishes.

---

## What It Does

1. **🔍 Discovers** all your Synthia files across your phone
2. **📦 Assembles** them into a single project (no deletions, only integration)
3. **🔧 Self-Heals** missing config files (package.json, tsconfig, etc.)
4. **🏗️ Builds** the APK using Capacitor + Android SDK
5. **📱 Installs** it on your device (or saves to Downloads)

---

## Quick Start

### Option A: One File (Self-Contained)

Just download `seedbox.sh` and run it:

```bash
# In Termux:
bash seedbox.sh
```

That's it. The swarm does everything.

### Option B: Manual Setup

```bash
# 1. Install dependencies
pkg install python nodejs openjdk-17

# 2. Run the coordinator
python3 swarm-coordinator.py
```

---

## Where to Put Your Files

The swarm scans these locations automatically:
- `~/storage/shared/Download/`
- `~/storage/shared/Documents/`
- `~/storage/shared/Synthia/`
- `~/synthia-seedbox/drop/` ← **Easiest: just drop files here**

**Supported file types:** `.ts`, `.tsx`, `.js`, `.jsx`, `.html`, `.json`, `.css`

---

## What Files It Looks For

| File | What It Is |
|------|-----------|
| `HumanAgent.tsx` | Body/avatar component |
| `EmbodiedWorld.tsx` | World component |
| `BodyPresets.ts` | Body configuration |
| `unified-cognitive-engine.ts` | Cognitive engine |
| `cognitive-physics-engine.ts` | Physics engine |
| `coordinate-space-engine.ts` | Coordinate engine |
| `universal-engine.ts` | Universal engine |
| `morph-engine.ts` | Morph engine |
| `resonance-sgan.ts` | Resonance engine |
| `fairyganmatter.ts` | FairyGAN matter |
| `ingestion-system.ts` | Ingestion system |
| `user-discernment.ts` | User discernment |
| `life-purpose-alignment.ts` | Life purpose |
| `diseminer.ts` | DISEMINER |
| `style-control-engine.ts` | Style control |
| `gamegan-simulator.ts` | GameGAN simulator |
| `human-design-gamegan.ts` | HD GameGAN |
| `package.json` | Project config |
| `index.html` | Entry point |
| `App.tsx` | App root |

---

## How It Works (The 5 Agents)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. DISCOVERER  │────▶│  2. ASSEMBLER   │────▶│  3. BUILDER     │
│  Find files     │     │  Merge project  │     │  Compile APK    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│  5. SELF-HEAL   │◀──────────────────────────│  4. INSTALLER   │
│  Fix issues     │                           │  Deploy APK     │
└─────────────────┘                           └─────────────────┘
```

---

## Safety Guarantees

- ✅ **Never deletes** your original files
- ✅ **Never overwrites** — duplicates get `.swarm.N` suffix
- ✅ **Self-healing** — creates missing configs automatically
- ✅ **Idempotent** — run it again, it just rebuilds
- ✅ **Logs everything** — check `~/synthia-seedbox/swarm.log`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No files found" | Drop files in `~/synthia-seedbox/drop/` and re-run |
| "Build failed" | Check `~/synthia-seedbox/swarm.log` for details |
| "pm install failed" | Install manually from Downloads |
| Missing Android SDK | The swarm downloads it automatically (first run only) |
| Out of space | Clear `~/synthia-seedbox/staging/` between runs |

---

## File Structure After Run

```
~/synthia-seedbox/
├── drop/                    ← Drop your files here
├── staging/
│   └── project/             ← Assembled project
├── build/
│   └── syntia-living-mirror.apk  ← The APK
├── swarm.log                ← Full log
├── swarm-coordinator.py     ← The brain
└── seedbox-bootstrap.sh     ← This script
```

---

## Re-Run Anytime

```bash
# Just run the coordinator again:
python3 ~/synthia-seedbox/swarm-coordinator.py

# Or use the quick shortcut:
bash ~/synthia-seedbox/rebuild.sh
```

---

## What This Is NOT

- ❌ NOT a code generator (it assembles YOUR code)
- ❌ NOT a replacement for your work (it finishes what you started)
- ❌ NOT going to rewrite your app (it only integrates)

---

**Built for Synthia. Built for you. Nothing deleted, only finished.** 🌱
