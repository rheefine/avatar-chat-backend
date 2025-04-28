import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get('/', async (req, res) => {
    return res.redirect('/api/docs');
  });
};

export default plugin;
