import {handleMessage, isMessageHandlerOrHandlers} from '../util/message-handler';

export class DelegatingMessageHandler {

  constructor(options = {}, children) {
    // Validate these signatures.
    // Only options:
    //   createDelegate({handleMessage: fn, ...})
    // Only children:
    //   createDelegate(fn)
    //   createDelegate({handleMessage: fn})
    //   createDelegate([...])
    // Both options and children:
    //   createDelegate({...}, fn)
    //   createDelegate({...}, {handleMessage: fn})
    //   createDelegate({...}, [...])
    this.children = children || options.handleMessage || options;
    if (!isMessageHandlerOrHandlers(this.children)) {
      throw new TypeError('Missing required message handlers.');
    }
  }

  // Iterate over all child handlers, yielding the first non-false result.
  handleMessage(message, ...args) {
    return handleMessage(this.children, message, ...args);
  }

}

export default function createDelegate(...args) {
  return new DelegatingMessageHandler(...args);
}
