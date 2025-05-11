import { FastifyBaseLogger } from 'fastify';
import { AUDIO } from '#@/constants/audio';

export class AudioBuffer {
  private log: FastifyBaseLogger;

  private buffers: Buffer[] = [];

  private tail: Buffer = Buffer.from([]);

  constructor(parentLogger: FastifyBaseLogger) {
    this.log = parentLogger;
    this.log.silent('');
  }

  append(buffer: Buffer): void {
    this.buffers.push(buffer);
  }

  size(): number {
    return this.buffers.reduce((sum, packet) => sum + packet.length, 0);
  }

  isFull(): boolean {
    const threshold = AUDIO.SAMPLE_RATE * AUDIO.BYTES_PER_SAMPLE * AUDIO.BUFFER_SECONDS;

    return this.size() >= threshold;
  }

  generateAudioChunk(): Buffer {
    const audioChunk = Buffer.concat([this.tail, Buffer.concat(this.buffers)]);

    const targetTailSize = AUDIO.SAMPLE_RATE * AUDIO.BYTES_PER_SAMPLE * AUDIO.TAIL_SECONDS;
    if (targetTailSize > 0) {
      const start = Math.max(0, audioChunk.length - targetTailSize);
      this.tail = audioChunk.slice(start);
    } else {
      this.tail = Buffer.alloc(0);
    }

    this.buffers = [];

    return audioChunk;
  }
}
