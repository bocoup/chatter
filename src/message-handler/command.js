import {DelegatingMessageHandler} from './delegate';
import createMatcher from './matcher';

export class CommandMessageHandler extends DelegatingMessageHandler {

  constructor(options = {}, children) {
    super(options, children);
    this.isCommand = true;
    this.children = this.origChildren = Array.isArray(this.children) ? [...this.children] : [this.children];
    if (this.hasSubCommands()) {
      this.children.push(this.getHelpHandler());
    }
    this.children.push(this.getFallbackHandler());
    const {name, usage, description} = options;
    this.name = name;
    this.usage = usage;
    this.description = description;
    if (name) {
      this.children = createMatcher({match: name}, this.children);
    }
  }

  getSubCommands() {
    return this.origChildren.filter(c => c.isCommand);
  }

  hasSubCommands() {
    return this.getSubCommands().length > 0;
  }

  getUsage() {
    return this.usage && `Usage: \`${this.usage}\``;
  }

  getFallbackHandler() {
    return message => {
      const prefix = this.name ? `${this.name} ` : '';
      const usage = this.getUsage();
      return [
        message && `Unknown command *${prefix}${message}*.`,
        usage,
        this.hasSubCommands() && `${usage ? 'Or try' : 'Try'} *${prefix}help* for more information.`,
      ];
    };
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
