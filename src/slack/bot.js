import {Bot} from '../bot';
import {overrideProperties} from '../util/class';

import createSlackMessageHandler from './message-handler/slack';
import {parseMessage} from './util/message-parser';

export class SlackBot extends Bot {
  constructor(options = {}) {
    super(options);
    const {slack, name = 'Test Bot'} = options;
    if (!slack) {
      throw new TypeError('Missing required "slack" option.');
    }
    else if (!slack.rtmClient) {
      throw new TypeError('Missing required "slack.rtmClient" option.');
    }
    else if (!slack.rtmClient.dataStore) {
      throw new TypeError('Missing required "slack.rtmClient.dataStore" property.');
    }
    else if (!slack.webClient) {
      throw new TypeError('Missing required "slack.webClient" option.');
    }
    this.name = name;
    this.slack = slack;
    overrideProperties(this, options, [
      'onOpen',
      'onError',
      'login',
      'postMessageOptions',
    ]);
    this.bindEventHandlers(['open', 'error', 'message']);
  }

  createSlackMessageHandler(...args) {
    return createSlackMessageHandler(this, ...args);
  }

  parseMessage(...args) {
    return parseMessage(this.slack, ...args);
  }

  bindEventHandlers(events) {
    events.forEach(name => {
      const method = this[`on${name[0].toUpperCase()}${name.slice(1)}`];
      if (method) {
        this.slack.rtmClient.on(name, method.bind(this));
      }
    });
  }

  ignoreMessage(message) {
    return message.subtype === 'bot_message';
  }

  getConversationId(message) {
    return message.channel;
  }

  getMessageHandlerArgs(message) {
    const channel = this.slack.rtmClient.dataStore.getChannelGroupOrDMById(message.channel);
    // Ignore non-message messages.
    if (message.type !== 'message') {
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
    const user = this.slack.rtmClient.dataStore.getUserById(message.user);
    const meta = {
      bot: this,
      slack: this.slack,
      channel,
      user,
    };
    return [message.text, meta];
  }

  onOpen() {
    console.log('Bot connected.');
  }

  onError(...args) {
    console.log('Bot error.', args);
  }

  login() {
    this.slack.rtmClient.start();
    return this;
  }

  sendResponse(message, response, options) {
    const text = this.normalizeResponse(response);
    if (!options) {
      options = this.postMessageOptions(text, message, response);
    }
    return this.slack.webClient.chat.postMessage(message.channel, null, options);
  }

  postMessageOptions(text, message, response) {
    return {
      username: this.name,
      text,
      unfurl_links: false,
      unfurl_media: false,
    };
  }

}

export default function createSlackBot(options) {
  return new SlackBot(options);
}
