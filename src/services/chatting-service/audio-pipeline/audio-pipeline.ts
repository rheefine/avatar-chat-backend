import { PreprocessStage } from '#@/services/chatting-service/audio-pipeline/preprocess-stage/preprocess-stage';
import { CHATTING_LOG_CONTEXT } from '#@/constants/log-context';
import { CHATTING_LOG_MESSAGES } from '#@/constants/log-message';
import { STAGE_EVENT } from '#@/constants/event';

import type { FastifyBaseLogger } from 'fastify';

export class AudioPipeline {
  private log: FastifyBaseLogger;

  private preprocessStage: PreprocessStage;

  public handleAudioBuffer = async (buffer: Buffer): Promise<void> => {
    await this.preprocessStage.process(buffer);
  };

  private onAudioReady = async (chunk: Buffer): Promise<void> => {
    this.log.debug(CHATTING_LOG_MESSAGES.AUDIO_BUFFER.PROCESSING(chunk.length));
  };

  constructor(parentLogger: FastifyBaseLogger) {
    this.log = parentLogger.child({ pipeline: CHATTING_LOG_CONTEXT.AUDIO_PIPELINE });
    this.preprocessStage = new PreprocessStage(this.log);

    this.preprocessStage.on(STAGE_EVENT.DATA, this.onAudioReady);
  }
}
