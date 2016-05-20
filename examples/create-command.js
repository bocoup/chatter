// Run "npm install" and then test with this command in your shell:
// npm run babel examples/create-command.js

import Promise from 'bluebird';
import {processMessage, normalizeMessage, createCommand, createParser} from '../src';

const echoCommand = createCommand({
  name: 'echo',
  description: 'Echoes what you say back to you.',
  usage: '<message>',
}, function(message) {
  if (!message) {
    return false;
  }
  return `You said "${message}".`;
});

const addCommand = createCommand({
  name: 'add',
  description: 'Adds some numbers.',
  usage: 'number [ number [ number ... ] ]',
}, createParser(function(parsed) {
  const result = parsed.remain.reduce((sum, num) => sum + Number(num), 0);
  return `${parsed.remain.join(' + ')} = ${result}`;
}));

const rootCommand = createCommand({
  description: 'Some commands.',
}, [
  echoCommand,
  addCommand,
]);

// ================
// handle messages!
// ================

function simulate(messageHandler, message) {
  console.log('\n[In]', message);
  return processMessage(messageHandler, message).then(response => {
    if (response === false) {
      console.log('-');
    }
    else {
      console.log('[Out]', normalizeMessage(response));
    }
  });
}

Promise.mapSeries([
  () => simulate(rootCommand, 'hello'),
  () => simulate(rootCommand, 'help'),
  () => simulate(rootCommand, 'help add'),
  () => simulate(rootCommand, 'add 3 4 5'),
  () => simulate(rootCommand, 'echo hello world'),
  () => simulate(rootCommand, 'echo'),
], f => f());
