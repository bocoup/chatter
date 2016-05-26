import {overrideProperties} from './bot-helpers';

const nop = () => {};

describe('util/bot-helpers', function() {

  it('should export the proper API', function() {
    expect(overrideProperties).to.be.a('function');
  });

  describe('overrideProperties', function() {

    it('should copy specific properties to the target', function() {
      const src = {a: 1, b: 'two', c: null, d: false, f: nop};
      let target = {};
      overrideProperties(target, src, ['a', 'b']);
      expect(target).to.deep.equal({a: 1, b: 'two'});
      target = {c: 123};
      overrideProperties(target, src, ['a', 'b', 'c', 'd', 'f']);
      expect(target).to.deep.equal({a: 1, b: 'two', c: 123, f: nop});
    });

  });

});
