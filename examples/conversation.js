import createConversation from '../src/message-handler/conversation';
import createMatcher from '../src/message-handler/matcher';
import createParser from '../src/message-handler/parser';
import createBot from '../src/bot';

// foo top level command's subcommands
const barCommand = createMatcher({match: 'bar'}, createParser((args, {user}) => {
  return {
    response: `bar received <${args.input}> from <${user.name}>`,
  };
}));

const bazCommand = createMatcher({match: 'baz'}, (message, {user}) => {
  return {
    response: `baz received <${message}> from <${user.name}>`,
  };
});

const askCommand = createMatcher({
  match: 'ask',
  handleMessage(message, {user}) {
    return {
      response: `Why do you want me to ask you a question, ${user.name}?`,
      dialog(message, {user}) {
        return {response: `I'm not sure \`${message}\` is a good reason, ${user.name}.`};
      },
    };
  },
});

// foo top-level command
const fooCommand = createMatcher({match: 'foo'}, [
  barCommand,
  bazCommand,
  askCommand,
  (message, {user}) => ({response: `foo received <${message}> from <${user.name}>`}),
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
    .then(data => {
      if (data === false) {
        return logBot(`Sorry, I don't understand \`${message}\`.`);
      }
      logBot(data.response);
    })
    .catch(error => {
      logBot(`Error encountered: \`${error.message}\`.`);
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
  () => simulate('joe', 'i dunno'),
  () => simulate('cowboy', 'foo should be parsed by the foo fallback handler'),
], f => f());
