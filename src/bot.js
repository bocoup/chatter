export class Bot {

  constructor({createConversation} = {}) {
    this.createConversation = createConversation;
    this.conversations = {};
  }

  getConversation(id) {
    if (!this.conversations[id]) {
      this.conversations[id] = this.createConversation(id);
    }
    return this.conversations[id];
  }

}

export default function createBot(options) {
  return new Bot(options);
}
