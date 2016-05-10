import Promise from 'bluebird';
import createConversation, {ConversingMessageHandler} from './conversation';

const nop = () => {};

describe('ConversingMessageHandler', function() {

  describe('API', function() {

    it('createConversation should return an instance of ConversingMessageHandler', function() {
      const conversation = createConversation(nop);
      expect(conversation).to.be.an.instanceof(ConversingMessageHandler);
    });

    it('should behave like DelegatingMessageHandler', function() {
      expect(() => createConversation(nop)).to.not.throw();
      expect(() => createConversation()).to.throw(/missing.*message.*handlers/i);
    });

  });

  describe('handleMessage', function() {

    beforeEach(function() {
      // Object-type message handler
      const dialog = {
        handleMessage(message, a, b) {
          return {message: `dialog ${message} ${a} ${b}`};
        },
      };
      // Function-type message handler
      const deepDialog = function(message, a, b) {
        return {
          message: `deep-dialog ${message} ${a} ${b}`,
          dialog,
        };
      };
      // Object-type message handler
      const dialogThatThrows = {
        handleMessage(message, a, b) {
          throw new Error(`whoops ${message} ${a} ${b}`);
        },
      };
      // Function-type message handler
      const returnsFalse = () => false;
      // Object-type message handler
      const childThatReturnsDialog = {
        handleMessage(message, a, b) {
          return {
            message: `${message} ${a} ${b}`,
            dialog,
          };
        },
      };
      // Function-type message handler
      const childThatReturnsNestedDialogs = (message, a, b) => {
        return {
          message: `${message} ${a} ${b}`,
          dialog: deepDialog,
        };
      };
      const childThatReturnsThrowingDialog = (message, a, b) => {
        return {
          message: `${message} ${a} ${b}`,
          dialog: dialogThatThrows,
        };
      };
      this.conversation = createConversation({
        handleMessage: [returnsFalse, childThatReturnsDialog],
      });
      this.deepConversation = createConversation({
        handleMessage: [returnsFalse, childThatReturnsNestedDialogs],
      });
      this.conversationObjectChild = createConversation({
        handleMessage: childThatReturnsDialog,
      });
      this.deepConversationFunctionChild = createConversation({
        handleMessage: childThatReturnsNestedDialogs,
      });
      this.conversationWithThrowingDialog = createConversation({
        handleMessage: [returnsFalse, childThatReturnsThrowingDialog],
      });
    });

    it('should return a promise that gets fulfilled', function() {
      const conversation = createConversation(nop);
      return expect(conversation.handleMessage()).to.be.fulfilled();
    });

    it('should delegate to a returned message handler on the next message', function() {
      const conversation = this.conversation;
      return Promise.mapSeries([
        () => expect(conversation.handleMessage('foo', 1, 2)).to.become({message: 'foo 1 2'}),
        () => expect(conversation.handleMessage('bar', 3, 4)).to.become({message: 'dialog bar 3 4'}),
        () => expect(conversation.handleMessage('baz', 5, 6)).to.become({message: 'baz 5 6'}),
      ], f => f());
    });

    it('should allow deeply nested dialogs / should support function child handlers', function() {
      const conversation = this.deepConversation;
      return Promise.mapSeries([
        () => expect(conversation.handleMessage('foo', 1, 2)).to.become({message: 'foo 1 2'}),
        () => expect(conversation.handleMessage('bar', 3, 4)).to.become({message: 'deep-dialog bar 3 4'}),
        () => expect(conversation.handleMessage('baz', 5, 6)).to.become({message: 'dialog baz 5 6'}),
        () => expect(conversation.handleMessage('qux', 7, 8)).to.become({message: 'qux 7 8'}),
      ], f => f());
    });

    // The following two tests are the same as the previous two, except using
    // an explicit child instead of an array of children.
    it('should support a single child handler (object) instead of array', function() {
      const conversation = this.conversationObjectChild;
      return Promise.mapSeries([
        () => expect(conversation.handleMessage('foo', 1, 2)).to.become({message: 'foo 1 2'}),
        () => expect(conversation.handleMessage('bar', 3, 4)).to.become({message: 'dialog bar 3 4'}),
        () => expect(conversation.handleMessage('baz', 5, 6)).to.become({message: 'baz 5 6'}),
      ], f => f());
    });

    it('should support a single child handler (function) instead of array', function() {
      const conversation = this.deepConversationFunctionChild;
      return Promise.mapSeries([
        () => expect(conversation.handleMessage('foo', 1, 2)).to.become({message: 'foo 1 2'}),
        () => expect(conversation.handleMessage('bar', 3, 4)).to.become({message: 'deep-dialog bar 3 4'}),
        () => expect(conversation.handleMessage('baz', 5, 6)).to.become({message: 'dialog baz 5 6'}),
        () => expect(conversation.handleMessage('qux', 7, 8)).to.become({message: 'qux 7 8'}),
      ], f => f());
    });

    it('should clear the current dialog with .clearDialog', function() {
      const conversation = this.conversation;
      return Promise.mapSeries([
        () => expect(conversation.handleMessage('foo', 1, 2)).to.become({message: 'foo 1 2'}),
        () => conversation.clearDialog(),
        () => expect(conversation.handleMessage('bar', 3, 4)).to.become({message: 'bar 3 4'}),
      ], f => f());
    });

    it('should clear the current dialog even if the dialog throws an exception', function() {
      const conversation = this.conversationWithThrowingDialog;
      return Promise.mapSeries([
        () => expect(conversation.handleMessage('foo', 1, 2)).to.become({message: 'foo 1 2'}),
        () => expect(conversation.handleMessage('bar', 3, 4)).to.be.rejectedWith('whoops bar 3 4'),
        () => expect(conversation.handleMessage('baz', 5, 6)).to.become({message: 'baz 5 6'}),
      ], f => f());
    });

  });

});

