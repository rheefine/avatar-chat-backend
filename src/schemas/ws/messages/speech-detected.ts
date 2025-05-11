import { Type, Static } from '@sinclair/typebox';

export const SpeechDetectedSchema = Type.Object({
  type: Type.Literal('speech_detected'),
});
export type SpeechDetected = Static<typeof SpeechDetectedSchema>;
