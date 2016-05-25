import Promise from 'bluebird';
import {DelegatingMessageHandler} from './delegate';

export class ArgsAdjustingMessageHandler extends DelegatingMessageHandler {

  constructor(options = {}, children) {
    super(options, children);
    if (!options.adjustArgs) {
      throw new TypeError('Missing required "adjustArgs" option.');
    }
    this.adjustArgs = options.adjustArgs || {};
  }

  // Adjust args, and pass the new args into the message handler.
  handleMessage(...args) {
    const newArgs = this.adjustArgs(...args);
    if (!Array.isArray(newArgs)) {
      return Promise.reject(new Error('adjustArgs must return an array (of arguments).'));
    }
    return super.handleMessage(...newArgs);
  }

}

export default function createArgsAdjuster(...args) {
  return new ArgsAdjustingMessageHandler(...args);
}
