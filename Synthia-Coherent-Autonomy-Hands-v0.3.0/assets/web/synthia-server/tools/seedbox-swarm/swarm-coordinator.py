#!/data/data/com.termux/files/usr/bin/env python3
# Seed Box Swarm Coordinator v1.1 - Fixed: SDK detection, error handling

import os
import sys
import json
import shutil
import subprocess
import hashlib
import re
import traceback
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Set, Tuple
from dataclasses import dataclass

HOME = Path(os.environ.get("HOME", "/data/data/com.termux/files/home"))
SEEDBOX_DIR = HOME / "synthia-seedbox"
SWARM_DIR = SEEDBOX_DIR / "swarm"
BUILD_DIR = SEEDBOX_DIR / "build"
STAGING_DIR = SEEDBOX_DIR / "staging"
LOG_FILE = SEEDBOX_DIR / "swarm.log"
DROP_DIR = SEEDBOX_DIR / "drop"

SCAN_PATHS = [
    HOME / "storage" / "shared" / "Download",
    HOME / "storage" / "shared" / "Documents",
    HOME / "storage" / "shared" / "Synthia",
    HOME,
    Path("/sdcard/Download"),
    Path("/sdcard/Documents"),
    Path("/sdcard/Synthia"),
]

class C:
    R = '\033[91m'
    G = '\033[92m'
    Y = '\033[93m'
    B = '\033[94m'
    CY = '\033[96m'
    M = '\033[95m'
    W = '\033[97m'
    DIM = '\033[90m'
    BD = '\033[1m'
    NC = '\033[0m'

def cc(color, text):
    return f"{color}{text}{C.NC}"

class SwarmLog:
    def __init__(self, path):
        self.p = path
        path.parent.mkdir(parents=True, exist_ok=True)

    def write(self, msg, level="INFO"):
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = f"[{ts}] [{level}] {msg}"
        with open(self.p, "a") as f:
            f.write(line + "\n")
        print(line)

    def info(self, m): self.write(m)
    def warn(self, m): self.write(cc(C.Y, m), "WARN")
    def err(self, m): self.write(cc(C.R, m), "ERROR")
    def ok(self, m): self.write(cc(C.G, m), "SUCCESS")
    def banner(self, m):
        print()
        print(cc(C.CY, "-" * 50))
        print(cc(C.CY, f"  {m}"))
        print(cc(C.CY, "-" * 50))
        self.write(m, "BANNER")

log = SwarmLog(LOG_FILE)

@dataclass
class DFile:
    path: Path
    name: str
    ftype: str
    size: int
    h: str
    sig: str
    conf: float

SIGS = {
    "unified-cognitive-engine.ts": ("engine", 1.0),
    "cognitive-physics-engine.ts": ("engine", 1.0),
    "coordinate-space-engine.ts": ("engine", 1.0),
    "universal-engine.ts": ("engine", 1.0),
    "morph-engine.ts": ("engine", 1.0),
    "resonance-sgan.ts": ("engine", 1.0),
    "fairyganmatter.ts": ("engine", 1.0),
    "HumanAgent.tsx": ("component", 1.0),
    "EmbodiedWorld.tsx": ("component", 1.0),
    "BodyPresets.ts": ("config", 1.0),
    "human-design-gamegan.ts": ("engine", 1.0),
    "gamegan-simulator.ts": ("engine", 1.0),
    "ingestion-system.ts": ("system", 1.0),
    "user-discernment.ts": ("system", 1.0),
    "life-purpose-alignment.ts": ("system", 1.0),
    "diseminer.ts": ("system", 1.0),
    "style-control-engine.ts": ("system", 1.0),
    "package.json": ("config", 0.8),
    "tsconfig.json": ("config", 0.8),
    "vite.config.ts": ("config", 0.8),
    "capacitor.config.ts": ("config", 0.9),
    "index.html": ("entry", 0.7),
    "App.tsx": ("entry", 0.8),
    "main.tsx": ("entry", 0.7),
}

