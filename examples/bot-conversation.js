// If this syntax looks unfamiliar, don't worry, it's just JavaScript!
// Learn more about ES2015 here: https://babeljs.io/docs/learn-es2015/
//
// Run "npm install" and then test with this command in your shell:
// node examples/bot-conversation.js

const Promise = require('bluebird');
const chalk = require('chalk');

// ES2015 syntax:
//   import {createBot, createConversation, createMatcher, createParser} from 'chatter';
// ES5 syntax:
//   const chatter = require('chatter');
const chatter = require('..');
const createBot = chatter.createBot;
const createConversation = chatter.createConversation;
const createMatcher = chatter.createMatcher;
const createParser = chatter.createParser;

// =======================================
// "parent" message handler's sub-handlers
// =======================================

// Respond to a message starting with "parse", then return response with the
// parsed args.
const parseHandler = createMatcher({match: 'parse'}, createParser((parsed, message) => {
  const args = parsed.args;
  const user = message.user;
  return `parseHandler received <${args.join('> <')}> from ${user}.`;
}));

// Respond to a message starting with "message", then return response with
// the remainder of the message.
const messageHandler = createMatcher({match: 'message'}, (text, message) => {
  const user = message.user;
  return `messageHandler received "${text}" from ${user}.`;
});

// Respond to a message starting with "ask", then return response object with
// message and "dialog" message handler that preempts handling of the next
// message.
const askHandler = createMatcher({
  match: 'ask',
  handleMessage(text, message) {
    const user = message.user;
    return {
      message: `Why do you want me to ask you a question, ${user}?`,
      dialog: dialogHandler,
    };
  },
});

// The "dialog" message handler that's returned after "ask" is matched.
function dialogHandler(text, message) {
  const user = message.user;
  return `I'm not sure "${text}" is a good reason, ${user}.`;
}

// Respond to a message starting with "choose", then return response object with
// message and "dialog" message handler that preempts handling of the next
// message.
const chooseHandler = createMatcher({
  match: 'choose',
  handleMessage(text, message) {
    const user = message.user;
    return {
      message: `Choose one of the following, ${user}: a, b, c or exit.`,
      dialog: getChooseHandlerChoices(['a', 'b', 'c'], choice => `Thank you for choosing "${choice}".`),
    };
  },
});

// Once the "choose" handler has been matched, this function is called, which
// returns (and keeps returning) a new set of message handlers that only match
// a very specific set of messages.
function getChooseHandlerChoices(choices, choiceHandler) {
  return [
    // Abort if the user says "exit".
    createMatcher({match: 'exit'}, () => `Choose aborted.`),
    // Call the choiceHandler function if the message matches one of the
    // specified choices. This could also have been implemented as a series
    // of individual "matcher" handlers.
    message => {
      const choice = message.toLowerCase();
      if (choices.find(c => c === choice)) {
        return choiceHandler(choice);
      }
      return false;
    },
    // If none of the preceding handlers match, this handler returns the same
    // set of handlers again.
    message => ({
      message: `I'm sorry, but "${message}" is an invalid choice, please try again.`,
      dialog: getChooseHandlerChoices(choices, choiceHandler),
    }),
  ];
}

// ========================
// "parent" message handler
// ========================

// Pass any message starting with "parent" to the child message handlers, with
// the leading "parent" removed.
const parentHandler = createMatcher({match: 'parent'}, [
  parseHandler,
  messageHandler,
  askHandler,
  chooseHandler,
  // Create a "fallback" handler that always returns a message if none of the
  // preceding message handlers match (ie. they all return false)
  (text, message) => `Parent fallback received "${text}" from ${message.user}.`,
]);

// =========================
// another top-level handler
// =========================

// This handler throws an exception, which is caught by the bot.
const whoopsHandler = createMatcher({
  match: 'whoops',
  handleMessage() {
    throw new Error('Whoops error.');
  },
});

// =============
// the basic bot
// =============

const myBot = createBot({
  // This function must be specified. Even though not used here, this function
  // receives the id returned by getMessageHandlerCacheId, which can be used to
  // programatically return a different message handler.
  createMessageHandler(id) {
    // Because a "conversation" message handler has state, it will be cached
    // for future use for messages with the same id. Try replacing the
    // createConversation function with just the the array of message handlers
    // to see how differently the bot behaves!
    return createConversation([
      parentHandler,
      whoopsHandler,
    ]);
  },
  // Get a cache id from the message object passed into onMessage. Try
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

const colorMap = {cowboy: 'magenta', joe: 'yellow'};

function simulate(user, text) {
  // Display the user message.
  console.log(chalk[colorMap[user]](`\n[${user}] ${text}`));
  // Create a "message" object for the Bot's methods to use.
  const message = {user, text};
  // Normally, this would be run when a message event is received from a chat
  // service, but in this case we'll call it manually.
  return myBot.onMessage(message).then(() => Promise.delay(1000));
}

// Simulate a series of messages, in order. Note that multiple users can talk
// simultaneously and the bot will keep track of their conversations separately
// because their user name is used as the message handler cache id (see the
// getMessageHandlerCacheId function). If both users were both talking in a
// shared channel and the channel name was used as the cache id, the results
// would be very different.
Promise.mapSeries([
  () => simulate('cowboy', 'parent message should be handled by messageHandler'),
  () => simulate('joe', 'parent parse should be parsed by parseHandler'),
  () => simulate('cowboy', 'whoops should throw an exception'),
  () => simulate('cowboy', 'parent ask'),
  () => simulate('joe', 'parent should be handled by the fallback handler'),
  () => simulate('joe', 'parent choose'),
  () => simulate('cowboy', 'i dunno'),
  () => simulate('cowboy', 'parent choose'),
  () => simulate('cowboy', 'parent ask'),
  () => simulate('joe', 'exit'),
  () => simulate('cowboy', 'a'),
  () => simulate('joe', 'xyz should not be handled by anything'),
  () => simulate('cowboy', 'parent should be handled by the fallback handler'),
], f => f());
