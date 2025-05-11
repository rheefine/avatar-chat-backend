import { EventEmitter } from 'events';
import { randomUUID32 } from '#@/utils/random-uuid-32';

import type { FastifyBaseLogger } from 'fastify';
import type { Stage } from '#@/services/chatting/speech-pipeline/stage.type';
import type { ChatMessage, LlmAdapter } from '#@/adapters/llm/llm.adapter.type';
import type { VectorMessage, EmbeddingAdapter } from '#@/adapters/embedding/embedding.adapter.type';
import type { MessageRepository } from '#@/repositories/message.repository';
import type { Transcript, Sequence } from '#@/services/chatting/speech-pipeline/stage.dto';

export class ContextRagStage extends EventEmitter implements Stage<string, string> {
  private log: FastifyBaseLogger;

  private contextWindow: Array<ChatMessage> = [];

  private contextSnapshots = new Map<string, ChatMessage[]>();

  private round: number = 0;

  private buffers = new Map<string, string[]>();

  private handleVector = async (vectorMessage: VectorMessage) => {
    this.log.debug(`Vector Array Length: ${vectorMessage.vector?.length}(${vectorMessage.role})`);
    await this.repo.create(vectorMessage);
    this.log.debug(`Redis Created Message ID: ${vectorMessage.id}(${vectorMessage.role})`);
    if (vectorMessage.role !== 'user') {
      return;
    }
    const snapshot = this.contextSnapshots.get(vectorMessage.id) ?? [];
    this.contextSnapshots.delete(vectorMessage.id);
    const assistantMessage: ChatMessage = {
      id: randomUUID32(),
      sessionID: vectorMessage.sessionID,
      round: vectorMessage.round,
      role: 'assistant',
      text: '',
      createdAt: undefined,
    };
    try {
      let relevant: string[] = [];
      if (snapshot.length >= this.windowSize) {
        const oldestRound = Math.min(...snapshot.map((m) => m.round));
        relevant = (
          await this.repo.knnSearch(vectorMessage.vector!, oldestRound, vectorMessage.sessionID, 3)
        ).map((r, idx) => {
          const num = idx + 1;
          const msg = `${num}. (${r.entry.role}) ${r.entry.text}`;
          this.log.debug(`Relevant Message: ${msg}, Score: ${r.score}`);
          return msg;
        });
      }
      this.llmPort.createResponse(assistantMessage, relevant);
    } catch (err) {
      this.log.error(err);
      this.emit('error');
    }
  };

  private handleSequence = (chatMessage: ChatMessage) => {
    if (!this.buffers.has(chatMessage.id)) this.buffers.set(chatMessage.id, []);
    this.buffers.get(chatMessage.id)!.push(chatMessage.text);
    const sequence: Sequence = {
      idx: this.buffers.get(chatMessage.id)!.length,
      text: chatMessage.text,
    };
    this.emit('data', sequence);
  };

  private handleDone = (chatMessage: ChatMessage) => {
    const full = (this.buffers.get(chatMessage.id) ?? []).join('');

    const completedChatMessage = { ...chatMessage, text: full, createdAt: Date.now() };
    this.pushMessage(completedChatMessage);
    this.embeddingPort.processEmbedding({ ...completedChatMessage, vector: undefined });

    this.buffers.delete(chatMessage.id);
    if (this.contextSnapshots.has(chatMessage.id)) {
      this.contextSnapshots.delete(chatMessage.id);
    }
  };

  private handlePortError = () => {
    this.emit('error');
  };

  constructor(
    parentLogger: FastifyBaseLogger,
    private readonly llmPort: LlmAdapter,
    private readonly embeddingPort: EmbeddingAdapter,
    private readonly repo: MessageRepository,
    private readonly windowSize: number,
    private readonly sessionID: string,
  ) {
    super();
    this.log = parentLogger.child({ stage: 'rag' });

    this.embeddingPort.on('vector', this.handleVector);
    this.llmPort.on('sequence', this.handleSequence);
    this.llmPort.on('done', this.handleDone);
    this.llmPort.on('error', this.handlePortError);
  }

  async process(text: Transcript): Promise<void> {
    this.round += 1;
    const userMessage: ChatMessage = {
      id: randomUUID32(),
      sessionID: this.sessionID,
      round: this.round,
      role: 'user',
      text,
      createdAt: Date.now(),
    };
    this.llmPort.processPrevContext(this.contextWindow);
    this.contextSnapshots.set(userMessage.id, [...this.contextWindow]);
    this.llmPort.processNewQuery(userMessage);
    this.pushMessage(userMessage);
    this.embeddingPort.processEmbedding({
      ...userMessage,
      createdAt: userMessage.createdAt ?? Date.now(),
      vector: undefined,
    });
  }

  async start(): Promise<void> {
    await this.llmPort.startGenerator();
  }

  async stop(): Promise<void> {
    this.llmPort.stopGenerator();
    this.embeddingPort.off('vector', this.handleVector);
    this.llmPort.off('sequence', this.handleSequence);
    this.llmPort.off('done', this.handleDone);
    this.llmPort.off('error', this.handlePortError);
  }

  private pushMessage(message: ChatMessage): void {
    this.contextWindow.push(message);

    while (this.contextWindow.length > this.windowSize) {
      const oldestRound = Math.min(...this.contextWindow.map((m) => m.round));
      let idx = this.contextWindow.findIndex(
        (m) => m.round === oldestRound && m.role === 'assistant',
      );
      if (idx < 0) {
        idx = this.contextWindow.findIndex((m) => m.round === oldestRound && m.role === 'user');
      }
      if (idx >= 0) this.contextWindow.splice(idx, 1);
    }
  }
}
