/* eslint no-undefined: 0 */

import command, {runCommands} from './command';

describe('command', function() {

  beforeEach(function() {
    this.fooCommand = command({
      name: 'foo',
      description: 'Do something with the foo command.',
      parseOptions: {
        aaa: String,
        bbb: Number,
        ccc: Boolean,
      },
      onMatch(args, a, b, c) {
        return Object.assign({}, args, {name: 'foo', a, b, c});
      },
    });

    this.barCommand = command({
      name: 'bar',
      description: 'Do something with the bar command.',
      onMatch(args, a, b, c) {
        return Object.assign({}, args, {name: 'bar', a, b, c});
      },
    });

    this.parentCommand = command({
      name: 'parent',
      description: 'Parent to the foo and bar commands.',
      commands: [
        this.fooCommand,
        this.barCommand,
      ],
      onMatch(args, a, b, c) {
        return Object.assign({}, args, {name: 'parent', a, b, c});
      },
    });
  });

  describe('Command', function() {

    it('should have a description', function() {
      expect(this.fooCommand.getDescription()).to.equal('Do something with the foo command.');
    });

    it('should return false if no match', function() {
      expect(this.fooCommand.handleMessage('xxx yyy zzz')).to.equal(false);
    });

    it('should pass the proper arguments to onMatch', function() {
      expect(this.fooCommand.handleMessage('foo bar baz')).to.deep.equal({
        name: 'foo',
        a: undefined,
        b: undefined,
        c: undefined,
        options: {},
        remain: ['bar', 'baz'],
        errors: [],
        input: 'bar baz',
      });
      expect(this.fooCommand.handleMessage('foo   bar   baz')).to.deep.equal({
        name: 'foo',
        a: undefined,
        b: undefined,
        c: undefined,
        options: {},
        remain: ['bar', 'baz'],
        errors: [],
        input: 'bar   baz',
      });
      expect(this.fooCommand.handleMessage('foo bar a="omg yay" b=123 baz c=1')).to.deep.equal({
        name: 'foo',
        a: undefined,
        b: undefined,
        c: undefined,
        options: {
          aaa: 'omg yay',
          bbb: 123,
          ccc: true,
        },
        remain: ['bar', 'baz'],
        errors: [],
        input: 'bar a="omg yay" b=123 baz c=1',
      });
      expect(this.barCommand.handleMessage('bar', 1, true, 'yay')).to.deep.equal({
        name: 'bar',
        a: 1,
        b: true,
        c: 'yay',
        options: {},
        remain: [],
        errors: [],
        input: '',
      });
    });

    it('should pass message through to sub-commands', function() {
      expect(this.parentCommand.handleMessage('xxx yyy zzz')).to.equal(false);
      expect(this.parentCommand.handleMessage('parent foo bar baz')).to.deep.equal({
        name: 'foo',
        a: undefined,
        b: undefined,
        c: undefined,
        options: {},
        remain: ['bar', 'baz'],
        errors: [],
        input: 'bar baz',
      });
      expect(this.parentCommand.handleMessage('parent bar baz', 1, true, 'yay')).to.deep.equal({
        name: 'bar',
        a: 1,
        b: true,
        c: 'yay',
        options: {},
        remain: ['baz'],
        errors: [],
        input: 'baz',
      });
      expect(this.parentCommand.handleMessage('parent xxx yyy zzz', 1, true, 'yay')).to.deep.equal({
        name: 'parent',
        a: 1,
        b: true,
        c: 'yay',
        options: {},
        remain: ['xxx', 'yyy', 'zzz'],
        errors: [],
        input: 'xxx yyy zzz',
      });
    });

  });

  describe('runCommand', function() {

    it('should be able to run arbitrary commands', function() {
      const commands = [this.fooCommand, this.barCommand];
      expect(runCommands(commands, 'xxx yyy zzz')).to.equal(false);
      expect(runCommands(commands, 'foo bar baz')).to.deep.equal({
        name: 'foo',
        a: undefined,
        b: undefined,
        c: undefined,
        options: {},
        remain: ['bar', 'baz'],
        errors: [],
        input: 'bar baz',
      });
      expect(runCommands(commands, 'bar baz')).to.deep.equal({
        name: 'bar',
        a: undefined,
        b: undefined,
        c: undefined,
        options: {},
        remain: ['baz'],
        errors: [],
        input: 'baz',
      });
      expect(runCommands(commands, 'bar baz', 1, true, 'yay')).to.deep.equal({
        name: 'bar',
        a: 1,
        b: true,
        c: 'yay',
        options: {},
        remain: ['baz'],
        errors: [],
        input: 'baz',
      });
    });

  });

});
