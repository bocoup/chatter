# chatter

A collection of useful primitives for creating interactive chat bots.

## Examples

This project and all examples are written for nodejs in ES2015, using babel.
Ensure you have [nodejs & npm] installed and run `npm install` before running
any of the following examples:

* [message-handlers](./examples/message-handlers.js) - Shows how [message
  handlers] and the [processMessage function] work, abstractly.
* [conversation](./examples/conversation.js) - Shows how "conversations" work
  using the abstract [Bot] along with [message handlers] and the [processMessage
  function].
* [slack-basic](./examples/slack-basic.js) - A naive Slack bot that uses
  [message handlers] and the [processMessage function].
* [slack](./examples/slack.js) - A more robust Slack bot that uses [SlackBot]
  and [Commands].

[message handlers]: #message-handlers
[processMessage function]: #processing-messages
[Bot]: #Bot
[SlackBot]: #SlackBot
[Commands]: #Commands
[normalizeMessage]: #normalizeMessage

See the comment at the top of each example file for instructions on how to
run that example.

[nodejs & npm]: https://nodejs.org/en/download/

## Usage

### What is a bot?

For the purposes of this documentation, a bot is an automated system that
selectively responds to text messages with text responses. The bot may simply
respond to messages, statelessly, or the bot may do more complex things, like
keep track of ongoing conversations with users.

The most basic bot looks something like this (note, this is pseudocode):

```js
// Import the chat service's bot library.
import ServiceBot from 'service-bot';

// Create the bot with the relevant options.
const myBot = new ServiceBot(options);

// When the bot receives a message that it cares about, respond to it.
myBot.on('message', function(message) {
  // This is the code you'll spend most of your time writing:
  if (doICareAbout(message)) {
    myBot.send(response);
  }
});

// Tell the bot to connect to the chat service.
myBot.connect();
```

Usually, all the behind-the-scenes work of connecting the bot to the remote
service, handling reconnections, keeping track of state (what users is the bot
currently talking to, what channels is the bot currently in) is done by a
service-specific library.

So, what's left to do? Well, as shown in the previous example, you'll need
to write the code that determines if a given message warrants a response, and
to then deliver that response to the user.

This project aims to help with all that.

### Message handlers

Since most bot code is made up of these two steps:

1. Testing an incoming message to see if it should be handled
2. Sending a response based on the incoming message

It makes sense to introduce a primitive that does these things. That primitive
is called a "message handler."

The simplest message handler is a function that accepts a message argument and
returns a response if it should respond, or `false` if it doesn't care about
that message:

```js
const lolHandler = function(message) {
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
const stuffHandler = function(message) {
  if (message !== 'show me the stuff') {
    return false;
  }
  return db.query('SELECT * FROM STUFF').then(function(results) {
    const stuff = results.join(', ');
    return `Look at all the stuff! ${stuff}`;
  });
};

stuffHandler('huh')               // false
stuffHandler('show me the stuff') // Promise -> 'Look at all the stuff! ...'
```

But what do you do if you want to pass all messages through both `lolHandler`
and `stuffHandler`? What if your bot needs to be able to respond to a dozen
types of message in a dozen different ways?

Just create an array of message handlers:

```js
const botHandlers = [
  lolHandler,
  stuffHandler,
];
```

But, wait. If you've been paying attention, you've realized that these things
behave quite differently. Without a helper function that knows how to iterate
over that array, or wait for promises to resolve, or both of those things, this
won't make your job any easier.

Fortunately, we've given you that helper function.

### Processing messages

This module exports a `processMessage` function that takes two arguments:

1. A message handler
2. A message

It understands that a message handler might be a function or an array of
functions like the ones described above (or a few other possible things, which
will be explained later).

It takes the message handler and message you give it and intelligently processes
them to produce a response (if any), and it returns a Promise that will be
resolved with that response:

```js
processMessage(botHandlers, message).then(function(response) {
  // do something with response
});

// An example:
function test(message) {
  processMessage(botHandlers, message).then(function(response) {
    if (response === false) {
      response = `Sorry, I don't understand "${message}".`;
    }
    console.log(response);
  });
}

