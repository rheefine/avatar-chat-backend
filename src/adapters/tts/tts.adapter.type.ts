import { EventEmitter } from 'events';
import { SynthesizeSpeechCommandOutput } from '@aws-sdk/client-polly';

import type { AudioToClient as WsAudio, Viseme as WsViseme } from '#@/schemas/ws/index';

export type TtsViseme = WsViseme;
export type TtsAudio = WsAudio;

export interface TtsAdapter extends EventEmitter {
  processAudio(text: string, idx: number): Promise<any>;
  processViseme(text: string, idx: number): Promise<any>;
  handleAudio(response: SynthesizeSpeechCommandOutput): Promise<void>;
  handleViseme(response: SynthesizeSpeechCommandOutput, idx: number): Promise<void>;

  on(event: 'audio', listener: (res: TtsAudio) => void): this;

  on(event: 'viseme', listener: (res: TtsViseme) => void): this;

  on(event: 'error', listener: () => void): this;
}
