import path from 'node:path';
import fastifyAutoload from '@fastify/autoload';

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

  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'plugins/external'),
    options: { ...opts },
  });

  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'plugins/app'),
    options: { ...opts },
  });

  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'routes'),
    autoHooks: true,
    cascadeHooks: true,
    options: { ...opts },
  });
}
