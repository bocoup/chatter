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
      onMatch(args) {
        return Object.assign({}, args, {name: 'foo'});
      },
    });

    this.barCommand = command({
      name: 'bar',
      description: 'Do something with the bar command.',
      onMatch(args) {
        return Object.assign({}, args, {name: 'bar'});
      },
    });

    this.parentCommand = command({
      name: 'parent',
      description: 'Parent to the foo and bar commands.',
      commands: [
        this.fooCommand,
        this.barCommand,
      ],
      onMatch(args) {
        return Object.assign({}, args, {name: 'parent'});
      },
    });
  });

  describe('Command', function() {

    it('should have a description', function() {
      expect(this.fooCommand.getDescription()).to.equal('Do something with the foo command.');
    });

    it('should return false if no match', function() {
      expect(this.fooCommand.process('xxx yyy zzz')).to.equal(false);
    });

    it('should pass the proper arguments to onMatch', function() {
      expect(this.fooCommand.process('foo bar baz')).to.deep.equal({
        name: 'foo',
        options: {},
        remain: ['bar', 'baz'],
        errors: [],
        input: 'bar baz',
      });
      expect(this.fooCommand.process('foo   bar   baz')).to.deep.equal({
        name: 'foo',
        options: {},
        remain: ['bar', 'baz'],
        errors: [],
        input: 'bar   baz',
      });
      expect(this.fooCommand.process('foo bar a="omg yay" b=123 baz c=1')).to.deep.equal({
        name: 'foo',
        options: {
          aaa: 'omg yay',
          bbb: 123,
          ccc: true,
        },
        remain: ['bar', 'baz'],
        errors: [],
        input: 'bar a="omg yay" b=123 baz c=1',
      });
    });

    it('should pass message through to sub-commands', function() {
      expect(this.parentCommand.process('xxx yyy zzz')).to.equal(false);
      expect(this.parentCommand.process('parent foo bar baz')).to.deep.equal({
        name: 'foo',
        options: {},
        remain: ['bar', 'baz'],
        errors: [],
        input: 'bar baz',
      });
      expect(this.parentCommand.process('parent bar baz')).to.deep.equal({
        name: 'bar',
        options: {},
        remain: ['baz'],
        errors: [],
        input: 'baz',
      });
      expect(this.parentCommand.process('parent xxx yyy zzz')).to.deep.equal({
        name: 'parent',
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
        options: {},
        remain: ['bar', 'baz'],
        errors: [],
        input: 'bar baz',
      });
      expect(runCommands(commands, 'bar baz')).to.deep.equal({
        name: 'bar',
        options: {},
        remain: ['baz'],
        errors: [],
        input: 'baz',
      });
    });

  });

});
