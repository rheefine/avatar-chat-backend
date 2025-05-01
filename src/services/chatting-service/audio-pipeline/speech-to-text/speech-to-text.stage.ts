import { EventEmitter } from 'events';
import { AzureSttAdapter } from '#@/adapters/stt/azure/azure-stt.adapter';
import { STAGE_EVENT, STT_EVENT } from '#@/constants/event';

import type { FastifyBaseLogger } from 'fastify';
import type { PipelineStage } from '#@/services/chatting-service/audio-pipeline/pipeline-stage.type';
import type { Transcription, SttAdapter } from '#@/adapters/stt/stt.adapter.type';

export class SpeechToTextStage extends EventEmitter implements PipelineStage<Buffer, string> {
  private log: FastifyBaseLogger;

  private sttAdapter: SttAdapter;

  constructor(parentLogger: FastifyBaseLogger) {
    super();
    this.log = parentLogger.child({ stage: 'STT' });
    this.sttAdapter = new AzureSttAdapter(this.log, {
      subscriptionKey: String(process.env.AZURE_SPEECH_KEY),
      region: 'koreacentral',
      language: 'ko-kr',
    });

    this.sttAdapter.on(STT_EVENT.TRANSCRIPTION, (transcription: Transcription) => {
      this.emit(STAGE_EVENT.DATA, transcription.text);
    });
    this.sttAdapter.on(STT_EVENT.SPEECH_STARTED, () => {
      this.emit(STAGE_EVENT.DETECTED);
    });
    this.sttAdapter.on(STT_EVENT.ERROR, (err) => {
      this.emit(STAGE_EVENT.ERROR, err, this.log);
    });
  }

  async process(buffer: Buffer): Promise<void> {
    await this.sttAdapter.processAudioChunk(buffer);
  }

  async start(): Promise<void> {
    await this.sttAdapter.startContinuousRecognition();
  }

  async stop(): Promise<void> {
    await this.sttAdapter.stopContinuousRecognition();
  }
}
