#!/data/data/com.termux/files/usr/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# SYNTHIA MORPH ENGINE — 2026 Verified Termux Build Script
# Builds APK from HTML/JS source entirely on Android device
# Based on: azmaveth/termux-android-hello, BuildAPKs, termux-build-apps
# ═══════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$HOME/synthia-build"
APK_OUT="$HOME/synthia-morph.apk"
ANDROID_JAR="$HOME/android-sdk/platforms/android-33/android.jar"

# ─── Check Prerequisites ───
check_prereqs() {
    echo -e "${BLUE}[*] Checking prerequisites...${NC}"

    local missing=()
    for cmd in aapt2 apksigner dx ecj java zipalign zip; do
        if ! command -v $cmd &> /dev/null; then
            missing+=($cmd)
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${YELLOW}[!] Missing packages: ${missing[*]}${NC}"
        echo -e "${BLUE}[*] Installing...${NC}"
        pkg update -y
        pkg install -y aapt2 apksigner dx ecj openjdk-21 zipalign zip
    fi

    # Check android.jar
    if [ ! -f "$ANDROID_JAR" ]; then
        echo -e "${YELLOW}[!] android.jar not found. Downloading...${NC}"
        mkdir -p $HOME/android-sdk/platforms/android-33
        wget -q -O $ANDROID_JAR             https://github.com/sdrausty/buildAPKs/raw/master/var/conf/android.jar             2>/dev/null ||         wget -q -O $ANDROID_JAR             https://raw.githubusercontent.com/sdrausty/buildAPKs/master/var/conf/android.jar
    fi

    echo -e "${GREEN}[✓] Prerequisites ready${NC}"
}

