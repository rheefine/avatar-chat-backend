import EventEmitter from 'events';
import type { FastifyBaseLogger } from 'fastify';

export interface PipelineStage<I, O> extends EventEmitter {
  process(input: I): Promise<void>;

  on(event: 'data', listener: (output: O) => void): this;
  on(event: 'error', listener: (err: Error, logger: FastifyBaseLogger) => void): this;
}
