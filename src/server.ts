import Fastify from 'fastify';
import fp from 'fastify-plugin';
import closeWithGrace from 'close-with-grace';
import serviceApp from '#@/app';

function getLoggerOptions() {
  if (process.stdout.isTTY) {
    return {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    };
  }

  return { level: process.env.LOG_LEVEL ?? 'silent' };
}

const app = Fastify({
  logger: getLoggerOptions(),
  ajv: {
    customOptions: {
      coerceTypes: 'array',
      removeAdditional: 'all',
    },
  },
});

async function init() {
  await app.register(fp(serviceApp));

  closeWithGrace(
    { delay: process.env.FASTIFY_CLOSE_GRACE_DELAY ?? 500 },
    async ({ err }: { err?: Error }) => {
      if (err != null) {
        app.log.error(err);
      }

      await app.close();
    },
  );

  await app.ready();

  try {
    await app.listen({ port: process.env.PORT ?? 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

init();
