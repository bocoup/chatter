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
  () => simulate(parsingHandler, 'foo bar baz'),
  () => simulate(addHandler, 'add 3 4 5'),
], f => f());