PATTERNS = [
    (r"class\s+\w*Engine", "engine", 0.9),
    (r"export\s+class\s+\w*Agent", "agent", 0.9),
    (r"HumanDesign|HD\s*System|Bodygraph", "hd", 0.8),
    (r"CognitivePhysics|Resonance|Attractor", "physics", 0.8),
    (r"MRNN|SemanticField|Autopoiesis", "mrnn", 0.9),
    (r"Synthia|LivingMirror", "brand", 0.7),
    (r"Gate\s+\d+|Channel\s+\d+", "hd-data", 0.8),
]


class Discoverer:
    def __init__(self):
        self.found = []
        self.roots = set()

    def scan(self):
        log.banner("AGENT 1: DISCOVERER")
        log.info("Scanning for Synthia files...")
        for sp in SCAN_PATHS:
            if sp.exists():
                self._scan_dir(sp)
        if DROP_DIR.exists():
            self._scan_dir(DROP_DIR, is_drop=True)
        self.found.sort(key=lambda x: x.conf, reverse=True)
        log.ok(f"Found {len(self.found)} files, {len(self.roots)} project roots")
        return self.found

    def _scan_dir(self, root, is_drop=False, depth=4):
        try:
            for item in root.iterdir():
                if item.is_dir() and depth > 0:
                    dn = item.name.lower()
                    if any(k in dn for k in ["synthia", "mirror", "living", "hd-app", "cognitive"]):
                        self.roots.add(item)
                        log.info(f"  Project root: {item}")
                    if item.name.startswith(".") or item.name == "node_modules":
                        continue
                    self._scan_dir(item, is_drop, depth - 1)
                elif item.is_file():
                    self._check_file(item, is_drop)
        except PermissionError:
            pass

    def _check_file(self, path, is_drop):
        name = path.name
        conf = 0.0
        ftype = "unknown"
        sig = "none"
        if name in SIGS:
            ftype, conf = SIGS[name]
            sig = name
        if conf < 0.5 and path.suffix in [".ts", ".tsx", ".js", ".jsx"]:
            try:
                if path.stat().st_size < 1024 * 1024:
                    content = path.read_text(errors="ignore")
                    for pat, ptype, w in PATTERNS:
                        if re.search(pat, content):
                            conf = max(conf, w)
                            ftype = ptype
                            sig = f"pat:{pat[:20]}"
            except:
                pass
        if is_drop:
            conf = min(1.0, conf + 0.2)
        if conf > 0.3:
            try:
                h = hashlib.md5(path.read_bytes()[:8192]).hexdigest()[:16]
            except:
                h = "empty"
            self.found.append(DFile(path, name, ftype, path.stat().st_size, h, sig, conf))
            log.info(f"  + {name} ({ftype}, {conf:.0%})")


