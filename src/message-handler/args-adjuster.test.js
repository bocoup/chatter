import Promise from 'bluebird';
import createArgsAdjuster, {ArgsAdjustingMessageHandler} from './args-adjuster';

const nop = () => {};

describe('message-handler/args-adjuster', function() {

  it('should export the proper API', function() {
    expect(createArgsAdjuster).to.be.a('function');
    expect(ArgsAdjustingMessageHandler).to.be.a('function');
  });

  describe('createArgsAdjuster', function() {

    it('should return an instance of ArgsAdjustingMessageHandler', function() {
      const adjuster = createArgsAdjuster({adjustArgs: nop}, nop);
      expect(adjuster).to.be.an.instanceof(ArgsAdjustingMessageHandler);
    });

  });

  describe('ArgsAdjustingMessageHandler', function() {

    describe('constructor', function() {

      it('should behave like DelegatingMessageHandler', function() {
        expect(() => createArgsAdjuster({adjustArgs: nop}, nop)).to.not.throw();
        expect(() => createArgsAdjuster({adjustArgs: nop})).to.throw(/missing.*message.*handler/i);
      });

      it('should throw if adjustArgs option was specified', function() {
        // Valid
        expect(() => createArgsAdjuster({adjustArgs: nop}, nop)).to.not.throw();
        // Invalid
        expect(() => createArgsAdjuster(nop)).to.throw(/missing.*adjustArgs/i);
        expect(() => createArgsAdjuster({}, nop)).to.throw(/missing.*adjustArgs/i);
      });

    });

    describe('handleMessage', function() {

      it('should return a promise that gets fulfilled', function() {
        const adjuster = createArgsAdjuster({adjustArgs: () => []}, nop);
        return expect(adjuster.handleMessage()).to.be.fulfilled();
      });

      it('should reject if adjustArgs returns a non-array', function() {
        const adjuster = createArgsAdjuster({adjustArgs: nop}, nop);
        expect(adjuster.handleMessage('foo')).to.be.rejectedWith(/adjustArgs.*array/i);
      });

      it('should pass adjusted args into child handlers', function() {
        const adjuster = createArgsAdjuster({
          adjustArgs(message, ...args) {
            return [message, 'a', ...args, 'b'];
          },
        }, (...args) => args.join('-'));
        return Promise.all([
          expect(adjuster.handleMessage('foo')).to.eventually.equal('foo-a-b'),
          expect(adjuster.handleMessage('foo', 1, 2)).to.eventually.equal('foo-a-1-2-b'),
        ]);
      });

    });

  });

});
