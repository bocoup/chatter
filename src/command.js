import {parseArgs} from './args-parser';

// Pass a message and any other arbitrary args through any number of commands.
// The first command to return a non-false value is the winner!
export function runCommands(commands, message, ...args) {
  const {length} = commands;
  for (let i = 0; i < length; i++) {
    const result = commands[i].handleMessage(message, ...args);
    if (result !== false) {
      return result;
    }
  }
  return false;
}

export class Command {
  constructor({name, description, commands, onMatch, parseOptions} = {}) {
    this.name = name;
    this.description = description;
    this.commands = commands || [];
    this.onMatch = onMatch;
    this.parseOptions = parseOptions || {};
    this.onMatchWrapper = this.onMatchWrapper.bind(this);
  }

  getDescription() {
    return this.description;
  }

  runCommands(message, ...args) {
    const commands = [...this.commands];
    if (this.onMatch) {
      commands.push({handleMessage: this.onMatchWrapper});
    }
    return runCommands(commands, message, ...args);
  }

  onMatchWrapper(message, ...args) {
    if (!this.onMatch) {
      return false;
    }
    const parsed = parseArgs(message, this.parseOptions);
    parsed.input = message;
    return this.onMatch(parsed, ...args);
  }

  handleMessage(message, ...args) {
    const isMatch = message.indexOf(this.name) === 0;
    if (!isMatch) {
      return false;
    }
    const remainder = message.slice(this.name.length).replace(/^\s+/, '');
    return this.runCommands(remainder, ...args);
  }
}

Command.runCommands = runCommands;

export default function command(options) {
  return new Command(options);
}
