import {Bot} from '../bot';
import {overrideProperties} from '../util/bot-helpers';
import {parseMessage} from './util/message-parser';

export class SlackBot extends Bot {

  constructor(options = {}) {
    super(options);
    const {
      slack,
      getSlack,
      name = 'Chatter Bot',
      icon = 'https://placekitten.com/48/48',
      eventNames = ['open', 'error', 'message'],
    } = options;
    if (!slack && !getSlack) {
      throw new TypeError('Missing required "slack" or "getSlack" option.');
    }
    // Bot name and icon.
    this.name = name;
    this.icon = icon;
    // Either specify a slack object or a function that will be used to get one.
    this.slack = slack;
    this.getSlack = getSlack;
    // Slack rtm client event names to bind to.
    this.eventNames = eventNames;
    // Allow any of these options to override default Bot methods.
    overrideProperties(this, options, [
      'formatOnOpen',
      'formatOnError',
      'login',
      'onOpen',
      'onError',
      'postMessage',
      'postMessageOptions',
    ]);
  }

  // Provide a bound-to-this-slack wrapper around the parseMessage utility
  // function.
  parseMessage(...args) {
    return parseMessage(this.slack, ...args);
  }

  // String formatting helper functions.
  formatErrorMessage(message) { return `An error occurred: \`${message}\``; }
  formatOnOpen({user, team}) { return `Connected to ${team.name} as ${user.name}.`; }
  formatOnError(args) { return `${this.name} error: ${JSON.stringify(args)}`; }

  // Return an object that defines the message text and an additional "meta"
  // argument containing a number of relevant properties, to be passed into
  // message handlers (and the getMessageHandlerCacheId and getMessageHandler
  // functions).
  //
  // This function receives a slack "message" object.
  getMessageHandlerArgs(message) {
    // Ignore bot messages.
    if (message.subtype === 'bot_message') {
      return false;
    }
    const origMessage = message;
    const channel = this.slack.rtmClient.dataStore.getChannelGroupOrDMById(message.channel);
    // Ignore non-message messages.
    if (message.type !== 'message') {
      return false;
    }
    // If the message was a "changed" message, get the underlying message.
    if (message.subtype === 'message_changed') {
      message = message.message;
    }
    // Ignore any message with a subtype or attachments.
    if (message.subtype || message.attachments) {
      return false;
    }
    const user = this.slack.rtmClient.dataStore.getUserById(message.user);
    const meta = {
      bot: this,
      slack: this.slack,
      message,
      origMessage,
      channel,
      user,
    };
    return {
      text: message.text,
      args: [meta],
    };
  }

  // Return a value that will be used as an id to cache stateful message
  // handlers returned from the getMessageHandler function.
  //
  // This function receives the "meta" object from getMessageHandlerArgs. and
  // returns the message.channel property, which is the channel / group / DM id.
  getMessageHandlerCacheId(meta) {
    return meta.message.channel;
  }

  // First, ensure the bot has a "slack" object, then bind event handlers and
  // start the bot.
  login() {
    if (!this.slack) {
      this.slack = this.getSlack();
      if (!this.slack || typeof this.slack !== 'object') {
        throw new TypeError('The "getSlack" function must return an object.');
      }
    }
    const slack = this.slack;
    if (!slack.rtmClient) {
      throw new TypeError('The "slack" object is missing a required "rtmClient" property.');
    }
    else if (!slack.rtmClient.dataStore) {
      throw new TypeError('The "slack" object is missing a required "rtmClient.dataStore" property.');
    }
    else if (!slack.webClient) {
      throw new TypeError('The "slack" object is missing a required "webClient" property.');
    }
    // Bind event handlers to the slack rtm client.
    this.bindEventHandlers(this.eventNames);
    // Start the rtm client!
    this.slack.rtmClient.start();
    // Make it chainable.
    return this;
  }

  // Bind whitelisted "foo"-type slack rtm events to "onFoo"-type bot methods.
  bindEventHandlers(events) {
    events.forEach(name => {
      const method = this[`on${name[0].toUpperCase()}${name.slice(1)}`];
      if (method) {
        this.slack.rtmClient.on(name, method.bind(this));
      }
    });
  }

  // When the slack rtm client connects, log a message.
  onOpen() {
    const {dataStore, activeUserId, activeTeamId} = this.slack.rtmClient;
    const user = dataStore.getUserById(activeUserId);
    const team = dataStore.getTeamById(activeTeamId);
    this.log(this.formatOnOpen({user, team}));
  }

  // If a slack error is encountered, log an error.
  onError(...args) {
    this.logError(this.formatOnError(args));
  }

  // After a message handler response has been normalized, send the response
  // text to the channel from where the message originated.
  sendResponse(message, text) {
    return this.postMessage(message.channel, text);
  }

  // Send an arbitrary message to an arbitrary slack channel. If options aren't
  // specified, get them via postMessageOptions. Returns a promise that
  // resolves after the message has been sent, so multiple messages can be
  // sent in-order.
  postMessage(channelId, text, options) {
    text = this.normalizeResponse(text);
    if (!options) {
      options = this.postMessageOptions(text);
    }
    return this.slack.webClient.chat.postMessage(channelId, null, options);
  }

  // Get postMessage options. See the slack API documentation for more info:
  // https://api.slack.com/methods/chat.postMessage
  postMessageOptions(text) {
    return {
      as_user: false,
      username: this.name,
      icon_url: this.icon,
      text,
      unfurl_links: false,
      unfurl_media: false,
    };
  }

}

export default function createSlackBot(options) {
  return new SlackBot(options);
}
