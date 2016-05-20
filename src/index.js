// Bot
export {Bot, default as createBot} from './bot';
export {SlackBot, default as createSlackBot} from './slack/bot';

// Message handlers
export {DelegatingMessageHandler, default as createDelegate} from './message-handler/delegate';
export {MatchingMessageHandler, default as createMatcher} from './message-handler/matcher';
export {ParsingMessageHandler, default as createParser} from './message-handler/parser';
export {ConversingMessageHandler, default as createConversation} from './message-handler/conversation';
export {CommandMessageHandler, default as createCommand} from './message-handler/command';

// Util
export {processMessage, isMessageHandlerOrHandlers} from './util/process-message';
export {parseArgs} from './util/args-parser';
export {isMessage, normalizeMessage} from './util/response';
export {composeCreators} from './message-handler/delegate';
