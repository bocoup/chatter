import Promise from 'bluebird';
import {parseArgs} from '../util/args-parser';

export class ParsingMessageHandler {

  constructor(options = {}) {
    if (!('handleMessage' in options)) {
      throw new TypeError('Missing required "handleMessage" option.');
    }
    this._handleMessage = options.handleMessage;
    this.parseOptions = options.parseOptions || {};
  }

  // Parse arguments and options from message and pass the resulting object
  // into the specified handleMessage function.
  handleMessage(message = '', ...args) {
    const parsed = parseArgs(message, this.parseOptions);
    parsed.input = message;
    return Promise.try(() => this._handleMessage(parsed, ...args));
  }

}

export default function createParser(options) {
  return new ParsingMessageHandler(options);
}
