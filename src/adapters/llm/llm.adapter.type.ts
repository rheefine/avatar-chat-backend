import { EventEmitter } from 'events';

export interface ChatMessage {
  id: string;
  sessionID: string;
  round: number;
  role: 'user' | 'assistant';
  text: string;
  createdAt?: number;
}

export interface LlmAdapter extends EventEmitter {
  processPrevContext(contextWindow: ChatMessage[]): void;

  processNewQuery(message: ChatMessage): void;

  createResponse(message: ChatMessage, relevant: string[]): void;

  startGenerator(): Promise<void>;

  stopGenerator(): void;

  on(event: 'sequence', listener: (res: ChatMessage) => void): this;

  on(event: 'done', listener: (res: ChatMessage) => void): this;

  on(event: 'error', listener: () => void): this;
}
