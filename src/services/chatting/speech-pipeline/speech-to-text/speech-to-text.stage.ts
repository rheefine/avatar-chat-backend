import { EventEmitter } from 'events';
import { STAGE_EVENT, STT_EVENT } from '#@/constants/event';

import type { FastifyBaseLogger } from 'fastify';
import type { Stage } from '#@/services/chatting/speech-pipeline/stage.type';
import type { Transcription, SttAdapter } from '#@/adapters/stt/stt.adapter.type';

export class SpeechToTextStage extends EventEmitter implements Stage<Buffer, string> {
  private log: FastifyBaseLogger;

  constructor(
    parentLogger: FastifyBaseLogger,
    private readonly sttPort: SttAdapter,
  ) {
    super();
    this.log = parentLogger.child({ stage: 'STT' });

    this.sttPort.on(STT_EVENT.TRANSCRIPTION, (transcription: Transcription) => {
      this.emit(STAGE_EVENT.DATA, transcription.text);
    });
    this.sttPort.on(STT_EVENT.SPEECH_STARTED, () => {
      this.emit(STAGE_EVENT.DETECTED);
    });
    this.sttPort.on(STT_EVENT.ERROR, (err) => {
      this.emit(STAGE_EVENT.ERROR, err, this.log);
    });
  }

  async process(buffer: Buffer): Promise<void> {
    await this.sttPort.processAudioChunk(buffer);
  }

  async start(): Promise<void> {
    await this.sttPort.startContinuousRecognition();
  }

  async stop(): Promise<void> {
    await this.sttPort.stopContinuousRecognition();
  }
}
