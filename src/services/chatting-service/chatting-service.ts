import { AudioPipeline } from '#@/services/chatting-service/audio-pipeline/audio-pipeline';

import type { FastifyBaseLogger } from 'fastify';
import type { WebSocket } from 'ws';

export class ChattingService {
  private log: FastifyBaseLogger;

  private audioPipeline: AudioPipeline;

  constructor(
    private readonly ws: WebSocket,
    parentLogger: FastifyBaseLogger,
  ) {
    this.log = parentLogger.child({ service: 'chatting' });
    this.audioPipeline = new AudioPipeline(this.log);
  }

  startSession() {
    this.log.info('session start');
    this.ws.on('message', (data) => this.handleMessage(data));
    this.ws.on('error', (err) => this.handleError(err));
    this.ws.on('close', () => this.handleClose());
  }

  private async handleMessage(data: WebSocket.Data) {
    try {
      if (Buffer.isBuffer(data)) {
        await this.audioPipeline.handleAudioBuffer(data);
      } else {
        this.log.warn(`Unexpected data type: ${typeof data}`);
      }
    } catch (err) {
      this.log.error(err);
      this.ws.close(1011, 'Internal error');
    }
  }

  private handleError(err: Error) {
    this.log.error(err);
  }

  private handleClose() {
    this.log.info('session close');
  }
}
