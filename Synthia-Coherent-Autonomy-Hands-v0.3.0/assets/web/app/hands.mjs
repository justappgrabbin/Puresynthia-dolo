import { MobileControl, parseNative } from './mobile-control.mjs';

const clone = value => {
  try { return structuredClone(value); }
  catch {
    try { return JSON.parse(JSON.stringify(value)); }
    catch { return String(value); }
  }
};

function androidBridge() { return globalThis.SynthiaAndroid ?? null; }

function verified(value) {
  const parsed = parseNative(value);
  if (parsed && typeof parsed === 'object' && parsed.ok === false) {
    throw new Error(parsed.error || parsed.message || 'Hand reported failure.');
  }
  return parsed;
}

/**
 * One hand = one role-level automaton. It observes addressed events, decides
 * whether it is allowed/able to act, performs its own role and verifies the
 * returned evidence. The containing SynthiaHands object is a registry/mesh,
 * not a central decision maker.
 */
export class HandAutomaton {
  constructor({ capability, workspace = null, history = null }) {
    this.capability = capability;
    this.id = capability.id;
    this.workspace = workspace;
    this.history = history ?? [];
    this.state = 'ready';
    this.decisions = 0;
    this.actions = 0;
    this.failures = 0;
    this.unsubscribe = workspace?.subscribe(`hand:${this.id}`, event => this.observe(event)) ?? null;
  }

  available() {
    try { return Boolean(this.capability.available?.()); }
    catch { return false; }
  }

  manifest() {
    return Object.freeze({
      id:this.id,
      description:this.capability.description ?? '',
      autonomous:Boolean(this.capability.autonomous),
      risk:this.capability.risk ?? 'local',
      available:this.available(),
      state:this.state,
      decisions:this.decisions,
      actions:this.actions,
      failures:this.failures,
    });
  }

  async observe(event) {
    if (event?.type !== 'hand.request') return null;
    if (event?.payload?.id !== this.id) return null;

    this.state = 'observing';
    this.decisions += 1;
    const request = event.payload;
    const autonomous = request.manual !== true;

    this.state = 'deciding';
    if (!this.available()) {
      this.state = 'blocked';
      throw new Error(`Hand unavailable: ${this.id}`);
    }
    if (autonomous && !this.capability.autonomous) {
      this.state = 'blocked';
      throw new Error(`Hand requires person approval: ${this.id}`);
    }

    return this.act(request.args ?? {}, { manual:request.manual === true, event });
  }

  async act(args = {}, context = {}) {
    const autonomous = context.manual !== true;
    const startedAt = new Date().toISOString();
    this.state = 'acting';
    try {
      const raw = await this.capability.invoke(args, context);
      this.state = 'verifying';
      const result = verified(raw);
      const row = {
        at:startedAt,
        id:this.id,
        ok:true,
        autonomous,
        args:clone(args),
        result:clone(result),
      };
      this.actions += 1;
      this.history.push(row);
      if (this.history.length > 500) this.history.splice(0, this.history.length - 500);
      this.state = 'ready';
      return result;
    } catch (error) {
      this.failures += 1;
      this.state = 'failed';
      const row = {
        at:startedAt,
        id:this.id,
        ok:false,
        autonomous,
        args:clone(args),
        error:String(error?.stack || error?.message || error),
      };
      this.history.push(row);
      if (this.history.length > 500) this.history.splice(0, this.history.length - 500);
      throw error;
    }
  }

  destroy() { try { this.unsubscribe?.(); } catch {} }
}

export class SynthiaHands {
  constructor({ journal = null, workspace = null, runtime = null } = {}) {
    this.journal = journal;
    this.workspace = workspace;
    this.runtime = runtime;
    this.history = [];
    this.capabilities = new Map();
    this.organs = new Map();
    this.mobile = new MobileControl();
    this.registerDefaults();
  }

