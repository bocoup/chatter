# chatter
> A collection of useful primitives for creating interactive chat bots.

[![NPM](https://nodei.co/npm/chatter.png)](https://nodei.co/npm/chatter/)

[![Build Status](https://travis-ci.org/bocoup/chatter.svg?branch=master)](https://travis-ci.org/bocoup/chatter)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.svg)](http://gruntjs.com/)

[normalizeMessage]: #normalizeMessage
[node]: https://nodejs.org/en/download/

## Usage

```
npm install --save chatter
```

Tested in [Node][node] 4.x and 6.x.

_Note: If the following code example syntax looks unfamiliar, don't worry, it's
just JavaScript! Read [a detailed overview of ECMAScript 2015
features](https://babeljs.io/docs/learn-es2015/) to learn more._

### What is a bot?

For the purposes of this documentation, a bot is an automated system that
selectively responds to text messages with text responses. The bot may simply
respond to messages, statelessly, or the bot may do more complex things, like
keep track of ongoing conversations with users.

The most basic bot looks something like this (note, this is pseudocode):

```js
// Import the chat service's bot library.
const ServiceBot = require('service-bot');

// Create the bot with the relevant options.
const myBot = new ServiceBot(options);

// When the bot receives a message that it cares about, respond to it.
myBot.on('message', message => {
  // This is the code you'll spend most of your time writing:
  if (doICareAbout(message)) {
    myBot.send(response);
  }
});

// Tell the bot to connect to the chat service.
myBot.connect();
```

Usually, all the behind-the-scenes work of connecting the bot to the remote
service, handling reconnections, keeping track of state (what users the bot is
currently talking to, what channels the bot is currently in) is done by a
service-specific library.

So, what's left to do? Well, as shown in the previous example, you'll need
to write the code that determines if a given message warrants a response, and
to then deliver that response to the user.

This project aims to help with all that.

### Message handlers

Since most bot code is centered around these two steps:

1. Testing an incoming message to see if it should be handled
2. Sending a response based on the incoming message

It makes sense to introduce a primitive that does these things. That primitive
is called a "message handler."

The simplest message handler is a function that accepts a message argument and
returns a response if it should respond, or `false` if it doesn't care about
that message:

```js
const lolHandler = message => {
  if (/lol/i.test(message)) {
    const newMessage = message.replace(/lol/ig, 'laugh out loud');
    return `More like "${newMessage}" amirite`;
  }
  return false;
};

lolHandler('what')     // false
lolHandler('lol what') // 'More like "laugh out loud what" amirite'
```

But what if a message handler needs to yield a response asynchronously, instead
of returning a value immediately? It can, by returning a Promise:

```js
const stuffHandler = message => {
  if (message === 'get stuff') {
    return db.query('SELECT * FROM STUFF').then(results => {
      const stuff = results.join(', ');
      return `Look at all the stuff: ${stuff}`;
    });
  }
  return false;
};

stuffHandler('huh')       // false
stuffHandler('get stuff') // Promise -> 'Look at all the stuff! ...'
```

But what do you do if you want to pass all messages through both `lolHandler`
and `stuffHandler`? What if your bot needs to be able to respond to a dozen
types of message in a dozen different ways?

Just create an array of message handlers:

```js
const messageHandlers = [
  lolHandler,
  stuffHandler,
];
```

Now, you've undoubtedly realized that functions that return values or promises
and arrays behave quite differently. Without a helper function that knows how to
iterate over that array, or wait for a promise to resolve, or both of those
things, this won't make your job any easier.

Fortunately, chatter gives you that helper function.

### Processing messages

The `processMessage` function (that chatter exports) takes two arguments:

1. A message handler
2. A message

This function understands that a message handler might be a function or an
array of functions like the ones described above (or a few other possible
things, which will be explained later).

It takes the message handler and message you give it and intelligently processes
them to produce a response (if any), and it returns a Promise that will be
resolved with that response:

```js
const processMessage = require('chatter').processMessage;

// (See the previous examples for the definition of "messageHandlers")
processMessage(messageHandlers, message).then(response => {
  // do something with response
});

// An example:
function simulate(message) {
  processMessage(messageHandlers, message).then(response => {
    if (response === false) {
      response = `Sorry, I don't understand "${message}".`;
    }
    console.log(response);
  });
}

simulate('lol what') // Logs: More like "laugh out loud what" amirite
simulate('getstuff') // Logs: Look at all the stuff! ...
simulate('huh')      // Logs: Sorry, I don't understand "huh".
```

Of course, instead of logging the response, your bot would be sending it back to
the user who said the message or the channel it was said in, using the chat
service library. But you get the idea.

### Message handlers, more specifically

As far as the `processMessage` function is concerned, a message handler is
a function, an object with a `handleMessage` method, or an array of any
combination of those things. That array may contain other arrays.

```js
const functionMessageHandler = message => {
  if (condition) {
    return response;
  }
  return false;
};

const objectMessageHandler = {
  handleMessage(message) {
    if (condition) {
      return response;
    }
    return false;
  },
};

const arrayMessageHandler = [
  functionMessageHandler,
  objectMessageHandler,
];
```

A message handler function (or method) may return `false` or return a Promise
that yields `false` to indicate that the message handler doesn't care about the
message, and the next message handler (if any) should process the message.

```js
const returnsFalseMessageHandler = function(message) {
  return false;
};

const yieldsFalseMessageHandler = function(message) {
  return Promise.resolve(false);
};
```

A message handler may return or yield any other value, and if so, iteration will
be stopped immediately and that value will be yielded.

```js
const returnsValueMessageHandler = function(message) {
  return 'hello';
};

const yieldsValueMessageHandler = function(message) {
  return Promise.resolve('world');
};
```

Also, a message handler may return another message handler (function, object or
array) and those new message handlers will be processed in-line.

As you can see, message handlers may be very simple, but may be composed in very
creative ways.

(See [message-handlers](./examples/message-handlers.js) for more examples)

### A bot using message handlers and processMessage

Like the earlier [What is a bot?](#what-is-a-bot) example, this bot is
pseudocode, but this time it uses message handlers and the `processMessage`
helper function:

```js
// Import the chat service's bot library.
const ServiceBot = require('service-bot');

// Import the chatter processMessage helper function.
const processMessage = require('chatter').processMessage;

// Define your message handlers.
const messageHandlers = [...];

// Create the bot with the relevant options.
const myBot = new ServiceBot(options);

// When the bot receives a message that it cares about, respond to it.
myBot.on('message', function(message) {
  // Things just got a lot easier.
  processMessage(messageHandlers, message).then(response => {
    if (response === false) {
      response = `Sorry, I don't understand "${message}".`;
    }
    myBot.send(response);
  });
});

// Tell the bot to connect to the chat service.
myBot.connect();
```

### Additional included message handlers

Because there are a number of common things message handlers need to do, a few
message handler "creator" functions have been included to make creating common
message handlers easier.

#### createMatcher

The `createMatcher` function creates a new message handler that only calls the
specified message handler if the message matches. It accepts a `match` option,
which is a string, regex or function, to match against the message. If a string
is specified, it matches the beginning of the message. If a message is matched,
the remainder of the message will be passed into the specified message handler:

```js
const createMatcher = require('chatter').createMatcher;

// Matches "add" prefix, then splits the message into an array and adds the
// array items into a sum.
const addMatcher = createMatcher({match: 'add'}, message => {
  const numbers = message.split(' ');
  const result = numbers.reduce((sum, n) => sum + Number(n), 0);
  return `${numbers.join(' + ')} = ${result}`;
});

// Matches "multiply" prefix, then splits the message into an array and
// multiplies the array items into a product.
const multiplyMatcher = createMatcher({match: 'mult'}, message => {
  const numbers = message.split(' ');
  const result = numbers.reduce((product, n) => product * Number(n), 1);
  return `${numbers.join(' x ')} = ${result}`;
});

// Parent message handler that "namespaces" its sub-handlers and provides a
// fallback message if a sub-handler isn't matched.
const mathMatcher = createMatcher({match: 'math'}, [
  addMatcher,
  multiplyMatcher,
  message => `Sorry, I don't understand "${message}".`,
]);

processMessage(mathMatcher, 'add 3 4 5')       // Promise -> false
processMessage(mathMatcher, 'math add 3 4 5')  // Promise -> 3 + 4 + 5 = 12
processMessage(mathMatcher, 'math mult 3 4 5') // Promise -> 3 x 4 x 5 = 60
processMessage(mathMatcher, 'math sub 3 4 5')  // Promise -> Sorry, I don't understand "sub 3 4 5".
```

See the [create-matcher](examples/create-matcher.js) example.

#### createParser

The `createParser` function creates a new message handler that calls the
specified message handler, not with a message string, but with an object
representing the "parsed" message. This is especially useful if you want to
work with an array of words from the message, instead of just a string message.

```js
const createParser = require('chatter').createParser;

// Reduce the array of parsed args into a sum.
const addHandler = createParser(parsed => {
  const args = parsed.args;
  const result = args.reduce((sum, num) => sum + Number(num), 0);
  return `${args.join(' + ')} = ${result}`;
});

processMessage(addHandler, '1 2 3')    // Promise -> 1 + 2 + 3 = 6
processMessage(addHandler, '4 five 6') // Promise -> 4 + five + 6 = NaN
```

See the [create-parser](examples/create-parser.js) example.

#### createCommand

The `createCommand` function is meant to be used to create a nested tree of
message handlers that each have a name, description and usage information.

Like with the `createMatcher` `match` option, the `name` will be used to match
the message, with the remainder of the message being passed into the specified
message handler. The `name`, `description` and `usage` options will be used to
display contextual help and usage information, via an automatically-created
top-level 'help' command and a fallback message handler.

Note that the response from message handlers created with `createCommand` may
return arrays, and should be normalized into a newline-joined string with the
included [normalizeMessage] helper function.

```js
const createCommand = require('chatter').createCommand;

// Command that adds args into a sum.
const addCommand = createCommand({
  name: 'add',
  description: 'Adds some numbers.',
  usage: 'number [ number [ number ... ] ]',
}, createParser(parsed => {
  const args = parsed.args;
  const result = args.reduce((sum, n) => sum + Number(n), 0);
  return `${args.join(' + ')} = ${result}`;
}));

// Command that multiplies args into a product.
const multiplyCommand = createCommand({
  name: 'multiply',
  description: 'Multiplies some numbers.',
  usage: 'number [ number [ number ... ] ]',
}, createParser(parsed => {
  const args = parsed.args;
  const result = args.reduce((product, n) => product * Number(n), 1);
  return `${args.join(' x ')} = ${result}`;
}));

// Parent command that provides a "help" command and fallback usage information.
const rootCommand = createCommand({
  isParent: true,
  description: 'Some example math commands.',
}, [
  addCommand,
  multiplyCommand,
]);

processMessage(rootCommand, 'hello').then(normalizeMessage);
// Unknown command *hello*.
// Try *help* for more information.

processMessage(rootCommand, 'help').then(normalizeMessage);
// Some example math commands.
// *Commands:*
// > *add* - Adds some numbers.
// > *multiply* - Multiplies some numbers.
// > *help* - Get help for the specified command.

processMessage(rootCommand, 'help add').then(normalizeMessage);
// Adds some numbers.
// Usage: `add number [ number [ number ... ] ]`

processMessage(rootCommand, 'add 3 4 5').then(normalizeMessage);
// 3 + 4 + 5 = 12

processMessage(rootCommand, 'multiply').then(normalizeMessage);
// Usage: `multiply number [ number [ number ... ] ]`
// Or try *help multiply* for more information.

processMessage(rootCommand, 'multiply 3 4 5').then(normalizeMessage);
// 3 x 4 x 5 = 60
```

See the [create-command](examples/create-command.js) and
[create-command-namespaced](examples/create-command-namespaced.js) examples.

#### createConversation

The `createConversation` function creates a new message handler that calls the
specified message handler, doing nothing of note until that message handler
returns an object with a `dialog` property, which should be a new
message handler. At that point, the new message handler is stored and used
_instead of the originally-specified message handler_ to handle the next
message. After that message, the message handler is reverted to the original,
unless another `dialog` is specified, in which case that is used instead.

Conversations can be used to create an interactive sequence of message handlers,
and must be be cached on a per-conversation basis (usually per-channel or
per-direct message), because of the need to keep track of the current dialog.

```js
const createConveration = require('chatter').createConveration;

const helloHandler = message => {
  return message.indexOf('hello') !== -1 ? 'Hello to you too!' : false;
};

const askHandler = createMatcher({match: 'ask'}, () => {
  return {
    message: 'Why do you want me to ask you a question?',
    dialog(message) {
      return `I'm not sure "${message}" is a good reason.`;
    },
  };
});

const chooseHandler = createMatcher({match: 'choose'}, () => {
  return {
    message: `Choose one of the following: a, b or c.`,
    dialog: handleChoices,
  };
});

const handleChoices = choice => {
  if (choice === 'a' || choice === 'b' || choice === 'c') {
    return `Thank you for choosing "${choice}".`;
  }
  return {
    message: `I'm sorry, but "${choice}" is not a valid choice. Try again.`,
    dialog: handleChoices,
  };
};

const conversationHandler = createConveration([
  helloHandler,
  askHandler,
  chooseHandler,
]);

function handleResponse(response) {
  if (response !== false) {
    console.log(response.message || response);
  }
}

processMessage(conversationHandler, 'ask').then(handleResponse);
// Why do you want me to ask you a question?

processMessage(conversationHandler, 'hello').then(handleResponse);
// I'm not sure "hello" is a good reason.

processMessage(conversationHandler, 'hello').then(handleResponse);
// Hello to you too!

processMessage(conversationHandler, 'choose').then(handleResponse);
// Choose one of the following: a, b or c.

processMessage(conversationHandler, 'hello').then(handleResponse);
// I'm sorry, but "hello" is not a valid choice. Try again.

processMessage(conversationHandler, 'b').then(handleResponse);
// Thank you for choosing "b".

processMessage(conversationHandler, 'hello').then(handleResponse);
// Hello to you too!
```

See the [bot-conversation](examples/bot-conversation.js) example.

#### createArgsAdjuster

The `createArgsAdjuster` function creates a new message handler that calls the
specified message handler with a different set of arguments than the message
handler received. This is especially useful when you need to pass state from
where a parent message handler is created into a child message handler.

```js
const createArgsAdjuster = require('chatter').createArgsAdjuster;

// Increments the counter and returns a string decribing the new state.
const incrementCommand = createCommand({
  name: 'increment',
  description: 'Increment the counter and show it.',
}, (message, state) => {
  state.counter++;
  return `The counter is now at ${state.counter}.`;
});

// Returns a message handler that encapsualates some state, and passes that
// state into child commands as an argument.
function getStatefulMessageHandler() {
  const state = {counter: 0};
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

const firstStatefulHandler = getStatefulMessageHandler();

processMessage(firstStatefulHandler, 'increment')  // Promise -> The counter is now at 1.
processMessage(firstStatefulHandler, 'increment')  // Promise -> The counter is now at 2.

const secondStatefulHandler = getStatefulMessageHandler();

processMessage(secondStatefulHandler, 'increment') // Promise -> The counter is now at 1.
processMessage(firstStatefulHandler, 'increment')  // Promise -> The counter is now at 3.
processMessage(secondStatefulHandler, 'increment') // Promise -> The counter is now at 2.
```

See the [create-args-adjuster](examples/create-args-adjuster.js) and
[bot-stateful](examples/bot-stateful.js) examples.

### API

#### Bot
* `Bot` - The base bot class.
* `createBot` - function that returns an instance of `Bot`.
* `SlackBot` - Subclass of `Bot` that contains Slack-specific functionality.
* `createSlackBot` - function that returns an instance of `SlackBot`.

#### Message handlers
* `DelegatingMessageHandler` - 
* `createDelegate` - function that returns an instance of `DelegatingMessageHandler`.
* `MatchingMessageHandler` - 
* `createMatcher` - function that returns an instance of `MatchingMessageHandler`.
* `ArgsAdjustingMessageHandler` - 
* `createArgsAdjuster` - function that returns an instance of `ArgsAdjustingMessageHandler`.
* `ParsingMessageHandler` - 
* `createParser` - function that returns an instance of `ParsingMessageHandler`.
* `ConversingMessageHandler` - 
* `createConversation` - function that returns an instance of `ConversingMessageHandler`.
* `CommandMessageHandler` - 
* `createCommand` - function that returns an instance of `CommandMessageHandler`.

#### Util
* `handleMessage` - Pass specified arguments through a message handler or array
  of message handlers.
* `isMessageHandlerOrHandlers` - Facilitate message handler result parsing.
* `parseArgs` - Parse args from an array or string. Suitable for use with lines
  of chat.
* `isMessage` - Is the argument a message? It's a message if it's an Array,
  nested Arrays, or a value comprised solely of String, Number, null, undefined
  or false values.
* `normalizeMessage` - Flatten message array and remove null, undefined or false
  items, then join on newline.
* `composeCreators` - Compose creators that accept a signature like getHandlers()
  into a single creator. All creators receive the same options object.

## Developing and Contributing

### npm scripts

This project and all examples are written for nodejs in ES2015, using babel.
Ensure you have [Node][node] 4.x or 6.x and Npm installed and run `npm install`
before running any of the following commands:

* `npm test` - Lints project code and runs tests.
* `npm run build` - Builds project code from `src` into `lib` for publishing.
* `npm run start` - Watches project files for changes, linting, testing and
  building as-necessary.
* `npm run babel` - Run ES2015 javascript via the babel cli.
* `npm run prepublish` - Automatically runs `npm run build` before publishing.

### Contributing

TBD
