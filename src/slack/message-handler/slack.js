import {DelegatingMessageHandler} from '../../message-handler/delegate';

export class SlackMessageHandler extends DelegatingMessageHandler {

  constructor(slack, options = {dm: false, channel: false}, children) {
    super(options, children);
    this.slack = slack;
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
    const channel = this.slack.getChannelGroupOrDMByID(message.channel);
    // Ignore non-message messages.
    if (!this.isValidChannel(channel) || message.type !== 'message') {
      return false;
    }
    // If the message was a "changed" message, get the underlying message.
    if (message.subtype === 'message_changed') {
      message = message.message;
    }
    // Any message with a subtype or attachments can be safely ignored.
    if (message.subtype || message.attachments) {
      return false;
    }
    const user = this.slack.getUserByID(message.user);
    return super.handleMessage(message.text, {channel, user});
  }

}

export default function createSlackMessageHandler(...args) {
  return new SlackMessageHandler(...args);
}
