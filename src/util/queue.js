import Promise from 'bluebird';

export default class Queue {

  constructor(options = {}) {
    this.cache = {};
    const {
      onDrain = data => console.log('onDrain', data),
    } = options;
    this.onDrain = onDrain;
  }

  enqueue(id, data) {
    if (!this.cache[id]) {
      this.cache[id] = {
        queue: [],
      };
    }
    const obj = this.cache[id];
    obj.queue.push(data);
    if (!obj.promise) {
      obj.promise = this.drain(id);
    }
    return obj.promise;
  }

  drain(id) {
    const obj = this.cache[id];
    const next = () => {
      if (obj.queue.length === 0) {
        obj.promise = null;
        return null;
      }
      return Promise.try(() => this.onDrain(id, obj.queue.shift())).then(next);
    };
    return next();
  }

}
