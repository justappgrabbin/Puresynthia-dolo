const clone = value => {
  try { return structuredClone(value); }
  catch {
    try { return JSON.parse(JSON.stringify(value)); }
    catch { return String(value); }
  }
};

const now = () => new Date().toISOString();

/**
 * Bounded re-entrant event workspace.
 *
 * This is deliberately not a planner. Automatons subscribe and decide for
 * themselves whether an event belongs to them. The workspace only preserves,
 * broadcasts and re-introduces witnessed state.
 */
export class EventWorkspace {
  constructor({ maxEvents = 1000 } = {}) {
    this.maxEvents = Math.max(64, Number(maxEvents) || 1000);
    this.events = [];
    this.subscribers = new Map();
    this.sequence = 0;
  }

  subscribe(id, listener) {
    if (!id || typeof listener !== 'function') throw new Error('Workspace subscriber requires id + listener.');
    this.subscribers.set(String(id), listener);
    return () => this.subscribers.delete(String(id));
  }

  record(type, payload = {}, { source = 'synthia', kind = null } = {}) {
    const event = Object.freeze({
      sequence:++this.sequence,
      at:now(),
      source:String(source || 'synthia'),
      type:String(type || 'event'),
      kind:String(kind || type || 'event'),
      payload:clone(payload),
    });
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
    return event;
  }

  async publish(type, payload = {}, options = {}) {
    const event = this.record(type, payload, options);
    const responses = [];
    for (const [subscriberId, listener] of this.subscribers) {
      try {
        const value = await listener(event);
        if (value !== undefined && value !== null) {
          responses.push(Object.freeze({ subscriberId, ok:true, value:clone(value) }));
        }
      } catch (error) {
        responses.push(Object.freeze({
          subscriberId,
          ok:false,
          error:String(error?.stack || error?.message || error),
        }));
      }
    }
    return Object.freeze({ event, responses:Object.freeze(responses) });
  }

  recent(limit = 20, { type = null, source = null } = {}) {
    let rows = this.events;
    if (type) rows = rows.filter(row => row.type === type);
    if (source) rows = rows.filter(row => row.source === source);
    return clone(rows.slice(-Math.max(0, Number(limit) || 0)));
  }

  reentry(limit = 12) {
    return this.recent(limit).map(row => ({
      sequence:row.sequence,
      at:row.at,
      source:row.source,
      type:row.type,
      payload:row.payload,
    }));
  }

  restore(rows = []) {
    if (!Array.isArray(rows)) return false;
    this.events = rows.slice(-this.maxEvents).map(row => Object.freeze(clone(row)));
    this.sequence = this.events.reduce((max, row) => Math.max(max, Number(row.sequence) || 0), 0);
    return true;
  }

  snapshot() {
    return Object.freeze({
      sequence:this.sequence,
      subscribers:[...this.subscribers.keys()].sort(),
      events:this.recent(this.maxEvents),
    });
  }
}
