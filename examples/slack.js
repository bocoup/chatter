import Slack from 'slack-client';
import command from './command';
import bot from './bot';

function onMatch(args) { return `${this.name} received <${args.input}>`; }

const barCommand = command({
  name: 'bar',
  description: 'Do something with the bar command.',
  onMatch,
});

const bazCommand = command({
  name: 'baz',
  description: 'Do something with the baz command.',
  onMatch,
});

const fooCommand = command({
  name: 'foo',
  description: 'Parent to the bar and baz commands.',
  commands: [
    barCommand,
    bazCommand,
  ],
  onMatch,
});

const quxCommand = command({
  name: 'qux',
  description: 'Do something with the qux command.',
  onMatch,
});

const myBot = bot({
  commands: [
    fooCommand,
    quxCommand,
  ],
});

const slack = new Slack('slack-bot-key');
const getPostMessage = channel => text => channel.postMessage({usename: 'testbot', text});
slack.on('open', function() {
  console.log('connected');
});

slack.on('error', function() {
  console.log('error');
});

slack.on('message', function(message) {
  const channel = this.getChannelGroupOrDMByID(message.channel);
  const user = this.getUserByID(message.user);
  const postMessage = getPostMessage(channel);
  Promise.try(() => {
    const conversation = myBot.getConversation(channel);
    return conversation.handleMessage(message.text, {user, channel});
  }).then(response => {
    postMessage(response);
  }, error => {
    postMessage(`An error occurred: \`${error.message}\``);
    console.error(error.stack);
  });
});
