import cors from '@fastify/cors';

import type { FastifyCorsOptions } from '@fastify/cors';

export const autoConfig: FastifyCorsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

export default cors;
