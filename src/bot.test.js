import createBot, {Bot} from './bot';

const nop = () => {};

describe('Bot', function() {

  describe('API', function() {

    it('createBot should return an instance of Bot', function() {
      const bot = createBot({createMessageHandler: nop});
      expect(bot).to.be.an.instanceof(Bot);
    });

    it('should throw if no createMessageHandler option was specified', function() {
      expect(() => createBot()).to.throw(/missing.*createMessageHandler/i);
      expect(() => createBot({})).to.throw(/missing.*createMessageHandler/i);
      expect(() => createBot({createMessageHandler: nop})).to.not.throw();
    });

  });

  describe('createMessageHandler', function() {

    it('should create and return stateless message handlers', function() {
      let i = 0;
      const createStatelessHandler = id => ({i: i++, id});
      const bot = createBot({createMessageHandler: createStatelessHandler});
      expect(bot.getMessageHandler('a')).to.deep.equal({i: 0, id: 'a'});
      expect(bot.getMessageHandler('a')).to.deep.equal({i: 1, id: 'a'});
      expect(bot.getMessageHandler('b')).to.deep.equal({i: 2, id: 'b'});
      expect(bot.getMessageHandler('c')).to.deep.equal({i: 3, id: 'c'});
      expect(bot.getMessageHandler('b')).to.deep.equal({i: 4, id: 'b'});
      expect(bot.getMessageHandler('a')).to.deep.equal({i: 5, id: 'a'});
      expect(bot.getMessageHandler('c')).to.deep.equal({i: 6, id: 'c'});
    });

    it('should cache and retrieve stateful message handlers', function() {
      let i = 0;
      const createStatefulHandler = id => ({i: i++, id, hasState: true});
      const bot = createBot({createMessageHandler: createStatefulHandler});
      expect(bot.getMessageHandler('a')).to.deep.equal({i: 0, id: 'a', hasState: true});
      expect(bot.getMessageHandler('a')).to.deep.equal({i: 0, id: 'a', hasState: true});
      expect(bot.getMessageHandler('b')).to.deep.equal({i: 1, id: 'b', hasState: true});
      expect(bot.getMessageHandler('c')).to.deep.equal({i: 2, id: 'c', hasState: true});
      expect(bot.getMessageHandler('b')).to.deep.equal({i: 1, id: 'b', hasState: true});
      expect(bot.getMessageHandler('a')).to.deep.equal({i: 0, id: 'a', hasState: true});
      expect(bot.getMessageHandler('c')).to.deep.equal({i: 2, id: 'c', hasState: true});
    });

  });

});
