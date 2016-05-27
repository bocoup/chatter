// If this syntax looks unfamiliar, don't worry, it's just JavaScript!
// Learn more about ES2015 here: https://babeljs.io/docs/learn-es2015/
//
// Run "npm install" and then test with this command in your shell:
// node examples/message-handlers.js

const Promise = require('bluebird');
const chalk = require('chalk');

// ES2015 syntax:
//   import {processMessage} from 'chatter';
// ES5 syntax:
//   const chatter = require('chatter');
const chatter = require('..');
const processMessage = chatter.processMessage;

// Simulate a promise-yielding database abstraction.
const db = {
  query() {
    return new Promise(resolve => {
      const stuff = ['stapler', 'robot', 'another robot', 'piano'];
      setTimeout(() => resolve(stuff), 100);
    });
  },
};

// ================
// message handlers
// ================

// Plain function. Receives a message and always returns a response.
const alwaysRespond = message => `You said "${message}".`;

// Plain function. Receives a message and sometimes returns a response, but
// sometimes returns false.
const sometimesRespond = message => {
  if (/lol/i.test(message)) {
    const newMessage = message.replace(/lol/ig, 'laugh out loud');
    return `More like "${newMessage}" amirite`;
  }
  return false;
};

// Array of functions. Messages will be sent through them in order, and the
// first one that returns a non-false value wins!
const multipleResponders = [
  sometimesRespond,
  alwaysRespond,
];

// Object with a handleMessage method. Also returns a promise that yields a
// value.
const respondEventually = {
  handleMessage(message) {
    if (message === 'get stuff') {
      return db.query('SELECT * FROM STUFF').then(results => {
        const stuff = results.join(', ');
        return `Look at all the stuff: ${stuff}`;
      });
    }
    return false;
  },
};

// Object with a handleMessage method. This is basically what you get when you
// use createMatcher, so use that instead. The chatter "processMessage"
// function is used to process the message through all children.
const matchAndRunChildHandlers = {
  match: 'yo',
  children: [
    sometimesRespond,
    alwaysRespond,
  ],
  getMatchRemainder(message) {
    if (message.indexOf(this.match) !== 0) {
      return false;
    }
    return message.slice(this.match.length).replace(/^\s+/, '');
  },
  handleMessage(message) {
    const remainder = this.getMatchRemainder(message);
    if (remainder === false) {
      return false;
    }
    else if (remainder === '') {
      return `You need to specify something after "yo".`;
    }
    return processMessage(this.children, remainder);
  },
};


// ====================================
// process messages with processMessage
// ====================================

function log(color, prefix, message) {
  message = message.replace(/(\n)/g, `$1${' '.repeat(prefix.length + 1)}`);
  console.log(chalk[color](`${prefix} ${message}`));
}

function header(message) {
  log('cyan', '\n=====', message);
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
  () => header('alwaysRespond'),
  () => simulate(alwaysRespond, 'hello'),
  () => simulate(alwaysRespond, 'world'),

  () => header('sometimesRespond'),
  () => simulate(sometimesRespond, 'hello'),
  () => simulate(sometimesRespond, 'lol world'),

  () => header('multipleResponders'),
  () => simulate(multipleResponders, 'hello'),
  () => simulate(multipleResponders, 'lol world'),

  () => header('respondEventually'),
  () => simulate(respondEventually, 'get stuff'),
  () => simulate(respondEventually, 'get nothing'),

  () => header('matchAndRunChildHandlers'),
  () => simulate(matchAndRunChildHandlers, 'not yo'),
  () => simulate(matchAndRunChildHandlers, 'yo'),
  () => simulate(matchAndRunChildHandlers, 'yo hello'),
  () => simulate(matchAndRunChildHandlers, 'yo lol world'),
], f => f());
