import Promise from 'bluebird';
import createCommand, {CommandMessageHandler} from './command';

const nop = () => {};

describe('message-handler/command', function() {

  it('should export the proper API', function() {
    expect(createCommand).to.be.a('function');
    expect(CommandMessageHandler).to.be.a('function');
  });

  describe('createCommand', function() {

    it('should return an instance of CommandMessageHandler', function() {
      const command = createCommand({name: 'foo', handleMessage: []});
      expect(command).to.be.an.instanceof(CommandMessageHandler);
    });

  });

  describe('CommandMessageHandler', function() {

    describe('constructor', function() {

      it('should behave like DelegatingMessageHandler', function() {
        expect(() => createCommand({name: 'foo'}, nop)).to.not.throw();
        expect(() => createCommand({name: 'foo'})).to.throw(/missing.*message.*handler/i);
      });

    });

    describe('handleMessage', function() {

      it('should return a promise that gets fulfilled', function() {
        const command = createCommand({name: 'foo'}, nop);
        return expect(command.handleMessage()).to.be.fulfilled();
      });

      it('should match messages starting with the command name', function() {
        const command = createCommand({name: 'foo'}, [
          message => message === 'xyz' && 'xyz-match',
          message => message,
        ]);
        return Promise.all([
          expect(command.handleMessage('foo')).to.become(''),
          expect(command.handleMessage('foo ')).to.become(''),
          expect(command.handleMessage('foo bar')).to.become('bar'),
          expect(command.handleMessage('foo    bar')).to.become('bar'),
          expect(command.handleMessage('foo xyz')).to.become('xyz-match'),
          expect(command.handleMessage('foo-bar')).to.become(false),
        ]);
      });

      it('should match messages starting with the command name or an alias', function() {
        const command = createCommand({name: 'foo', aliases: ['aaa', 'aaa:']}, [
          message => message === 'xyz' && 'xyz-match',
          message => message,
        ]);
        return Promise.all([
          // name
          expect(command.handleMessage('foo')).to.become(''),
          expect(command.handleMessage('foo ')).to.become(''),
          expect(command.handleMessage('foo bar')).to.become('bar'),
          expect(command.handleMessage('foo    bar')).to.become('bar'),
          expect(command.handleMessage('foo xyz')).to.become('xyz-match'),
          // alias 1
          expect(command.handleMessage('aaa')).to.become(''),
          expect(command.handleMessage('aaa ')).to.become(''),
          expect(command.handleMessage('aaa bar')).to.become('bar'),
          expect(command.handleMessage('aaa    bar')).to.become('bar'),
          expect(command.handleMessage('aaa xyz')).to.become('xyz-match'),
          // alias 2
          expect(command.handleMessage('aaa:')).to.become(''),
          expect(command.handleMessage('aaa: ')).to.become(''),
          expect(command.handleMessage('aaa: bar')).to.become('bar'),
          expect(command.handleMessage('aaa:    bar')).to.become('bar'),
          expect(command.handleMessage('aaa: xyz')).to.become('xyz-match'),
          // messages that don't match the name or an alias just fail
          expect(command.handleMessage('aaa-bar')).to.become(false),
          expect(command.handleMessage('aaa:bar')).to.become(false),
          expect(command.handleMessage('xyz')).to.become(false),
        ]);
      });

      it('should match messages starting with no name but with an alias', function() {
        const command = createCommand({aliases: ['aaa', 'aaa:']}, [
          message => message === 'xyz' && 'xyz-match',
          message => message,
        ]);
        return Promise.all([
          // alias 1
          expect(command.handleMessage('aaa')).to.become(''),
          expect(command.handleMessage('aaa ')).to.become(''),
          expect(command.handleMessage('aaa bar')).to.become('bar'),
          expect(command.handleMessage('aaa    bar')).to.become('bar'),
          expect(command.handleMessage('aaa xyz')).to.become('xyz-match'),
          // alias 2
          expect(command.handleMessage('aaa:')).to.become(''),
          expect(command.handleMessage('aaa: ')).to.become(''),
          expect(command.handleMessage('aaa: bar')).to.become('bar'),
          expect(command.handleMessage('aaa:    bar')).to.become('bar'),
          expect(command.handleMessage('aaa: xyz')).to.become('xyz-match'),
          // not matched
          expect(command.handleMessage('aaa-bar')).to.become('aaa-bar'),
          expect(command.handleMessage('aaa:bar')).to.become('aaa:bar'),
          expect(command.handleMessage('xyz')).to.become('xyz-match'),
        ]);
      });

    });

  });

});
