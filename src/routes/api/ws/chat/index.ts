import fastifyWebsocket from '@fastify/websocket';
import { ChattingFactory } from '#@/services/chatting/chatting.factory';
import { WS_STATUS } from '#@/constants/ws-status';
import { randomUUID32 } from '#@/utils/random-uuid-32';

import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';

const plugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyWebsocket);

  fastify.get('/', { websocket: true }, async (socket: WebSocket, req: FastifyRequest) => {
    try {
      fastify.log.info(fastify.messageRepo);
      const sessionID = randomUUID32();
      const chattingService = ChattingFactory.create(
        req.log,
        sessionID,
        socket,
        fastify.config,
        fastify.messageRepo,
      );

      await chattingService.startSession();
    } catch (err) {
      fastify.log.error(err);
      socket.close(WS_STATUS.INTERNAL.CODE, WS_STATUS.INTERNAL.MESSAGE);
    }
  });
};

export default plugin;
