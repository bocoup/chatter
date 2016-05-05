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
      const delegate3 = createDelegate({children: []});
      return Promise.all([
        expect(delegate1.handleMessage()).to.eventually.equal(false),
        expect(delegate2.handleMessage()).to.eventually.equal(false),
        expect(delegate3.handleMessage()).to.eventually.equal(false),
      ]);
    });

    it('should run child handlers in order / should yield false if no children returned a non-false value', function() {
      let i = 0;
      const children = Array.from({length: 10}, (n, index) => {
        return {
          handleMessage() {
            expect(i++).to.equal(index);
            return false;
          },
        };
      });
      const delegate = createDelegate({children});
      const promise = delegate.handleMessage('foo');
      return Promise.all([
        expect(promise).to.eventually.equal(false),
        promise.then(() => {
          expect(i).to.equal(10);
        }),
      ]);
    });

    it('should support function child handlers', function() {
      const children = [
        () => false,
        (response, a, b) => ({response: `${response} ${a} ${b}`}),
      ];
      const delegate = createDelegate({children});
      return expect(delegate.handleMessage('foo', 1, 2)).to.become({response: 'foo 1 2'});
    });

    it('should support a single child handler (object) instead of array', function() {
      const child = {
        handleMessage(response, a, b) {
          return {response: `${response} ${a} ${b}`};
        },
      };
      const delegate = createDelegate({children: child});
      return expect(delegate.handleMessage('foo', 1, 2)).to.become({response: 'foo 1 2'});
    });

    it('should support a single child handler (function) instead of array', function() {
      const child = (response, a, b) => ({response: `${response} ${a} ${b}`});
      const delegate = createDelegate({children: child});
      return expect(delegate.handleMessage('foo', 1, 2)).to.become({response: 'foo 1 2'});
    });

    it('should pass additional arguments into child handlers', function() {
      const children = [
        {
          handleMessage(response, a, b) {
            return {response: `${response} ${a} ${b}`};
          },
        },
      ];
      const delegate = createDelegate({children});
      return expect(delegate.handleMessage('foo', 1, 2)).to.become({response: 'foo 1 2'});
    });

    it('should reject if an exception is thrown in a child handler', function() {
      const children = [
        {
          handleMessage() {
            throw new Error('whoops');
          },
        },
      ];
      const delegate = createDelegate({children});
      return expect(delegate.handleMessage('foo')).to.be.rejectedWith('whoops');
    });

    it('should yield the first non-false result and stop iterating', function() {
      let i = 0;
      const children = [
        {
          handleMessage() {
            i++;
            return false;
          },
        },
        {
          handleMessage(response) {
            i++;
            return {response: `a ${response}`};
          },
        },
        {
          handleMessage(response) {
            i++;
            return {response: `b ${response}`};
          },
        },
      ];
      const delegate = createDelegate({children});
      const promise = delegate.handleMessage('foo');
      return Promise.all([
        expect(promise).to.become({response: 'a foo'}),
        promise.then(() => {
          expect(i).to.equal(2);
        }),
      ]);
    });

    it('should resolve promises yielded by children', function() {
      let i = 0;
      const children = [
        {
          handleMessage() {
            i++;
            return new Promise(resolve => {
              setTimeout(() => resolve(false), 10);
            });
          },
        },
        {
          handleMessage(response) {
            i++;
            return new Promise(resolve => {
              setTimeout(() => resolve({response: `a ${response}`}), 10);
            });
          },
        },
        {
          handleMessage(response) {
            i++;
            return new Promise(resolve => {
              setTimeout(() => resolve({response: `b ${response}`}), 10);
            });
          },
        },
      ];
      const delegate = createDelegate({children});
      const promise = delegate.handleMessage('foo');
      return Promise.all([
        expect(promise).to.become({response: 'a foo'}),
        promise.then(() => {
          expect(i).to.equal(2);
        }),
      ]);
    });

  });

});
