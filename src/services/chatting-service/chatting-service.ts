import type { FastifyBaseLogger } from 'fastify';
import type { WebSocket } from 'ws';

export class ChattingService {
  private log: FastifyBaseLogger;

  constructor(
    private readonly ws: WebSocket,
    parentLogger: FastifyBaseLogger,
  ) {
    this.log = parentLogger.child({ service: 'chatting' });
  }

  startSession() {
    this.log.info('session start');
    this.log.info(this.ws);
  }
}
