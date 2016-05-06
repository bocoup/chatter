/* eslint object-shorthand: 0 */

import Promise from 'bluebird';
import {callMessageHandler, isMessageHandlerOrHandlers, handleMessage} from './message-handler';

describe('message-handler', function() {

  describe('callMessageHandler', function() {

    it('should throw if argument is not a function or object with a callMessageHandler method', function() {
      expect(() => callMessageHandler()).to.throw(/message handler/i);
      expect(() => callMessageHandler('whoops')).to.throw(/message handler/i);
      expect(() => callMessageHandler({})).to.throw(/message handler/i);
      expect(() => callMessageHandler(null)).to.throw(/message handler/i);
    });

    it('should invoke a function directly', function() {
      const fn = (a, b) => a + b;
      expect(callMessageHandler(fn, 1, 2)).to.equal(3);
    });

    it('should invoke an object handleMessage method', function() {
      const obj = {
        handleMessage(a, b) {
          return a + b;
        },
      };
      expect(callMessageHandler(obj, 1, 2)).to.equal(3);
    });

  });

  describe('isMessageHandlerOrHandlers', function() {

    it('should return true for message handler functions', function() {
      expect(isMessageHandlerOrHandlers(() => {})).to.equal(true);
      expect(isMessageHandlerOrHandlers(function() {})).to.equal(true);
      expect(isMessageHandlerOrHandlers(123)).to.equal(false);
      expect(isMessageHandlerOrHandlers(null)).to.equal(false);
      expect(isMessageHandlerOrHandlers(0)).to.equal(false);
    });

    it('should return true for message handler objects', function() {
      expect(isMessageHandlerOrHandlers({handleMessage() {}})).to.equal(true);
      expect(isMessageHandlerOrHandlers({handleMessage: () => {}})).to.equal(true);
      expect(isMessageHandlerOrHandlers({handleMessage: function() {}})).to.equal(true);
      expect(isMessageHandlerOrHandlers({bloops: function() {}})).to.equal(false);
      expect(isMessageHandlerOrHandlers({})).to.equal(false);
    });

    it('should return true for arrays comprised only of message handler functions of objects', function() {
      const f = () => {};
      const o = {handleMessage() {}};
      expect(isMessageHandlerOrHandlers([])).to.equal(true);
      expect(isMessageHandlerOrHandlers([f, o, [], f, [o, [[[], [f]], []], o], f])).to.equal(true);
      expect(isMessageHandlerOrHandlers([f, o, [o, f], f, [o, [f, o], f], f])).to.equal(true);
      expect(isMessageHandlerOrHandlers([f, o, [o, f], f, [o, [null, o], f], f])).to.equal(false);
      expect(isMessageHandlerOrHandlers([f, o, [o, f], f, [o, [f, o], 1], f])).to.equal(false);
    });

  });

  describe('handleMessage', function() {

    it('should throw if handlers are invalid', function() {
      const f = () => { return false; };
      const o = {handleMessage: f};
      return Promise.all([
        expect(handleMessage()).to.be.rejectedWith(/message handler/i),
        expect(handleMessage(null)).to.be.rejectedWith(/message handler/i),
        expect(handleMessage([null])).to.be.rejectedWith(/message handler/i),
        expect(handleMessage([null, f, o, [o, f]])).to.be.rejectedWith(/message handler/i),
        expect(handleMessage([f, o, [o, null, f]])).to.be.rejectedWith(/message handler/i),
        expect(handleMessage([])).to.be.fulfilled(),
        expect(handleMessage(f)).to.be.fulfilled(),
        expect(handleMessage(o)).to.be.fulfilled(),
        expect(handleMessage([f, o])).to.be.fulfilled(),
        expect(handleMessage([f, o, [o, f]])).to.be.fulfilled(),
      ]);
    });

    it('should return a promise that gets fulfilled', function() {
      return expect(handleMessage([])).to.be.fulfilled();
    });

    it('should support a single function handler', function() {
      const handler = (response, a, b) => ({response: `${response} ${a} ${b}`});
      return expect(handleMessage(handler, 'foo', 1, 2)).to.become({response: 'foo 1 2'});
    });

    it('should support a single object handler', function() {
      const handler = {
        handleMessage(response, a, b) {
          return {response: `${response} ${a} ${b}`};
        },
      };
      return expect(handleMessage(handler, 'foo', 1, 2)).to.become({response: 'foo 1 2'});
    });

    // Like the previous example, but handler returns a promise.
    it('should resolve promises yielded by handlers', function() {
      const handler = {
        handleMessage(response, a, b) {
          return Promise.resolve({response: `${response} ${a} ${b}`}); // THIS LINE IS DIFFERENT
        },
      };
      return expect(handleMessage(handler, 'foo', 1, 2)).to.become({response: 'foo 1 2'});
    });

    it('should reject if an exception is thrown in a child handler', function() {
      const handlers = [
        {
          handleMessage() {
            throw new Error('whoops');
          },
        },
      ];
      return expect(handleMessage(handlers, 'foo', 1, 2)).to.be.rejectedWith('whoops');
    });

    describe('complex examples', function() {

      beforeEach(function() {
        this.memo = '';
        this.getHandler = (id, retval) => (message, arg) => {
          this.memo += message + id + arg;
          return retval;
        };
      });

      it('should run handlers in order / should yield false if no children returned a non-false value', function() {
        const handlers = 'abcdefgh'.split('').map(s => this.getHandler(s, false));
        const promise = handleMessage(handlers, '<', '>');
        return Promise.all([
          expect(promise).to.become(false),
          promise.then(() => {
            expect(this.memo).to.equal('<a><b><c><d><e><f><g><h>');
          }),
        ]);
      });

      it('should run nested arrays of handlers in order', function() {
        const getHandler = this.getHandler;
        const handlers = [
          getHandler('a', false),
          [
            getHandler('b', false),
            [
              getHandler('c', false),
              [
                getHandler('d', false),
                getHandler('e', false),
              ],
              getHandler('f', false),
            ],
            getHandler('g', false),
          ],
          getHandler('h', {response: 'done'}),
        ];
        const promise = handleMessage(handlers, '<', '>');
        return Promise.all([
          expect(promise).to.become({response: 'done'}),
          promise.then(() => {
            expect(this.memo).to.equal('<a><b><c><d><e><f><g><h>');
          }),
        ]);
      });

      it('should allow handlers to return new handlers or arrays of handlers', function() {
        const getHandler = this.getHandler;
        const handlers = [
          getHandler('a', false),
          [
            getHandler('b', getHandler('bb', false)),
            [
              getHandler('c', {handleMessage: getHandler('cc', false)}),
              [
                getHandler('d', [
                  getHandler('d1', false),
                  getHandler('d2', [
                    getHandler('d3', getHandler('d4', false)),
                  ]),
                ]),
                getHandler('e', false),
              ],
              getHandler('f', false),
            ],
            getHandler('g', false),
          ],
          getHandler('h', {response: 'done'}),
        ];
        const promise = handleMessage(handlers, '<', '>');
        return Promise.all([
          expect(promise).to.become({response: 'done'}),
          promise.then(() => {
            expect(this.memo).to.equal('<a><b><bb><c><cc><d><d1><d2><d3><d4><e><f><g><h>');
          }),
        ]);
      });

      // Like the previous example but handler 'd4' returns an actual response.
      it('should stop iterating when a non-false, non-handler response is received', function() {
        const getHandler = this.getHandler;
        const handlers = [
          getHandler('a', false),
          [
            getHandler('b', getHandler('bb', false)),
            [
              getHandler('c', {handleMessage: getHandler('cc', false)}),
              [
                getHandler('d', [
                  getHandler('d1', false),
                  getHandler('d2', [
                    getHandler('d3', getHandler('d4', {response: 'early'})), // THIS LINE IS DIFFERENT
                  ]),
                ]),
                getHandler('e', false),
              ],
              getHandler('f', false),
            ],
            getHandler('g', false),
          ],
          getHandler('h', {response: 'done'}),
        ];
        const promise = handleMessage(handlers, '<', '>');
        return Promise.all([
          expect(promise).to.become({response: 'early'}),
          promise.then(() => {
            expect(this.memo).to.equal('<a><b><bb><c><cc><d><d1><d2><d3><d4>');
          }),
        ]);
      });

      // Like the previous example but handlers return promises.
      it('should allow handlers to return promises', function() {
        const getHandler = (id, retval) => (message, arg) => {
          this.memo += message + id + arg;
          return Promise.resolve(retval);
        };
        const handlers = [
          getHandler('a', false),
          [
            getHandler('b', getHandler('bb', false)),
            [
              getHandler('c', {handleMessage: getHandler('cc', false)}),
              [
                getHandler('d', [
                  getHandler('d1', false),
                  getHandler('d2', [
                    getHandler('d3', getHandler('d4', {response: 'early'})),
                  ]),
                ]),
                getHandler('e', false),
              ],
              getHandler('f', false),
            ],
            getHandler('g', false),
          ],
          getHandler('h', {response: 'done'}),
        ];
        const promise = handleMessage(handlers, '<', '>');
        return Promise.all([
          expect(promise).to.become({response: 'early'}),
          promise.then(() => {
            expect(this.memo).to.equal('<a><b><bb><c><cc><d><d1><d2><d3><d4>');
          }),
        ]);
      });

    });

  });

});
