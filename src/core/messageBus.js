import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

export class MessageBus {
  constructor() {
    this.emitter = new EventEmitter();
    this.subscribers = new Map();
    this.history = [];
  }

  subscribe(agentId, handler) {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, new Set());
    }
    const handlers = this.subscribers.get(agentId);
    handlers.add(handler);

    return () => handlers.delete(handler);
  }

  async publish({ from, to, topic, content, meta = {} }) {
    const message = {
      id: uuidv4(),
      from,
      to,
      topic,
      content,
      meta,
      ts: new Date().toISOString(),
    };
    this.history.push(message);
    this.emitter.emit("message", message);

    if (to) {
      this.deliver(to, message);
    } else {
      this.broadcast(message);
    }

    return message;
  }

  deliver(targetId, message) {
    const handlers = this.subscribers.get(targetId);
    if (!handlers) return;
    handlers.forEach((handler) => {
      queueMicrotask(() => handler(message));
    });
  }

  broadcast(message) {
    this.subscribers.forEach((handlers) => {
      handlers.forEach((handler) => queueMicrotask(() => handler(message)));
    });
  }

  getHistory(filter = {}) {
    return this.history.filter((msg) => {
      const matchesTo = filter.to ? msg.to === filter.to : true;
      const matchesFrom = filter.from ? msg.from === filter.from : true;
      return matchesTo && matchesFrom;
    });
  }

  onMessage(handler) {
    this.emitter.on("message", handler);
    return () => this.emitter.off("message", handler);
  }
}

export default MessageBus;
