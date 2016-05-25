// Run "npm install" and then test with this command in your shell:
// npm run babel examples/create-matcher.js

import Promise from 'bluebird';
import {processMessage, createMatcher} from '../src';

const addMatcher = createMatcher({match: 'add'}, function(message) {
  const numbers = message.split(' ');
  const result = numbers.reduce((sum, num) => sum + Number(num), 0);
  return `${numbers.join(' + ')} = ${result}`;
});

const multMatcher = createMatcher({match: 'mult'}, function(message) {
  const numbers = message.split(' ');
  const result = numbers.reduce((sum, num) => sum * Number(num), 1);
  return `${numbers.join(' x ')} = ${result}`;
});

const mathMatcher = createMatcher({match: 'math'}, [
  addMatcher,
  multMatcher,
  function(message) {
    return `Unknown command "${message}"`;
  },
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
    const text = response !== false ? response : '-';
    log('green', '[Out]', text);
  });
}

Promise.mapSeries([
  () => simulate(mathMatcher, 'math add 3 4 5'),
  () => simulate(mathMatcher, 'math mult 3 4 5'),
  () => simulate(mathMatcher, 'math sub 3 4 5'),
  () => simulate(mathMatcher, 'hello world'),
], f => f());
