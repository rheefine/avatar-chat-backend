import { Type, Static } from '@sinclair/typebox';
import { EndSchema } from '#@/schemas/ws/messages/end';
import { ServiceErrorSchema } from '#@/schemas/ws/messages/service-error';
import { SpeechDetectedSchema } from '#@/schemas/ws/messages/speech-detected';
import { UtteranceStartSchema } from '#@/schemas/ws/messages/utterance-start';
import { VisemeSchema } from '#@/schemas/ws/messages/viseme';

export type { End } from '#@/schemas/ws/messages/end';
export type { ServiceError } from '#@/schemas/ws/messages/service-error';
export type { SpeechDetected } from '#@/schemas/ws/messages/speech-detected';
export type { UtteranceStart } from '#@/schemas/ws/messages/utterance-start';
export type { Viseme } from '#@/schemas/ws/messages/viseme';

export { EndSchema };
export { ServiceErrorSchema };
export { SpeechDetectedSchema };
export { UtteranceStartSchema };
export { VisemeSchema };

export const WsMessageSchema = Type.Union([
  EndSchema,
  ServiceErrorSchema,
  SpeechDetectedSchema,
  UtteranceStartSchema,
  VisemeSchema,
]);
export type WsMessage = Static<typeof WsMessageSchema>;

export type AudioFromClient = Buffer;
export type AudioToClient = Uint8Array;