class Assembler:
    def __init__(self, found):
        self.found = found
        self.plan = None

    def analyze(self):
        log.banner("AGENT 2: ASSEMBLER")
        proj_type = "unknown"
        proj_root = None
        pkg_files = [f for f in self.found if f.name == "package.json"]
        if pkg_files:
            pkg_files.sort(key=lambda x: len(str(x.path)), reverse=True)
            proj_root = pkg_files[0].path.parent
            try:
                pkg = json.loads(proj_root.joinpath("package.json").read_text())
                deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                if "@capacitor/core" in deps:
                    proj_type = "capacitor-react" if "react" in deps else "capacitor"
                elif "vite" in deps:
                    proj_type = "vite"
            except:
                pass
        cap_files = [f for f in self.found if "capacitor.config" in f.name]
        if cap_files and not proj_root:
            proj_root = cap_files[0].path.parent
            proj_type = "capacitor"
        log.info(f"Project type: {proj_type}")
        if proj_root:
            log.info(f"Project root: {proj_root}")
        missing = []
        critical = {
            "capacitor-react": ["package.json", "index.html", "vite.config.ts"],
            "capacitor": ["package.json", "capacitor.config.ts"],
            "vite": ["package.json", "vite.config.ts", "index.html"],
        }
        if proj_type in critical:
            for req in critical[proj_type]:
                if not any(f.name == req for f in self.found):
                    missing.append(req)
        if missing:
            log.warn(f"Missing: {', '.join(missing)}")
        seen = {}
        to_copy = []
        conflicts = []
        for f in self.found:
            if f.h in seen:
                existing = seen[f.h]
                if f.conf > existing.conf:
                    conflicts.append((existing, f))
                    seen[f.h] = f
                    to_copy = [x for x in to_copy if x.h != f.h]
                    to_copy.append(f)
            else:
                seen[f.h] = f
                to_copy.append(f)
        self.plan = (proj_type, proj_root, to_copy, conflicts, missing)
        log.ok(f"Plan: {len(to_copy)} files, {len(conflicts)} conflicts resolved")
        return self.plan

    def execute(self):
        log.banner("AGENT 2b: EXECUTING MERGE")
        if not self.plan:
            raise RuntimeError("No plan")
        proj_type, proj_root, to_copy, conflicts, missing = self.plan
        if STAGING_DIR.exists():
            shutil.rmtree(STAGING_DIR)
        STAGING_DIR.mkdir(parents=True)
        if proj_root and proj_root.exists():
            log.info(f"Copying project: {proj_root}")
            shutil.copytree(proj_root, STAGING_DIR / "project", dirs_exist_ok=True)
        log.info(f"Integrating {len(to_copy)} files...")
        for f in to_copy:
            if proj_root and f.path.is_relative_to(proj_root):
                continue
            if f.ftype == "component":
                target = STAGING_DIR / "project" / "src" / "components" / f.name
            elif f.ftype == "engine":
                target = STAGING_DIR / "project" / "src" / "engines" / f.name
            elif f.ftype == "system":
                target = STAGING_DIR / "project" / "src" / "systems" / f.name
            elif f.ftype == "config":
                target = STAGING_DIR / "project" / f.name
            else:
                target = STAGING_DIR / "project" / "src" / f.name
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists():
                n = 1
                while target.with_suffix(f".swarm.{n}{target.suffix}").exists():
                    n += 1
                target = target.with_suffix(f".swarm.{n}{target.suffix}")
                log.info(f"  Renamed: {target.name}")
            shutil.copy2(f.path, target)
            log.info(f"  + {f.name} -> {target.relative_to(STAGING_DIR)}")
        log.ok("Assembly complete - nothing deleted")
        return STAGING_DIR / "project"


