import { EventEmitter } from 'events';
import { STT_EVENT } from '#@/constants/event';

export interface Transcription {
  text: string;
  timestamp: Date;
}

export interface SttAdapter extends EventEmitter {
  processAudioChunk(buffer: Buffer): Promise<void>;

  startContinuousRecognition(): Promise<void>;

  stopContinuousRecognition(): Promise<void>;

  on(event: typeof STT_EVENT.TRANSCRIPTION, listener: (res: Transcription) => void): this;

  on(event: typeof STT_EVENT.SPEECH_STARTED, listener: () => void): this;

  on(event: typeof STT_EVENT.ERROR, listener: () => void): this;
}