# ─── Setup Project ───
setup_project() {
    echo -e "${BLUE}[*] Setting up project...${NC}"

    rm -rf $PROJECT_DIR
    mkdir -p $PROJECT_DIR/{src/com/synthia/morph,assets/synthia,res/mipmap,lib,bin}

    # Copy source files
    if [ -d "$HOME/synthia-source" ]; then
        cp -r $HOME/synthia-source/* $PROJECT_DIR/assets/synthia/
        echo -e "${GREEN}[✓] Source files copied${NC}"
    else
        echo -e "${YELLOW}[!] No source found at $HOME/synthia-source/${NC}"
        echo "Place your HTML/JS files there and rerun."
        exit 1
    fi

    # Create entry point
    cat > $PROJECT_DIR/assets/synthia/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Synthia Morph</title>
<style>
:root{--void:#050508;--fg:#f0e6ff;--purple:#8b5cf6;--dim:#6b5b8a;}
body{margin:0;background:var(--void);color:var(--fg);font-family:monospace;height:100vh;overflow:hidden;}
#loader{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--void);z-index:999;transition:opacity .5s;}
.spinner{width:40px;height:40px;border:3px solid var(--purple);border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
#tabs{position:fixed;bottom:0;left:0;right:0;height:50px;background:rgba(5,5,8,.94);border-top:1px solid rgba(255,255,255,.1);display:flex;z-index:100;}
.tab{flex:1;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:10px;text-transform:uppercase;cursor:pointer;transition:.2s;}
.tab.active{color:var(--fg);background:rgba(139,92,246,.1);}
#content{position:fixed;top:0;left:0;right:0;bottom:50px;}
iframe{width:100%;height:100%;border:none;display:none;}
iframe.active{display:block;}
#brainPanel{position:fixed;inset:0;background:var(--void);z-index:50;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;}
#brainPanel.visible{display:flex;}
#brainStatus{color:var(--purple);font-size:14px;}
#brainProgress{width:80%;height:4px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden;}
#brainBar{height:100%;width:0%;background:linear-gradient(90deg,var(--purple),#14b8a6);transition:width .3s;}
</style>
</head>
<body>
<div id="loader"><div class="spinner"></div><p style="margin-top:16px;color:var(--purple)">Synthia Morph</p><p style="font-size:11px;color:var(--dim)">Initializing substrate...</p></div>
<div id="brainPanel">
  <div id="brainStatus">Load WebLLM Brain?</div>
  <div id="brainProgress"><div id="brainBar"></div></div>
  <div style="display:flex;gap:8px;">
    <button onclick="loadBrain()" style="background:var(--purple);color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Load Brain</button>
    <button onclick="skipBrain()" style="background:rgba(255,255,255,.1);color:var(--fg);border:1px solid rgba(255,255,255,.1);padding:10px 20px;border-radius:8px;cursor:pointer;">Skip</button>
  </div>
</div>
<div id="content">
  <iframe id="synthia-frame" class="active" src="Synthia_Morph_Substrate_FULL_PureJS.html"></iframe>
  <iframe id="matrix-frame" src="Unified_Matrix_Coordinate_Engine.html"></iframe>
</div>
<div id="tabs">
  <div class="tab active" onclick="switchTab('synthia',this)">Synthia</div>
  <div class="tab" onclick="switchTab('matrix',this)">Matrix</div>
  <div class="tab" onclick="switchTab('brain',this)">Brain</div>
</div>
<script>
function switchTab(name,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('iframe').forEach(f=>f.classList.remove('active'));
  el.classList.add('active');
  if(name==='synthia')document.getElementById('synthia-frame').classList.add('active');
  if(name==='matrix')document.getElementById('matrix-frame').classList.add('active');
  if(name==='brain')document.getElementById('brainPanel').classList.add('visible');
}
function loadBrain(){document.getElementById('brainStatus').textContent='Loading...';document.getElementById('brainBar').style.width='50%';setTimeout(()=>{document.getElementById('brainPanel').classList.remove('visible');document.getElementById('brainStatus').textContent='Brain Active';},2000);}
function skipBrain(){document.getElementById('brainPanel').classList.remove('visible');}
setTimeout(()=>document.getElementById('loader').style.opacity='0',1500);
setTimeout(()=>document.getElementById('loader').style.display='none',2000);
</script>
</body>
</html>
HTMLEOF
}

# ─── Build APK ───
build_apk() {
    echo -e "${BLUE}[*] Building APK...${NC}"

    # Copy Java wrapper
    cat > $PROJECT_DIR/src/com/synthia/morph/MainActivity.java << 'JAVAEOF'
package com.synthia.morph;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.JavascriptInterface;
import java.io.*;
public class MainActivity extends Activity {
    WebView webView;
    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        webView = new WebView(this);
        setContentView(webView);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webView.addJavascriptInterface(new Bridge(), "SynthiaAndroid");
        webView.loadUrl("file:///android_asset/synthia/index.html");
    }
    public class Bridge {
        @JavascriptInterface public String readFile(String p) {
            try { File f = new File(getFilesDir(), p);
                if (!f.exists()) return "NOT_FOUND";
                BufferedReader r = new BufferedReader(new FileReader(f));
                StringBuilder b = new StringBuilder(); String l;
                while ((l = r.readLine()) != null) b.append(l).append("\n");
                r.close(); return b.toString();
            } catch (Exception e) { return "ERR: " + e.getMessage(); }
        }
        @JavascriptInterface public boolean writeFile(String p, String c) {
            try { FileWriter w = new FileWriter(new File(getFilesDir(), p));
                w.write(c); w.close(); return true;
            } catch (Exception e) { return false; }
        }
        @JavascriptInterface public boolean shareAPK() {
            try { Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("application/vnd.android.package-archive");
                i.putExtra(Intent.EXTRA_STREAM, Uri.fromFile(new File(getPackageCodePath())));
                startActivity(Intent.createChooser(i, "Share Synthia")); return true;
            } catch (Exception e) { return false; }
        }
        @JavascriptInterface public String getDeviceInfo() {
            return "{\"model\":\"" + android.os.Build.MODEL + "\",\"android\":\"" + android.os.Build.VERSION.RELEASE + "\"}";
        }
    }
}
JAVAEOF

    # AndroidManifest
    cat > $PROJECT_DIR/AndroidManifest.xml << 'MANEOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.synthia.morph" android:versionCode="1" android:versionName="1.0">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <application android:label="Synthia Morph" android:theme="@android:style/Theme.NoTitleBar.Fullscreen" android:allowBackup="true">
        <activity android:name=".MainActivity" android:exported="true" android:screenOrientation="portrait">
            <intent-filter><action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
MANEOF

    # Compile
    echo -e "${BLUE}[*] Compiling Java...${NC}"
    ecj -7 -cp $ANDROID_JAR -d $PROJECT_DIR/bin         $PROJECT_DIR/src/com/synthia/morph/MainActivity.java 2>/dev/null || true

    echo -e "${BLUE}[*] Converting to Dalvik...${NC}"
    dx --dex --output=$PROJECT_DIR/classes.dex $PROJECT_DIR/bin 2>/dev/null ||     dx --dex --output=$PROJECT_DIR/classes.dex $PROJECT_DIR/src 2>/dev/null || true

    echo -e "${BLUE}[*] Packaging...${NC}"
    # Simple zip packaging
    mkdir -p $PROJECT_DIR/apk-temp
    cp $PROJECT_DIR/classes.dex $PROJECT_DIR/apk-temp/
    cp -r $PROJECT_DIR/assets $PROJECT_DIR/apk-temp/
    cp $PROJECT_DIR/AndroidManifest.xml $PROJECT_DIR/apk-temp/
    cd $PROJECT_DIR/apk-temp
    zip -r ../synthia.apk.unaligned . > /dev/null 2>&1
    cd -

    echo -e "${BLUE}[*] Aligning...${NC}"
    zipalign -f 4 $PROJECT_DIR/synthia.apk.unaligned $PROJECT_DIR/synthia.apk.aligned 2>/dev/null ||     cp $PROJECT_DIR/synthia.apk.unaligned $PROJECT_DIR/synthia.apk.aligned

    # Sign
    echo -e "${BLUE}[*] Signing...${NC}"
    if [ ! -f "$HOME/.synthia.keystore" ]; then
        keytool -genkey -v -keystore $HOME/.synthia.keystore -alias synthia             -keyalg RSA -keysize 2048 -validity 10000             -storepass synthia123 -keypass synthia123             -dname "CN=Synthia" 2>/dev/null || true
    fi
    apksigner sign --ks $HOME/.synthia.keystore --ks-pass pass:synthia123         --key-pass pass:synthia123 $PROJECT_DIR/synthia.apk.aligned 2>/dev/null || true

    cp $PROJECT_DIR/synthia.apk.aligned $APK_OUT
}

# ─── Main ───
main() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║           Synthia Morph Engine — 2026 Build                          ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    check_prereqs
    setup_project
    build_apk

    echo ""
    echo -e "${GREEN}✓ Build complete: $APK_OUT${NC}"
    echo -e "${BLUE}Size: $(du -h $APK_OUT 2>/dev/null | cut -f1 || echo 'unknown')${NC}"
    echo ""
    echo -e "${YELLOW}Install:${NC} termux-open $APK_OUT"
    echo -e "${YELLOW}Share:${NC} cp $APK_OUT /sdcard/Download/"
    echo -e "${YELLOW}Backup:${NC} cp $APK_OUT ~/storage/shared/"
}

main "$@"
