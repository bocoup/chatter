// If this syntax looks unfamiliar, don't worry, it's just JavaScript!
// Learn more about ES2015 here: https://babeljs.io/docs/learn-es2015/
//
// Run "npm install" and then test with this command in your shell:
// node examples/create-parser.js

const Promise = require('bluebird');
const chalk = require('chalk');

// ES2015 syntax:
//   import {processMessage, createParser, createMatcher} from 'chatter';
// ES5 syntax:
//   const chatter = require('chatter');
const chatter = require('../lib');
const processMessage = chatter.processMessage;
const createParser = chatter.createParser;
const createMatcher = chatter.createMatcher;

// ================
// message handlers
// ================

// Returns a JSON-formatted string representing the parsed object.
const parsingHandler = createParser(parsed => JSON.stringify(parsed, null, 2));

// When parseOptions is defined, any options in the message specified like
// option=value will be parsed and processed via the defined function.
const parsingHandlerWithOptions = createParser({
  parseOptions: {
    alpha: String,
    beta: Number,
    bravo: Boolean,
  },
}, parsed => JSON.stringify(parsed, null, 2));

// Matches "add" prefix, then adds the remaining args into a sum.
const addHandler = createMatcher({match: 'add'}, createParser(parsed => {
  const args = parsed.args;
  const result = args.reduce((sum, num) => sum + Number(num), 0);
  return `${args.join(' + ')} = ${result}`;
}));

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
  () => simulate(parsingHandler, 'foo bar baz'),
  () => simulate(parsingHandlerWithOptions, 'foo bar a=12 baz b=34 c=56'),
  () => simulate(parsingHandlerWithOptions, 'foo bar al=12 baz be=34 br=56'),
  () => simulate(addHandler, 'add 1 2 3'),
  () => simulate(addHandler, 'add 4 five 6'),
], f => f());
