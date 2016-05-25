// Run "npm install" and then test with this command in your shell:
// npm run babel examples/create-command.js

import Promise from 'bluebird';
import {processMessage, normalizeMessage, createCommand, createParser} from '../src';

const addCommand = createCommand({
  name: 'add',
  description: 'Adds some numbers.',
  usage: 'number [ number [ number ... ] ]',
}, createParser(function({remain, input}) {
  if (!input) {
    return false;
  }
  const result = remain.reduce((sum, n) => sum + Number(n), 0);
  if (isNaN(result)) {
    return `Whoops! Are you sure those were all numbers?`;
  }
  return `${remain.join(' + ')} = ${result}`;
}));

const multiplyCommand = createCommand({
  name: 'multiply',
  description: 'Multiplies some numbers.',
  usage: 'number [ number [ number ... ] ]',
}, createParser(function({remain, input}) {
  if (!input) {
    return false;
  }
  const result = remain.reduce((product, n) => product * Number(n), 1);
  if (isNaN(result)) {
    return `Whoops! Are you sure those were all numbers?`;
  }
  return `${remain.join(' x ')} = ${result}`;
}));

const rootCommand = createCommand({
  isParent: true,
  description: 'Some example math commands.',
}, [
  addCommand,
  multiplyCommand,
]);

// ================
// handle messages!
// ================

import chalk from 'chalk';
function log(color, prefix, message) {
  message = message.replace(/(\n)/g, `$1${' '.repeat(prefix.length + 1)}`);
  console.log(chalk[color](`${prefix} ${message}`));
}

function simulate(messageHandler, message) {
  log('magenta', '\n[In] ', message);
  return processMessage(messageHandler, message).then(response => {
    const text = response !== false ? normalizeMessage(response) : '-';
    log('green', '[Out]', text);
  });
}

Promise.mapSeries([
  () => simulate(rootCommand, 'hello'),
  () => simulate(rootCommand, 'help'),
  () => simulate(rootCommand, 'help add'),
  () => simulate(rootCommand, 'help add 3 4 5'),
  () => simulate(rootCommand, 'add 3 4 5'),
  () => simulate(rootCommand, 'multiply'),
  () => simulate(rootCommand, 'multiply three four five'),
  () => simulate(rootCommand, 'help multiply'),
  () => simulate(rootCommand, 'multiply 3 4 5'),
], f => f());
