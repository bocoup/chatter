import * as api from './index';

describe('npm module', function() {

  it('should export Bot', function() {
    expect(api.Bot).to.be.a('function');
    expect(api.createBot).to.be.a('function');
  });

  it('should export SlackBot', function() {
    expect(api.SlackBot).to.be.a('function');
    expect(api.createSlackBot).to.be.a('function');
  });

  it('should export DelegatingMessageHandler', function() {
    expect(api.DelegatingMessageHandler).to.be.a('function');
    expect(api.createDelegate).to.be.a('function');
  });

  it('should export MatchingMessageHandler', function() {
    expect(api.MatchingMessageHandler).to.be.a('function');
    expect(api.createMatcher).to.be.a('function');
  });

  it('should export ArgsAdjustingMessageHandler', function() {
    expect(api.ArgsAdjustingMessageHandler).to.be.a('function');
    expect(api.createArgsAdjuster).to.be.a('function');
  });

  it('should export ParsingMessageHandler', function() {
    expect(api.ParsingMessageHandler).to.be.a('function');
    expect(api.createParser).to.be.a('function');
  });

  it('should export ConversingMessageHandler', function() {
    expect(api.ConversingMessageHandler).to.be.a('function');
    expect(api.createConversation).to.be.a('function');
  });

  it('should export utils', function() {
    expect(api.processMessage).to.be.a('function');
    expect(api.parseArgs).to.be.a('function');
    expect(api.isMessage).to.be.a('function');
    expect(api.normalizeMessage).to.be.a('function');
  });

});
