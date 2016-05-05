import Promise from 'bluebird';
import createConversation, {ConversingMessageHandler} from './conversation';
import {DelegatingMessageHandler} from './delegate';

describe('MatchingMessageHandler', function() {

  describe('API', function() {

    it('createConversation should return an instance of ConversingMessageHandler, ' +
       'DelegatingMessageHandler', function() {
      const conversation = createConversation();
      expect(conversation).to.be.an.instanceof(ConversingMessageHandler);
      expect(conversation).to.be.an.instanceof(DelegatingMessageHandler);
    });

  });

  describe('handleMessage', function() {

    beforeEach(function() {
      const dialog = {
        handleMessage(message, a, b) {
          return {response: `dialog ${message} ${a} ${b}`};
        },
      };
      const deepDialog = {
        handleMessage(message, a, b) {
          return {
            response: `deep-dialog ${message} ${a} ${b}`,
            dialog,
          };
        },
      };
      const nopChild = {
        handleMessage() {
          return false;
        },
      };
      const childThatReturnsDialog = {
        handleMessage(message, a, b) {
          return {
            response: `${message} ${a} ${b}`,
            dialog,
          };
        },
      };
      const childThatReturnsNestedDialogs = {
        handleMessage(message, a, b) {
          return {
            response: `${message} ${a} ${b}`,
            dialog: deepDialog,
          };
        },
      };
      this.conversation = createConversation({
        children: [nopChild, childThatReturnsDialog],
      });
      this.deepConversation = createConversation({
        children: [nopChild, childThatReturnsNestedDialogs],
      });
    });

    it('should return a promise that gets fulfilled', function() {
      const conversation = createConversation();
      return expect(conversation.handleMessage()).to.be.fulfilled();
    });

    it('should delegate to a returned message handler on the next message', function() {
      const conversation = this.conversation;
      return Promise.mapSeries([
        () => expect(conversation.handleMessage('foo', 1, 2)).to.become({response: 'foo 1 2'}),
        () => expect(conversation.handleMessage('bar', 3, 4)).to.become({response: 'dialog bar 3 4'}),
        () => expect(conversation.handleMessage('baz', 5, 6)).to.become({response: 'baz 5 6'}),
      ], f => f());
    });

    it('should allow deeply nested dialogs', function() {
      const conversation = this.deepConversation;
      return Promise.mapSeries([
        () => expect(conversation.handleMessage('foo', 1, 2)).to.become({response: 'foo 1 2'}),
        () => expect(conversation.handleMessage('bar', 3, 4)).to.become({response: 'deep-dialog bar 3 4'}),
        () => expect(conversation.handleMessage('baz', 5, 6)).to.become({response: 'dialog baz 5 6'}),
        () => expect(conversation.handleMessage('qux', 7, 8)).to.become({response: 'qux 7 8'}),
      ], f => f());
    });

    it('should clear the current dialog with .clearDialog', function() {
      const conversation = this.conversation;
      return Promise.mapSeries([
        () => expect(conversation.handleMessage('foo', 1, 2)).to.become({response: 'foo 1 2'}),
        () => conversation.clearDialog(),
        () => expect(conversation.handleMessage('bar', 3, 4)).to.become({response: 'bar 3 4'}),
      ], f => f());
    });

  });

});

