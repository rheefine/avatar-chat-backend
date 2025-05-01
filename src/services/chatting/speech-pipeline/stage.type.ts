import EventEmitter from 'events';
import { STAGE_EVENT } from '#@/constants/event';

import type { FastifyBaseLogger } from 'fastify';

export interface Stage<I, O> extends EventEmitter {
  process(input: I): Promise<void>;

  on(event: typeof STAGE_EVENT.DATA, listener: (output: O) => void): this;
  on(
    event: typeof STAGE_EVENT.ERROR,
    listener: (err: Error, logger: FastifyBaseLogger) => void,
  ): this;
}
