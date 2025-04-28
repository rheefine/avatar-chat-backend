import type { FastifyPluginAsync } from 'fastify';

const notFoundHandler: FastifyPluginAsync = async (fastify) => {
  fastify.setNotFoundHandler(
    {
      preHandler: fastify.rateLimit({
        max: 3,
        timeWindow: 500,
      }),
    },
    (request, reply) => {
      request.log.warn(
        {
          request: {
            method: request.method,
            url: request.url,
            query: request.query,
            params: request.params,
          },
        },
        'Resource not found',
      );

      reply.code(404);
      return { message: 'Not Found' };
    },
  );
};

export default notFoundHandler;
