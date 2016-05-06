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
    });

    it('should return a promise that gets fulfilled', function() {
      const matcher = createMatcher({match: 'foo'});
      return expect(matcher.handleMessage()).to.be.fulfilled();
    });

    it('should only run child handlers on match / should return false on no match', function() {
      let i = 0;
      const handleMessage = [
        {
          handleMessage() {
            i++;
            return {response: 'yay'};
          },
        },
      ];
      const matcher = createMatcher({match: 'foo', handleMessage});
      return Promise.mapSeries([
        () => expect(matcher.handleMessage('foo')).to.become({response: 'yay'}),
        () => expect(matcher.handleMessage('bar')).to.become(false),
        () => expect(i).to.equal(1),
      ], f => f());
    });

    it('should pass match remainder and additional arguments into child handlers', function() {
      const handleMessage = [
        {
          handleMessage(remainder, a, b) {
            return {response: `${remainder} ${a} ${b}`};
          },
        },
      ];
      const matcher = createMatcher({match: 'foo', handleMessage});
      return expect(matcher.handleMessage('foo bar', 1, 2)).to.become({response: 'bar 1 2'});
    });

    it('should support function child handlers', function() {
      const handleMessage = [
        () => false,
        (remainder, a, b) => ({response: `${remainder} ${a} ${b}`}),
      ];
      const matcher = createMatcher({match: 'foo', handleMessage});
      return expect(matcher.handleMessage('foo bar', 1, 2)).to.become({response: 'bar 1 2'});
    });

    it('should support a single child handler (object) instead of array', function() {
      const child = {
        handleMessage(remainder, a, b) {
          return {response: `${remainder} ${a} ${b}`};
        },
      };
      const matcher = createMatcher({match: 'foo', handleMessage: child});
      return expect(matcher.handleMessage('foo bar', 1, 2)).to.become({response: 'bar 1 2'});
    });

    it('should support a single child handler (function) instead of array', function() {
      const child = (remainder, a, b) => ({response: `${remainder} ${a} ${b}`});
      const matcher = createMatcher({match: 'foo', handleMessage: child});
      return expect(matcher.handleMessage('foo bar', 1, 2)).to.become({response: 'bar 1 2'});
    });

  });

});
