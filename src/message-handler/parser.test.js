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

  });

});