  registerDefaults() {
    this.register({
      id:'javascript.run',
      description:'Run local JavaScript inside Synthia.',
      autonomous:true,
      risk:'local-code',
      available:() => true,
      invoke:async ({ code, input }) => {
        if (!this.runtime) throw new Error('Synthia runtime is not attached to JavaScript hand.');
        return this.runtime.runJS(code, input, { manual:false });
      },
    });

    this.register({
      id:'files.pick',
      description:'Ask the person to pick a file through Android.',
      autonomous:false,
      risk:'person-interaction',
      available:() => Boolean(globalThis.document?.createElement),
      invoke:async () => {
        const input = document.createElement('input');
        input.type = 'file';
        return await new Promise(resolve => {
          input.onchange = () => {
            const file = input.files?.[0] ?? null;
            resolve(file ? { name:file.name, type:file.type, size:file.size, file } : null);
          };
          input.click();
        });
      },
    });

    this.register({
      id:'clipboard.read',
      description:'Read clipboard text with browser permission.',
      autonomous:false,
      risk:'personal-data',
      available:() => Boolean(globalThis.navigator?.clipboard?.readText),
      invoke:async () => navigator.clipboard.readText(),
    });

    this.register({
      id:'clipboard.write',
      description:'Write clipboard text.',
      autonomous:false,
      risk:'person-interaction',
      available:() => Boolean(globalThis.navigator?.clipboard?.writeText),
      invoke:async ({ text }) => {
        await navigator.clipboard.writeText(String(text ?? ''));
        return { ok:true, complete:true };
      },
    });

    this.register({
      id:'open.url',
      description:'Open a URL through the Android host.',
      autonomous:false,
      risk:'external-navigation',
      available:() => typeof androidBridge()?.openUrl === 'function',
      invoke:async ({ url }) => androidBridge().openUrl(String(url ?? '')),
    });

    this.register({
      id:'share.text',
      description:'Open Android share sheet for text.',
      autonomous:false,
      risk:'external-communication',
      available:() => typeof androidBridge()?.shareText === 'function',
      invoke:async ({ text }) => androidBridge().shareText(String(text ?? '')),
    });

    this.register({
      id:'notify',
      description:'Show a local Android notification/toast.',
      autonomous:true,
      risk:'local-ui',
      available:() => typeof androidBridge()?.notify === 'function',
      invoke:async ({ text }) => androidBridge().notify(String(text ?? '')),
    });

    this.register({
      id:'workspace.write',
      description:'Write UTF-8 text into Synthia workspace.',
      autonomous:true,
      risk:'local-storage',
      available:() => typeof androidBridge()?.writeWorkspaceText === 'function',
      invoke:async ({ path, text }) => androidBridge().writeWorkspaceText(String(path ?? ''), String(text ?? '')),
    });

    this.register({
      id:'workspace.read',
      description:'Read UTF-8 text from Synthia workspace.',
      autonomous:true,
      risk:'local-storage',
      available:() => typeof androidBridge()?.readWorkspaceText === 'function',
      invoke:async ({ path }) => androidBridge().readWorkspaceText(String(path ?? '')),
    });

    this.register({
      id:'termux.shell',
      description:'Optional Termux shell faculty. Native bridge reports request acceptance, not fabricated command output.',
      autonomous:false,
      risk:'shell',
      available:() => typeof androidBridge()?.runShell === 'function',
      invoke:async ({ command }) => androidBridge().runShell(String(command ?? '')),
    });

    // Mobile MCP donor translated to direct local Android faculties.
    this.register({
      id:'mobile.status', description:'Report local mobile-control/accessibility status.', autonomous:true, risk:'read-only',
      available:() => this.mobile.available('mobileStatus'), invoke:async () => this.mobile.status(),
    });
    this.register({
      id:'mobile.enable-accessibility', description:'Open Android Accessibility settings so the person can enable Synthia hands.', autonomous:false, risk:'settings',
      available:() => this.mobile.available('openAccessibilitySettings'), invoke:async () => this.mobile.enableAccessibility(),
    });
    this.register({
      id:'mobile.observe', description:'Read the active accessibility element tree and stable @e references.', autonomous:true, risk:'read-only',
      available:() => this.mobile.available('mobileElements'), invoke:async () => this.mobile.elements(),
    });
    this.register({
      id:'mobile.click-ref', description:'Click an element reference from the most recent mobile observation.', autonomous:true, risk:'device-interaction',
      available:() => this.mobile.available('mobileClickRef'), invoke:async ({ ref }) => this.mobile.clickRef(ref),
    });
    this.register({
      id:'mobile.tap', description:'Tap screen coordinates through Android accessibility gestures.', autonomous:true, risk:'device-interaction',
      available:() => this.mobile.available('mobileTap'), invoke:async ({ x, y }) => this.mobile.tap(x, y),
    });
    this.register({
      id:'mobile.swipe', description:'Swipe through Android accessibility gestures.', autonomous:true, risk:'device-interaction',
      available:() => this.mobile.available('mobileSwipe'), invoke:async ({ x1, y1, x2, y2, durationMs }) => this.mobile.swipe(x1, y1, x2, y2, durationMs),
    });
    this.register({
      id:'mobile.press', description:'Perform Android global navigation actions such as back/home/recents.', autonomous:true, risk:'device-navigation',
      available:() => this.mobile.available('mobilePress'), invoke:async ({ button }) => this.mobile.press(button),
    });
    this.register({
      id:'mobile.type', description:'Set text in the focused editable Android accessibility element.', autonomous:false, risk:'text-entry',
      available:() => this.mobile.available('mobileType'), invoke:async ({ text }) => this.mobile.type(text),
    });
    this.register({
      id:'mobile.list-apps', description:'List launchable Android applications visible to Synthia.', autonomous:true, risk:'read-only',
      available:() => this.mobile.available('mobileListApps'), invoke:async () => this.mobile.listApps(),
    });
    this.register({
      id:'mobile.launch-app', description:'Launch an installed Android application by package name.', autonomous:true, risk:'device-navigation',
      available:() => this.mobile.available('mobileLaunchApp'), invoke:async ({ packageName }) => this.mobile.launchApp(packageName),
    });
  }

