import createSlackBot, {SlackBot} from './bot';

const nop = () => {};

const slack = {
  on: nop,
};

describe('slack/bot', function() {

  it('should export the proper API', function() {
    expect(createSlackBot).to.be.a('function');
    expect(SlackBot).to.be.a('function');
  });

  describe('createSlackBot', function() {

    it('should return an instance of Bot', function() {
      const bot = createSlackBot({slack, createMessageHandler: nop});
      expect(bot).to.be.an.instanceof(SlackBot);
    });

  });

  describe('SlackBot', function() {

    describe('constructor', function() {

      it('should behave like Bot', function() {
        expect(() => createSlackBot({slack, createMessageHandler: nop})).to.not.throw();
        expect(() => createSlackBot()).to.throw(/missing.*createMessageHandler/i);
      });

      it('should throw if no slack option was specified', function() {
        expect(() => createSlackBot({createMessageHandler: nop})).to.throw(/missing.*slack/i);
        expect(() => createSlackBot({createMessageHandler: nop, slack})).to.not.throw();
      });

    });

  });

});

