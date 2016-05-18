import {DelegatingMessageHandler} from './delegate';
import createMatcher from './matcher';
import createParser from './parser';

export class CommandMessageHandler extends DelegatingMessageHandler {

  constructor(options = {}, children) {
    super(options, children);
    const {name, usage, description, details} = options;
    this.isCommand = true;
    this.name = name;
    this.usage = usage;
    this.description = description;
    this.details = details;
    // Ensure children is an array.
    if (!Array.isArray(this.children)) {
      this.children = [this.children];
    }
    // If this command has no name, it's the "top-level" command. Add a help
    // command and a fallback handler for usage information.
    if (!name) {
      this.children = [
        ...this.children,
        this.createHelpCommand(),
        this.createFallbackHandler(),
      ];
    }
    // Keep track of this command's sub-commands for later use.
    this.subCommands = this.children.filter(c => c.isCommand);
    // If this command has a name, create a matching wrapper around children
    // that responds only to this command's name.
    if (name) {
      this.children = createMatcher({match: name}, this.children);
    }
  }

  // Does this command have sub-commands?
  hasSubCommands() {
    return this.subCommands.length > 0;
  }

  // Search for a matching sub-command. IF an exact match isn't found, return
  // the closest matching parent command. Returns the matched command, the full
  // name (ie. path) to that command, and whether or not it was an exact match.
  getMatchingSubCommand(search) {
    let command = this; // eslint-disable-line consistent-this
    let exact = true;
    const fullCommandNameParts = [];
    if (search) {
      const parts = search.split(/\s+/);
      for (let i = 0; i < parts.length; i++) {
        const subCommand = command.subCommands.find(c => c.name && c.name === parts[i]);
        if (!subCommand) {
          exact = false;
          break;
        }
        command = subCommand;
        fullCommandNameParts.push(command.name);
      }
    }
    return {
      command,
      exact,
      fullCommandName: fullCommandNameParts.join(' '),
    };
  }

  // Display usage info for this command, given the specified command name.
  getUsage(commandName) {
    if (!this.name) {
      return false;
    }
    const usageFormatter = details => `${commandName} ${details}`;
    // If usage is a function, pass the commandName to it.
    const usage = typeof this.usage === 'function' ? this.usage(commandName) :
      // If usage is a string, format it.
      this.usage ? usageFormatter(this.usage) :
      // If usage isn't specified, but the command has sub-commands, format it.
      this.hasSubCommands() ? usageFormatter('<command>') :
      // Otherwise just return the commandName,
      commandName;
    return `Usage: \`${usage}\``;
  }

  // Get help info for this command, given the specified arguments.
  helpInfo(search, fullCommandName, exact) {
    const helpText = fullCommandName ? `help for *${fullCommandName}*` : 'general help';
    return [
      !exact && `_Unknown command *${search}*, showing ${helpText}._`,
      this.description,
      this.getUsage(fullCommandName),
      this.hasSubCommands() && '*Commands:*',
      this.subCommands.map(c => `> *${c.name}* - ${c.description}`),
      this.details,
    ];
  }

  // Create a top-level "help" command handler that displays help for the
  // closest matching command to what was specified.
  createHelpCommand() {
    return createCommand({ // eslint-disable-line no-use-before-define
      name: 'help',
      description: 'Get help for the specified command.',
      usage: '<command>',
      handleMessage: createParser(({remain}) => {
        const search = remain.join(' ');
        const {command, fullCommandName, exact} = this.getMatchingSubCommand(search);
        return command.helpInfo(search, fullCommandName, exact);
      }),
    });
  }

  // Get usage info for this command, given the specified arguments.
  usageInfo(message, fullCommandName) {
    const isMatch = Boolean(fullCommandName);
    const usage = isMatch && this.getUsage(fullCommandName);
    const name = fullCommandName ? ` ${fullCommandName}` : fullCommandName;
    return [
      !isMatch && `Unknown command *${message}*.`,
      usage,
      `${usage ? 'Or try' : 'Try'} *help${name}* for more information.`,
    ];
  }

  // Create a top-level "fallback" handler that displays usage info for the
  // closest matching command to what was specified. This handler only runs if
  // every other handler returns false. Ie. no other command matched.
  createFallbackHandler() {
    return message => {
      const {command, fullCommandName} = this.getMatchingSubCommand(message);
      return command.usageInfo(message, fullCommandName);
    };
  }

}

export default function createCommand(...args) {
  return new CommandMessageHandler(...args);
}
