import fp from 'fastify-plugin';
import { MessageRepository } from '#@/repositories/message.repository';

import type { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  export interface FastifyInstance {
    messageRepo: MessageRepository;
  }
}

const messageRepoPlugin: FastifyPluginAsync = async (fastify) => {
  const repo = new MessageRepository(fastify.redis, 1536);

  fastify.decorate<MessageRepository>('messageRepo', repo);

  fastify.log.info('✔ messageRepo plugin initialized');
};

export default fp(messageRepoPlugin, { name: 'message-repo-plugin' });
