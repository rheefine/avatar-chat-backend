import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { createClient } from 'redis';

type Redis = ReturnType<typeof createClient>;

declare module 'fastify' {
  export interface FastifyInstance {
    redis: Redis;
  }
}

interface RedisPluginOptions {
  url: string;
  vectorDim: number;
}

const redisCore: FastifyPluginAsync<RedisPluginOptions> = async (fastify, opts) => {
  const client = createClient({ url: opts.url });
  await client.connect();
  const dim = Number(opts.vectorDim);
  fastify.decorate<Redis>('redis', client);

  const idx = 'messageIdx';
  try {
    await client.ft.dropIndex('messageIdx', { DD: true });
  } catch {
    fastify.log.info('messageIdx not resist');
  }
  await client.ft.create(
    idx,
    {
      sessionID: { type: 'TAG' },
      role: { type: 'TAG' },
      text: { type: 'TEXT' },
      round: { type: 'NUMERIC' },
      createdAt: { type: 'NUMERIC' },
      vector: {
        type: 'VECTOR',
        ALGORITHM: 'HNSW',
        TYPE: 'FLOAT32',
        DIM: dim,
        DISTANCE_METRIC: 'COSINE',
        INITIAL_CAP: 1_000,
        M: 16,
        EF_CONSTRUCTION: 200,
      },
    },
    { ON: 'HASH', PREFIX: 'message:' },
  );
  fastify.log.info('✔ messageIdx created');

  fastify.addHook('onClose', async (app) => {
    await app.redis.quit().catch(() => {});
  });
};

export default fp(redisCore, { name: 'redis-plugin' });
