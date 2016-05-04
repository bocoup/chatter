import Promise from 'bluebird';
import {runCommands as defaultRunCommands} from './command';

export class Conversation {
  constructor({commands, runCommands} = {}) {
    this.commands = commands;
    this.runCommands = runCommands || defaultRunCommands;
    this.dialog = null;
  }

  handleMessage(message, ...args) {
    let commands = this.commands;
    if (this.dialog) {
      commands = [this.dialog, ...commands];
      this.dialog = null;
    }
    return Promise.try(() => {
      return this.runCommands(commands, message, ...args);
    }).then(result => {
      if (result && result.dialog) {
        this.dialog = result.dialog;
      }
      return result;
    });
  }

  clearDialog() {
    this.dialog = null;
  }
}

export default function conversation(options) {
  return new Conversation(options);
}
