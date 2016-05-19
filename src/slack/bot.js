import Promise from 'bluebird';
import {Bot} from '../bot';
import {isMessage, normalizeMessage} from '../util/response';
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
    this.overrideProperties(options);
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

  overrideProperties(options) {
    const overrides = [
      'onOpen',
      'onError',
      'onMessage',
      'login',
      'ignoreMessage',
      'getConversationId',
      'postMessage',
      'postMessageOptions',
      'handleResponse',
      'handleResponseError',
    ];
    overrides.forEach(name => {
      if (options[name]) {
        this[name] = options[name];
      }
    });
  }

  onOpen() {
    console.log('Bot connected.');
  }

  onError(...args) {
    console.log('Bot error.', args);
  }

  onMessage(message) {
    if (this.ignoreMessage(message)) {
      return;
    }
    const channel = this.slack.rtmClient.dataStore.getChannelGroupOrDMById(message.channel);
    Promise.try(() => {
      const id = this.getConversationId(channel, message);
      const messageHandler = this.getMessageHandler(id);
      return this.handleMessage(messageHandler, message);
    })
    .then(response => {
      this.handleResponse(channel, response);
    })
    .catch(error => {
      this.handleResponseError(channel, error);
    });
  }

  login() {
    this.slack.rtmClient.start();
    return this;
  }

  ignoreMessage(message) {
    return message.subtype === 'bot_message';
  }

  getConversationId(channel, message) {
    return channel.id;
  }

  postMessage(channel, message, options) {
    const channelId = channel && channel.id;
    const text = isMessage(message) ? normalizeMessage(message) :
      isMessage(message.message) ? normalizeMessage(message.message) :
      null;
    if (!options) {
      options = this.postMessageOptions(text, {message, channel});
    }
    return this.slack.webClient.chat.postMessage(channelId, null, options);
  }

  postMessageOptions(text, meta) {
    return {
      username: this.name,
      text,
      unfurl_links: false,
      unfurl_media: false,
    };
  }

  handleResponse(channel, response) {
    if (response === false) {
      return;
    }
    this.postMessage(channel, response);
  }

  handleResponseError(channel, error) {
    console.error(error.stack);
    this.postMessage(channel, `An error occurred: \`${error.message}\``);
  }

}

export default function createSlackBot(options) {
  return new SlackBot(options);
}
