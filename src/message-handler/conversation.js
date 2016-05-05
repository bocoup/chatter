import Promise from 'bluebird';
import {DelegatingMessageHandler} from './delegate';

export class ConversingMessageHandler extends DelegatingMessageHandler {

  constructor(options = {}) {
    super(options);
    this.dialog = null;
  }

  // If a child handler returns an object with a "dialog" property, that
  // handler will be stored and will receive the next message, then will be
  // cleared. A stored dialog may return another dialog (infinitely). If no
  // dialog is stored, child handlers will be called in order.
  handleMessage(message, ...args) {
    let promise;
    const dialog = this.dialog;
    if (dialog) {
      this.clearDialog();
      promise = Promise.try(() => dialog.handleMessage(message, ...args));
    }
    else {
      promise = super.handleMessage(message, ...args);
    }
    return promise
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

export default function createConversation(options) {
  return new ConversingMessageHandler(options);
}
