import { EventEmitter } from 'events';
import { AzureSttRecognizer } from '#@/adapters/stt/azure/azure-stt-recognizer';

import type { FastifyBaseLogger } from 'fastify';
import type { AzureSttOptions } from '#@/adapters/stt/azure/azure-stt-options.type';
import type { Transcription, SttAdapter } from '#@/adapters/stt/stt.adapter.type';

export class AzureSttAdapter extends EventEmitter implements SttAdapter {
  private log: FastifyBaseLogger;

  private recognizer: AzureSttRecognizer;

  constructor(parentLogger: FastifyBaseLogger, opts: AzureSttOptions) {
    super();
    this.log = parentLogger;
    this.recognizer = new AzureSttRecognizer(this.log, opts);

    this.recognizer.on('transcription', (res: Transcription) => this.emit('transcription', res));
    this.recognizer.on('speechStarted', () => this.emit('speechStarted'));
    this.recognizer.on('error', (err: Error) => this.emit('error', err));
  }

  async processAudioChunk(buffer: Buffer): Promise<void> {
    this.recognizer.writeAudio(buffer);
  }

  async startContinuousRecognition(): Promise<void> {
    await this.recognizer.startRecognition();
  }

  async stopContinuousRecognition(): Promise<void> {
    await this.recognizer.stopRecognition();
  }
}
