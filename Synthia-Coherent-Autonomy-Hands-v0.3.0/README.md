# Synthia Coherent Autonomy + Hands v0.3.0

This is a surgical upgrade of v0.2.0. The preserved Trainable and Universal Execution Spine authorities remain authoritative; Mobile MCP and AION are donors, not replacement brains.

## Preserved authorities

1. `Pure-Synthia-Trainable-Assembly-v0.4.2.zip`
2. `Synthia-Universal-Execution-Spine-v0.4.0.zip`
3. `Synthia-PureAutomata-ALIVE-CONTINUOUS-v2-FULL-with-Runner.zip`

Original authority archives remain in `authority-original/`. Verify them with `AUTHORITY-SHA256.json`.

## v0.3.0 changes

### Distributed Hands

Each hand is now a role-level automaton with its own lifecycle:

`ready -> observing -> deciding -> acting -> verifying -> ready|blocked|failed`

Autonomous hand requests enter the shared event workspace. The addressed hand decides whether it is available and autonomous, performs its role, and records evidence. A central heartbeat no longer impersonates the hand's decision.

The queue now supports `hand` tasks in addition to `call`, `chat`, and `execute-js`.

### Mobile MCP cleaned transplant

No Node server, ADB daemon, telemetry, PostHog, Scarf, or cloud dependency is bundled.

The useful model is translated directly into the Android residence:
- accessibility-first element observation;
- stable `@eN` element references for the latest observation;
- click-by-reference;
- coordinate tap and swipe;
- Android back/home/recents/notification/quick-settings actions;
- launchable-app discovery and app launch;
- explicit person-triggered text entry;
- explicit Accessibility Settings hand.

This is same-device local control. It does **not** pretend to provide unsupported Mobile MCP features such as arbitrary app termination, ADB logs, crash reports, simulator control, or iOS control from this Android APK.

### AION cleaned transplant

Imported as architecture mechanics, not as AION's Rust/Next/Ollama/Gemma agent stack:
- bounded re-entrant event workspace;
- measured self-state derived from actual task outcomes;
- gated capability promotion with canary/check hooks;
- circuit breaker after consecutive candidate failures.

Synthia's existing StateSpace, ATO, Klein, Trainable and Universal Execution Spine remain unchanged authorities.

### Truth + hardening fixes

- Android native methods return structured `{ok, complete, ...}` evidence.
- Workspace failures can no longer be recorded as success strings.
- Termux returns `complete:false` after dispatch because this bridge does not possess stdout/stderr/exit status.
- Privileged WebView navigation is restricted to the packaged `127.0.0.1` origin; external HTTP(S) URLs leave the WebView.
- `file://` access is disabled in the privileged WebView.
- localStorage lineage moves to `v0.3.0` with migration from the historical v0.1/v0.2 keys.
- manifest/package/build names are aligned on `0.3.0`.

## Hands

There are 20 registered faculties in this build. Mobile faculties are visible but report unavailable until the native Android bridge exists; accessibility actions report unavailable until the person enables the Synthia accessibility service.

Autonomous by default include local JS, workspace read/write, notifications, mobile observation, click/tap/swipe/navigation, app listing and app launch. Person approval remains required for file picking, clipboard access, URL/share actions, Termux shell, opening Accessibility Settings, and text entry.

## Test gate

There are 26 visible action buttons. Static/runtime tests cover:
- button contract;
- Trainable + UES wiring;
- SHA/crypto compatibility;
- Hands contract;
- distributed hand decisions and truthful failure evidence;
- Mobile native evidence parsing;
- measured state + evolution circuit breaker.

Run:

```bash
npm test
```

## Build APK on the phone

```bash
cd /path/to/Synthia-Coherent-Autonomy-Hands-v0.3.0
export ANDROID_JAR="$PREFIX/share/aapt/android.jar"
bash build-apk.sh
```

Output:

`~/storage/downloads/Synthia-Autonomy/Synthia-Coherent-Autonomy-Hands-v0.3.0.apk`

The Android build now compiles both `MainActivity.java` and `SynthiaAccessibilityService.java`.

## Provenance

See `DONOR-PROVENANCE.json` and `THIRD-PARTY-NOTES.md`. No upstream telemetry implementation is included.