  register(capability) {
    if (!capability?.id || typeof capability.invoke !== 'function') throw new Error('Hand capability requires id + invoke().');
    if (this.organs.has(capability.id)) this.organs.get(capability.id).destroy();
    const frozen = Object.freeze({ ...capability });
    this.capabilities.set(capability.id, frozen);
    this.organs.set(capability.id, new HandAutomaton({ capability:frozen, workspace:this.workspace, history:this.history }));
  }

  list() { return [...this.organs.values()].map(organ => organ.manifest()); }

  async use(id, args = {}, context = {}) {
    const organ = this.organs.get(id);
    if (!organ) throw new Error(`Unknown hand: ${id}`);
    if (!organ.available()) throw new Error(`Hand unavailable: ${id}`);
    const autonomous = context.manual !== true;
    if (autonomous && !organ.capability.autonomous) throw new Error(`Hand requires person approval: ${id}`);
    return organ.act(args, context);
  }

  /** Publish an autonomous request. The addressed hand itself decides and acts. */
  async request(id, args = {}, context = {}) {
    if (!this.workspace) return this.use(id, args, { ...context, manual:false });
    const publication = await this.workspace.publish('hand.request', {
      id,
      args:clone(args),
      manual:false,
      context:clone(context),
    }, { source:'autonomy', kind:'action-request' });

    const response = publication.responses.find(row => row.subscriberId === `hand:${id}`);
    if (!response) throw new Error(`No hand automaton answered request: ${id}`);
    if (!response.ok) throw new Error(response.error || `Hand request failed: ${id}`);
    return response.value;
  }

  status() {
    return Object.freeze({
      capabilities:this.list(),
      history:this.history.slice(-100).map(clone),
    });
  }
}
