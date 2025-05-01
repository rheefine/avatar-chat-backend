import fp from 'fastify-plugin';

export default fp(async function azureSttPlugin(fastify) {
  const { AZURE_SPEECH_KEY, AZURE_SPEECH_REGION } = process.env;

  try {
    const res = await fetch(
      `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': String(AZURE_SPEECH_KEY) },
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Azure Speech pre-flight failed (${res.status}): ${body}`);
    }

    fastify.log.info('✔ Azure Speech token pre-flight succeeded');
  } catch (err) {
    fastify.log.error(err, '✖ Azure Speech token pre-flight failed');
    throw err;
  }
});
