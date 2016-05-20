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

function simulate(messageHandler, message) {
  console.log('[In]', message);
  return processMessage(messageHandler, message).then(response => {
    if (response === false) {
      console.log('-');
    }
    else {
      console.log('[Out]', response);
    }
  });
}

Promise.mapSeries([
  () => simulate(mathMatcher, 'math add 3 4 5'),
  () => simulate(mathMatcher, 'math mult 3 4 5'),
  () => simulate(mathMatcher, 'math sub 3 4 5'),
  () => simulate(mathMatcher, 'hello world'),
], f => f());
