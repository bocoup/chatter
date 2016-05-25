// Run "npm install" and then test with this command in your shell:
// npm run babel examples/create-args-adjuster.js

import Promise from 'bluebird';
import {
  processMessage,
  createCommand,
  createArgsAdjuster,
  normalizeMessage,
} from '../src';

const incrementCommand = createCommand({
  name: 'increment',
  description: 'Increment the counter and show it.',
}, function(message, state) {
  state.counter++;
  return `The ${state.name} counter is now at ${state.counter}.`;
});

function getStatefulMessageHandler(name) {
  const state = {name, counter: 0};
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

const firstStatefulHandler = getStatefulMessageHandler('first');
const secondStatefulHandler = getStatefulMessageHandler('second');

Promise.mapSeries([
  () => simulate(firstStatefulHandler, 'help'),
  () => simulate(firstStatefulHandler, 'increment'),
  () => simulate(firstStatefulHandler, 'increment'),
  () => simulate(firstStatefulHandler, 'increment'),
  () => simulate(secondStatefulHandler, 'increment'),
  () => simulate(secondStatefulHandler, 'increment'),
  () => simulate(firstStatefulHandler, 'increment'),
  () => simulate(secondStatefulHandler, 'increment'),
], f => f());
