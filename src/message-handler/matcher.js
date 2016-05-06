import Promise from 'bluebird';
import {DelegatingMessageHandler} from './delegate';

export class MatchingMessageHandler extends DelegatingMessageHandler {

  constructor(options = {}, children) {
    super(options, children);
    if (!('match' in options)) {
      throw new TypeError('Missing required "match" option.');
    }
    this.match = options.match;
  }

  // If match succeeds, pass remainder into child handlers, yielding their
  // result. If no match, yield false.
  handleMessage(message, ...args) {
    return Promise.try(() => this.doMatch(message, ...args))
    .then(remainder => {
      if (remainder === false) {
        return false;
      }
      return super.handleMessage(remainder, ...args);
    });
  }

  // Attempt to match the message, given the "match" option.
  doMatch(message, ...args) {
    const {match} = this;
    if (typeof match === 'function') {
      return match(message, ...args);
    }
    else if (typeof match === 'string') {
      return this.matchString(match, message);
    }
    throw new TypeError('Invalid "match" option format.');
  }

  // If the "match" string matches the beginning of the message, success!
  // Return the remainder of the message, with leading spaces removed, otherwise
  // return false.
  matchString(match, message = '') {
    const isMatch = message.indexOf(match) === 0;
    if (!isMatch) {
      return false;
    }
    const remainder = message.slice(match.length).replace(/^\s+/, '');
    return remainder;
  }

}

export default function createMatcher(...args) {
  return new MatchingMessageHandler(...args);
}
