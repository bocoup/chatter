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

  // Parse arguments and options from message and pass the resulting object
  // into the specified handleMessage function.
  handleMessage(message) {
    const {bot} = this;
    const {slack} = this.bot;
    const channel = slack.rtmClient.dataStore.getChannelGroupOrDMById(message.channel);
    // Ignore non-message messages.
    if (!this.isValidChannel(channel) || message.type !== 'message') {
      return Promise.resolve(false);
    }
    // If the message was a "changed" message, get the underlying message.
    if (message.subtype === 'message_changed') {
      message = message.message;
    }
    // Any message with a subtype or attachments can be safely ignored.
    if (message.subtype || message.attachments) {
      return Promise.resolve(false);
    }
    const user = slack.rtmClient.dataStore.getUserById(message.user);
    const meta = {
      bot,
      slack,
      channel,
      user,
    };
    return super.handleMessage(message.text, meta);
  }

}

export default function createSlackMessageHandler(...args) {
  return new SlackMessageHandler(...args);
}
