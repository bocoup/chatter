import Promise from 'bluebird';
import {DelegatingMessageHandler} from './delegate';

// If "match" is a String and matches the entire message or matches a space-
// delimited word at the beginning of the message, success. If any text
// remains after the match, return it (with leading spaces stripped) as the
// remainder.
//
// If match is a RegExp and matches the message, return the value of the
// first truthy capture group.
export function matchStringOrRegex(match, message = '') {
  const re = typeof match === 'string' ? new RegExp(`^${match}(?:$|\\s+(.*))`, 'i') : match;
  const [isMatch, ...captures] = message.match(re) || [];
  if (!isMatch) {
    return false;
  }
  return captures.find(Boolean) || '';
}

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
      return matchStringOrRegex(match, message);
    }
    throw new TypeError('Invalid "match" option format.');
  }

}

export default function createMatcher(...args) {
  return new MatchingMessageHandler(...args);
}
