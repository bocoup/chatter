import Queue from './queue';

const nop = () => {};

describe('util/queue', function() {

  it('should export the proper API', function() {
    expect(Queue).to.be.a('function');
  });

  describe('Queue', function() {

    describe('constructor', function() {
      const q = new Queue();
      expect(q).to.be.instanceof(Queue);
    });

    describe('enqueue', function() {

      it('should return the same promise each time while it is draining', function() {
        const q = new Queue({onDrain: nop});
        const promise1 = q.enqueue('a', {});
        const promise2 = q.enqueue('a', {});
        const promise3 = q.enqueue('a', {});
        expect(promise1).to.equal(promise2);
        expect(promise2).to.equal(promise3);
      });

      it('should reset the returned promise after draining completes', function() {
        const q = new Queue({onDrain: nop});
        const promise1 = q.enqueue('a', {});
        const promise2 = promise1.then(() => q.enqueue('a', {}));
        promise1.then(() => {
          expect(promise2).to.not.equal(promise1);
        });
        return Promise.all([
          promise1,
          promise2,
        ]);
      });

      it('should return per-id promises', function() {
        const q = new Queue({onDrain: nop});
        const promise1 = q.enqueue('a', {});
        const promise2 = q.enqueue('b', {});
        const promise3 = q.enqueue('a', {});
        const promise4 = q.enqueue('b', {});
        expect(promise1).to.equal(promise3);
        expect(promise2).to.equal(promise4);
        expect(promise1).to.not.equal(promise2);
      });

    });

    describe('drain', function() {

      it('should pass id and data object into onDrain', function() {
        const result = [];
        const q = new Queue({
          onDrain(id, data) {
            result.push(id, data);
          },
        });
        return Promise.all([
          q.enqueue('a', {value: 1}),
        ])
        .then(() => {
          expect(result).to.deep.equal(['a', {value: 1}]);
        });
      });

      it('should run onDrain for each enqueued item, in order', function() {
        const result = [];
        const q = new Queue({
          onDrain(id, {value}) {
            result.push(id + value);
          },
        });
        return Promise.all([
          q.enqueue('a', {value: 1}),
          q.enqueue('a', {value: 2}),
          q.enqueue('a', {value: 3}),
        ])
        .then(() => {
          expect(result).to.deep.equal(['a1', 'a2', 'a3']);
        });
      });

      it('should run onDrain for each enqueued item, in order, per-id', function() {
        const result = [];
        const q = new Queue({
          onDrain(id, {value}) {
            result.push(id + value);
          },
        });
        return Promise.all([
          q.enqueue('a', {value: 1}),
          q.enqueue('a', {value: 2}),
          q.enqueue('b', {value: 4}),
          q.enqueue('c', {value: 7}),
          q.enqueue('a', {value: 3}),
          q.enqueue('b', {value: 5}),
          q.enqueue('b', {value: 6}),
          q.enqueue('c', {value: 8}),
          q.enqueue('c', {value: 9}),
        ])
        .then(() => {
          expect(result).to.deep.equal([
            'a1', 'b4', 'c7',
            'a2', 'b5', 'c8',
            'a3', 'b6', 'c9',
          ]);
        });
      });

    });

  });

});
