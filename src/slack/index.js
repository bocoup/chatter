import {Bot} from '../bot';
import {isMessage, normalizeMessage} from '../util/response';
import createSlackMessageHandler from './message-handler/slack';

class SlackBot extends Bot {
  constructor(options = {}) {
    super(options);
    this.slack = options.slack;
    this.overrideProperties(options);
  }

  overrideProperties(options) {
    const overrides = [
      'getConversationId',
      'postMessage',
      'postMessageOptions',
    ];
    overrides.forEach(name => {
      if (options[name]) {
        this[name] = options[name];
      }
    });
  }

  getConversationId(message) {
    const channel = this.slack.getChannelGroupOrDMByID(message.channel);
    return channel.id;
  }

  postMessage(message, response) {
    const channel = this.slack.getChannelGroupOrDMByID(message.channel);
    const text = isMessage(response) ? normalizeMessage(response) :
      isMessage(response.message) ? normalizeMessage(response.message) :
      null;
    const meta = {message, response, channel};
    return channel.postMessage(this.postMessageOptions(text, meta));
  }

  postMessageOptions(text) {
    return {
      username: 'Default Bot Name',
      text,
      unfurl_links: false,
      unfurl_media: false,
    };
  }

  createSlackMessageHandler(...args) {
    return createSlackMessageHandler(this.slack, ...args);
  }

}

export default function createSlackBot(options) {
  return new SlackBot(options);
}
