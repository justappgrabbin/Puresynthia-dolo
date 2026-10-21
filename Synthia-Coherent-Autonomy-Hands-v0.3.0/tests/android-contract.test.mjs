import assert from 'node:assert/strict';
import fs from 'node:fs';

const activity = fs.readFileSync(new URL('../src/com/synthia/autonomy/MainActivity.java', import.meta.url), 'utf8');
const service = fs.readFileSync(new URL('../src/com/synthia/autonomy/SynthiaAccessibilityService.java', import.meta.url), 'utf8');
const manifest = fs.readFileSync(new URL('../AndroidManifest.xml', import.meta.url), 'utf8');
const build = fs.readFileSync(new URL('../build-apk.sh', import.meta.url), 'utf8');

for (const method of [
  'mobileStatus', 'openAccessibilitySettings', 'mobileElements', 'mobileClickRef',
  'mobileTap', 'mobileSwipe', 'mobilePress', 'mobileType', 'mobileListApps', 'mobileLaunchApp'
]) {
  assert.match(activity, new RegExp(`\\b${method}\\s*\\(`), `missing Android bridge method ${method}`);
}
assert.match(service, /class SynthiaAccessibilityService extends AccessibilityService/);
assert.match(manifest, /SynthiaAccessibilityService/);
assert.match(manifest, /android\.accessibilityservice\.AccessibilityService/);
assert.match(activity, /setAllowFileAccess\(false\)/);
assert.match(activity, /SynthiaWebViewClient/);
assert.match(activity, /\\"complete\\":false/);
assert.match(build, /SynthiaAccessibilityService\.java/);
assert.match(build, /Synthia-Coherent-Autonomy-Hands-v0\.3\.0\.apk/);

console.log('android native contract PASS');
