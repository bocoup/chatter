import Promise from 'bluebird';
import {parseArgs} from '../util/args-parser';
import {handleMessage} from '../util/message-handler';

export class ParsingMessageHandler {

  constructor(options = {}) {
    if (!('handleMessage' in options)) {
      throw new TypeError('Missing required "handleMessage" option.');
    }
    this.proxyHandler = options.handleMessage;
    this.parseOptions = options.parseOptions || {};
  }

  // Parse arguments and options from message and pass the resulting object
  // into the specified handleMessage function.
  handleMessage(message = '', ...args) {
    const parsed = parseArgs(message, this.parseOptions);
    parsed.input = message;
    return Promise.try(() => handleMessage(this.proxyHandler, parsed, ...args));
  }

}

export default function createParser(options) {
  return new ParsingMessageHandler(options);
}
