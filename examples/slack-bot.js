// If this syntax looks unfamiliar, don't worry, it's just JavaScript!
// Learn more about ES2015 here: https://babeljs.io/docs/learn-es2015/
//
// Run "npm install" and then test with this command in your shell:
// SLACK_API_TOKEN=<YOUR_TOKEN_HERE> node examples/slack-bot.js
//
// Note that you'll first need a Slack API token, which you can get by going
// to your team's settings page and creating a new bot:
// https://my.slack.com/services/new/bot

const Promise = require('bluebird');

// ES2015 syntax:
//   import {createSlackBot, createCommand, createParser} from 'chatter';
// ES5 syntax:
//   const chatter = require('chatter');
const chatter = require('..');
const createSlackBot = chatter.createSlackBot;
const createCommand = chatter.createCommand;
const createParser = chatter.createParser;

// import {RtmClient} from '@slack/client';
const slack = require('@slack/client');
const RtmClient = slack.RtmClient;
const WebClient = slack.WebClient;
const MemoryDataStore = slack.MemoryDataStore;

// ================
// message handlers
// ================

// Respond to the word "hello"
const helloHandler = text => {
  if (/hello/i.test(text)) {
    return `Hello to you too!`;
  }
  return false;
};

// Respond, but only if the message contains the word "lol".
const lolHandler = text => {
  if (/lol/i.test(text)) {
    const newText = text.replace(/lol/ig, 'laugh out loud');
    return `More like "${newText}" amirite`;
  }
  return false;
};

// A command that says something after a delay. Be careful, though! Even though
// this command yields false to indicate when it doesn't know how to handle the
// message, it does so after the delay. If possible, return false immediately!
const delayCommand = createCommand({
  name: 'delay',
  description: `I'll say something after a delay.`,
  usage: '[yes | no]',
}, text => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!text) {
        resolve(false);
      }
      else if (text.toLowerCase() === 'yes') {
        resolve('Awesome!');
      }
      else {
        resolve('Bummer!');
      }
    }, 250);
  });
});

// A command that echoes user input, as long as the user says something after
// the command name!
const echoCommand = createCommand({
  name: 'echo',
  description: `I'm the echo command.`,
  usage: '<say anything here>',
}, text => {
  if (text) {
    const isAmazing = text.toLowerCase() === 'amazing';
    return {
      messages: [
        `You said *${text}*.`,
        isAmazing ? 'Which is amazing...' : 'Which is great, and all...',
        isAmazing ? 'Literally!' : 'But not amazing.',
      ],
    };
  }
  return false;
});

// Command that adds args into a sum. If no args were specified, return false
// to display usage information. If sum isn't a number, display a message.
const addCommand = createCommand({
  name: 'add',
  description: 'Adds some numbers.',
  usage: 'number [ number [ number ... ] ]',
}, createParser(parsed => {
  const args = parsed.args;
  if (args.length === 0) {
    return false;
  }
  const result = args.reduce((sum, n) => sum + Number(n), 0);
  if (isNaN(result)) {
    return `Whoops! Are you sure those were all numbers?`;
  }
  return `${args.join(' + ')} = ${result}`;
}));

// Command that multiplies args into a product. If no args were specified,
// return false to display usage information. If product isn't a number,
// display a message.
const multiplyCommand = createCommand({
  name: 'multiply',
  description: 'Multiplies some numbers.',
  usage: 'number [ number [ number ... ] ]',
}, createParser(parsed => {
  const args = parsed.args;
  if (args.length === 0) {
    return false;
  }
  const result = args.reduce((product, n) => product * Number(n), 1);
  if (isNaN(result)) {
    return `Whoops! Are you sure those were all numbers?`;
  }
  return `${args.join(' x ')} = ${result}`;
}));

// Parent math command that "namespaces" its sub-commands.
const mathCommand = createCommand({
  name: 'math',
  description: 'Math-related commands.',
}, [
  addCommand,
  multiplyCommand,
]);

// ================
// proper slack bot
// ================

const bot = createSlackBot({
  // The bot name.
  name: 'Chatter Bot',
  // The getSlack function should return instances of the slack rtm and web
  // clients, like so. See https://github.com/slackhq/node-slack-sdk
  getSlack() {
    return {
      rtmClient: new RtmClient(process.env.SLACK_API_TOKEN, {
        dataStore: new MemoryDataStore(),
        autoReconnect: true,
        logLevel: 'error',
      }),
      webClient: new WebClient(process.env.SLACK_API_TOKEN),
    };
  },
  // The createMessageHandler function should return a top-level message handler
  // to handle each message.
  createMessageHandler(id, meta) {
    const channel = meta.channel;
    // Get actual bot name and aliases for the bot. If the bot's actual name in
    // Slack was "test", the aliases would be "test:" "@test" "@test:", allowing
    // the bot to respond to commands prefixed with any of them. If the channel
    // is a DM, the bot name will be null, and the actual name will be added to
    // the aliases list, so the bot can respond to both prefixed and non-
    // prefixed messages. Alternately, specify your own bot name and aliases!
    const nameObj = this.getBotNameAndAliases(channel.is_im);
    console.log(nameObj);
    // Create the top-level command.
    const rootCommand = createCommand({
      isParent: true,
      name: nameObj.name,
      aliases: nameObj.aliases,
      description: `Hi, I'm the test bot!`,
    }, [
      delayCommand,
      echoCommand,
      mathCommand,
    ]);
    // Direct message.
    if (channel.is_im) {
      return rootCommand;
    }
    // Public channel message.
    return [
      rootCommand,
      // You can certainly combine commands and other message handlers, as long
      // as the command has a name. (If the command didn't have a name, it would
      // handle all messages, and message handlers after it would never run).
      helloHandler,
      lolHandler,
    ];
  },
});

// Connect!
bot.login();