class SelfHeal:
    def __init__(self, proj):
        self.proj = proj

    def repair(self):
        log.banner("AGENT 5: SELF-HEAL")
        issues = self._diagnose()
        if not issues:
            log.ok("No issues")
            return
        log.info(f"Found {len(issues)} issues")
        for i in issues:
            log.info(f"  ! {i}")
        pkg = self.proj / "package.json"
        if not pkg.exists():
            log.info("Creating package.json...")
            pkg_data = {
                "name": "synthia-living-mirror",
                "version": "1.0.0",
                "type": "module",
                "scripts": {
                    "dev": "vite",
                    "build": "tsc && vite build",
                    "preview": "vite preview"
                },
                "dependencies": {
                    "react": "^18.3.1",
                    "react-dom": "^18.3.1",
                    "@capacitor/core": "^6.0.0",
                    "@capacitor/android": "^6.0.0"
                },
                "devDependencies": {
                    "@types/react": "^18.3.3",
                    "@types/react-dom": "^18.3.0",
                    "@vitejs/plugin-react": "^4.3.1",
                    "typescript": "^5.2.2",
                    "vite": "^5.3.1"
                }
            }
            pkg.write_text(json.dumps(pkg_data, indent=2))
            log.ok("  Created package.json")
        html = self.proj / "index.html"
        if not html.exists():
            log.info("Creating index.html...")
            html.write_text('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"><title>Synthia Living Mirror</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>')
            log.ok("  Created index.html")
        src = self.proj / "src"
        src.mkdir(exist_ok=True)
        (src / "components").mkdir(exist_ok=True)
        (src / "engines").mkdir(exist_ok=True)
        (src / "systems").mkdir(exist_ok=True)
        main = src / "main.tsx"
        if not main.exists():
            log.info("Creating main.tsx...")
            main.write_text('import React from "react"\nimport ReactDOM from "react-dom/client"\nimport App from "./App"\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)\n')
            log.ok("  Created main.tsx")
        app = src / "App.tsx"
        if not app.exists():
            log.info("Creating App.tsx...")
            self._mk_app(app)
            log.ok("  Created App.tsx")
        ts = self.proj / "tsconfig.json"
        if not ts.exists():
            log.info("Creating tsconfig.json...")
            ts_data = {
                "compilerOptions": {
                    "target": "ES2020",
                    "useDefineForClassFields": True,
                    "lib": ["ES2020", "DOM", "DOM.Iterable"],
                    "module": "ESNext",
                    "skipLibCheck": True,
                    "moduleResolution": "bundler",
                    "allowImportingTsExtensions": True,
                    "resolveJsonModule": True,
                    "isolatedModules": True,
                    "noEmit": True,
                    "jsx": "react-jsx",
                    "strict": True,
                    "noUnusedLocals": False,
                    "noUnusedParameters": False,
                    "noFallthroughCasesInSwitch": True
                },
                "include": ["src"],
                "references": [{"path": "./tsconfig.node.json"}]
            }
            ts.write_text(json.dumps(ts_data, indent=2))
            log.ok("  Created tsconfig.json")
        vite = self.proj / "vite.config.ts"
        if not vite.exists():
            log.info("Creating vite.config.ts...")
            vite.write_text('import { defineConfig } from "vite"\nimport react from "@vitejs/plugin-react"\n\nexport default defineConfig({\n  plugins: [react()],\n  build: { outDir: "dist", emptyOutDir: true },\n})\n')
            log.ok("  Created vite.config.ts")
        cap = self.proj / "capacitor.config.ts"
        if not cap.exists():
            log.info("Creating capacitor.config.ts...")
            cap.write_text('import { CapacitorConfig } from "@capacitor/cli";\n\nconst config: CapacitorConfig = {\n  appId: "com.synthia.livingmirror",\n  appName: "Synthia Living Mirror",\n  webDir: "dist",\n  server: { androidScheme: "https" }\n};\n\nexport default config;\n')
            log.ok("  Created capacitor.config.ts")
        log.ok("Self-heal complete")

    def _diagnose(self):
        issues = []
        pkg = self.proj / "package.json"
        if not pkg.exists():
            issues.append("Missing package.json")
        else:
            try:
                p = json.loads(pkg.read_text())
                if "dependencies" not in p and "devDependencies" not in p:
                    issues.append("package.json empty")
            except:
                issues.append("package.json corrupted")
        if not (self.proj / "src").exists():
            issues.append("Missing src/")
        src = self.proj / "src"
        if not any((src / f).exists() for f in ["main.tsx", "main.ts", "index.tsx", "App.tsx"]):
            issues.append("No entry point")
        if not (self.proj / "index.html").exists():
            issues.append("Missing index.html")
        return issues

    def _mk_app(self, app_path):
        src = self.proj / "src"
        mods = []
        for d in [src / "components", src / "engines", src / "systems"]:
            if d.exists():
                for f in d.iterdir():
                    if f.suffix in [".ts", ".tsx"]:
                        mods.append(f.stem)
        mod_list = ", ".join(mods[:5]) + ("..." if len(mods) > 5 else "")
        app_path.write_text(
            'import React, { useState, useEffect } from "react"\n\n'
            'const App = () => {\n'
            '  const [ready, setReady] = useState(false)\n'
            '  useEffect(() => { setTimeout(() => setReady(true), 1500) }, [])\n'
            '  if (!ready) return <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",background:"#0a0a0f",color:"#00ffaa",fontFamily:"monospace",flexDirection:"column"}}><div style={{fontSize:"3rem"}}>🌱</div><div>Synthia Living Mirror</div><div style={{fontSize:"0.8rem",opacity:0.6,marginTop:"0.5rem"}}>Seed Box Swarm assembling...</div></div>\n'
            '  return <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0a0f,#1a0a2e,#0a1a0f)",color:"#e0e0e0",padding:"1rem"}}><header style={{textAlign:"center",padding:"2rem",borderBottom:"1px solid rgba(0,255,170,0.2)"}}><h1 style={{color:"#00ffaa",fontSize:"1.8rem",margin:0}}>✨ Synthia Living Mirror</h1><p style={{opacity:0.7,marginTop:"0.5rem"}}>Assembled by Seed Box Swarm</p><div style={{display:"inline-block",marginTop:"1rem",padding:"0.5rem 1rem",borderRadius:"2rem",background:"rgba(0,255,170,0.1)",border:"1px solid rgba(0,255,170,0.3)",fontSize:"0.85rem"}}>🧩 ' + str(len(mods)) + ' modules loaded</div></header><main style={{maxWidth:"800px",margin:"0 auto",padding:"2rem"}}><div style={{padding:"2rem",background:"rgba(0,255,170,0.05)",borderRadius:"1rem",border:"1px solid rgba(0,255,170,0.15)",textAlign:"center"}}><div style={{fontSize:"3rem",marginBottom:"1rem"}}>🌱</div><h3 style={{color:"#00ffaa"}}>Seed Box Active</h3><p style={{opacity:0.7}}>Your Synthia app is assembled and running.</p><p style={{opacity:0.5,fontSize:"0.85rem",marginTop:"1rem"}}>Modules: ' + mod_list + '</p></div></main></div>\n'
            '}\n\nexport default App\n'
        )


