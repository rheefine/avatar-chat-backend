import { EventEmitter } from 'events';
import { AzureSttAdapter } from '#@/adapters/stt/azure/azure-stt.adapter';

import type { FastifyBaseLogger } from 'fastify';
import type { PipelineStage } from '#@/services/chatting-service/audio-pipeline/pipeline-stage.type';
import type { SttAdapter } from '#@/adapters/stt/stt.adapter.type';

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

    this.sttAdapter.on('transcription', ({ text }) => {
      this.emit('data', text);
    });
    this.sttAdapter.on('error', (err) => {
      this.emit('error', err, this.log);
    });
    this.sttAdapter.on('speechStarted', () => {
      this.emit('detected');
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
