import Promise from 'bluebird';
import createParser, {ParsingMessageHandler} from './parser';

describe('ParsingMessageHandler', function() {

  describe('API', function() {

    it('createParser should return an instance of ParsingMessageHandler', function() {
      const parser = createParser({handleMessage() {}});
      expect(parser).to.be.an.instanceof(ParsingMessageHandler);
    });

  });

  describe('handleMessage', function() {

    it('should throw if no handleMessage option was specified', function() {
      expect(() => createParser()).to.throw(/missing.*handleMessage/i);
      expect(() => createParser({})).to.throw(/missing.*handleMessage/i);
      expect(() => createParser({handleMessage() {}})).to.not.throw();
    });

    it('should return a promise that gets fulfilled', function() {
      const parser = createParser({handleMessage() {}});
      return expect(parser.handleMessage()).to.be.fulfilled();
    });

    it('should pass parsed args and additional arguments into child handlers', function() {
      const parser = createParser({
        handleMessage(args, a, b) {
          return {args, a, b};
        },
        parseOptions: {
          xxx: String,
          yyy: Number,
          zzz: Boolean,
        },
      });
      return Promise.all([
        expect(parser.handleMessage('foo bar', 1, 2)).to.become({
          args: {
            input: 'foo bar',
            errors: [],
            options: {},
            remain: ['foo', 'bar'],
          },
          a: 1,
          b: 2,
        }),
        expect(parser.handleMessage('foo bar x=1 y=2 z=3 baz', 1, 2)).to.become({
          args: {
            input: 'foo bar x=1 y=2 z=3 baz',
            errors: [],
            options: {xxx: '1', yyy: 2, zzz: true},
            remain: ['foo', 'bar', 'baz'],
          },
          a: 1,
          b: 2,
        }),
      ]);
    });

    it('should support an object message handler', function() {
      const messageHandler = {
        handleMessage(args, a, b) {
          return {args, a, b};
        },
      };
      const parser = createParser({
        handleMessage: messageHandler,
      });
      return expect(parser.handleMessage('foo bar', 1, 2)).to.become({
        args: {
          input: 'foo bar',
          errors: [],
          options: {},
          remain: ['foo', 'bar'],
        },
        a: 1,
        b: 2,
      });
    });

  });

});

