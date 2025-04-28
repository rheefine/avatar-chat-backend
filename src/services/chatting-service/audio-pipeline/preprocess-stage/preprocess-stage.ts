import EventEmitter from 'events';
import { AudioBuffer } from '#@/services/chatting-service/audio-pipeline/preprocess-stage/audio-buffer';

import type { FastifyBaseLogger } from 'fastify';
import type { PipelineStage } from '#@/services/chatting-service/audio-pipeline/pipeline-stage.type';

export class PreprocessStage extends EventEmitter implements PipelineStage<Buffer, Buffer> {
  private log: FastifyBaseLogger;

  private buffer: AudioBuffer;

  constructor(parentLogger: FastifyBaseLogger) {
    super();
    this.log = parentLogger.child({ stage: 'preprocess' });
    this.buffer = new AudioBuffer(this.log);
  }

  async process(buffer: Buffer) {
    this.buffer.append(buffer);

    if (this.buffer.isFull()) {
      const chunk = this.buffer.generateAudioChunk();
      this.emit('data', chunk);
    }
  }
}
