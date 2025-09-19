class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(name, fn) {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, []);
    }

    this.listeners.get(name).push(fn);
    return this;
  }

  emit(name, ...args) {
    const listeners = this.listeners.get(name);
    if (listeners && listeners.length) {
      listeners.forEach((listener) => listener(...args));
      return true;
    }
    return false;
  }

  off(name, fn) {
    const listeners = this.listeners.get(name);
    if (listeners && listeners.length) {
      const index = listeners.indexOf(fn);
      if (index > -1) {
        listeners.splice(index, 1);
        return true;
      }
    }
    return false;
  }
}

export default EventEmitter;
