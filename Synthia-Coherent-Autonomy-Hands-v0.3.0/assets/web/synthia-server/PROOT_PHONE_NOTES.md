# Synthia On Phone: Termux vs Debian PRoot

This kit supports two phone modes:

1. Termux host mode
   - Start with `synthia`.
   - Best for Android-specific packaging tools because Termux can install mobile build utilities.

2. Debian PRoot mode
   - Install with `bash phone/install-proot-debian.sh`.
   - Start with `synthia-proot` or `bash phone/start-proot-synthia.sh`.
   - Best for a fuller Linux userland for the Synthia server.
   - The kit is mounted inside Debian at `/opt/synthia`.
   - The PRoot launcher keeps restarting the Node server if it exits.

The browser URL stays the same:

```text
http://127.0.0.1:3000/dashboard
```

If the browser says `Cannot GET` or the buttons stop working, the backend is not running. Start one of:

```bash
synthia
synthia-proot
```

APK compilation depends on Android build tools being installed successfully. If Debian PRoot struggles with Android SDK pieces, use Termux host mode for APK packaging and PRoot mode for the Synthia server.
