import Promise from 'bluebird';
import createDelegate, {MessageHandlerDelegate} from './delegate';

describe('MessageHandlerDelegate', function() {

  describe('API', function() {

    it('createDelegate should return an instance of MessageHandlerDelegate', function() {
      const delegate = createDelegate();
      return expect(delegate).to.be.an.instanceof(MessageHandlerDelegate);
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

    it('should pass additional arguments into child handlers', function() {
      const children = [
        {
          handleMessage(message, a, b) {
            return {message: `${message} ${a} ${b}`};
          },
        },
      ];
      const delegate = createDelegate({children});
      return expect(delegate.handleMessage('foo', 1, 2)).to.become({message: 'foo 1 2'});
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
          handleMessage(message) {
            i++;
            return {message: `a ${message}`};
          },
        },
        {
          handleMessage(message) {
            i++;
            return {message: `b ${message}`};
          },
        },
      ];
      const delegate = createDelegate({children});
      const promise = delegate.handleMessage('foo');
      return Promise.all([
        expect(promise).to.become({message: 'a foo'}),
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
          handleMessage(message) {
            i++;
            return new Promise(resolve => {
              setTimeout(() => resolve({message: `a ${message}`}), 10);
            });
          },
        },
        {
          handleMessage(message) {
            i++;
            return new Promise(resolve => {
              setTimeout(() => resolve({message: `b ${message}`}), 10);
            });
          },
        },
      ];
      const delegate = createDelegate({children});
      const promise = delegate.handleMessage('foo');
      return Promise.all([
        expect(promise).to.become({message: 'a foo'}),
        promise.then(() => {
          expect(i).to.equal(2);
        }),
      ]);
    });

  });

});
