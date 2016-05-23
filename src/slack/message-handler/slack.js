import Promise from 'bluebird';
import {DelegatingMessageHandler} from '../../message-handler/delegate';

export class SlackMessageHandler extends DelegatingMessageHandler {

  constructor(bot, options = {dm: false, channel: false}, children) {
    super(options, children);
    if (!bot || !bot.slack) {
      throw new TypeError('Missing required "bot" argument.');
    }
    this.bot = bot;
    this.dm = options.dm;
    this.channel = options.channel;
  }

  // Test the given channel for validity, based on the specified options.
  isValidChannel(channel) {
    return (this.dm === true && channel.is_im) || (this.channel === true && !channel.is_im);
  }

  handleMessage(message, meta) {
    // Ignore messages that should be ignored.
    if (!this.isValidChannel(meta.channel)) {
      return Promise.resolve(false);
    }
    return super.handleMessage(message, meta);
  }

}

export default function createSlackMessageHandler(...args) {
  return new SlackMessageHandler(...args);
}
