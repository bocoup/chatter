// import Promise from 'bluebird';
import createSlackMessageHandler, {SlackMessageHandler} from './slack';

const nop = () => {};

const slack = {
  getChannelGroupOrDMByID: nop,
  getUserByID: nop,
};

describe('slack/message-handler/slack', function() {

  it('should export the proper API', function() {
    expect(createSlackMessageHandler).to.be.a('function');
    expect(SlackMessageHandler).to.be.a('function');
  });

  describe('SlackMessageHandler', function() {

    it('should return an instance of SlackMessageHandler', function() {
      const handler = createSlackMessageHandler(slack, nop);
      expect(handler).to.be.an.instanceof(SlackMessageHandler);
    });

  });

  describe('SlackMessageHandler', function() {

    describe('constructor', function() {

      it('should behave like DelegatingMessageHandler', function() {
        expect(() => createSlackMessageHandler(slack, nop)).to.not.throw();
        expect(() => createSlackMessageHandler(slack)).to.throw(/missing.*message.*handler/i);
        expect(() => createSlackMessageHandler()).to.throw(/missing.*message.*handler/i);
      });

      it('should throw if no slack option was specified', function() {
        expect(() => createSlackMessageHandler({}, nop)).to.throw(/missing.*slack/i);
        expect(() => createSlackMessageHandler(slack, {}, nop)).to.not.throw();
      });

    });

    describe('handleMessage', function() {

      it('should return a promise that gets fulfilled', function() {
        const handler = createSlackMessageHandler(slack, nop);
        return expect(handler.handleMessage({channel: 1})).to.be.fulfilled();
      });

    });

  });

});

