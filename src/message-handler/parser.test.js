import Promise from 'bluebird';
import createParser, {ParsingMessageHandler} from './parser';

const nop = () => {};

describe('message-handler/parser', function() {

  it('should export the proper API', function() {
    expect(createParser).to.be.a('function');
    expect(ParsingMessageHandler).to.be.a('function');
  });

  describe('createParser', function() {

    it('should return an instance of ParsingMessageHandler', function() {
      const parser = createParser({handleMessage() {}});
      expect(parser).to.be.an.instanceof(ParsingMessageHandler);
    });

  });

  describe('ParsingMessageHandler', function() {

    describe('constructor', function() {

      it('should behave like DelegatingMessageHandler', function() {
        expect(() => createParser(nop)).to.not.throw();
        expect(() => createParser()).to.throw(/missing.*message.*handler/i);
      });

    });

    describe('handleMessage', function() {

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

    });

  });

});

