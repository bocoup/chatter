import Promise from 'bluebird';
import {handleMessage} from '../util/message-handler';

export class MatchingMessageHandler {

  constructor(options = {}) {
    if (!('match' in options)) {
      throw new TypeError('Missing required "match" option.');
    }
    this.match = options.match;
    this.children = options.handleMessage || [];
  }

  // If match succeeds, pass remainder into child handlers, yeilding their
  // result. If no match, yield false.
  handleMessage(message = '', ...args) {
    const remainder = this.getMatchRemainder(message);
    if (remainder === false) {
      return Promise.resolve(false);
    }
    return handleMessage(this.children, remainder, ...args);
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
