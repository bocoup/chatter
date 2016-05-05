import {handleMessage} from './message-handler';

describe('message-handler', function() {

  describe('handleMessage', function() {

    it('should throw if not a function or object with a handleMessage method', function() {
      expect(() => handleMessage()).to.throw(/message handler/i);
      expect(() => handleMessage('whoops')).to.throw(/message handler/i);
      expect(() => handleMessage({})).to.throw(/message handler/i);
      expect(() => handleMessage(null)).to.throw(/message handler/i);
    });

    it('should invoke a function directly', function() {
      const fn = (a, b) => a + b;
      expect(handleMessage(fn, 1, 2)).to.equal(3);
    });

    it('should invoke an object handleMessage method', function() {
      const obj = {
        handleMessage(a, b) {
          return a + b;
        },
      };
      expect(handleMessage(obj, 1, 2)).to.equal(3);
    });

  });

});
