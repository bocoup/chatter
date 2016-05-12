import {parseMessage} from './message-parser';

const slack = {
  getUserByID(id) {
    const map = ['aaa', 'bbb', 'ccc'];
    return {name: map[id]};
  },
  getChannelByID(id) {
    const map = ['ddd', 'eee', 'fff'];
    return {name: map[id]};
  },
};

describe('slack/message-handler/slack', function() {

  it('should export the proper API', function() {
    expect(parseMessage).to.be.a('function');
  });

  describe('parseMessage', function() {

    it('should parse names, returning the first pipe-delimited part', function() {
      expect(parseMessage(slack, '<@0>')).to.equal('@aaa');
      expect(parseMessage(slack, '<@0|foo>')).to.equal('@aaa');
      expect(parseMessage(slack, '<@1> <@2>')).to.equal('@bbb @ccc');
      expect(parseMessage(slack, 'x <@0> y <@1> z <@2>')).to.equal('x @aaa y @bbb z @ccc');
    });

    it('should parse channels, returning the first pipe-delimited part', function() {
      expect(parseMessage(slack, '<#0>')).to.equal('#ddd');
      expect(parseMessage(slack, '<#0|foo>')).to.equal('#ddd');
      expect(parseMessage(slack, '<#1> <#2>')).to.equal('#eee #fff');
      expect(parseMessage(slack, 'x <#0> y <#1> z <#2>')).to.equal('x #ddd y #eee z #fff');
    });

    it('should otherwise just strip <> brackets and return the first pipe-delimited part', function() {
      expect(parseMessage(slack, '<a>')).to.equal('a');
      expect(parseMessage(slack, '<foo>')).to.equal('foo');
      expect(parseMessage(slack, '<http://foo.com/bar>')).to.equal('http://foo.com/bar');
      expect(parseMessage(slack, '<http://foo.com/bar|foo.com/bar>')).to.equal('http://foo.com/bar');
    });

    it('should support any combination of the above', function() {
      expect(
        parseMessage(slack, '<a>  <@0> <b|c>  <#1> ddd <@1|e>  <f|g> <#2|h>')
      ).to.equal('a  @aaa b  #eee ddd @bbb  f #fff');
    });

  });

});
