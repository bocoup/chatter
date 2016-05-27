// If this syntax looks unfamiliar, don't worry, it's just JavaScript!
// Learn more about ES2015 here: https://babeljs.io/docs/learn-es2015/
//
// Run "npm install" and then test with this command in your shell:
// node examples/create-args-adjuster.js

const Promise = require('bluebird');
const chalk = require('chalk');

// ES2015 syntax:
//   import {processMessage, createCommand, createArgsAdjuster, normalizeMessage} from 'chatter';
// ES5 syntax:
//   const chatter = require('chatter');
const chatter = require('..');
const processMessage = chatter.processMessage;
const createCommand = chatter.createCommand;
const createArgsAdjuster = chatter.createArgsAdjuster;
const normalizeMessage = chatter.normalizeMessage;

// ================
// message handlers
// ================

// Increments the counter and returns a string decribing the new state.
const incrementCommand = createCommand({
  name: 'increment',
  description: 'Increment the counter and show it.',
  usage: '<delta>',
}, (message, state) => {
  const delta = Number(message);
  if (!message) {
    return false;
  }
  else if (isNaN(delta)) {
    return `Sorry, but "${message}" doesn't appear to be a number!`;
  }
  state.counter += delta;
  return `The counter is now at ${state.counter}.`;
});

// Returns a message handler that encapsualates some state, and passes that
// state into child commands as an argument.
function getStatefulMessageHandler() {
  const state = {counter: 0};
  return createArgsAdjuster({
    adjustArgs(message) {
      return [message, state];
    },
  }, createCommand({
    isParent: true,
    description: 'An exciting command, for sure.',
  }, [
    incrementCommand,
  ]));
}

// ====================================
// process messages with processMessage
// ====================================

function log(color, prefix, message) {
  message = message.replace(/(\n)/g, `$1${' '.repeat(prefix.length + 1)}`);
  console.log(chalk[color](`${prefix} ${message}`));
}

function header(message) {
  log('cyan', '\n=====', message);
}

function simulate(messageHandler, message) {
  log('magenta', '\n[In] ', message);
  return processMessage(messageHandler, message)
  .then(response => {
    const text = response !== false ? normalizeMessage(response) : '-';
    log('green', '[Out]', text);
  })
  .then(() => Promise.delay(100));
}

const firstStatefulHandler = getStatefulMessageHandler('first');
const secondStatefulHandler = getStatefulMessageHandler('second');

Promise.mapSeries([
  () => header('firstStatefulHandler'),
  () => simulate(firstStatefulHandler, 'help'),
  () => simulate(firstStatefulHandler, 'help increment'),
  () => simulate(firstStatefulHandler, 'increment 1'),
  () => simulate(firstStatefulHandler, 'increment 2'),

  () => header('secondStatefulHandler'),
  () => simulate(secondStatefulHandler, 'increment 101'),
  () => simulate(secondStatefulHandler, 'increment 202'),

  () => header('firstStatefulHandler'),
  () => simulate(firstStatefulHandler, 'increment 3'),

  () => header('secondStatefulHandler'),
  () => simulate(secondStatefulHandler, 'increment 303'),
], f => f());
