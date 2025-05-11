import { AzureClientOptions } from 'openai';
import type { EmbeddingModel } from 'openai/resources/embeddings';

export interface AzureEmbeddingClientOptions
  extends Pick<Required<AzureClientOptions>, 'apiKey' | 'apiVersion' | 'endpoint' | 'deployment'> {}

export interface AzureEmbeddingRequestOptions {
  model: EmbeddingModel;
}

export interface AzureEmbeddingOptions {
  client: AzureEmbeddingClientOptions;
  request: AzureEmbeddingRequestOptions;
}
