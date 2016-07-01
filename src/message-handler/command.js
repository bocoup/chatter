import {DelegatingMessageHandler} from './delegate';
import createMatcher from './matcher';
import createParser from './parser';

function formatCommand(...args) {
  // console.log(`formatCommand <${args.join('> <')}>`);
  return args.filter(Boolean).join(' ');
}

export class CommandMessageHandler extends DelegatingMessageHandler {

  constructor(options = {}, children) {
    super(options, children);
    const {name, aliases, usage, description, details, isParent} = options;
    this.isCommand = true;
    this.name = name;
    this.usage = usage;
    this.description = description;
    this.details = details;
    this.isParent = isParent;
    // Ensure children is an array.
    if (!Array.isArray(this.children)) {
      this.children = [this.children];
    }
    // If this command has no name, it's the "top-level" command. Add a help
    // command and a fallback handler for usage information.
    if (isParent) {
      this.children = [
        ...this.children,
        this.createHelpCommand(),
        this.createFallbackHandler(),
      ];
    }
    // Keep track of this command's sub-commands for later use.
    this.subCommands = this.children.filter(c => c.isCommand);
    // If this command has a name or aliases, create a matching wrapper around
    // children that responds only to that name or an alias.
    if (name || aliases) {
      const items = !aliases ? [] : Array.isArray(aliases) ? aliases : [aliases];
      if (name) {
        items.unshift(name);
      }
      const origChildren = this.children;
      this.children = items.map(item => createMatcher({match: item}, origChildren));
      if (!name) {
        this.children.push(origChildren);
      }
    }
  }

  // Does this command have sub-commands?
  hasSubCommands() {
    return this.subCommands.length > 0;
  }

  // Search for a matching sub-command. If an exact match isn't found, return
  // the closest matching parent command. Returns the matched command, the full
  // name (ie. path) to that command, and whether or not it was an exact match.
  getMatchingSubCommand(search) {
    let command = this; // eslint-disable-line consistent-this
    let exact = true;
    const prefix = this.isParent ? this.name : '';
    const subCommandNameParts = [];
    if (search) {
      const parts = search.split(/\s+/);
      for (let i = 0; i < parts.length; i++) {
        const subCommand = command.subCommands.find(({name}) => {
          if (name) {
            // Handle spaces in command names.
            for (let j = i; j < parts.length; j++) {
              if (parts.slice(i, j + 1).join(' ') === name) {
                i = j;
                return true;
              }
            }
          }
          return false;
        });
        if (!subCommand) {
          exact = false;
          break;
        }
        command = subCommand;
        subCommandNameParts.push(command.name);
      }
    }
    return {
      command,
      prefix,
      exact,
      subCommandName: subCommandNameParts.join(' '),
    };
  }

  // Display usage info for this command, given the specified command name.
  getUsage(command, prefix) {
    if (!this.name) {
      return false;
    }
    command = formatCommand(prefix, command);
    const usageFormatter = details => formatCommand(command, details);
    // If usage is a function, pass the command to it.
    const usage = typeof this.usage === 'function' ? this.usage(command) :
      // If usage is a string, format it.
      this.usage ? usageFormatter(this.usage) :
      // If usage isn't specified, but the command has sub-commands, format it.
      this.hasSubCommands() ? usageFormatter('<command>') :
      // Otherwise just return the command,
      command;
    return `Usage: \`${usage}\``;
  }

  // Get help info for this command, given the specified arguments.
  helpInfo(search, command, prefix, exact) {
    const helpText = command ? ` for *${formatCommand(prefix, command)}*` : prefix ? ` for *${prefix}*` : '';
    return [
      !exact && `_Unknown command *${formatCommand(prefix, search)}*, showing help${helpText}._`,
      this.description,
      this.getUsage(command, prefix),
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
      handleMessage: createParser(({args}) => {
        const search = args.join(' ');
        const {command, subCommandName, prefix, exact} = this.getMatchingSubCommand(search);
        return command.helpInfo(search, subCommandName, prefix, exact);
      }),
    });
  }

  // Get usage info for this command, given the specified arguments.
  usageInfo(message, command, prefix) {
    const isMatch = !message || Boolean(command);
    const usage = isMatch && this.getUsage(command, prefix);
    const help = command = formatCommand(prefix, 'help', command);
    return [
      !isMatch && `Unknown command *${formatCommand(prefix, message)}*.`,
      usage,
      `${usage ? 'Or try' : 'Try'} *${help}* for more information.`,
    ];
  }

  // Create a top-level "fallback" handler that displays usage info for the
  // closest matching command to what was specified. This handler only runs if
  // every other handler returns false. Ie. no other command matched.
  createFallbackHandler() {
    return message => {
      const {command, subCommandName, prefix} = this.getMatchingSubCommand(message);
      return command.usageInfo(message, subCommandName, prefix);
    };
  }

}

export default function createCommand(...args) {
  return new CommandMessageHandler(...args);
}
