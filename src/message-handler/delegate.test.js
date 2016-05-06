import Promise from 'bluebird';
import createDelegate, {DelegatingMessageHandler} from './delegate';

describe('DelegatingMessageHandler', function() {

  describe('API', function() {

    it('createDelegate should return an instance of DelegatingMessageHandler', function() {
      const delegate = createDelegate();
      expect(delegate).to.be.an.instanceof(DelegatingMessageHandler);
    });

  });

  describe('handleMessage', function() {

    it('should return a promise that gets fulfilled', function() {
      const delegate = createDelegate();
      return expect(delegate.handleMessage()).to.be.fulfilled();
    });

    it('should have sensible defaults for children / should yield false if no children were specified', function() {
      const delegate1 = createDelegate();
      const delegate2 = createDelegate({});
      const delegate3 = createDelegate({handleMessage: []});
      return Promise.all([
        expect(delegate1.handleMessage()).to.eventually.equal(false),
        expect(delegate2.handleMessage()).to.eventually.equal(false),
        expect(delegate3.handleMessage()).to.eventually.equal(false),
      ]);
    });

    it('should pass additional arguments into child handlers', function() {
      const handleMessage = [
        {
          handleMessage(response, a, b) {
            return {response: `${response} ${a} ${b}`};
          },
        },
      ];
      const delegate = createDelegate({handleMessage});
      return expect(delegate.handleMessage('foo', 1, 2)).to.become({response: 'foo 1 2'});
    });

    it('should reject if an exception is thrown in a child handler', function() {
      const handleMessage = [
        {
          handleMessage() {
            throw new Error('whoops');
          },
        },
      ];
      const delegate = createDelegate({handleMessage});
      return expect(delegate.handleMessage('foo')).to.be.rejectedWith('whoops');
    });

  });

});
