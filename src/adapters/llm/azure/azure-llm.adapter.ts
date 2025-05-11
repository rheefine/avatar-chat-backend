import EventEmitter from 'events';
import { AzureLlmGenerator } from '#@/adapters/llm/azure/azure-llm-generator';

import type { FastifyBaseLogger } from 'fastify';
import type { AzureLlmOptions } from '#@/adapters/llm/azure/azure-llm-options.type';
import type { ChatMessage } from '#@/adapters/llm/llm.adapter.type';

export class AzureLlmAdapter extends EventEmitter {
  private log: FastifyBaseLogger;

  private generator: AzureLlmGenerator;

  private idMap = new Map<string, { message: ChatMessage; itemIDs: string[] | undefined }>();

  private sequence = '';

  private handleToken = (id: string, token: string) => {
    this.sequence += token;
    if (['!', '?', '.', ','].includes(token)) {
      this.emit('sequence', { ...this.idMap.get(id)?.message, text: this.sequence });
      this.sequence = '';
    }
  };

  private handleAssistantCreated = (id: string, itemIDs: string[]) => {
    const entry = this.idMap.get(id);
    if (!entry) {
      this.log.error('ID is not exist in idMap');
      this.emit('error');
      return;
    }
    entry.itemIDs = itemIDs;
    this.emit('done', entry.message);
  };

  private handleError = () => {
    this.emit('error');
  };

  constructor(parentLogger: FastifyBaseLogger, opts: AzureLlmOptions) {
    super();
    this.log = parentLogger.child({ adapter: 'azure-llm' });
    this.generator = new AzureLlmGenerator(this.log, opts);

    this.generator.on('token', this.handleToken);
    this.generator.on('assistantCreated', this.handleAssistantCreated);
    this.generator.on('error', this.handleError);
  }

  async startGenerator() {
    await this.generator.startStreaming();
  }

  stopGenerator() {
    this.generator.stopStreaming();
    this.generator.off('token', this.handleToken);
    this.generator.off('assistantCreated', this.handleAssistantCreated);
    this.generator.off('error', this.handleError);
  }

  processPrevContext(contextWindow: ChatMessage[]): void {
    const validIDs = contextWindow.reduce<Set<string>>((set, { id }) => set.add(id), new Set());

    [...this.idMap.entries()].forEach(([msgID, { itemIDs }]) => {
      if (!validIDs.has(msgID)) {
        (itemIDs ?? []).forEach((itm) => this.generator.deleteQuery(itm));
        this.idMap.delete(msgID);
      }
    });
  }

  processNewQuery(message: ChatMessage): void {
    this.idMap.set(message.id, { message, itemIDs: [message.id] });

    this.generator.sendUserQuery(message.text, message.id);
  }

  createResponse(message: ChatMessage, relevant: string[]): void {
    this.idMap.set(message.id, { message, itemIDs: undefined });
    this.generator.updateSession(relevant);
    this.generator.createResponse(message.id);
  }
}
