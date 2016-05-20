import Promise from 'bluebird';

// Pass in a message handler and arguments, and the message handler will be
// called with those arguments.
//
// A message handler may be a function or an object with a handleMessage method.
// A message handler may return a value or a promise that yields a value.
export function callMessageHandler(handler, ...args) {
  if (typeof handler === 'function') {
    return handler(...args);
  }
  else if (handler && handler.handleMessage) {
    return handler.handleMessage(...args);
  }
  throw new TypeError('Message handler must be a function or object with a handleMessage method.');
}

// Facilitate message handler result parsing.
export function isMessageHandlerOrHandlers(val) {
  // Ensure arrays consist of only functions or message handler objects.
  if (Array.isArray(val)) {
    return val.every(item => isMessageHandlerOrHandlers(item));
  }
  // Return true if val is a function or message handler object.
  return typeof val === 'function' || (val && typeof val.handleMessage === 'function') || false;
}

// Pass specified arguments through a message handler or array of message
// handlers.
//
// If a returned/yielded value is:
// * a message handler or array of message handlers: unroll it/them inline
// * false: skip to the the next message handler
// * anything else: stop iteration and yield that value
//
// If iteration completes and no non-false value was returned/yielded, yield
// false.
export function processMessage(handlers, ...args) {
  if (!Array.isArray(handlers)) {
    return Promise.try(() => callMessageHandler(handlers, ...args));
  }
  const {length} = handlers;
  let i = 0;
  const next = f => Promise.try(f).then(result => {
    if (isMessageHandlerOrHandlers(result)) {
      return next(() => processMessage(result, ...args));
    }
    else if (result !== false) {
      return result;
    }
    else if (i === length) {
      return false;
    }
    return next(() => processMessage(handlers[i++], ...args));
  });
  return next(() => false);
}
