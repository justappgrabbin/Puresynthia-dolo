import apps from './apps.json' with { type: 'json' };

export class OSKernel {
  constructor({ unit }) {
    if (!unit) throw new TypeError('OSKernel requires the living Synthia unit');
    this.unit = unit;
    this.apps = new Map(apps.map(app => [app.id, Object.freeze({...app})]));
    this.settings = {
      autonomy: true,
      backgroundLife: true,
      mutationApproval: true,
      browserActionApproval: true,
      interface: 'os',
      localFirst: true,
      backendPolicy: 'optional-service-only',
    };
    this.activeApp = 'home';
  }
  listApps() { return [...this.apps.values()]; }
  open(id) { if (!this.apps.has(id)) throw new Error(`Unknown OS app: ${id}`); this.activeApp=id; return this.apps.get(id); }
  set(key, value) { if (!(key in this.settings)) throw new Error(`Unknown setting: ${key}`); this.settings[key]=value; return this.snapshot(); }
  snapshot() { return { activeApp:this.activeApp, settings:{...this.settings}, apps:this.listApps() }; }
}
export default OSKernel;
