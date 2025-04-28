import fastifyWebsocket from '@fastify/websocket';
import { ChattingService } from '#@/services/chatting-service/chatting-service';
import { WS_STATUS } from '#@/constants/ws-status';

import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';

const plugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyWebsocket);

  fastify.get('/', { websocket: true }, async (socket: WebSocket, req: FastifyRequest) => {
    try {
      const chattingService = new ChattingService(socket, req.log);
      chattingService.startSession();
    } catch (err) {
      fastify.log.error(err);
      socket.close(WS_STATUS.INTERNAL.CODE, WS_STATUS.INTERNAL.MESSAGE);
    }
  });
};

export default plugin;
