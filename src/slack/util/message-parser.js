// Parse message strings per https://api.slack.com/docs/formatting
// Turns a string like this:
//   Hello <@U03BS5P65>, channel is <#C025GMFDX> and URL is <http://foo.com/bar|foo.com/bar>
// Into this:
//   Hello @cowboy, channel is #general and URL is http://foo.com/bar
export function parseMessage(slack, message = '') {
  const handlers = {
    '#': id => {
      const {name} = slack.rtmClient.dataStore.getChannelById(id) || {};
      return name && `#${name}`;
    },
    '@': id => {
      const {name} = slack.rtmClient.dataStore.getUserById(id) || {};
      return name && `@${name}`;
    },
  };
  const firstPart = s => s.split('|')[0];
  return message.replace(/<([^\s>]+)>/g, (all, text) => {
    const prefix = text[0];
    const handler = handlers[prefix];
    if (handler) {
      return handler(firstPart(text.slice(1)));
    }
    return firstPart(text);
  });
}
