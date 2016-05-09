import {Bot} from '../bot';
import createMessageHandler from './message-handler/slack';

class SlackBot extends Bot {
  constructor(options = {}) {
    super(options);
    this.slack = options.slack;
  }

  createMessageHandler(...args) {
    return createMessageHandler(this.slack, ...args);
  }

}

export default function createSlackBot(options) {
  return new SlackBot(options);
}
