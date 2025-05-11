import { EventEmitter } from 'events';

export interface VectorMessage {
  id: string;
  sessionID: string;
  role: 'user' | 'assistant';
  text: string;
  round: number;
  createdAt: number;
  vector: Array<number> | undefined;
}

export interface EmbeddingAdapter extends EventEmitter {
  processEmbedding(vectorMessage: VectorMessage): void;

  on(event: 'vector', listener: (res: VectorMessage) => void): this;

  on(event: 'error', listener: () => void): this;
}
