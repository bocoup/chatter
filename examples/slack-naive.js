// If this syntax looks unfamiliar, don't worry, it's just JavaScript!
// Learn more about ES2015 here: https://babeljs.io/docs/learn-es2015/
//
// Run "npm install" and then test with this command in your shell:
// SLACK_API_TOKEN=<YOUR_TOKEN_HERE> node examples/slack-naive.js
//
// Note that you'll first need a Slack API token, which you can get by going
// to your team's settings page and creating a new bot:
// https://my.slack.com/services/new/bot

// ES2015 syntax:
//   import {processMessage, createMatcher} from 'chatter';
// ES5 syntax:
//   const chatter = require('chatter');
const chatter = require('../lib');
const processMessage = chatter.processMessage;
const createMatcher = chatter.createMatcher;

// import {RtmClient} from '@slack/client';
const slack = require('@slack/client');
const RtmClient = slack.RtmClient;

// ================
// message handlers
// ================

// Respond to the word "hello".
const helloHandler = (text, message) => {
  if (/hello/i.test(text)) {
    return `Hello to you too, <@${message.user}>!`;
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

// Matches "add" prefix, then splits the message text into an array and adds the
// array items into a sum.
const addMatcher = createMatcher({match: 'add'}, text => {
  const numbers = text.split(' ');
  const result = numbers.reduce((sum, n) => sum + Number(n), 0);
  return `${numbers.join(' + ')} = ${result}`;
});

// Message handlers to be processed, in order.
const messageHandlers = [
  helloHandler,
  lolHandler,
  addMatcher,
];

// ===============
// naive slack bot
// ===============

// Note that, while this example works, it's lacking a lot of useful
// functionality. See slack-bot.js for a more robust example.

// Create a basic RTM Slack bot.
const rtmClient = new RtmClient(process.env.SLACK_API_TOKEN, {logLevel: 'error'});

// Log to console when the bot connects.
rtmClient.on('open', () => {
  console.log('Bot connected.');
});

// Process message through message handlers with the chatter "processMessage"
// function whenever the bot receives a new message.
rtmClient.on('message', message => {
  const text = message.text;
  // Pass message text through all message handlers.
  processMessage(messageHandlers, text, message)
  // Handle response.
  .then(response => {
    if (response === false) {
      response = `Sorry, I don't understand "${text}".`;
    }
    // Send response to the same channel in which the message was received
    // (this could be a channel, group or direct message).
    const channel = message.channel;
    rtmClient.sendMessage(response, channel);
  });
});

// Connect!
rtmClient.start();
