import { EventEmitter } from 'events';

export interface Transcription {
  text: string;
  timestamp: Date;
}

export interface SttAdapter extends EventEmitter {
  processAudioChunk(buffer: Buffer): Promise<void>;

  startContinuousRecognition(): Promise<void>;

  stopContinuousRecognition(): Promise<void>;

  on(event: 'transcription', listener: (res: Transcription) => void): this;

  on(event: 'speechStarted', listener: () => void): this;

  on(event: 'error', listener: (err: Error) => void): this;
}
