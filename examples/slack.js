// Run "npm install" and then test with this command in your shell:
// SLACK_API_TOKEN=<YOUR_TOKEN_HERE> npm run babel examples/slack.js

import Promise from 'bluebird';
import {RtmClient, WebClient, MemoryDataStore} from '@slack/client';
import {
  createSlackBot,
  createConversation,
  createCommand,
  createMatcher,
  createParser,
} from '../src';

// Respond to the word "hello"
const helloHandler = message => {
  if (/hello/i.test(message)) {
    return `Hello to you too!`;
  }
  return false;
};

// Respond to the word "lol"
const lolHandler = message => {
  if (/lol/i.test(message)) {
    const newMessage = message.replace(/lol/ig, 'laugh out loud');
    return `More like "${newMessage}" amirite`;
  }
  return false;
};

// A command that echoes user input.
const delayCommand = createCommand({
  name: 'delay',
  description: `I'll say something after a delay.`,
  usage: '[yes | no]',
}, message => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(!message ? false : message.toLowerCase() === 'yes' ? 'Awesome!' : 'Bummer!');
    }, 1000);
  });
});

// A command that echoes user input.
const echoCommand = createCommand({
  name: 'echo',
  description: `I'm the echo command.`,
  usage: '<say anything here>',
}, message => {
  if (message) {
    return `You said *${message}*`;
  }
  return false;
});

// A command that adds some numbers.
const addCommand = createCommand({
  name: 'add',
  description: `I'll add some numbers for you!`,
  usage: '<list of numbers>',
}, createParser(({remain, input}) => {
  if (!input) {
    return false;
  }
  const result = remain.reduce((sum, n) => sum + Number(n), 0);
  if (isNaN(result)) {
    return `Whoops! Are you sure those were all numbers?`;
  }
  return `Apparently, ${remain.join(' + ')} = ${result}.`;
}));

// A command that multiplies some numbers.
const multCommand = createCommand({
  name: 'mult',
  description: `I'll multiply some numbers for you!`,
  usage: '<list of numbers>',
}, createParser(({remain, input}) => {
  if (!input) {
    return false;
  }
  const result = remain.reduce((sum, n) => sum * Number(n), 1);
  if (isNaN(result)) {
    return `Whoops! Are you sure those were all numbers?`;
  }
  return `Apparently, ${remain.join(' x ')} = ${result}.`;
}));

// Math commands.
const mathCommand = createCommand({
  name: 'math',
  description: `Math-related commands.`,
}, [
  addCommand,
  multCommand,
]);

// The bot.
const bot = createSlackBot({
  // The bot name.
  name: 'Test Bot',
  // Instances of the slack rtm and web client, per
  // https://github.com/slackhq/node-slack-sdk
  slack: {
    rtmClient: new RtmClient(process.env.SLACK_API_TOKEN, {
      dataStore: new MemoryDataStore(),
      autoReconnect: true,
    }),
    webClient: new WebClient(process.env.SLACK_API_TOKEN),
  },
  // Whenever a new message comes in, it'll be handled by what this returns.
  // If a stateful message handler is used (like a conversation), it will
  // be cached.
  createMessageHandler() {
    // A conversation allows the bot to remember "dialogs" by channel.
    return createConversation([
      // Handle direct (private) messages:
      this.createSlackMessageHandler({dm: true}, [
        // Top-level command that encapsulates sub-commands and adds a "help"
        // command and a fallback message handler.
        createCommand({
          description: `Hi, I'm the test bot!`,
        }, [
          delayCommand,
          echoCommand,
          mathCommand,
        ]),
      ]),
      // Handle public messages, assuming the bot's actually in one or more
      // channels.
      this.createSlackMessageHandler({channel: true}, [
        helloHandler,
        lolHandler,
      ]),
    ]);
  },
});

// Connect!
bot.login();
