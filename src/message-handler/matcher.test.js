import Promise from 'bluebird';
import createMatcher, {MatchingMessageHandler} from './matcher';

const nop = () => {};

describe('MatchingMessageHandler', function() {

  describe('API', function() {

    it('createMatcher should return an instance of MatchingMessageHandler', function() {
      const matcher = createMatcher({match: 'foo', handleMessage: []});
      expect(matcher).to.be.an.instanceof(MatchingMessageHandler);
    });

    it('should behave like DelegatingMessageHandler', function() {
      expect(() => createMatcher({match: 'foo'}, nop)).to.not.throw();
      expect(() => createMatcher({match: 'foo'})).to.throw(/missing.*message.*handler/i);
    });

    it('should throw if no match option was specified', function() {
      expect(() => createMatcher(nop)).to.throw(/missing.*match/i);
      expect(() => createMatcher({}, nop)).to.throw(/missing.*match/i);
      expect(() => createMatcher({match: 'foo'}, nop)).to.not.throw();
      expect(() => createMatcher({match() {}}, nop)).to.not.throw();
    });

  });

  describe('matchStringOrRegex', function() {

    it('should match entire message', function() {
      const {matchStringOrRegex} = MatchingMessageHandler.prototype;
      expect(matchStringOrRegex('foo', 'foo')).to.equal('');
      expect(matchStringOrRegex('foo', 'foo1')).to.equal(false);
      expect(matchStringOrRegex('foo', '1foo')).to.equal(false);
    });

    it('should match words at the beginning of the message', function() {
      const {matchStringOrRegex} = MatchingMessageHandler.prototype;
      expect(matchStringOrRegex('foo', 'foo bar')).to.equal('bar');
      expect(matchStringOrRegex('foo', 'foo bar baz')).to.equal('bar baz');
      expect(matchStringOrRegex('foo', 'foobar')).to.equal(false);
      expect(matchStringOrRegex('foo', 'foo-bar')).to.equal(false);
      expect(matchStringOrRegex('foo', 'foo:bar')).to.equal(false);
      expect(matchStringOrRegex('foo', 'foo: bar')).to.equal(false);
      expect(matchStringOrRegex('foo', 'bar foo')).to.equal(false);
    });

    it('should trim leading spaces from the remainder', function() {
      const {matchStringOrRegex} = MatchingMessageHandler.prototype;
      expect(matchStringOrRegex('foo', 'foo    ')).to.equal('');
      expect(matchStringOrRegex('foo', 'foo    bar')).to.equal('bar');
      expect(matchStringOrRegex('foo', 'foo    bar   baz')).to.equal('bar   baz');
    });

    it('should ignore case when matching via string', function() {
      const {matchStringOrRegex} = MatchingMessageHandler.prototype;
      expect(matchStringOrRegex('foo', 'FoO')).to.equal('');
      expect(matchStringOrRegex('foo', 'Foo bar')).to.equal('bar');
      expect(matchStringOrRegex('foo', 'FOO bar baz')).to.equal('bar baz');
      expect(matchStringOrRegex('FOO', 'FoO')).to.equal('');
      expect(matchStringOrRegex('fOO', 'Foo bar')).to.equal('bar');
      expect(matchStringOrRegex('FoO', 'foo bar baz')).to.equal('bar baz');
    });

    it('should match via regex', function() {
      const {matchStringOrRegex} = MatchingMessageHandler.prototype;
      expect(matchStringOrRegex(/^foo/, 'foo')).to.equal('');
      expect(matchStringOrRegex(/bar/, 'foo bar baz')).to.equal('');
    });

    it('should return the first non-empty capture as the remainder when matching via regex', function() {
      const {matchStringOrRegex} = MatchingMessageHandler.prototype;
      expect(matchStringOrRegex(/^(foo)/, 'foo')).to.equal('foo');
      expect(matchStringOrRegex(/(.*)\s+bar(.*)/, 'foo bar baz')).to.equal('foo');
      expect(matchStringOrRegex(/(?:(f.*)\s+)?bar\s+(.*)/, 'foo bar baz')).to.equal('foo');
      expect(matchStringOrRegex(/(?:(f.*)\s+)?bar\s+(.*)/, 'goo bar baz')).to.equal('baz');
    });

  });

  describe('handleMessage', function() {

    it('should return a promise that gets fulfilled', function() {
      const matcher = createMatcher({match: 'foo'}, nop);
      return expect(matcher.handleMessage()).to.be.fulfilled();
    });

    it('should only run child handlers on match / should return false on no match', function() {
      let i = 0;
      const handleMessage = () => {
        i++;
        return {message: 'yay'};
      };
      const matcher = createMatcher({match: 'foo', handleMessage});
      return Promise.mapSeries([
        () => expect(matcher.handleMessage('foo')).to.become({message: 'yay'}),
        () => expect(matcher.handleMessage('baz')).to.become(false),
        () => expect(i).to.equal(1),
      ], f => f());
    });

    it('should support string matching / should trim leading space from the remainder', function() {
      const handleMessage = (remainder, arg) => ({message: `${remainder} ${arg}`});
      const matcher = createMatcher({match: 'foo', handleMessage});
      return Promise.all([
        expect(matcher.handleMessage('foo', 1)).to.become({message: ' 1'}),
        expect(matcher.handleMessage('foo bar', 1)).to.become({message: 'bar 1'}),
        expect(matcher.handleMessage('foo    bar', 1)).to.become({message: 'bar 1'}),
        expect(matcher.handleMessage('foo-bar', 1)).to.become(false),
      ]);
    });

    it('should support function matching / should pass message and additional arguments into match fn', function() {
      const match = (message, arg) => {
        const [greeting, remainder] = message.split(' ');
        return greeting === 'hello' ? `the ${remainder} is ${arg}` : false;
      };
      const handleMessage = (remainder, arg) => ({message: `${remainder}, ${arg}`});
      const matcher = createMatcher({match, handleMessage});
      return Promise.all([
        expect(matcher.handleMessage('hello world', 'me')).to.become({message: 'the world is me, me'}),
        expect(matcher.handleMessage('hello universe', 'me')).to.become({message: 'the universe is me, me'}),
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
