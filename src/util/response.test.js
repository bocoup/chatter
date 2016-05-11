/* eslint no-undefined: 0 */

import {isMessage, normalizeMessage} from './response';

describe('util/response', function() {

  it('should export the proper API', function() {
    expect(isMessage).to.be.a('function');
    expect(normalizeMessage).to.be.a('function');
  });

  describe('isMessage', function() {

    it('should handle single values', function() {
      expect(isMessage('foo')).to.equal(true);
      expect(isMessage(123)).to.equal(true);
      expect(isMessage(null)).to.equal(true);
      expect(isMessage(undefined)).to.equal(true);
      expect(isMessage(false)).to.equal(true);
      expect(isMessage(true)).to.equal(false);
      expect(isMessage({})).to.equal(false);
    });

    it('should handle arrays of values', function() {
      expect(isMessage([])).to.equal(true);
      expect(isMessage(['foo'])).to.equal(true);
      expect(isMessage([123])).to.equal(true);
      expect(isMessage([null])).to.equal(true);
      expect(isMessage([undefined])).to.equal(true);
      expect(isMessage([false])).to.equal(true);
      expect(isMessage([true])).to.equal(false);
      expect(isMessage([{}])).to.equal(false);
    });

    it('should handle deeply-nested arrays of values', function() {
      expect(isMessage([['foo', [123, [[null], [[undefined], false]]]]])).to.equal(true);
      expect(isMessage([['foo', [123, [[null], [[undefined, {}], false]]]]])).to.equal(false);
    });

  });

  describe('normalizeMessage', function() {

    it('should handle single values', function() {
      expect(normalizeMessage('foo')).to.equal('foo');
      expect(normalizeMessage(123)).to.equal('123');
      expect(normalizeMessage(null)).to.equal('');
      expect(normalizeMessage(undefined)).to.equal('');
      expect(normalizeMessage(false)).to.equal('');
    });

    it('should handle arrays of values', function() {
      expect(normalizeMessage([])).to.equal('');
      expect(normalizeMessage(['foo'])).to.equal('foo');
      expect(normalizeMessage([123])).to.equal('123');
      expect(normalizeMessage([null])).to.equal('');
      expect(normalizeMessage([undefined])).to.equal('');
      expect(normalizeMessage([false])).to.equal('');
      expect(normalizeMessage(['foo', 'bar'])).to.equal('foo\nbar');
      expect(normalizeMessage(['foo', '', 'bar', '', '', 'baz'])).to.equal('foo\n\nbar\n\n\nbaz');
    });

    it('should handle deeply-nested arrays of values', function() {
      expect(
        normalizeMessage([['foo', [123, [[null], [[undefined], false]]]]])
      ).to.equal('foo\n123');
      expect(
        normalizeMessage([['foo', [123, [[null], ['', [undefined, 'bar'], false]]], 456]])
      ).to.equal('foo\n123\n\nbar\n456');
    });

  });

});
