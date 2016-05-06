import Promise from 'bluebird';
import createMatcher, {MatchingMessageHandler} from './matcher';

describe('MatchingMessageHandler', function() {

  describe('API', function() {

    it('createMatcher should return an instance of MatchingMessageHandler', function() {
      const matcher = createMatcher({match: 'foo'});
      expect(matcher).to.be.an.instanceof(MatchingMessageHandler);
    });

  });

  describe('handleMessage', function() {

    it('should throw if no match option was specified', function() {
      expect(() => createMatcher()).to.throw(/missing.*match/i);
      expect(() => createMatcher({})).to.throw(/missing.*match/i);
      expect(() => createMatcher({match: 'foo'})).to.not.throw();
      expect(() => createMatcher({match() {}})).to.not.throw();
    });

    it('should return a promise that gets fulfilled', function() {
      const matcher = createMatcher({match: 'foo'});
      return expect(matcher.handleMessage()).to.be.fulfilled();
    });

    it('should only run child handlers on match / should return false on no match', function() {
      let i = 0;
      const handleMessage = () => {
        i++;
        return {response: 'yay'};
      };
      const matcher = createMatcher({match: 'foo', handleMessage});
      return Promise.mapSeries([
        () => expect(matcher.handleMessage('foo')).to.become({response: 'yay'}),
        () => expect(matcher.handleMessage('bar')).to.become(false),
        () => expect(i).to.equal(1),
      ], f => f());
    });

    it('should support string matching / should trim leading space from the remainder', function() {
      const handleMessage = (remainder, arg) => ({response: `${remainder} ${arg}`});
      const matcher = createMatcher({match: 'foo', handleMessage});
      return Promise.all([
        expect(matcher.handleMessage('foo bar', 1)).to.become({response: 'bar 1'}),
        expect(matcher.handleMessage('foo    bar', 1)).to.become({response: 'bar 1'}),
      ]);
    });

    it('should support function matching / should pass message and additional arguments into match fn', function() {
      const match = (message, arg) => {
        const [greeting, remainder] = message.split(' ');
        return greeting === 'hello' ? `the ${remainder} is ${arg}` : false;
      };
      const handleMessage = (remainder, arg) => ({response: `${remainder}, ${arg}`});
      const matcher = createMatcher({match, handleMessage});
      return Promise.all([
        expect(matcher.handleMessage('hello world', 'me')).to.become({response: 'the world is me, me'}),
        expect(matcher.handleMessage('hello universe', 'me')).to.become({response: 'the universe is me, me'}),
        expect(matcher.handleMessage('goodbye world', 'me')).to.become(false),
        expect(matcher.handleMessage('goodbye universe', 'me')).to.become(false),
      ]);
    });

    it('should reject if the match option is invalid', function() {
      const matcher = createMatcher({match: 123, handleMessage() {}});
      return expect(matcher.handleMessage('foo')).to.be.rejectedWith(/invalid.*match/i);
    });

    it('should reject if the match function throws an exception', function() {
      const match = message => { throw new Error(`whoops ${message}`); };
      const matcher = createMatcher({match, handleMessage() {}});
      return expect(matcher.handleMessage('foo')).to.be.rejectedWith('whoops foo');
    });

  });

});
