import Promise from 'bluebird';
import {overrideProperties} from './util/class';
import {processMessage} from './util/process-message';
import {isMessage, normalizeMessage} from './util/response';

export class Bot {

  constructor(options = {}) {
    const {createMessageHandler, verbose} = options;
    if (!createMessageHandler) {
      throw new TypeError('Missing required "createMessageHandler" option.');
    }
    this.createMessageHandler = createMessageHandler;
    this.verbose = verbose;
    this.handlerMap = {};
    overrideProperties(this, options, [
      'onMessage',
      'ignoreMessage',
      'getConversationId',
      'getMessageHandler',
      'getMessageHandlerArgs',
      'handleResponse',
      'handleError',
      'normalizeResponse',
      'sendResponse',
    ]);
  }

  processMessage(...args) {
    return processMessage(...args);
  }

  onMessage(message) {
    if (this.ignoreMessage(message)) {
      return Promise.resolve();
    }
    return Promise.try(() => {
      const id = this.getConversationId(message);
      const messageHandler = this.getMessageHandler(id);
      const args = this.getMessageHandlerArgs(message);
      return [messageHandler, args];
    })
    .spread((messageHandler, args) => {
      if (args === false) {
        return false;
      }
      return this.processMessage(messageHandler, ...args)
        .then(response => this.handleResponse(message, response));
    })
    .catch(error => this.handleError(message, error));
  }

  ignoreMessage(message) {
    return false;
  }

  getConversationId(message) {
    return message.id;
  }

  getMessageHandler(id) {
    if (this.handlerMap[id]) {
      return this.handlerMap[id];
    }
    const messageHandler = this.createMessageHandler(id);
    if (messageHandler.hasState) {
      this.handlerMap[id] = messageHandler;
    }
    return messageHandler;
  }

  getMessageHandlerArgs(message) {
    const {text, id} = message;
    return [text, id];
  }

  handleResponse(message, response) {
    if (response === false) {
      return false;
    }
    return this.sendResponse(message, response);
  }

  handleError(message, error) {
    if (this.verbose) {
      console.error(error.stack);
    }
    return this.sendResponse(message, `An error occurred: \`${error.message}\``);
  }

  normalizeResponse(response) {
    if (isMessage(response)) {
      return normalizeMessage(response);
    }
    else if (isMessage(response.message)) {
      return normalizeMessage(response.message);
    }
    return null;
  }

  sendResponse(message, response) {
    console.log('[bot]', this.normalizeResponse(response));
  }

}

export default function createBot(options) {
  return new Bot(options);
}
