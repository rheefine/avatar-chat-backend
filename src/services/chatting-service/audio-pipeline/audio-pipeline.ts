import { PreprocessStage } from '#@/services/chatting-service/audio-pipeline/preprocess-stage/preprocess-stage';
import { SpeechToTextStage } from '#@/services/chatting-service/audio-pipeline/speech-to-text/speech-to-text.stage';
import { CHATTING_LOG_CONTEXT } from '#@/constants/log-context';
import { CHATTING_LOG_MESSAGES } from '#@/constants/log-message';
import { STAGE_EVENT } from '#@/constants/event';

import type { FastifyBaseLogger } from 'fastify';

export class AudioPipeline {
  private log: FastifyBaseLogger;

  private preprocessStage: PreprocessStage;

  private speechToTextStage: SpeechToTextStage;

  private onAudioReady = async (chunk: Buffer): Promise<void> => {
    this.log.debug(CHATTING_LOG_MESSAGES.AUDIO_BUFFER.PROCESSING(chunk.length));
    await this.speechToTextStage.process(chunk);
  };

  private onSttTranscribed = async (text: string): Promise<void> => {
    this.log.info(`${text}`);
  };

  private onStageError = (err: Error, errLog: FastifyBaseLogger = this.log) => {
    errLog.error(err.message);
  };

  constructor(parentLogger: FastifyBaseLogger) {
    this.log = parentLogger.child({ pipeline: CHATTING_LOG_CONTEXT.AUDIO_PIPELINE });
    this.preprocessStage = new PreprocessStage(this.log);
    this.speechToTextStage = new SpeechToTextStage(this.log);

    this.preprocessStage.on(STAGE_EVENT.DATA, this.onAudioReady);
    this.speechToTextStage.on('data', this.onSttTranscribed);
    this.speechToTextStage.on('detected', () => this.log.info('sound detected'));
    this.speechToTextStage.on('error', this.onStageError);
  }

  async start(): Promise<void> {
    await this.speechToTextStage.start();
  }

  async handleAudioBuffer(buffer: Buffer): Promise<void> {
    await this.preprocessStage.process(buffer);
  }

  async stop() {
    await this.speechToTextStage.stop();
    this.preprocessStage.off(STAGE_EVENT.DATA, this.onAudioReady);
    this.speechToTextStage.off('data', this.onSttTranscribed);
    this.speechToTextStage.off('error', this.onStageError);
  }
}
