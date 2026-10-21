#!/usr/bin/env python3
"""
ANDROID GENERATOR — MESSY Modern
Generates Android project (Java/Kotlin + XML + Gradle) from mesh triples.

VirtualAPK integration:
- Host app loads generated plugin APK at runtime
- Plugin APK built with 'gradle assemblePlugin'
- Crash feedback → CONTAINS_FLAW triples → Self-modification
"""

from typing import Dict, List, Any
from schema import UnifiedTriple, MeshState, sanitize_identifier

class AndroidGenerator:
    """Generates Android project scaffold from semantic mesh."""

    def __init__(self, mesh: MeshState):
        self.mesh = mesh
        self.package_name = "com.messy.generated"
        self.activity_name = "GeneratedActivity"

    def generate(self) -> Dict[str, str]:
        """Generate complete Android project files."""
        files = {}
        files['AndroidManifest.xml'] = self._generate_manifest()
        files['build.gradle'] = self._generate_gradle()
        files['src/main/java/com/messy/generated/GeneratedActivity.java'] = self._generate_activity()
        files['src/main/res/layout/activity_generated.xml'] = self._generate_layout()
        files['src/main/res/values/strings.xml'] = self._generate_strings()
        return files

    def _generate_manifest(self) -> str:
        return f"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="{self.package_name}">

    <application
        android:theme="@style/Theme.AppCompat.Light.DarkActionBar">
        <activity android:name=".GeneratedActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""

    def _generate_gradle(self) -> str:
        return f"""apply plugin: 'com.android.application'
apply plugin: 'com.didi.virtualapk.plugin'

android {{
    compileSdkVersion 33
    defaultConfig {{
        applicationId "{self.package_name}"
        minSdkVersion 15
        targetSdkVersion 33
        versionCode 1
        versionName "1.0"
    }}
    buildTypes {{
        release {{
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }}
    }}
}}

dependencies {{
    implementation 'com.didi.virtualapk:core:0.9.8'
    implementation 'androidx.appcompat:appcompat:1.6.1'
}}

virtualApk {{
    packageId = 0x6f
    targetHost = '../host/app'
    applyHostMapping = true
}}
"""

    def _generate_activity(self) -> str:
        # Extract entities and relations from mesh
        triples = self.mesh.active_triples()
        entities = list(set([t.subject for t in triples] + [t.object for t in triples if t.object]))
        relations = list(set([t.relation for t in triples]))

        # Generate Java code that visualizes the mesh
        entity_list = ', '.join([f'"{e}"' for e in entities[:10]])  # Limit to 10
        relation_list = ', '.join([f'"{r}"' for r in relations[:10]])

        return f"""package {self.package_name};

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.graphics.Color;

public class GeneratedActivity extends Activity {{

    @Override
    protected void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_generated);

        TextView tv = findViewById(R.id.mesh_view);

        String[] entities = {{{entity_list}}};
        String[] relations = {{{relation_list}}};

        StringBuilder sb = new StringBuilder();
        sb.append("MESSY Generated App\n");
        sb.append("==================\n\n");
        sb.append("Entities: " + entities.length + "\n");
        sb.append("Relations: " + relations.length + "\n\n");

        for (String e : entities) {{
            sb.append("• " + e + "\n");
        }}

        sb.append("\nRelations:\n");
        for (String r : relations) {{
            sb.append("→ " + r + "\n");
        }}

        tv.setText(sb.toString());
        tv.setTextColor(Color.parseColor("#00d4ff"));
        tv.setBackgroundColor(Color.parseColor("#0a0a0f"));
    }}
}}
"""

    def _generate_layout(self) -> str:
        return """<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="#0a0a0f">

    <TextView
        android:id="@+id/mesh_view"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:textSize="14sp"
        android:fontFamily="monospace"
        android:textColor="#00d4ff"
        android:padding="8dp" />
</LinearLayout>
"""

    def _generate_strings(self) -> str:
        return """<resources>
    <string name="app_name">MESSY Generated</string>
</resources>
"""

class VirtualAPKHostLoader:
    """Java code for host app to load MESSY-generated plugins."""

    HOST_CODE = """
package com.messy.host;

import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import com.didi.virtualapk.PluginManager;
import java.io.File;

public class MessyHostApplication extends Application {
    private static final String TAG = "MessyHost";

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(base);
        PluginManager.getInstance(base).init();
    }

    public void loadMessyPlugin(String apkPath) {
        try {
            File plugin = new File(apkPath);
            if (!plugin.exists()) {
                Log.e(TAG, "Plugin not found: " + apkPath);
                return;
            }
            PluginManager.getInstance(this).loadPlugin(plugin);
            Log.i(TAG, "Loaded MESSY plugin: " + apkPath);
        } catch (Exception e) {
            Log.e(TAG, "Failed to load plugin", e);
            // Emit crash feedback to MESSY mesh
            emitCrashFeedback("E6_EXECUTE", e.getMessage());
        }
    }

    public void launchPluginActivity(String packageName, String activityName) {
        Intent intent = new Intent();
        intent.setClassName(packageName, activityName);
        startActivity(intent);
    }

    private void emitCrashFeedback(String errorClass, String message) {
        // This would connect to MESSY backend to emit CONTAINS_FLAW triple
        Log.w(TAG, "Crash feedback: " + errorClass + " - " + message);
    }
}
"""

    HOST_GRADLE = """
// build.gradle (project)
buildscript {
    dependencies {
        classpath 'com.didi.virtualapk:gradle:0.9.8.6'
    }
}

// build.gradle (app module)
apply plugin: 'com.didi.virtualapk.host'

dependencies {
    implementation 'com.didi.virtualapk:core:0.9.8'
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
"""

    @classmethod
    def get_host_files(cls) -> Dict[str, str]:
        return {
            'src/main/java/com/messy/host/MessyHostApplication.java': cls.HOST_CODE,
            'build.gradle': cls.HOST_GRADLE
        }

# ============================================================
# MORPHIC ENGINE INTEGRATION
# ============================================================

def stream_to_virtualapk(mesh: MeshState, output_dir: str) -> str:
    """
    STREAM stage: Generate Android project, build APK, return path.

    This is called by MorphicEngine during the STREAM stage.
    It generates the plugin, triggers gradle build, and returns the APK path.
    """
    from morphic_schema import MorphStage

    # Generate Android project
    generator = AndroidGenerator(mesh)
    files = generator.generate()

    # Write files to output directory
    import os
    for path, content in files.items():
        full_path = os.path.join(output_dir, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w') as f:
            f.write(content)

    # Write host loader files
    host_files = VirtualAPKHostLoader.get_host_files()
    for path, content in host_files.items():
        full_path = os.path.join(output_dir, 'host', path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w') as f:
            f.write(content)

    # Return build command
    return f"cd {output_dir} && ./gradlew assemblePlugin"

__all__ = ['AndroidGenerator', 'VirtualAPKHostLoader', 'stream_to_virtualapk']
