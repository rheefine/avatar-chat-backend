import { Type } from '@sinclair/typebox';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get<{ Params: { sessionID: string } }>(
    '/:sessionID',
    {
      schema: {
        params: Type.Object({ sessionID: Type.String() }),
        response: {
          200: Type.Array(
            Type.Object({
              role: Type.String(),
              text: Type.String(),
              createdAt: Type.String(),
            }),
          ),
        },
      },
    },
    async (req) => {
      const { sessionID } = req.params;
      const messages = await fastify.messageRepo.read(sessionID);
      return messages.map(({ role, text, createdAt }) => ({
        role,
        text,
        createdAt: new Date(createdAt).toISOString(),
      }));
    },
  );
};

export default plugin;
