import {parseArgs} from '../util/args-parser';
import {DelegatingMessageHandler} from './delegate';

export class ParsingMessageHandler extends DelegatingMessageHandler {

  constructor(options = {}, children) {
    super(options, children);
    this.parseOptions = options.parseOptions || {};
  }

  // Parse arguments and options from message and pass the resulting object
  // into the specified handleMessage function.
  handleMessage(message = '', ...args) {
    const parsed = parseArgs(message, this.parseOptions);
    parsed.input = message;
    return super.handleMessage(parsed, ...args);
  }

}

export default function createParser(...args) {
  return new ParsingMessageHandler(...args);
}
