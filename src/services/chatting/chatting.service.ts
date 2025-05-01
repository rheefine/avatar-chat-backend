import { Orchestrator } from '#@/services/chatting/speech-pipeline/orchestrator';
import { CHATTING_LOG_MESSAGES } from '#@/constants/log-message';
import { WS_STATUS } from '#@/constants/ws-status';
import { WEBSOCKET_EVENT } from '#@/constants/event';

import type { FastifyBaseLogger } from 'fastify';
import type { WebSocket } from 'ws';

export class ChattingService {
  private handleMessage = async (data: WebSocket.Data) => {
    try {
      if (Buffer.isBuffer(data)) {
        await this.orchestrator.handleAudioBuffer(data);
      } else {
        this.log.warn(CHATTING_LOG_MESSAGES.ERROR.UNEXPECTED_DATA_TYPE(typeof data));
      }
    } catch (err) {
      this.log.error(err);
      this.socket.close(WS_STATUS.INTERNAL.CODE, WS_STATUS.INTERNAL.MESSAGE);
    }
  };

  private handleError = async (err: Error) => {
    await this.orchestrator.stop();
    this.log.error(err);
  };

  private handleClose = async () => {
    await this.orchestrator.stop();
    this.log.info(CHATTING_LOG_MESSAGES.SESSION.CLOSE);
    this.socket.off(WEBSOCKET_EVENT.MESSAGE, this.handleMessage);
    this.socket.off(WEBSOCKET_EVENT.ERROR, this.handleError);
    this.socket.off(WEBSOCKET_EVENT.CLOSE, this.handleClose);
  };

  constructor(
    private readonly log: FastifyBaseLogger,
    private readonly socket: WebSocket,
    private readonly orchestrator: Orchestrator,
  ) {}

  async startSession() {
    await this.orchestrator.start();
    this.log.info(CHATTING_LOG_MESSAGES.SESSION.START);
    this.socket.on(WEBSOCKET_EVENT.MESSAGE, (data) => this.handleMessage(data));
    this.socket.on(WEBSOCKET_EVENT.ERROR, (err) => this.handleError(err));
    this.socket.on(WEBSOCKET_EVENT.CLOSE, () => this.handleClose());
  }
}
