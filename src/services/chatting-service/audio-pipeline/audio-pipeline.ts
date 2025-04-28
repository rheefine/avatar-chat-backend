import { PreprocessStage } from '#@/services/chatting-service/audio-pipeline/preprocess-stage/preprocess-stage';

import type { FastifyBaseLogger } from 'fastify';

export class AudioPipeline {
  private log: FastifyBaseLogger;

  private preprocessStage: PreprocessStage;

  public handleAudioBuffer = async (buffer: Buffer): Promise<void> => {
    await this.preprocessStage.process(buffer);
  };

  private onAudioReady = async (chunk: Buffer): Promise<void> => {
    this.log.debug(`Processing audio buffer... (${chunk.length} Bytes)`);
  };

  constructor(parentLogger: FastifyBaseLogger) {
    this.log = parentLogger.child({ pipeline: 'audio' });
    this.preprocessStage = new PreprocessStage(this.log);

    this.preprocessStage.on('data', this.onAudioReady);
  }
}
