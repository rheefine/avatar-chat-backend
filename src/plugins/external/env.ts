import env from '@fastify/env';
import fp from 'fastify-plugin';

declare module 'fastify' {
  export interface FastifyInstance {
    config: {
      PORT: number;
      RATE_LIMIT_MAX: number;
      AZURE_SPEECH_KEY: string;
      AZURE_SPEECH_REGION: string;
    };
  }
}

const schema = {
  type: 'object',
  required: ['AZURE_SPEECH_KEY'],
  properties: {
    AZURE_SPEECH_KEY: {
      type: 'string',
    },
    AZURE_SPEECH_REGION: {
      type: 'string',
      default: 'koreacentral',
    },
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

export default fp(env, {
  name: 'config',
});
