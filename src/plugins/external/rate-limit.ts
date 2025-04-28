import fastifyRateLimit from '@fastify/rate-limit';

import type { FastifyInstance } from 'fastify';

export const autoConfig = async (fastify: FastifyInstance) => {
  if (process.env.NODE_ENV === 'development') return;

  await fastify.register(fastifyRateLimit, {
    max: fastify.config.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
  });
};

export default fastifyRateLimit;
