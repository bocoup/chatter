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

const mathCommand = createCommand({
  isParent: true,
  name: 'math',
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
  log('magenta', '[In] ', message);
  return processMessage(messageHandler, message).then(response => {
    const text = response !== false ? normalizeMessage(response) : '-';
    log('green', '[Out]', text);
  });
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

