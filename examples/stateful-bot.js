// Run "npm install" and then test with this command in your shell:
// npm run babel examples/stateful-bot.js

import {
  createBot,
  createCommand,
  createArgsAdjuster,
} from '../src';

// ===========
// timer class
// ===========

class Timer {
  wasStarted() {
    return 'startTime' in this;
  }
  start() {
    this.startTime = new Date();
  }
  getElapsed() {
    if (!this.startTime) {
      return 'Timer not yet started.';
    }
    const diff = new Date((new Date() - this.startTime))
    const elapsed = diff.toISOString().slice(11, 19);
    return `Elapsed time: ${elapsed}.`;
  }
}

// ========================
// message handler creators
// ========================

const startHandler = createCommand({
  name: 'start',
  description: 'Start or re-start the current timer.',
}, (text, timer) => {
  const wasStarted = timer.wasStarted();
  timer.start();
  return `Timer ${wasStarted ? 're-' : ''}started.`;
});

const elapsedHandler = createCommand({
  name: 'elapsed',
  description: 'Get the elapsed time for the current timer.',
}, (text, timer) => {
  return timer.getElapsed();
});

// =============
// the basic bot
// =============

const myBot = createBot({
  // This function must be specified. Even though not used here, this function
  // receives the id returned by getMessageHandlerCacheId, which can be used to
  // programatically return a different message handler.
  createMessageHandler(id) {
    // Create a new instance of our Timer class.
    const timer = new Timer();
    // Create a message handler that first adjusts the args received from the
    // bot to include the timer instance, then calls the command message handler
    // with the adjusted arguments. While we're not using the original "message"
    // object in our message handlers, it's included for completeness' sake.
    const messageHandler = createArgsAdjuster({
      adjustArgs(text, message) {
        return [text, timer, message];
      },
    }, createCommand({
      isParent: true,
      description: 'A useful timer.'
    }, [
      startHandler,
      elapsedHandler,
    ]));
    // Let the Bot know the message handler has state so it will be cached and
    // retrieved for future messages with the same id. Try commenting out this
    // line to see how Bot uses hasState.
    messageHandler.hasState = true;
    // Return the message handler.
    return messageHandler;
  },
  // Get a cache id from the "message" object passed into onMessage. Try
  // returning a fixed value to show how the bot uses the return value to cache
  // message handlers.
  getMessageHandlerCacheId(message) {
    return message.user;
  },
  // Normally, this would actually send a message to a chat service, but since
  // this is a simulation, just log the response to the console.
  sendResponse(message, response) {
    // Display the bot response.
    const text = this.normalizeResponse(response);
    console.log(chalk.cyan(`[bot] ${text}`));
  },
});

// ========================================
// simulate the bot interacting with a user
// ========================================

import chalk from 'chalk';
const colorMap = {cowboy: 'magenta', joe: 'yellow'}

function simulate(user, text) {
  // Display the user message.
  console.log(chalk[colorMap[user]](`\n[${user}] ${text}`));
  // Create a "message" object for the Bot's methods to use.
  const message = {user, text};
  // Normally, this would be run when a message event is received from a chat
  // service, but in this case we'll call it manually.
  return myBot.onMessage(message).then(() => Promise.delay(1000))
}

// Simulate a series of messages, in order. Note that multiple users can talk
// simultaneously and the bot will keep track of their conversations separately
// because their user name is used as the message handler cache id (see the
// getMessageHandlerCacheId function). If both users were both talking in a
// shared channel and the channel name was used as the cache id, the results
// would be very different.
import Promise from 'bluebird';
Promise.mapSeries([
  () => simulate('cowboy', 'hello'),
  () => simulate('cowboy', 'elapsed'),
  () => simulate('cowboy', 'help'),
  () => simulate('cowboy', 'start'),
  () => simulate('cowboy', 'elapsed'),
  () => simulate('joe', 'start'),
  () => simulate('joe', 'elapsed'),
  () => simulate('cowboy', 'elapsed'),
  () => simulate('cowboy', 'start'),
  () => simulate('cowboy', 'elapsed'),
  () => simulate('joe', 'elapsed'),
], f => f());
