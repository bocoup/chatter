import {handleMessage} from '../util/message-handler';

export class DelegatingMessageHandler {

  constructor(options = {}) {
    this.children = options.handleMessage || [];
  }

  // Iterate over all child handlers, yielding the first non-false result.
  handleMessage(message, ...args) {
    return handleMessage(this.children, message, ...args);
  }

}

export default function createDelegate(options) {
  return new DelegatingMessageHandler(options);
}
