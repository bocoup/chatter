import Promise from 'bluebird';
import {handleMessage} from '../util/message-handler';

export class DelegatingMessageHandler {

  constructor(options = {}) {
    this.children = options.handleMessage || [];
  }

  // Iterate over all child handlers, returning a promise.
  handleMessage(message, ...args) {
    return this.delegateToChildren(message, ...args);
  }

  // Pass message and args into each child's handler, in turn. Child handlers
  // may return a value or promise. Stop iterating and return a promise that
  // yields the first non-false value a child handler returns. Otherwise,
  // return a promise that yields false.
  delegateToChildren(message, ...args) {
    let {children} = this;
    if (!Array.isArray(children)) {
      children = [children];
    }
    const {length} = children;
    let i = 0;
    const next = f => Promise.try(f).then(result => {
      if (result !== false) {
        return result;
      }
      else if (i === length) {
        return false;
      }
      return next(() => handleMessage(children[i++], message, ...args));
    });
    return next(() => false);
  }

}

export default function createDelegate(options) {
  return new DelegatingMessageHandler(options);
}
