export function handleMessage(obj, message, ...args) {
  if (typeof obj === 'function') {
    return obj(message, ...args);
  }
  else if (obj && obj.handleMessage) {
    return obj.handleMessage(message, ...args);
  }
  throw new TypeError('Message handler must be a function or object with a handleMessage method.');
}
