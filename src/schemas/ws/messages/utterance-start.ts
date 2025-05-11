import { Type, Static } from '@sinclair/typebox';

export const UtteranceStartSchema = Type.Object({
  type: Type.Literal('utterance_start'),
});
export type UtteranceStart = Static<typeof UtteranceStartSchema>;
