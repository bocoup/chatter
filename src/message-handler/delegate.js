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

// Compose creators that accept a signature like getHandlers() into a single
// creator. All creators receive the same options object.
// Eg:
//   const createMatcherParser = composeCreators(createMatcher, createParser);
//   const fooHandler = createMatcherParser({match: 'foo', parseOptions: {}}, fn);
// Is equivalent to:
//   const fooHandler = createMatcher({match: 'foo'}, createParser({parseOptions: {}}, fn));
export function composeCreators(...creators) {
  if (Array.isArray(creators[0])) {
    creators = creators[0];
  }
  return function composed(options, children) {
    children = getHandlers(options, children);
    function recurse([currentHandler, ...remain]) {
      const nextHandler = remain.length > 0 ? recurse(remain) : createDelegate(children);
      return currentHandler(options, nextHandler);
    }
    return recurse(creators);
  };
}
