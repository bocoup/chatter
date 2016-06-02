import Promise from 'bluebird';
import {overrideProperties} from './util/bot-helpers';
import {processMessage} from './util/process-message';
import {isMessage, isArrayOfMessages, normalizeMessage, normalizeMessages} from './util/response';

export class Bot {

  constructor(options = {}) {
    const {createMessageHandler, verbose} = options;
    if (!createMessageHandler) {
      throw new TypeError('Missing required "createMessageHandler" option.');
    }
    this.createMessageHandler = createMessageHandler;
    // Log more?
    this.verbose = verbose;
    // Cache of message handlers.
    this.handlerCache = {};
    // Allow any of these options to override default Bot methods.
    overrideProperties(this, options, [
      'formatErrorMessage',
      'log',
      'logError',
      'onMessage',
      'ignoreMessage',
      'getMessageHandlerCacheId',
      'getMessageHandler',
      'getMessageHandlerArgs',
      'handleResponse',
      'handleError',
      'normalizeResponse',
      'sendResponse',
    ]);
  }

  // Expose the processMessage function on Bot instances for convenience.
  processMessage(...args) {
    return processMessage(...args);
  }

  // String formatting helper functions.
  formatErrorMessage(message) { return `An error occurred: ${message}`; }

  // Overridable logger.
  log(...args) {
    console.log(...args);
  }

  // Overridable error logger.
  logError(...args) {
    console.error(...args);
  }

  // This is main "run loop" for the bot. When a message is received, it gets
  // passed into this function to be handled.
  onMessage(message) {
    return Promise.try(() => {
      // Get the message text and an optional array of arguments based on the
      // current message. This is especially useful when "message" is an object,
      // and not a text string.
      const messageHandlerArgs = this.getMessageHandlerArgs(message);
      // Abort if false was returned. This gives the getMessageHandlerArg
      // function the ability to pre-emptively ignore messages.
      if (messageHandlerArgs === false) {
        return [false];
      }
      const {text, args = [message]} = messageHandlerArgs;
      // Get the id to retrieve a stateful message handler from the cache.
      const id = this.getMessageHandlerCacheId(...args);
      // Get a cached message handler via its id, or call createMessageHandler
      // to create a new one.
      const messageHandler = this.getMessageHandler(id, ...args);
      return [messageHandler, text, args];
    })
    .spread((messageHandler, text, args) => {
      // If messageHandlerArgs or getMessageHandler returned false, abort.
      if (messageHandler === false) {
        return false;
      }
      // Process text and additional args through the message handler.
      return this.processMessage(messageHandler, text, ...args)
        // Then handle the response.
        .then(response => this.handleResponse(message, response));
    })
    // If there was an error, handle that.
    .catch(error => this.handleError(message, error));
  }

  // Return an object that defines the message text and any additional arguments
  // to be passed into message handlers (and the getMessageHandlerCacheId and
  // getMessageHandler functions).
  //
  // This function receives the "message" value passed into onMessage.
  //
  // By default, Bot expect "message" to be an object with, at the minimum, a
  // "text" property. If your message is in a different format, override this
  // function. Eg. If messages are just strings of text, return {text: message}.
  getMessageHandlerArgs(message) {
    return {
      text: message.text,
      args: [message],
    };
  }

  // Return a value that will be used as an id to cache stateful message
  // handlers returned from the getMessageHandler function.
  //
  // This function receives the "args" returned from getMessageHandlerArgs.
  //
  // By default, Bot expects "message" to be an object with an "id" property. If
  // your message is in a different format, override this function.
  getMessageHandlerCacheId(message) {
    return message && message.id;
  }

  // Return a message handler, either from cache (if it exists) or created by
  // the createMessageHandler function. If the message handler is stateful (ie.
  // has a true "hasState" property) store it in the cache for later retrieval.
  //
  // This function receives the "args" returned from getMessageHandlerArgs.
  getMessageHandler(id, ...args) {
    if (this.handlerCache[id]) {
      return this.handlerCache[id];
    }
    const messageHandler = this.createMessageHandler(id, ...args);
    if (!messageHandler) {
      return false;
    }
    if (messageHandler.hasState) {
      this.handlerCache[id] = messageHandler;
    }
    return messageHandler;
  }

  // If a message handler didn't throw an exception and wasn't rejected, run
  // this function.
  //
  // This function receives the original "message" and "response" value returned
  // or yielded by the message handler. Normalize the response into an array
  // containing zero or more messages, and pass each to the sendResponse method,
  // in order.
  handleResponse(message, response) {
    if (response === false) {
      return false;
    }
    const responses = this.normalizeResponse(response);
    return Promise.all(responses.map(text => this.sendResponse(message, text)));
  }

  // Normalize response into an array of 0 or more text messages. For each
  // "message", flatten all arrays, remove any false, null or undefined values,
  // and join the resulting flattened and filtered array on newline.
  normalizeResponse(response = {}) {
    if (isMessage(response)) {
      return [normalizeMessage(response)];
    }
    else if (isArrayOfMessages(response.messages)) {
      return normalizeMessages(response.messages);
    }
    else if (isMessage(response.message)) {
      return [normalizeMessage(response.message)];
    }
    return [];
  }

  // If a message handler threw an exception or was otherwise rejected, run this
  // function.
  //
  // This function receives the original "message" and error object. Show the
  // error message in the same channel, group or DM from which the message
  // originated, and optionally log the error stack.
  handleError(message, error) {
    if (this.verbose) {
      this.logError(error.stack);
    }
    return this.sendResponse(message, this.formatErrorMessage(error.message));
  }

  // Once the response (successful or not) has been handled, this message does
  // the actual "sending" of the response back to the chat service. Which means
  // it needs to be overridden. If not, it will just log to the console.
  //
  // This function receives the original "message" and the normalized message
  // or formatted error message as the "text" value.
  //
  // If sending the response runs asynchronously, this function should return a
  // promise that is resolved when the response has been sent.
  sendResponse(message, text) {
    this.log('sendResponse', text);
  }

}

export default function createBot(options) {
  return new Bot(options);
}
