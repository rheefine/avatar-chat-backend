import type {
  ConversationItemCreateEvent,
  ConversationItemDeleteEvent,
  ResponseCreateEvent,
  ResponseCancelEvent,
  SessionUpdateEvent,
  ConversationItemCreatedEvent,
  ResponseTextDeltaEvent,
  ResponseTextDoneEvent,
  ResponseDoneEvent,
  ErrorEvent,
} from 'openai/resources/beta/realtime/realtime';

export type {
  ConversationItemCreateEvent,
  ConversationItemDeleteEvent,
  ResponseCreateEvent,
  ResponseCancelEvent,
  SessionUpdateEvent,
  ConversationItemCreatedEvent,
  ResponseTextDeltaEvent,
  ResponseTextDoneEvent,
  ResponseDoneEvent,
  ErrorEvent,
};

export const AzureLlmEmitEvents = {
  ConversationItemCreate: 'conversation.item.create' as ConversationItemCreateEvent['type'],
  ConversationItemDelete: 'conversation.item.delete' as ConversationItemDeleteEvent['type'],
  ResponseCreate: 'response.create' as ResponseCreateEvent['type'],
  ResponseCancel: 'response.cancel' as ResponseCancelEvent['type'],
  SessionUpdate: 'session.update' as SessionUpdateEvent['type'],
} as const;

export type AzureLlmEmitEventName = (typeof AzureLlmEmitEvents)[keyof typeof AzureLlmEmitEvents];

export const AzureLlmOnEvents = {
  ConversationItemCreated: 'conversation.item.created' as ConversationItemCreatedEvent['type'],
  ResponseTextDelta: 'response.text.delta' as ResponseTextDeltaEvent['type'],
  ResponseTextDone: 'response.text.done' as ResponseTextDoneEvent['type'],
  ResponseDone: 'response.done' as ResponseDoneEvent['type'],
  ERROR: 'error' as ErrorEvent['type'],
} as const;

export type AzureLlmEventName = (typeof AzureLlmOnEvents)[keyof typeof AzureLlmOnEvents];
