import {createBot, createConversation, createMatcher, createParser} from '../src';

// foo top level command's subcommands
const barCommand = createMatcher({match: 'bar'}, createParser((args, {user}) => {
  return {
    message: `bar received <${args.input}> from <${user.name}>`,
  };
}));

const bazCommand = createMatcher({match: 'baz'}, (message, {user}) => {
  return {
    message: `baz received <${message}> from <${user.name}>`,
  };
});

const askCommand = createMatcher({
  match: 'ask',
  handleMessage(message, {user}) {
    return {
      message: `Why do you want me to ask you a question, ${user.name}?`,
      dialog(message, {user}) {
        return {
          message: `I'm not sure "${message}" is a good reason, ${user.name}.`,
        };
      },
    };
  },
});

const chooseCommandChoices = [
  createMatcher({match: m => m === 'a'}, () => ({message: 'Thank you for choosing a.'})),
  createMatcher({match: m => m === 'b'}, () => ({message: 'Thank you for choosing b.'})),
  createMatcher({match: m => m === 'c'}, () => ({message: 'Thank you for choosing c.'})),
  message => ({
    message: `I'm sorry, but "${message}" is an invalid choice, please try again.`,
    dialog: chooseCommandChoices,
  }),
];

const chooseCommand = createMatcher({
  match: 'choose',
  handleMessage(message, {user}) {
    return {
      message: `Choose one of the following, ${user.name}: a, b, or c.`,
      dialog: chooseCommandChoices,
    }
  },
});

// foo top-level command
const fooCommand = createMatcher({match: 'foo'}, [
  barCommand,
  bazCommand,
  askCommand,
  chooseCommand,
  (message, {user}) => ({message: `foo received <${message}> from <${user.name}>`}),
]);

// qux top-level command
const quxCommand = createMatcher({
  match: 'qux',
  handleMessage: createParser({
    handleMessage(args, {user}) {
      throw new Error(`qux error`);
    },
  }),
});

// Bot
const myBot = createBot({
  createConversation: () => createConversation([
    fooCommand,
    quxCommand,
  ]),
});

function simulate(username, message) {
  const user = {name: username};
  console.log(`[${username}] ${message}`);
  const logBot = message => { console.log(`= ${message}\n`); };
  return myBot.getConversation(user.name).handleMessage(message, {user})
    .then(response => {
      if (response === false) {
        return logBot(`Sorry, I don't understand "${message}".`);
      }
      logBot(response.message);
    })
    .catch(error => {
      logBot(`Error encountered: "${error.message}".`);
    });
}

import Promise from 'bluebird';
Promise.mapSeries([
  () => simulate('cowboy', 'foo bar should be parsed by the bar command handler'),
  () => simulate('cowboy', 'foo baz should be parsed by the baz handler'),
  () => simulate('cowboy', 'xyz should not be parsed by anything'),
  () => simulate('cowboy', 'qux should throw an exception'),
  () => simulate('cowboy', 'foo ask'),
  () => simulate('joe', 'foo should be parsed by the foo fallback handler'),
  () => simulate('joe', 'foo ask'),
  () => simulate('cowboy', 'because i said so?'),
  () => simulate('cowboy', 'foo choose'),
  () => simulate('cowboy', 'foo bar'),
  () => simulate('cowboy', 'a walk in the park'),
  () => simulate('joe', 'i dunno'),
  () => simulate('cowboy', 'a'),
  () => simulate('cowboy', 'foo should be parsed by the foo fallback handler'),
], f => f());