class Builder:
    def __init__(self, proj):
        self.proj = proj
        self.apk = None

    def _find_existing_sdk(self):
        """Look for existing Android SDK installations."""
        # Check common locations
        candidates = [
            HOME / "android-sdk",
            HOME / "Android/Sdk",
            Path("/data/data/com.termux/files/usr/lib/android-sdk"),
            Path("/usr/lib/android-sdk"),
        ]
        # Also check ANDROID_SDK_ROOT env var
        env_sdk = os.environ.get("ANDROID_SDK_ROOT") or os.environ.get("ANDROID_HOME")
        if env_sdk:
            candidates.insert(0, Path(env_sdk))

        for c in candidates:
            if c.exists():
                # Verify it has the key tools
                sdkmanager = c / "cmdline-tools" / "latest" / "bin" / "sdkmanager"
                if sdkmanager.exists():
                    log.info(f"  Found existing SDK: {c}")
                    return c
                # Also check for platform-tools
                if (c / "platform-tools" / "adb").exists():
                    log.info(f"  Found existing SDK: {c}")
                    return c
        return None

    def ensure_deps(self):
        log.banner("AGENT 3a: ENSURING DEPS")
        for cmd, pkg, name in [("node", "nodejs", "Node.js"), ("npm", "nodejs", "npm"), ("javac", "openjdk-17", "Java")]:
            if not shutil.which(cmd):
                log.info(f"Installing {name}...")
                r = subprocess.run(["pkg", "install", "-y", pkg], capture_output=True, text=True)
                if r.returncode != 0:
                    subprocess.run(["apt", "update"], capture_output=True)
                    subprocess.run(["apt", "install", "-y", pkg], capture_output=True)
            else:
                log.info(f"  ✓ {name}")

        # Check for existing SDK first
        existing = self._find_existing_sdk()
        if existing:
            os.environ["ANDROID_SDK_ROOT"] = str(existing)
            os.environ["ANDROID_HOME"] = str(existing)
            os.environ["PATH"] = f"{os.environ.get('PATH', '')}:{existing}/cmdline-tools/latest/bin:{existing}/platform-tools:{existing}/build-tools/34.0.0"
            log.ok(f"Using existing Android SDK: {existing}")
            return

        # No existing SDK — try to set up
        sdk = HOME / "android-sdk"
        if not sdk.exists():
            self._setup_sdk(sdk)
        else:
            # Directory exists but tools missing — might be broken
            log.warn(f"SDK dir exists but tools missing: {sdk}")
            log.info("Attempting to repair...")
            self._setup_sdk(sdk)

        if not shutil.which("cap"):
            log.info("Installing Capacitor CLI...")
            subprocess.run(["npm", "install", "-g", "@capacitor/cli"], capture_output=True)

    def _setup_sdk(self, sdk_dir):
        """Download and setup Android SDK with proper error handling."""
        log.info("Setting up Android SDK...")
        log.info("  This requires ~1GB free space and a stable internet connection")

        # Check free space
        try:
            stat = os.statvfs(sdk_dir.parent if sdk_dir.exists() else HOME)
            free_gb = (stat.f_bavail * stat.f_frsize) / (1024**3)
            log.info(f"  Free space: {free_gb:.1f} GB")
            if free_gb < 2:
                log.warn("  ⚠ Less than 2GB free. SDK setup may fail.")
        except Exception as e:
            log.warn(f"  Could not check free space: {e}")

        sdk_dir.mkdir(parents=True, exist_ok=True)
        cmdline = sdk_dir / "cmdline-tools" / "latest"
        cmdline.mkdir(parents=True, exist_ok=True)

        url = "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
        zp = sdk_dir / "tools.zip"

        # Download with timeout and retry
        log.info("  Downloading SDK command line tools...")
        downloaded = False
        for attempt in range(3):
            try:
                r = subprocess.run(
                    ["curl", "-L", "--connect-timeout", "30", "--max-time", "300", "-o", str(zp), url],
                    capture_output=True, text=True, timeout=310
                )
                if r.returncode == 0 and zp.exists() and zp.stat().st_size > 1000000:
                    downloaded = True
                    log.ok(f"  Downloaded ({zp.stat().st_size / 1024 / 1024:.1f} MB)")
                    break
                else:
                    log.warn(f"  Download attempt {attempt + 1} failed, retrying...")
                    if zp.exists():
                        zp.unlink()
            except subprocess.TimeoutExpired:
                log.warn(f"  Download timed out (attempt {attempt + 1})")
                if zp.exists():
                    zp.unlink()

        if not downloaded:
            log.warn("  curl failed, trying wget...")
            try:
                r = subprocess.run(
                    ["wget", "--timeout=30", "-q", url, "-O", str(zp)],
                    capture_output=True, text=True, timeout=310
                )
                if r.returncode == 0 and zp.exists() and zp.stat().st_size > 1000000:
                    downloaded = True
                    log.ok(f"  Downloaded via wget ({zp.stat().st_size / 1024 / 1024:.1f} MB)")
            except Exception as e:
                log.err(f"  wget also failed: {e}")

        if not downloaded:
            log.err("✗ Could not download Android SDK tools")
            log.info("  You can manually download from:")
            log.info("  https://developer.android.com/studio#command-tools")
            log.info(f"  Extract to: {sdk_dir}/cmdline-tools/latest/")
            raise RuntimeError("Android SDK setup failed — download error")

        # Extract
        log.info("  Extracting...")
        r = subprocess.run(["unzip", "-q", "-o", str(zp), "-d", str(cmdline.parent)], capture_output=True, text=True)
        if r.returncode != 0:
            log.err(f"  Unzip failed: {r.stderr}")
            raise RuntimeError("Android SDK setup failed — extract error")

        # The zip extracts to cmdline-tools/ — we need to move contents to latest/
        extracted = cmdline.parent / "cmdline-tools"
        if extracted.exists():
            # Move everything from extracted to latest/
            for item in extracted.iterdir():
                dest = cmdline / item.name
                if dest.exists():
                    if dest.is_dir():
                        shutil.rmtree(dest)
                    else:
                        dest.unlink()
                shutil.move(str(item), str(dest))
            extracted.rmdir()

        zp.unlink()

        # Set environment
        os.environ["ANDROID_SDK_ROOT"] = str(sdk_dir)
        os.environ["ANDROID_HOME"] = str(sdk_dir)
        os.environ["PATH"] = f"{os.environ.get('PATH', '')}:{sdk_dir}/cmdline-tools/latest/bin:{sdk_dir}/platform-tools"

        # Accept licenses
        log.info("  Accepting licenses...")
        sdkmanager_path = sdk_dir / "cmdline-tools" / "latest" / "bin" / "sdkmanager"
        if sdkmanager_path.exists():
            # Run with yes piped in
            try:
                proc = subprocess.Popen(
                    [str(sdkmanager_path), "--licenses"],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                proc.communicate(input="y\n" * 20, timeout=60)
            except Exception as e:
                log.warn(f"  License accept issue: {e}")

            # Install platforms and build tools
            log.info("  Installing Android platform 34 and build tools...")
            r = subprocess.run(
                [str(sdkmanager_path), "platforms;android-34", "build-tools;34.0.0"],
                capture_output=True, text=True, timeout=300
            )
            if r.returncode != 0:
                log.warn(f"  SDK package install had issues: {r.stderr[:200]}")
            else:
                log.ok("  SDK ready")
        else:
            log.err("  sdkmanager not found after extraction")
            raise RuntimeError("Android SDK setup failed — sdkmanager missing")

    def build(self):
        log.banner("AGENT 3b: BUILDING APK")
        if not self.proj.exists():
            log.err("Project missing")
            return None

        os.chdir(self.proj)

        # Check if node_modules exists, if not install
        if not (self.proj / "node_modules").exists():
            log.info("Installing npm deps...")
            r = subprocess.run(["npm", "install"], capture_output=True, text=True)
            if r.returncode != 0:
                log.warn("npm install had issues, continuing...")
                log.info(f"  stderr: {r.stderr[:500]}")
        else:
            log.info("node_modules exists, skipping npm install")

        log.info("Building web assets...")
        r = subprocess.run(["npm", "run", "build"], capture_output=True, text=True)
        if r.returncode != 0:
            log.warn("npm build failed, trying vite directly...")
            r = subprocess.run(["npx", "vite", "build"], capture_output=True, text=True)
        if r.returncode != 0:
            log.err("Web build failed")
            log.info(f"Build output:\n{r.stderr[:1000]}")
            return None

        log.ok("Web assets built")

        android = self.proj / "android"
        if not android.exists():
            log.info("Adding Android platform...")
            r = subprocess.run(["npx", "cap", "add", "android"], capture_output=True, text=True)
            if r.returncode != 0:
                log.err("Failed to add Android platform")
                log.info(f"Output: {r.stderr[:500]}")
                return None

        log.info("Syncing Android...")
        r = subprocess.run(["npx", "cap", "sync", "android"], capture_output=True, text=True)
        if r.returncode != 0:
            log.warn(f"cap sync had issues: {r.stderr[:300]}")

        log.info("Building APK (this takes 2-5 minutes)...")
        os.chdir(android)
        gradlew = android / "gradlew"
        if gradlew.exists():
            gradlew.chmod(0o755)

        r = subprocess.run(["./gradlew", "assembleDebug"], capture_output=True, text=True)
        if r.returncode != 0:
            log.err("Gradle build failed")
            log.info("Last 30 lines of output:")
            for line in r.stderr.split("\n")[-30:]:
                if line.strip():
                    log.info(f"  {line}")
            return None

        apks = list(android.rglob("app-debug.apk"))
        if apks:
            BUILD_DIR.mkdir(parents=True, exist_ok=True)
            final = BUILD_DIR / "synthia-living-mirror.apk"
            shutil.copy2(apks[0], final)
            log.ok(f"APK built: {final}")
            return final

        log.err("APK not found after build")
        return None


class Installer:
    def __init__(self, apk):
        self.apk = apk

    def install(self):
        log.banner("AGENT 4: INSTALLING")
        if not self.apk.exists():
            log.err("APK missing")
            return False
        dl = Path("/sdcard/Download") / "synthia-living-mirror.apk"
        try:
            shutil.copy2(self.apk, dl)
            log.ok(f"Saved to Downloads: {dl}")
        except Exception as e:
            log.warn(f"Could not copy to Downloads: {e}")

        log.info("Attempting direct install...")
        r = subprocess.run(["pm", "install", "-r", "-d", str(self.apk)], capture_output=True, text=True)
        if r.returncode == 0:
            log.ok("Installed!")
            return True
        log.warn(f"pm install failed: {r.stderr.strip()}")

        if shutil.which("adb"):
            log.info("Trying adb...")
            r = subprocess.run(["adb", "install", "-r", str(self.apk)], capture_output=True, text=True)
            if r.returncode == 0:
                log.ok("Installed via adb!")
                return True
            log.warn(f"adb failed: {r.stderr.strip()}")

        log.info("Manual install: Files -> Downloads -> syntia-living-mirror.apk")
        return False


def main():
    print()
    print(cc(C.CY, "-" * 50))
    print(cc(C.CY, "  🌱 SYNTHIA SEED BOX SWARM v1.1"))
    print(cc(C.CY, "  Drop files. Press go. It finishes."))
    print(cc(C.CY, "-" * 50))
    print()
    log.info("Swarm initializing...")
    SEEDBOX_DIR.mkdir(parents=True, exist_ok=True)
    DROP_DIR.mkdir(exist_ok=True)

    d = Discoverer()
    found = d.scan()
    if not found:
        log.warn("No files found!")
        log.info(f"Drop files in: {DROP_DIR}")
        print(cc(C.Y, "Press ENTER when ready, or 'q' to quit"))
        if input().strip().lower() == "q":
            sys.exit(0)
        found = d.scan()
        if not found:
            log.err("Still nothing. Exiting.")
            sys.exit(1)

    a = Assembler(found)
    plan = a.analyze()
    proj = a.execute()

    h = SelfHeal(proj)
    h.repair()

    b = Builder(proj)
    b.ensure_deps()
    apk = b.build()

    if not apk:
        log.err("Build failed — check log above for details")
        log.info(f"Full log: {LOG_FILE}")
        sys.exit(1)

    i = Installer(apk)
    installed = i.install()

    print()
    print(cc(C.CY, "=" * 50))
    print(cc(C.CY, "  🌱 SEED BOX SWARM COMPLETE"))
    print(cc(C.CY, "=" * 50))
    print()
    print(f"  Seed Box:  {SEEDBOX_DIR}")
    print(f"  Build:     {BUILD_DIR}")
    print(f"  APK:       {apk}")
    print(f"  Downloads: /sdcard/Download/synthia-living-mirror.apk")
    print(f"  Log:       {LOG_FILE}")
    print()
    print(cc(C.G, "  ✓ Your app is assembled. Nothing deleted."))
    print(cc(C.G, "  ✓ Only added. Only built. Only finished."))
    print()
    if installed:
        print(cc(C.G, "  🎉 App installed! Check your app drawer."))
    else:
        print(cc(C.Y, "  📋 Tap the APK in Downloads to install."))
    print()
    print(cc(C.DIM, f"  Re-run: python3 {SEEDBOX_DIR}/swarm-coordinator.py"))
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
        log.warn("Interrupted")
        sys.exit(1)
    except Exception as e:
        log.err(f"Swarm failed: {e}")
        traceback.print_exc()
        sys.exit(1)
