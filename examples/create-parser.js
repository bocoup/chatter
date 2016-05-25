// Run "npm install" and then test with this command in your shell:
// npm run babel examples/create-parser.js

import Promise from 'bluebird';
import {processMessage, createParser, createMatcher} from '../src';

const parsingHandler = createParser(function(parsed) {
  return JSON.stringify(parsed, null, 2);
});

const addHandler = createMatcher({match: 'add'}, createParser(function(parsed) {
  const result = parsed.remain.reduce((sum, num) => sum + Number(num), 0);
  return `${parsed.remain.join(' + ')} = ${result}`;
}));

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
  () => simulate(parsingHandler, 'foo bar baz'),
  () => simulate(addHandler, 'add 3 4 5'),
], f => f());

