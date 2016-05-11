export class Bot {

  constructor({createMessageHandler} = {}) {
    if (!createMessageHandler) {
      throw new TypeError('Missing required "createMessageHandler" option.');
    }
    this.createMessageHandler = createMessageHandler;
    this.handlerMap = {};
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

}

export default function createBot(options) {
  return new Bot(options);
}
