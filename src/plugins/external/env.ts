import env from '@fastify/env';

declare module 'fastify' {
  export interface FastifyInstance {
    config: {
      PORT: number;
      RATE_LIMIT_MAX: number;
    };
  }
}

const schema = {
  type: 'object',
  required: [],
  properties: {
    RATE_LIMIT_MAX: {
      type: 'number',
      default: 100,
    },
  },
};

export const autoConfig = {
  confKey: 'config',
  schema,
  dotenv: true,
  data: process.env,
};

export default env;
