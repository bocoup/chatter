// If this syntax looks unfamiliar, don't worry, it's just JavaScript!
// Learn more about ES2015 here: https://babeljs.io/docs/learn-es2015/
//
// Run "npm install" and then test with this command in your shell:
// node examples/create-command-namespaced.js

const Promise = require('bluebird');
const chalk = require('chalk');

// ES2015 syntax:
//   import {processMessage, normalizeMessage, createCommand, createParser} from 'chatter';
// ES5 syntax:
//   const chatter = require('chatter');
const chatter = require('..');
const processMessage = chatter.processMessage;
const normalizeMessage = chatter.normalizeMessage;
const createCommand = chatter.createCommand;
const createParser = chatter.createParser;

// ================
// message handlers
// ================

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

// Parent command that "namespaces" its sub-commands and provides a "help"
// command and fallback usage information.
const mathCommand = createCommand({
  isParent: true,
  name: 'math',
  description: 'Math-related commands.',
}, [
  addCommand,
  multiplyCommand,
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
    const text = response !== false ? normalizeMessage(response) : '-';
    log('green', '[Out]', text);
  })
  .then(() => Promise.delay(100));
}

Promise.mapSeries([
  () => simulate(mathCommand, 'hello'),
  () => simulate(mathCommand, 'help'),
  () => simulate(mathCommand, 'math hello'),
  () => simulate(mathCommand, 'math help'),
  () => simulate(mathCommand, 'math help add'),
  () => simulate(mathCommand, 'math help add 3 4 5'),
  () => simulate(mathCommand, 'math add 3 4 5'),
  () => simulate(mathCommand, 'math multiply'),
  () => simulate(mathCommand, 'math multiply three four five'),
  () => simulate(mathCommand, 'math help multiply'),
  () => simulate(mathCommand, 'math multiply 3 4 5'),
], f => f());
