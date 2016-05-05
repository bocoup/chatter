import Promise from 'bluebird';
import {DelegatingMessageHandler} from './delegate';

export class MatchingMessageHandler extends DelegatingMessageHandler {

  constructor(options = {}) {
    super(options);
    if (!('match' in options)) {
      throw new TypeError('Missing required "match" option.');
    }
    this.match = options.match;
  }

  // Pass remainder from match into child handlers, but only if match succeeds.
  // Otherwise, yield false.
  handleMessage(message = '', ...args) {
    const remainder = this.getMatchRemainder(message);
    if (remainder === false) {
      return Promise.resolve(false);
    }
    return super.handleMessage(remainder, ...args);
  }

  // Determine if message matches. If not, return false, otherwise return the
  // remainder to be passed into child handlers.
  getMatchRemainder(message) {
    const {match} = this;
    const isMatch = message.indexOf(match) === 0;
    if (!isMatch) {
      return false;
    }
    const remainder = message.slice(match.length).replace(/^\s+/, '');
    return remainder;
  }

}

export default function createMatcher(options) {
  return new MatchingMessageHandler(options);
}
