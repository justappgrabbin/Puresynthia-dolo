#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
IFS=$'\n\t'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$PROJECT_DIR/build"
PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"
HOME="${HOME:-/data/data/com.termux/files/home}"

ANDROID_JAR="${ANDROID_JAR:-$PREFIX/share/aapt/android.jar}"
ANDROID_CLASSES_JAR="${ANDROID_CLASSES_JAR:-$PREFIX/share/java/android.jar}"

if [ ! -s "$ANDROID_CLASSES_JAR" ] && [ -s "$ANDROID_JAR" ]; then
  ANDROID_CLASSES_JAR="$ANDROID_JAR"
fi

OUTDIR="$HOME/storage/downloads/Synthia-Autonomy"
ROOT="$HOME/.synthia-autonomy-builder"
KEYSTORE="$ROOT/synthia-autonomy.keystore"
PASSFILE="$ROOT/signing.pass"
FINAL_APK="$OUTDIR/Synthia-Coherent-Autonomy-Hands-v0.3.0.apk"

say() { printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { printf '\n[FAIL] %s\n' "$*" >&2; exit 1; }

need() {
  local command_name="$1"
  local package_name="$2"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    pkg install -y "$package_name" || die "Could not install $package_name"
  fi
  command -v "$command_name" >/dev/null 2>&1 ||
    die "Required command missing: $command_name"
}

if [ ! -d "$HOME/storage" ]; then
  termux-setup-storage || true
fi

mkdir -p "$OUTDIR" "$ROOT"

say "Checking Android build tools"
need javac openjdk-21
need keytool openjdk-21
need aapt aapt
need d8 d8
need zipalign aapt
need apksigner apksigner
need zip zip
need unzip unzip

[ -s "$ANDROID_JAR" ] ||
  die "android.jar missing: $ANDROID_JAR"

[ -s "$ANDROID_CLASSES_JAR" ] ||
  die "Android compile classes missing: $ANDROID_CLASSES_JAR"

[ -s "$PROJECT_DIR/AndroidManifest.xml" ] ||
  die "AndroidManifest.xml missing"

[ -s "$PROJECT_DIR/assets/web/index.html" ] ||
  die "Synthia web runtime missing"

grep -q 'package="com.synthia.autonomy"' "$PROJECT_DIR/AndroidManifest.xml" ||
  die "Manifest package contract is missing"

# Optional native Termux faculty. Cynthia's JavaScript runtime does not depend on this.
mkdir -p "$HOME/.termux"
PROP="$HOME/.termux/termux.properties"
touch "$PROP"
if grep -q '^allow-external-apps=' "$PROP"; then
  sed -i 's/^allow-external-apps=.*/allow-external-apps=true/' "$PROP"
else
  printf '\nallow-external-apps=true\n' >> "$PROP"
fi
termux-reload-settings 2>/dev/null || true

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/classes" "$BUILD_DIR/dex"

say "Packaging Synthia runtime"
aapt package \
  -f \
  -M "$PROJECT_DIR/AndroidManifest.xml" \
  -I "$ANDROID_JAR" \
  -A "$PROJECT_DIR/assets" \
  -F "$BUILD_DIR/base.apk"

[ -s "$BUILD_DIR/base.apk" ] || die "aapt did not create base.apk"

say "Compiling Android localhost/terminal host"
javac \
  -source 8 \
  -target 8 \
  -cp "$ANDROID_CLASSES_JAR" \
  -d "$BUILD_DIR/classes" \
  "$PROJECT_DIR/src/com/synthia/autonomy/MainActivity.java" \
  "$PROJECT_DIR/src/com/synthia/autonomy/SynthiaAccessibilityService.java"

mapfile -t CLASS_FILES < <(find "$BUILD_DIR/classes" -type f -name '*.class' -print)
[ "${#CLASS_FILES[@]}" -gt 0 ] || die "No Java class files were produced"

say "Creating classes.dex"
d8 \
  --min-api 24 \
  --lib "$ANDROID_CLASSES_JAR" \
  --output "$BUILD_DIR/dex" \
  "${CLASS_FILES[@]}"

[ -s "$BUILD_DIR/dex/classes.dex" ] || die "d8 did not create classes.dex"

cp "$BUILD_DIR/base.apk" "$BUILD_DIR/unsigned.apk"
(
  cd "$BUILD_DIR"
  zip -q -j unsigned.apk dex/classes.dex
)

unzip -t "$BUILD_DIR/unsigned.apk" >/dev/null ||
  die "Unsigned APK archive is invalid"

umask 077
if [ ! -s "$PASSFILE" ]; then
  printf '%s' "$(date +%s%N)-$RANDOM-$RANDOM" |
    sha256sum | cut -d' ' -f1 > "$PASSFILE"
fi
KEY_PASS="$(cat "$PASSFILE")"

if [ ! -s "$KEYSTORE" ]; then
  say "Creating persistent local signing key"
  keytool \
    -genkeypair \
    -noprompt \
    -keystore "$KEYSTORE" \
    -alias synthia-autonomy \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$KEY_PASS" \
    -keypass "$KEY_PASS" \
    -dname "CN=Synthia Coherent Autonomy" >/dev/null
fi

say "Aligning APK"
zipalign -p -f 4 "$BUILD_DIR/unsigned.apk" "$BUILD_DIR/aligned.apk"
zipalign -c 4 "$BUILD_DIR/aligned.apk" >/dev/null ||
  die "Alignment verification failed"

say "Signing APK"
apksigner sign \
  --ks "$KEYSTORE" \
  --ks-key-alias synthia-autonomy \
  --ks-pass "pass:$KEY_PASS" \
  --key-pass "pass:$KEY_PASS" \
  --out "$FINAL_APK" \
  "$BUILD_DIR/aligned.apk"

say "Verifying APK"
unzip -t "$FINAL_APK" >/dev/null ||
  die "Final APK ZIP verification failed"
zipalign -c 4 "$FINAL_APK" >/dev/null ||
  die "Final APK alignment verification failed"
apksigner verify --verbose --print-certs "$FINAL_APK" ||
  die "Final APK signature verification failed"

printf '\n============================================================\n'
printf 'SYNTHIA AUTONOMY APK CREATED + VERIFIED\n'
printf '%s\n' "$FINAL_APK"
printf '============================================================\n'

if command -v termux-open >/dev/null 2>&1; then
  say "Opening Android installer"
  termux-open "$FINAL_APK" || true
fi
