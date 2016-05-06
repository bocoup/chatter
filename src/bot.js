export class Bot {

  constructor({handleMessage = [], createConversation} = {}) {
    this.handleMessage = handleMessage;
    this.createConversation = createConversation;
    this.conversations = {};
  }

  getConversation(id) {
    if (!this.conversations[id]) {
      const {handleMessage, createConversation} = this;
      this.conversations[id] = createConversation({handleMessage});
    }
    return this.conversations[id];
  }

}

export default function createBot(options) {
  return new Bot(options);
}
