import {handleMessage} from '../util/message-handler';
import {DelegatingMessageHandler} from './delegate';

export class ConversingMessageHandler extends DelegatingMessageHandler {

  constructor(options = {}, children) {
    super(options, children);
    this.dialog = null;
    this.hasState = true;
  }

  // If a child handler yields an object with a "dialog" property, that
  // handler will be stored and will receive the next message. Upon receiving
  // that next message, the dialog will then be cleared.
  //
  // A stored dialog may yield another dialog (ad infinitum). If no dialog is
  // stored, child handlers will be called. A copy of the object yielded by the
  // child handler / dialog (minus the dialog property) will be yielded.
  handleMessage(message, ...args) {
    return handleMessage(this.dialog || this.children, message, ...args)
      .finally(() => this.clearDialog())
      .then(data => {
        if (data && data.dialog) {
          this.dialog = data.dialog;
          data = Object.assign({}, data);
          delete data.dialog;
        }
        return data;
      });
  }

  // Forceably clear any current stored dialog.
  clearDialog() {
    this.dialog = null;
  }

}

export default function createConversation(...args) {
  return new ConversingMessageHandler(...args);
}
