import * as api from './index';

describe('npm module', function() {

  it('should export the proper API', function() {
    expect(api.Bot).to.be.a('function');
    expect(api.createBot).to.be.a('function');

    expect(api.DelegatingMessageHandler).to.be.a('function');
    expect(api.createDelegate).to.be.a('function');
    expect(api.MatchingMessageHandler).to.be.a('function');
    expect(api.createMatcher).to.be.a('function');
    expect(api.ParsingMessageHandler).to.be.a('function');
    expect(api.createParser).to.be.a('function');
    expect(api.ConversingMessageHandler).to.be.a('function');
    expect(api.createConversation).to.be.a('function');

    expect(api.handleMessage).to.be.a('function');
    expect(api.parseArgs).to.be.a('function');
    expect(api.isMessage).to.be.a('function');
    expect(api.normalizeMessage).to.be.a('function');
  });

});
