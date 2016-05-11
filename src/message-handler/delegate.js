import {handleMessage, isMessageHandlerOrHandlers} from '../util/message-handler';

// Validate these signatures.
// Only options:
//   getHandlers({handleMessage: fn, ...})
// Only children:
//   getHandlers(fn)
//   getHandlers({handleMessage: fn})
//   getHandlers([...])
// Both options and children:
//   getHandlers({...}, fn)
//   getHandlers({...}, {handleMessage: fn})
//   getHandlers({...}, [...])
export function getHandlers(options = {}, handlers) {
  if (!handlers) {
    handlers = options.handleMessage || options;
  }
  if (!isMessageHandlerOrHandlers(handlers)) {
    throw new TypeError('Missing required message handler(s).');
  }
  return handlers;
}

export class DelegatingMessageHandler {

  constructor(options, children) {
    this.children = getHandlers(options, children);
  }

  // Iterate over all child handlers, yielding the first non-false result.
  handleMessage(message, ...args) {
    return handleMessage(this.children, message, ...args);
  }

}

export default function createDelegate(...args) {
  return new DelegatingMessageHandler(...args);
}
