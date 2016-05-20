// Run "npm install" and then test with this command in your shell:
// SLACK_API_TOKEN=<YOUR_TOKEN_HERE> npm run babel examples/slack-basic.js
//
// Note that you'll first need a Slack API token, which you can get by going
// to your team's settings page and creating a new bot:
// https://my.slack.com/services/new/bot

import {RtmClient, MemoryDataStore} from '@slack/client';
import {processMessage} from '../src';

// Respond to the word "hello".
const helloHandler = message => {
  if (/hello/i.test(message)) {
    return `Hello to you too!`;
  }
  return false;
};

// Respond to the word "lol".
const lolHandler = message => {
  if (/lol/i.test(message)) {
    const newMessage = message.replace(/lol/ig, 'laugh out loud');
    return `More like "${newMessage}" amirite`;
  }
  return false;
};

// Message handlers to be processed, in order.
const messageHandlers = [
  helloHandler,
  lolHandler,
];

// Create a basic RTM Slack bot.
const rtmClient = new RtmClient(process.env.SLACK_API_TOKEN, {logLevel: 'error'});

// Run when the bot connects.
rtmClient.on('open', () => {
  console.log('Bot connected.');
});

// Run when the bot receives a new message.
rtmClient.on('message', message => {
  const {text, channel} = message;
  // Pass message text through all message handlers.
  processMessage(messageHandlers, text)
  // Handle response.
  .then(response => {
    if (response === false) {
      response = `Sorry, I don't understand "${text}".`;
    }
    // Send response to the same channel in which the message was received
    // (this could be a channel, group or direct message).
    rtmClient.sendMessage(response, channel);
  });
});

// Connect!
rtmClient.start();
