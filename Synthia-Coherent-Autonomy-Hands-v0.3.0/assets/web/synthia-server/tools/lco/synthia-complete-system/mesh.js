// mesh.js — THE NERVOUS SYSTEM
//
// A minimal pub/sub channel mesh. Every tool publishes to its own channel.
// Other tools subscribe to channels they're interested in. No central broker —
// just named channels and typed messages.

export class Mesh {
  constructor() {
    this.channels = new Map(); // channelName -> Set of callback functions
    this.log = [];             // chronological message history
  }

  /** Subscribe a callback to a channel. Returns unsubscribe function. */
  subscribe(channel, callback) {
    if (!this.channels.has(channel)) this.channels.set(channel, new Set());
    this.channels.get(channel).add(callback);
    return () => this.channels.get(channel)?.delete(callback);
  }

  /** Publish a message to a channel. All subscribers receive it. */
  publish(channel, source, payload) {
    const msg = { channel, source, payload, timestamp: Date.now() };
    this.log.push(msg);
    const subs = this.channels.get(channel);
    if (subs) subs.forEach((cb) => cb(msg));
  }

  /** Query the log for messages matching a predicate. */
  query(predicate) {
    return this.log.filter(predicate);
  }

  /** Get last N messages from a channel. */
  last(channel, n = 1) {
    return this.log
      .filter((m) => m.channel === channel)
      .slice(-n);
  }

  /** Get all messages from a channel. */
  history(channel) {
    return this.log.filter((m) => m.channel === channel);
  }
}
