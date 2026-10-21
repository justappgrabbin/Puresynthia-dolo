const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
const clone = value => {
  try { return structuredClone(value); }
  catch { return JSON.parse(JSON.stringify(value)); }
};

/** A factual self-state: only values produced by runtime evidence are stored. */
export class MeasuredState {
  constructor({ outcomeWindow = 10 } = {}) {
    this.outcomeWindow = Math.max(3, Number(outcomeWindow) || 10);
    this.focus = null;
    this.focusSince = null;
    this.curiosity = null;
    this.certainty = 0.5;
    this.recentOutcomes = [];
    this.lastTaskSteps = 0;
    this.updatedAt = null;
  }

  setFocus(focus) {
    const value = String(focus ?? '').trim().slice(0, 160);
    if (!value || value === this.focus) return false;
    this.focus = value;
    this.focusSince = new Date().toISOString();
    this.updatedAt = this.focusSince;
    return true;
  }

  setCuriosity(curiosity) {
    const value = String(curiosity ?? '').trim().slice(0, 240);
    if (!value) return false;
    this.curiosity = value;
    this.updatedAt = new Date().toISOString();
    return true;
  }

  recordResult(success, steps = 1) {
    const ok = Boolean(success);
    this.recentOutcomes.push(ok);
    if (this.recentOutcomes.length > this.outcomeWindow) {
      this.recentOutcomes.splice(0, this.recentOutcomes.length - this.outcomeWindow);
    }
    const rate = this.successRate();
    this.certainty = clamp(ok ? 0.6 + 0.4 * rate : 0.3 * rate);
    this.lastTaskSteps = Math.max(0, Number(steps) || 0);
    this.updatedAt = new Date().toISOString();
    return this.snapshot();
  }

  successRate() {
    if (!this.recentOutcomes.length) return 0.5;
    return this.recentOutcomes.filter(Boolean).length / this.recentOutcomes.length;
  }

  operatingMode() {
    if (this.recentOutcomes.length < 3) return 'insufficient-evidence';
    const rate = this.successRate();
    const lastTwoFailed = this.recentOutcomes.slice(-2).every(value => value === false);
    if (lastTwoFailed && rate < 0.5) return 'verify-more';
    if (rate >= 0.8) return 'high-confidence';
    if (rate >= 0.5) return 'steady';
    return 'cautious';
  }

  restore(state = null) {
    if (!state || typeof state !== 'object') return false;
    this.focus = state.focus ?? null;
    this.focusSince = state.focusSince ?? null;
    this.curiosity = state.curiosity ?? null;
    this.certainty = clamp(state.certainty ?? 0.5);
    this.recentOutcomes = Array.isArray(state.recentOutcomes)
      ? state.recentOutcomes.slice(-this.outcomeWindow).map(Boolean)
      : [];
    this.lastTaskSteps = Math.max(0, Number(state.lastTaskSteps) || 0);
    this.updatedAt = state.updatedAt ?? null;
    return true;
  }

  snapshot() {
    return Object.freeze(clone({
      focus:this.focus,
      focusSince:this.focusSince,
      curiosity:this.curiosity,
      certainty:this.certainty,
      recentOutcomes:this.recentOutcomes,
      successRate:this.successRate(),
      operatingMode:this.operatingMode(),
      lastTaskSteps:this.lastTaskSteps,
      updatedAt:this.updatedAt,
    }));
  }
}
