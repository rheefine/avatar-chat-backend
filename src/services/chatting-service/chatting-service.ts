import { AudioPipeline } from '#@/services/chatting-service/audio-pipeline/audio-pipeline';
import { CHATTING_LOG_CONTEXT } from '#@/constants/log-context';
import { CHATTING_LOG_MESSAGES } from '#@/constants/log-message';
import { WS_STATUS } from '#@/constants/ws-status';
import { WEBSOCKET_EVENT } from '#@/constants/event';

import type { FastifyBaseLogger } from 'fastify';
import type { WebSocket } from 'ws';

export class ChattingService {
  private log: FastifyBaseLogger;

  private audioPipeline: AudioPipeline;

  constructor(
    private readonly socket: WebSocket,
    parentLogger: FastifyBaseLogger,
  ) {
    this.log = parentLogger.child({ service: CHATTING_LOG_CONTEXT.SERVICE });
    this.audioPipeline = new AudioPipeline(this.log);
  }

  async startSession() {
    await this.audioPipeline.start();
    this.log.info(CHATTING_LOG_MESSAGES.SESSION.START);
    this.socket.on(WEBSOCKET_EVENT.MESSAGE, (data) => this.handleMessage(data));
    this.socket.on(WEBSOCKET_EVENT.ERROR, (err) => this.handleError(err));
    this.socket.on(WEBSOCKET_EVENT.CLOSE, () => this.handleClose());
  }

  private async handleMessage(data: WebSocket.Data) {
    try {
      if (Buffer.isBuffer(data)) {
        await this.audioPipeline.handleAudioBuffer(data);
      } else {
        this.log.warn(CHATTING_LOG_MESSAGES.ERROR.UNEXPECTED_DATA_TYPE(typeof data));
      }
    } catch (err) {
      this.log.error(err);
      this.socket.close(WS_STATUS.INTERNAL.CODE, WS_STATUS.INTERNAL.MESSAGE);
    }
  }

  private async handleError(err: Error) {
    await this.audioPipeline.stop();
    this.log.error(err);
  }

  private async handleClose() {
    await this.audioPipeline.stop();
    this.log.info(CHATTING_LOG_MESSAGES.SESSION.CLOSE);
  }
}
