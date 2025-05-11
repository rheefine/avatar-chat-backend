import EventEmitter from 'events';
import { AudioBuffer } from '#@/services/chatting/speech-pipeline/audio-preprocess/audio-buffer';
import { CHATTING_LOG_CONTEXT } from '#@/constants/log-context';
import { STAGE_EVENT } from '#@/constants/event';

import type { FastifyBaseLogger } from 'fastify';
import type { Stage } from '#@/services/chatting/speech-pipeline/stage.type';
import type { AudioFromClient } from '#@/schemas/ws/index';
import type { AudioChunk } from '#@/services/chatting/speech-pipeline/stage.dto';

export class AudioPreprocessStage extends EventEmitter implements Stage<Buffer, Buffer> {
  private log: FastifyBaseLogger;

  private buffer: AudioBuffer;

  constructor(parentLogger: FastifyBaseLogger) {
    super();
    this.log = parentLogger.child({ stage: CHATTING_LOG_CONTEXT.PREPROCESS_STAGE });
    this.buffer = new AudioBuffer(this.log);
  }

  async process(buffer: AudioFromClient) {
    this.buffer.append(buffer);

    if (this.buffer.isFull()) {
      const chunk: AudioChunk = this.buffer.generateAudioChunk();
      this.emit(STAGE_EVENT.DATA, chunk);
    }
  }
}
