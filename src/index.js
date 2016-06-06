// Bot
export {Bot, default as createBot} from './bot';
export {SlackBot, default as createSlackBot} from './slack/slack-bot';

// Message handlers
export {DelegatingMessageHandler, default as createDelegate} from './message-handler/delegate';
export {MatchingMessageHandler, default as createMatcher} from './message-handler/matcher';
export {ArgsAdjustingMessageHandler, default as createArgsAdjuster} from './message-handler/args-adjuster';
export {ParsingMessageHandler, default as createParser} from './message-handler/parser';
export {ConversingMessageHandler, default as createConversation} from './message-handler/conversation';
export {CommandMessageHandler, default as createCommand} from './message-handler/command';

// Util
export {processMessage, isMessageHandlerOrHandlers} from './util/process-message';
export {parseArgs} from './util/args-parser';
export {isMessage, isArrayOfMessages, normalizeMessage, normalizeMessages, normalizeResponse} from './util/response';
export {default as Queue} from './util/queue';
export {composeCreators} from './message-handler/delegate';
