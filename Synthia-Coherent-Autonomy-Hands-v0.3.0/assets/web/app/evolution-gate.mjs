const clone = value => {
  try { return structuredClone(value); }
  catch { return JSON.parse(JSON.stringify(value)); }
};

/**
 * Gated promotion for generated capabilities.
 * Candidate execution/sandboxing is supplied by Synthia's existing runtime;
 * this class does not pretend a JS Worker is a deny-all security boundary.
 */
export class EvolutionGate {
  constructor({ failureThreshold = 3 } = {}) {
    this.failureThreshold = Math.max(1, Number(failureThreshold) || 3);
    this.consecutiveFailures = 0;
    this.history = [];
  }

  get open() { return this.consecutiveFailures >= this.failureThreshold; }

  async evaluate({ id, candidate, checks = [], canary, promote } = {}) {
    const report = {
      id:String(id || `candidate-${Date.now()}`),
      at:new Date().toISOString(),
      accepted:false,
      checks:[],
      reason:null,
    };

    if (this.open) {
      report.reason = 'circuit-breaker-open';
      return this.#record(report, false);
    }
    if (typeof canary !== 'function' || typeof promote !== 'function') {
      report.reason = 'missing-canary-or-promotion';
      return this.#record(report, false);
    }

    for (const check of checks) {
      const name = String(check?.name || 'check');
      try {
        const passed = Boolean(await check.run(candidate));
        report.checks.push({ name, passed });
        if (!passed) {
          report.reason = `check-failed:${name}`;
          return this.#record(report, false);
        }
      } catch (error) {
        report.checks.push({ name, passed:false, error:String(error?.message || error) });
        report.reason = `check-error:${name}`;
        return this.#record(report, false);
      }
    }

    let canaryResult;
    try {
      canaryResult = await canary(candidate);
      const passed = canaryResult?.ok !== false;
      report.checks.push({ name:'canary', passed, evidence:clone(canaryResult) });
      if (!passed) {
        report.reason = 'canary-failed';
        return this.#record(report, false);
      }
    } catch (error) {
      report.checks.push({ name:'canary', passed:false, error:String(error?.message || error) });
      report.reason = 'canary-error';
      return this.#record(report, false);
    }

    try {
      const receipt = await promote(candidate, canaryResult);
      report.accepted = true;
      report.reason = 'accepted';
      report.receipt = clone(receipt);
      this.consecutiveFailures = 0;
      return this.#record(report, true);
    } catch (error) {
      report.reason = 'promotion-failed';
      report.error = String(error?.message || error);
      return this.#record(report, false);
    }
  }

  #record(report, success) {
    if (!success) this.consecutiveFailures += 1;
    this.history.push(Object.freeze(clone(report)));
    if (this.history.length > 200) this.history.splice(0, this.history.length - 200);
    return Object.freeze(clone({
      ...report,
      breaker:{ open:this.open, consecutiveFailures:this.consecutiveFailures, threshold:this.failureThreshold },
    }));
  }

  snapshot() {
    return Object.freeze({
      open:this.open,
      consecutiveFailures:this.consecutiveFailures,
      threshold:this.failureThreshold,
      history:clone(this.history.slice(-50)),
    });
  }
}
