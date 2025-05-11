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
    this.log.error(err);
    await this.handleClose();
  };

  private handleClose = async () => {
    await this.orchestrator.stop();
    this.orchestrator.off('audio', this.sendAudio);
    this.orchestrator.off('message', this.sendMessage);
    this.orchestrator.off('error', this.sendError);
    this.socket.off(WEBSOCKET_EVENT.MESSAGE, this.handleMessage);
    this.socket.off(WEBSOCKET_EVENT.ERROR, this.handleError);
    this.socket.off(WEBSOCKET_EVENT.CLOSE, this.handleClose);
    this.log.info(CHATTING_LOG_MESSAGES.SESSION.CLOSE);
  };

  private sendAudio = async (data: WebSocket.Data) => {
    this.socket.send(data);
  };

  private sendMessage = async (data: WebSocket.Data) => {
    this.socket.send(data, { binary: false });
  };

  private sendError = async (data: WebSocket.Data) => {
    this.socket.send(data, { binary: false });
    this.socket.close(WS_STATUS.INTERNAL.CODE, WS_STATUS.INTERNAL.MESSAGE);
  };

  constructor(
    private readonly log: FastifyBaseLogger,
    private readonly sessionID: string,
    private readonly socket: WebSocket,
    private readonly orchestrator: Orchestrator,
  ) {
    this.socket.send(JSON.stringify({ type: 'session_id', id: this.sessionID }), { binary: false });
  }

  async startSession() {
    this.orchestrator.on('audio', this.sendAudio);
    this.orchestrator.on('message', this.sendMessage);
    this.orchestrator.on('error', this.sendError);
    await this.orchestrator.start();
    this.log.info(CHATTING_LOG_MESSAGES.SESSION.START);
    this.socket.on(WEBSOCKET_EVENT.MESSAGE, this.handleMessage);
    this.socket.on(WEBSOCKET_EVENT.ERROR, this.handleError);
    this.socket.on(WEBSOCKET_EVENT.CLOSE, this.handleClose);
  }
}
