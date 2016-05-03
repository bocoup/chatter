import {parseArgs} from './args-parser';

// Pass a message through any number of commands. The first command to return
// a non-false value is the winner!
export function runCommands(commands, message) {
  const {length} = commands;
  for (let i = 0; i < length; i++) {
    const result = commands[i].process(message);
    if (result !== false) {
      return result;
    }
  }
  return false;
}

export class Command {
  constructor({name, description, commands, onMatch, parseOptions}) {
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

  runCommands(message) {
    const commands = [...this.commands];
    if (this.onMatch) {
      commands.push({process: this.onMatchWrapper});
    }
    return runCommands(commands, message);
  }

  onMatchWrapper(message) {
    if (!this.onMatch) {
      return false;
    }
    const args = parseArgs(message, this.parseOptions);
    args.input = message;
    return this.onMatch(args);
  }

  process(message) {
    const isMatch = message.indexOf(this.name) === 0;
    if (!isMatch) {
      return false;
    }
    const remainder = message.slice(this.name.length).replace(/^\s+/, '');
    return this.runCommands(remainder);
  }
}

Command.runCommands = runCommands;

export default function command(options) {
  return new Command(options);
}
