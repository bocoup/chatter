// If this syntax looks unfamiliar, don't worry, it's just JavaScript!
// Learn more about ES2015 here: https://babeljs.io/docs/learn-es2015/
//
// Run "npm install" and then test with this command in your shell:
// node examples/create-matcher.js

const Promise = require('bluebird');
const chalk = require('chalk');

// ES2015 syntax:
//   import {processMessage, createMatcher} from 'chatter';
// ES5 syntax:
//   const chatter = require('chatter');
const chatter = require('..');
const processMessage = chatter.processMessage;
const createMatcher = chatter.createMatcher;

// ================
// message handlers
// ================

// Matches "add" prefix, then splits the message into an array and adds the
// array items into a sum.
const addMatcher = createMatcher({match: 'add'}, message => {
  const numbers = message.split(' ');
  const result = numbers.reduce((sum, n) => sum + Number(n), 0);
  return `${numbers.join(' + ')} = ${result}`;
});

// Matches "multiply" prefix, then splits the message into an array and
// multiplies the array items into a product.
const multiplyMatcher = createMatcher({match: 'multiply'}, message => {
  const numbers = message.split(' ');
  const result = numbers.reduce((product, n) => product * Number(n), 1);
  return `${numbers.join(' x ')} = ${result}`;
});

// Parent message handler that "namespaces" its sub-handlers and provides a
// fallback message if a sub-handler isn't matched.
const mathMatcher = createMatcher({match: 'math'}, [
  addMatcher,
  multiplyMatcher,
  message => `Sorry, I don't understand "${message}".`,
]);

// ====================================
// process messages with processMessage
// ====================================

function log(color, prefix, message) {
  message = message.replace(/(\n)/g, `$1${' '.repeat(prefix.length + 1)}`);
  console.log(chalk[color](`${prefix} ${message}`));
}

function simulate(messageHandler, message) {
  log('magenta', '\n[In] ', message);
  return processMessage(messageHandler, message)
  .then(response => {
    const text = response !== false ? response : '-';
    log('green', '[Out]', text);
  })
  .then(() => Promise.delay(100));
}

Promise.mapSeries([
  () => simulate(mathMatcher, 'add 3 4 5'),
  () => simulate(mathMatcher, 'multiply 3 4 5'),
  () => simulate(mathMatcher, 'math add 3 4 5'),
  () => simulate(mathMatcher, 'math multiply 3 4 5'),
  () => simulate(mathMatcher, 'math subtract 3 4 5'),
], f => f());
