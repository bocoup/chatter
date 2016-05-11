import createSlackBot, {SlackBot} from './bot';

const nop = () => {};

const slack = {
  on: nop,
};

describe('SlackBot', function() {

  describe('API', function() {

    it('createSlackBot should return an instance of Bot', function() {
      const bot = createSlackBot({slack, createMessageHandler: nop});
      expect(bot).to.be.an.instanceof(SlackBot);
    });

    it('should behave like Bot', function() {
      expect(() => createSlackBot({slack, createMessageHandler: nop})).to.not.throw();
      expect(() => createSlackBot()).to.throw(/missing.*createMessageHandler/i);
    });

    it('should throw if no slack option was specified', function() {
      expect(() => createSlackBot({createMessageHandler: nop})).to.throw(/missing.*slack/i);
      expect(() => createSlackBot({createMessageHandler: nop, slack})).to.not.throw();
    });

  });

  describe('TBD', function() {

  });

});

