import { EventEmitter } from 'events';
import { AzureOpenAI } from 'openai';

import type { FastifyBaseLogger } from 'fastify';
import type { AzureEmbeddingOptions } from '#@/adapters/embedding/azure/azure-llm-options.type';
import type { EmbeddingAdapter, VectorMessage } from '#@/adapters/embedding/embedding.adapter.type';

export class AzureEmbeddingAdapter extends EventEmitter implements EmbeddingAdapter {
  private log: FastifyBaseLogger;

  private embeddingConfig: AzureOpenAI;

  constructor(
    parentLogger: FastifyBaseLogger,
    private readonly opts: AzureEmbeddingOptions,
  ) {
    super();
    this.log = parentLogger.child({ adapter: 'azure-embedding' });
    this.embeddingConfig = new AzureOpenAI(this.opts.client);
  }

  processEmbedding(vectorMessage: VectorMessage): void {
    this.execute(vectorMessage).catch((err: Error) => {
      this.log.error({ err }, err.message);
      this.emit('error');
    });
  }

  private async execute(vectorMessage: VectorMessage): Promise<void> {
    const { text } = vectorMessage;
    const response = await this.embeddingConfig.embeddings.create({
      input: [text],
      model: this.opts.request.model,
    });

    if (response.data.length !== 1) {
      throw new Error('Invalid embedding count');
    }

    const vector = response.data[0].embedding;
    this.emit('vector', { ...vectorMessage, vector });
  }
}
