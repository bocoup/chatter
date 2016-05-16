import {MatchingMessageHandler} from './matcher';

export class CommandMessageHandler extends MatchingMessageHandler {

  constructor(options = {}, children) {
    const {name, usage, description} = options;
    const matchOptions = Object.assign({}, options, {match: name});
    super(matchOptions, children);

    this.isCommand = true;
    this.name = name;
    this.usage = usage;
    this.description = description;

    this.children = Array.isArray(this.children) ? [...this.children] : [this.children];
    if (this.hasSubCommands()) {
      this.children.push(this.getHelpHandler());
    }
    this.children.push(this.getFallbackHandler());
  }

  getSubCommands() {
    return this.children.filter(c => c.isCommand);
  }

  hasSubCommands() {
    return this.getSubCommands().length > 0;
  }

  getUsage() {
    return [
      this.usage && `Usage: \`${this.usage}\``,
    ];
  }

  getFallbackHandler() {
    const {name} = this;
    return message => [
      message && `Unknown command \`${name} ${message}\`.`,
      this.getUsage(),
      this.hasSubCommands() && `Or try \`${name} help\` for more information.`,
    ];
  }

  getHelpHandler() {
    return createCommand({ // eslint-disable-line no-use-before-define
      name: 'help',
      description: 'Get help for the specified command.',
      handleMessage: () => {
        return [
          this.description,
          this.getUsage(),
          '*Commands:*',
          this.getSubCommands().map(c => `> *${c.name}* - ${c.description}`),
        ];
      },
    });
  }

}

export default function createCommand(...args) {
  return new CommandMessageHandler(...args);
}