test('lol what')          // logs: More like "laugh out loud what" amirite
test('show me the stuff') // logs: Look at all the stuff! ...
test('huh')               // logs: Sorry, I don't understand "huh".
```

Of course, instead of logging the response, your bot would be sending it back to
the user who said the message or the channel it was said in, using the chat
service library. But you get the idea.

### Message handlers, more specifically

As far as the `processMessage` function is concerned, a message handler is
a function, an object with a `handleMessage` method, or an array of any
combination of those things. That array may contain other arrays.

```js
const functionMessageHandler = function(message) {
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
import ServiceBot from 'service-bot';

// Import the processMessage helper function.
import {processMessage} from 'chatter';

// Define your message handlers.
const botHandlers = [...];

// Create the bot with the relevant options.
const myBot = new ServiceBot(options);

// When the bot receives a message that it cares about, respond to it.
myBot.on('message', function(message) {
  // Things just got a lot easier.
  processMessage(botHandlers, message).then(function(response) {
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

Because there are a number of common behaviors a message handler might exhibit,
a few message handler "creator" functions have been included to make creating
common message handlers easier for you.

Each of the following functions share the same signature, which is:
`creatorFunction([options, ] messageHandler)`.

#### createMatcher

The `createMatcher` function creates a new message handler that only calls the
specified message handler if the message matches. It accepts a `match` option,
which is a string, regex or function, to match against the message. If a string
is specified, it matches the beginning of the message. If a message is matched,
the remainder of the message will be passed into the specified message handler:

```js
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
    return `Sorry, I don't understand "${message}".`;
  },
]);

processMessage(mathMatcher, 'math add 3 4 5')  // Promise -> 3 + 4 + 5 = 12
processMessage(mathMatcher, 'math mult 3 4 5') // Promise -> 3 x 4 x 5 = 60
processMessage(mathMatcher, 'math sub 3 4 5')  // Promise -> Sorry, I don't understand "sub 3 4 5".
processMessage(mathMatcher, 'hello world')     // Promise -> false
```

See the [create-matcher](examples/create-matcher.js) example.

#### createParser

The `createParser` function creates a new message handler that calls the
specified message handler, not with a message string, but with an object
representing the "parsed" message.

```js
const parsingHandler = createParser(function(parsed) {
  console.log(parsed);
});

processMessage(parsingHandler, 'foo bar baz')
// { options: {},
//   remain: [ 'foo', 'bar', 'baz' ],
//   errors: [],
//   input: 'foo bar baz' }
```

However, `createParser` is most useful when used in conjunction with
`createMatcher` (see the previous `addMatcher` example):

```js
const addMatcher = createMatcher({match: 'add'}, createParser(function(parsed) {
  const result = parsed.remain.reduce((sum, num) => sum + Number(num), 0);
  return `${parsed.remain.join(' + ')} = ${result}`;
}));

processMessage(addMatcher, 'add 3 4 5')  // Promise -> 3 + 4 + 5 = 12
```

See the [create-parser](examples/create-parser.js) example.

#### createCommand

The `createCommand` function is meant to be used to create a nested tree of
message handlers that each have a name, description and usage information.
Like with the `createMatcher` `match` option, the `name` will be used to match
the message, with the remainder of the message being passed into the specified
message handler. The `name`, `description` and `usage` options will be used to
display contextual help and usage information.

Note that the response from message handlers created with `createCommand` may
return arrays, and should be normalized into a newline-joined string with the
included [normalizeMessage] helper function.

```js
const addCommand = createCommand({
  name: 'add',
  description: 'Adds some numbers.',
  usage: 'number [ number [ number ... ] ]',
}, createParser(function({remain}) {
  const result = remain.reduce((sum, n) => sum + Number(n), 0);
  return `${remain.join(' + ')} = ${result}`;
}));

const multiplyCommand = createCommand({
  name: 'multiply',
  description: 'Multiplies some numbers.',
  usage: 'number [ number [ number ... ] ]',
}, createParser(function({remain}) {
  const result = remain.reduce((product, n) => product * Number(n), 1);
  return `${remain.join(' x ')} = ${result}`;
}));

const rootCommand = createCommand({
  isParent: true,
  description: 'Some example math commands.',
}, [
  addCommand,
  multiplyCommand,
]);

processMessage(rootCommand, 'hello');
// Unknown command *hello*.
// Try *help* for more information.

processMessage(rootCommand, 'help');
// Some example math commands.
// *Commands:*
// > *add* - Adds some numbers.
// > *multiply* - Multiplies some numbers.
// > *help* - Get help for the specified command.

processMessage(rootCommand, 'help add');
// Adds some numbers.
// Usage: `add number [ number [ number ... ] ]`

processMessage(rootCommand, 'add 3 4 5');
// 3 + 4 + 5 = 12

processMessage(rootCommand, 'multiply');
// Usage: `multiply number [ number [ number ... ] ]`
// Or try *help multiply* for more information.

processMessage(rootCommand, 'multiply 3 4 5');
// 3 x 4 x 5 = 60
```

See the [create-command](examples/create-command.js) and
[create-command-namespaced](examples/create-command-namespaced.js) examples.

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
Ensure you have [nodejs & npm] installed and run `npm install` before running
any of the following commands:

* `npm test` - Lints project code and runs tests.
* `npm run build` - Builds project code from `src` into `lib` for publishing.
* `npm run start` - Watches project files for changes, linting, testing and
  building as-necessary.
* `npm run babel` - Run ES2015 javascript via the babel cli.
* `npm run prepublish` - Automatically runs `npm run build` before publishing.

### Contributing

TBD
