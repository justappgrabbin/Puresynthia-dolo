# Debug APK build note (added by Grok Bot, 2026-10-21)
Source: Synthia-Hands-v0.3.0-with-r22-runtime-2.zip (sha256 14025d85…, 109 MB), extracted unchanged into Synthia-Coherent-Autonomy-Hands-v0.3.0/.
APK: Synthia-Hands-v0.3.0-r22-debug.apk, 92,619,987 bytes, sha256 e49d329493e8dd3d7b35920716eb99bc034e3f036eef0904d65da7c2da71e0de, debug-signed (throwaway key).
Built on Linux with Android SDK build-tools 35.0.0, android-35 jar, JDK 21, following build-apk.sh steps (javac -> d8 -> aapt -> zipalign -> apksigner).
Differences from build-apk.sh: assets added with zip instead of aapt -A, because aapt refused duplicate names (rootfs-arm.tar and rootfs-arm.tar.gz). All assets included.
Open question: assets/web/FULL-BOOT-FIX.txt says applicationId=com.synthia.phone, but AndroidManifest.xml says com.synthia.autonomy. Manifest was not edited, so the APK is com.synthia.autonomy.
Known: 8 of 9 Hands npm tests fail (missing assets/web/app measured-state.mjs, autonomy.mjs, button-contract.mjs). Not fixed.
