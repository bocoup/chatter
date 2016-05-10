import createBot, {Bot} from './bot';

describe('Bot', function() {

  describe('API', function() {

    it('createBot should return an instance of Bot', function() {
      const bot = createBot();
      expect(bot).to.be.an.instanceof(Bot);
    });

  });

  describe('createBot', function() {

    it('should cache and retrieve conversations by id', function() {
      let i = 0;
      const createConversation = id => ({i: i++, id});
      const bot = createBot({createConversation});
      expect(bot.getConversation('a')).to.deep.equal({i: 0, id: 'a'});
      expect(bot.getConversation('a')).to.deep.equal({i: 0, id: 'a'});
      expect(bot.getConversation('b')).to.deep.equal({i: 1, id: 'b'});
      expect(bot.getConversation('c')).to.deep.equal({i: 2, id: 'c'});
      expect(bot.getConversation('b')).to.deep.equal({i: 1, id: 'b'});
      expect(bot.getConversation('a')).to.deep.equal({i: 0, id: 'a'});
      expect(bot.getConversation('c')).to.deep.equal({i: 2, id: 'c'});
    });

  });

});
