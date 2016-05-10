import createDelegate, {DelegatingMessageHandler} from './delegate';

const nop = () => {};

describe('DelegatingMessageHandler', function() {

  describe('API', function() {

    it('createDelegate should return an instance of DelegatingMessageHandler', function() {
      const delegate = createDelegate(nop);
      expect(delegate).to.be.an.instanceof(DelegatingMessageHandler);
    });

    it('should throw if no/invalid message handlers were specified', function() {
      // Valid
      expect(() => createDelegate({handleMessage: nop, other: true})).to.not.throw();
      expect(() => createDelegate(nop)).to.not.throw();
      expect(() => createDelegate({handleMessage: nop})).to.not.throw();
      expect(() => createDelegate([])).to.not.throw();
      expect(() => createDelegate([nop])).to.not.throw();
      expect(() => createDelegate([{handleMessage: nop}])).to.not.throw();
      expect(() => createDelegate({}, nop)).to.not.throw();
      expect(() => createDelegate({}, {handleMessage: nop})).to.not.throw();
      expect(() => createDelegate({}, [])).to.not.throw();
      expect(() => createDelegate({}, [nop])).to.not.throw();
      expect(() => createDelegate({}, [{handleMessage: nop}])).to.not.throw();
      // Invalid
      expect(() => createDelegate()).to.throw(/missing.*message.*handlers/i);
      expect(() => createDelegate(123)).to.throw(/missing.*message.*handlers/i);
      expect(() => createDelegate({})).to.throw(/missing.*message.*handlers/i);
      expect(() => createDelegate([123])).to.throw(/missing.*message.*handlers/i);
      expect(() => createDelegate({}, {handleMessage: 123})).to.throw(/missing.*message.*handlers/i);
      expect(() => createDelegate({}, 123)).to.throw(/missing.*message.*handlers/i);
      expect(() => createDelegate({}, [123])).to.throw(/missing.*message.*handlers/i);
    });

  });

  describe('handleMessage', function() {

    it('should return a promise that gets fulfilled', function() {
      const delegate = createDelegate(nop);
      return expect(delegate.handleMessage()).to.be.fulfilled();
    });

    it('should pass additional arguments into child handlers', function() {
      const handleMessage = [
        {
          handleMessage(message, a, b) {
            return {message: `${message} ${a} ${b}`};
          },
        },
      ];
      const delegate = createDelegate({handleMessage});
      return expect(delegate.handleMessage('foo', 1, 2)).to.become({message: 'foo 1 2'});
    });

    it('should reject if an exception is thrown in a child handler', function() {
      const handleMessage = [
        {
          handleMessage(message) {
            throw new Error(`whoops ${message}`);
          },
        },
      ];
      const delegate = createDelegate({handleMessage});
      return expect(delegate.handleMessage('foo')).to.be.rejectedWith('whoops foo');
    });

  });

});
