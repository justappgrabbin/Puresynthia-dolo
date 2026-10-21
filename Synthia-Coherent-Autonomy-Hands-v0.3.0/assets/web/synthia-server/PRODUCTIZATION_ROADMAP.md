# Synthia Productization Roadmap

The current package is a developer/prototype kit. It can run in Termux and optionally Debian PRoot, but a future sellable product should not require customers to install Termux manually.

## Product Goal

Compete with UserLAnd-style phone Linux tools by shipping Synthia as a polished Android app that starts its own local Linux/runtime environment, opens a dashboard, and helps users build apps from their phone.

## Current Prototype Mode

- Termux starts Node, Python, watcher, Trident adapter, and Seedbox Swarm.
- Optional Debian PRoot can run the Synthia server in a fuller Linux userland.
- The dashboard is a local web app at `http://127.0.0.1:3000/dashboard`.
- APK compilation depends on Android build tools being available on the phone.

This is good for building and testing Synthia, but not yet a consumer product.

## Sellable APK Mode

A future product APK should include:

- Android native launcher.
- WebView dashboard pointed at the local Synthia server.
- Foreground service that keeps the local server alive.
- Rootless Linux runtime using PRoot or a similar bundled userland.
- Bundled or downloadable rootfs image.
- First-run setup screen.
- Storage picker/import flow.
- Project inbox and file watcher.
- Background build queue with notifications.
- Admin mode lock.
- Rollback UI.
- Clear plain-English assistant voice.
- Crash recovery and server restart.
- Update channel for app/runtime updates.

## Architecture Target

```text
Android APK
  -> Foreground service
  -> Rootless Linux runtime
  -> Synthia server
  -> Local dashboard WebView
  -> Builder watcher / swarm / rollback
```

## What Must Change Before Selling

- Remove manual Termux dependency from the user flow.
- Bundle or provision the Linux rootfs from inside the app.
- Replace shell-only setup with Android first-run setup.
- Add proper app permissions and storage access.
- Add foreground notification so Android does not quietly kill the server.
- Add crash logs and a restart button.
- Add license review for every bundled component.
- Add security boundaries for user projects and generated code.
- Add update/rollback rules for both the app and the local runtime.

## Honest Position

Termux mode is the workshop.

The sellable product should be a standalone Android app that hides the workshop behind a clean dashboard.
