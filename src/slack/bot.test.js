import createSlackBot, {SlackBot} from './bot';

const nop = () => {};

function getSlack() {
  return {
    rtmClient: {
      on: nop,
      dataStore: {},
    },
    webClient: {},
  };
}

const slack = getSlack();

describe('slack/bot', function() {

  it('should export the proper API', function() {
    expect(createSlackBot).to.be.a('function');
    expect(SlackBot).to.be.a('function');
  });

  describe('createSlackBot', function() {

    it('should return an instance of Bot', function() {
      const bot = createSlackBot({getSlack, createMessageHandler: nop});
      expect(bot).to.be.an.instanceof(SlackBot);
    });

  });

  describe('SlackBot', function() {

    describe('constructor', function() {

      it('should behave like Bot', function() {
        expect(() => createSlackBot({getSlack, createMessageHandler: nop})).to.not.throw();
        expect(() => createSlackBot()).to.throw(/missing.*createMessageHandler/i);
      });

      it('should throw if no slack or getSlack option was specified', function() {
        expect(() => createSlackBot({createMessageHandler: nop})).to.throw(/missing.*slack/i);
        expect(() => createSlackBot({createMessageHandler: nop, slack})).to.not.throw();
        expect(() => createSlackBot({createMessageHandler: nop, getSlack})).to.not.throw();
      });

    });

  });

});

