import Promise from 'bluebird';
import conversation from './conversation';

describe('conversation', function() {

  describe('Conversation', function() {

    it('should pass message to commands and yield their result', function() {
      const command1 = {
        handleMessage(message, a, b) {
          return message.indexOf('skip1') !== -1 ? false : {
            message: `first ${message} ${a} ${b}`,
          };
        },
      };
      const command2 = {
        handleMessage(message, a, b) {
          return message.indexOf('skip2') !== -1 ? false : {
            message: `second ${message} ${a} ${b}`,
          };
        },
      };
      const convo = conversation({
        commands: [command1, command2],
      });
      return Promise.mapSeries([
        () => convo.handleMessage('yay', 1, 2).then(result => {
          expect(result.message).to.equal('first yay 1 2');
        }),
        () => convo.handleMessage('skip1', 3, 4).then(result => {
          expect(result.message).to.equal('second skip1 3 4');
        }),
        () => convo.handleMessage('skip1 skip2', 5, 6).then(result => {
          expect(result).to.equal(false);
        }),
      ], f => f());
    });

    describe('dialog', function() {

      beforeEach(function() {
        const dialog = {
          handleMessage(message, a, b) {
            return {
              message: `dialog ${message} ${a} ${b}`,
            };
          },
        };
        const command = {
          handleMessage(message, a, b) {
            return {
              message: `command ${message} ${a} ${b}`,
              dialog,
            };
          },
        };
        this.convo = conversation({
          commands: [command],
        });
      });

      it('should prioritize a returned dialog over commands', function() {
        const convo = this.convo;
        return Promise.mapSeries([
          () => convo.handleMessage('a', 1, 2).then(result => {
            expect(result.message).to.equal('command a 1 2');
          }),
          () => convo.handleMessage('b', 3, 4).then(result => {
            expect(result.message).to.equal('dialog b 3 4');
          }),
          () => convo.handleMessage('c', 5, 6).then(result => {
            expect(result.message).to.equal('command c 5 6');
          }),
        ], f => f());
      });

      it('should allow a dialog to be cleared', function() {
        const convo = this.convo;
        return Promise.mapSeries([
          () => convo.handleMessage('a', 1, 2).then(result => {
            expect(result.message).to.equal('command a 1 2');
          }),
          () => convo.clearDialog(),
          () => convo.handleMessage('b', 3, 4).then(result => {
            expect(result.message).to.equal('command b 3 4');
          }),
        ], f => f());
      });

    });

  });

});
