Bundled runtime assets go here before building the product APK:

- proot-arm64
- proot-arm
- rootfs-arm64.tar.gz
- rootfs-arm.tar.gz
- rootfs.tar.gz as a fallback name

The APK extracts these into its private app storage, then bind-mounts the bundled Synthia backend into `/opt/synthia` inside the rootless Linux container.

If the rootfs is a minimal Alpine image, the app will try to install `nodejs`, `npm`, `python3`, `git`, `curl`, `unzip`, and `zip` on first boot.
