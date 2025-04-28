import type { FastifyPluginAsync } from 'fastify';

const errorHandler: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((err, request, reply) => {
    fastify.log.error(
      {
        err,
        request: {
          method: request.method,
          url: request.url,
          query: request.query,
          params: request.params,
        },
      },
      'Unhandled error occurred',
    );

    reply.code(err.statusCode ?? 500);
    const message = err.statusCode && err.statusCode < 500 ? err.message : 'Internal Server Error';
    return { message };
  });
};

export default errorHandler;
