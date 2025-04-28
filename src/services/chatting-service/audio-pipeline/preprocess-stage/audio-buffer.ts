import { FastifyBaseLogger } from 'fastify';

const DEFAULT_SAMPLE_RATE = 16000;
const BYTES_PER_SAMPLE = 2;
const DEFAULT_BUFFER_SECONDS = 0.6;
const DEFAULT_TAIL_SECONDS = 0.01;

export class AudioBuffer {
  private log: FastifyBaseLogger;

  private buffers: Buffer[];

  private tail: Buffer;

  constructor(parentLogger: FastifyBaseLogger) {
    this.log = parentLogger;
    this.buffers = [];
    this.tail = Buffer.from([]);
    this.log.trace('AudioBuffer initialized');
  }

  append(buffer: Buffer): void {
    this.buffers.push(buffer);
  }

  size(): number {
    return this.buffers.reduce((sum, packet) => sum + packet.length, 0);
  }

  isFull(): boolean {
    const threshold = DEFAULT_SAMPLE_RATE * BYTES_PER_SAMPLE * DEFAULT_BUFFER_SECONDS;

    return this.size() >= threshold;
  }

  generateAudioChunk(): Buffer {
    const audioChunk = Buffer.concat([this.tail, Buffer.concat(this.buffers)]);

    const targetTailSize = DEFAULT_SAMPLE_RATE * BYTES_PER_SAMPLE * DEFAULT_TAIL_SECONDS;
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
