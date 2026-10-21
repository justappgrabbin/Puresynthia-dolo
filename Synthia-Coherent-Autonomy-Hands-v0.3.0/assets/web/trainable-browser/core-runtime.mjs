import * as StateSpace from '../vendor/trainable/state-space/index.mjs';
import * as ATO from '../vendor/trainable/ato/index.mjs';
import Klein from './klein-browser.mjs';

/**
 * Browser realization of Trainable Assembly v0.4.2's mandatory core facade.
 * It keeps StateSpace + ATO + Klein live without node:module/createRequire.
 */
export class SynthiaCoreRuntimeBrowser {
  constructor(options = {}) {
    this.options = options;
    this.stateSpace = StateSpace;
    this.ato = ATO;
    this.klein = Klein;
  }

  capabilities() {
    return {
      stateSpace: Object.keys(this.stateSpace),
      ato: Object.keys(this.ato),
      klein: Object.keys(this.klein),
    };
  }
}

export default SynthiaCoreRuntimeBrowser;
