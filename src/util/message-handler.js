import Promise from 'bluebird';

// Pass in a message handler, a message, and optional additional args, and the
// message handler will be called. A message handler may be a function or
// an object with a handleMessage method. A message handler may return a value
// or a promise that yields a value.
export function callMessageHandler(handler, message, ...args) {
  if (typeof handler === 'function') {
    return handler(message, ...args);
  }
  else if (handler && handler.handleMessage) {
    return handler.handleMessage(message, ...args);
  }
  throw new TypeError('Message handler must be a function or object with a handleMessage method.');
}

// Facilitate message handler result parsing.
export function isMessageHandlerResult(val) {
  return Array.isArray(val) || typeof val === 'function' || (val && val.handleMessage);
}

// Pass a message (and optional additional args) through a message handler or
// (nested) arrays of message handlers. A message handler may be a function or
// an object with a handleMessage method. A message handler may return a value
// or a promise that yields a value. If the value is a message handler (per the
// previous definition) or an array, it will be handled in-place. If the value
// is false, the next message handler will be called. If the value is anything
// else, iteration will stop and that value will be yielded.
export function handleMessage(handlers, message, ...args) {
  if (!Array.isArray(handlers)) {
    return Promise.try(() => callMessageHandler(handlers, message, ...args));
  }
  const {length} = handlers;
  let i = 0;
  const next = f => Promise.try(f).then(result => {
    if (isMessageHandlerResult(result)) {
      return next(() => handleMessage(result, message, ...args));
    }
    else if (result !== false) {
      return result;
    }
    else if (i === length) {
      return false;
    }
    return next(() => handleMessage(handlers[i++], message, ...args));
  });
  return next(() => false);
}
