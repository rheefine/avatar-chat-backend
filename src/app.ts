import path from 'node:path';
import fastifyAutoload from '@fastify/autoload';
import redisPlugin from '#@/plugins/redis-plugin';
import messageRepoPlugin from '#@/plugins/message-repo';

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

export const options = {
  ajv: {
    customOptions: {
      coerceTypes: 'array',
      removeAdditional: 'all',
    },
  },
};

export default async function serviceApp(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  delete opts.skipOverride;

  await fastify.register(redisPlugin, {
    url: 'redis://default:1213@localhost:6379',
    vectorDim: 1536,
  });

  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'plugins/external'),
    options: { ...opts },
  });

  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'plugins/app'),
    options: { ...opts },
  });
  await fastify.register(messageRepoPlugin);

  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'routes'),
    dirNameRoutePrefix: (parent, name) => {
      return name === 'http' || name === 'ws' ? false : name;
    },
    autoHooks: true,
    cascadeHooks: true,
    options: { ...opts },
  });
}
