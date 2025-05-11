import { EventEmitter } from 'events';
import { AzureSttRecognizer } from '#@/adapters/stt/azure/azure-stt-recognizer';
import { STT_EVENT } from '#@/constants/event';
import { ADAPTER_LOG_CONTEXT } from '#@/constants/log-context';

import type { FastifyBaseLogger } from 'fastify';
import type { AzureSttOptions } from '#@/adapters/stt/azure/azure-stt-options.type';
import type { Transcription, SttAdapter } from '#@/adapters/stt/stt.adapter.type';

export class AzureSttAdapter extends EventEmitter implements SttAdapter {
  private log: FastifyBaseLogger;

  private recognizer: AzureSttRecognizer;

  private handleTranscription = (res: Transcription): void => {
    this.emit(STT_EVENT.TRANSCRIPTION, res);
  };

  private handleSpeechStarted = (): void => {
    this.emit(STT_EVENT.SPEECH_STARTED);
  };

  private handleError = (): void => {
    this.emit(STT_EVENT.ERROR);
  };

  constructor(parentLogger: FastifyBaseLogger, opts: AzureSttOptions) {
    super();
    this.log = parentLogger.child({ adapter: ADAPTER_LOG_CONTEXT.STT.AZURE });
    this.recognizer = new AzureSttRecognizer(this.log, opts);

    this.recognizer.on(STT_EVENT.TRANSCRIPTION, this.handleTranscription);
    this.recognizer.on(STT_EVENT.SPEECH_STARTED, this.handleSpeechStarted);
    this.recognizer.on(STT_EVENT.ERROR, this.handleError);
  }

  async processAudioChunk(buffer: Buffer): Promise<void> {
    this.recognizer.writeAudio(buffer);
  }

  async startContinuousRecognition(): Promise<void> {
    await this.recognizer.startRecognition();
  }

  async stopContinuousRecognition(): Promise<void> {
    await this.recognizer.stopRecognition();
    this.recognizer.off(STT_EVENT.TRANSCRIPTION, this.handleTranscription);
    this.recognizer.off(STT_EVENT.SPEECH_STARTED, this.handleSpeechStarted);
    this.recognizer.off(STT_EVENT.ERROR, this.handleError);
  }
}
