// import Promise from 'bluebird';
import createSlackMessageHandler, {SlackMessageHandler} from './slack';

const nop = () => {};

const slack = {
  getChannelGroupOrDMByID: nop,
  getUserByID: nop,
};

describe('SlackMessageHandler', function() {

  describe('API', function() {

    it('createSlackMessageHandler should return an instance of SlackMessageHandler', function() {
      const handler = createSlackMessageHandler(slack, nop);
      expect(handler).to.be.an.instanceof(SlackMessageHandler);
    });

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

