function bridge() { return globalThis.SynthiaAndroid ?? null; }

export function parseNative(value) {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text) return { ok:false, error:'empty-native-response' };
  if (text.startsWith('{') || text.startsWith('[')) {
    try { return JSON.parse(text); } catch {}
  }
  if (/\b(failed|failure|not found|rejected|unavailable|could not)\b/i.test(text)) {
    return { ok:false, error:text };
  }
  return { ok:true, value:text };
}

function call(method, ...args) {
  const host = bridge();
  if (!host || typeof host[method] !== 'function') {
    throw new Error(`Native mobile faculty unavailable: ${method}`);
  }
  const result = parseNative(host[method](...args));
  if (result?.ok === false) throw new Error(result.error || `${method} failed`);
  return result;
}

export class MobileControl {
  available(method = 'mobileStatus') {
    return typeof bridge()?.[method] === 'function';
  }

  status() { return call('mobileStatus'); }
  enableAccessibility() { return call('openAccessibilitySettings'); }
  elements() { return call('mobileElements'); }
  clickRef(ref) { return call('mobileClickRef', String(ref ?? '')); }
  tap(x, y) { return call('mobileTap', Number(x) || 0, Number(y) || 0); }
  swipe(x1, y1, x2, y2, durationMs = 350) {
    return call('mobileSwipe', Number(x1)||0, Number(y1)||0, Number(x2)||0, Number(y2)||0, Math.max(50, Number(durationMs)||350));
  }
  press(button) { return call('mobilePress', String(button ?? '')); }
  type(text) { return call('mobileType', String(text ?? '')); }
  listApps() { return call('mobileListApps'); }
  launchApp(packageName) { return call('mobileLaunchApp', String(packageName ?? '')); }
}
