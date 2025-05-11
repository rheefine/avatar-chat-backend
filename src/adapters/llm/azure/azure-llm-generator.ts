import EventEmitter from 'events';
import { AzureOpenAI } from 'openai';
import { OpenAIRealtimeWS } from 'openai/beta/realtime/ws';
import { AzureLlmMessages } from '#@/adapters/llm/azure/azure-llm-messages';
import { AzureLlmOnEvents } from '#@/adapters/llm/azure/azure-llm-events';

import type { FastifyBaseLogger } from 'fastify';
import type { AzureLlmOptions } from '#@/adapters/llm/azure/azure-llm-options.type';
import type {
  ResponseDoneEvent,
  ResponseTextDeltaEvent,
} from '#@/adapters/llm/azure/azure-llm-events';

export class AzureLlmGenerator extends EventEmitter {
  private log: FastifyBaseLogger;

  private llmConfig: AzureOpenAI;

  private generatorWS!: OpenAIRealtimeWS;

  private streamingStatus: boolean = false;

  private cancelingStatus: boolean = false;

  private latestPendingMsgID: string | null = null;

  private activeMsgID: string | null = null;

  private handleSocketOpen = () => {
    this.log.info('LLM Generator Session Start');
    this.generatorWS.send(AzureLlmMessages.buildSessionInit(this.opts.session));
  };

  private handleSocketClose = () => {
    this.log.info('LLM Generator Session Close');
  };

  private handleResponseTextDelta = (e: ResponseTextDeltaEvent) => {
    this.emit('token', this.activeMsgID, e.delta);
  };

  private handleResponseDone = (e: ResponseDoneEvent) => {
    this.streamingStatus = false;
    this.cancelingStatus = false;

    if (e.response.metadata?.id !== this.activeMsgID) {
      this.log.error('LLM Meta ID not match');
      this.emit('error');
      return;
    }
    this.emit('token', this.activeMsgID, '\n');
    const itemID = (e.response.output ?? []).map((item) => item.id);
    this.emit('assistantCreated', this.activeMsgID, itemID);

    if (
      e.response.status === 'cancelled' &&
      this.latestPendingMsgID &&
      this.latestPendingMsgID !== this.activeMsgID
    ) {
      this.createResponse(this.latestPendingMsgID);
      return;
    }
    this.activeMsgID = null;
  };

  private handleError = (e: Error) => {
    this.log.error(`Azure OpenAI Server Error`, e);
    this.emit('error');
  };

  constructor(
    parentLogger: FastifyBaseLogger,
    private opts: AzureLlmOptions,
  ) {
    super();
    this.log = parentLogger.child({ adapter: 'azure-llm' });
    this.llmConfig = new AzureOpenAI(this.opts.client);
  }

  async startStreaming() {
    this.generatorWS = await OpenAIRealtimeWS.azure(this.llmConfig);

    this.generatorWS.socket.on('open', this.handleSocketOpen);
    this.generatorWS.socket.on('error', this.handleError);
    this.generatorWS.socket.on('close', this.handleSocketClose);

    this.generatorWS.on(AzureLlmOnEvents.ResponseTextDelta, this.handleResponseTextDelta);
    this.generatorWS.on(AzureLlmOnEvents.ERROR, this.handleError);
    this.generatorWS.on(AzureLlmOnEvents.ResponseDone, this.handleResponseDone);
  }

  deleteQuery(id: string) {
    this.generatorWS.send(AzureLlmMessages.buildDeleteQuery(id));
  }

  sendUserQuery(query: string, itemID: string) {
    this.generatorWS.send(AzureLlmMessages.buildUserQuery(query, itemID));
  }

  updateSession(relevantQueries: Array<string>) {
    this.generatorWS.send(AzureLlmMessages.buildSessionUpdate(relevantQueries));
  }

  createResponse(msgID: string) {
    this.latestPendingMsgID = msgID;
    if (this.streamingStatus === true) {
      if (this.cancelingStatus === false) {
        this.cancelingStatus = true;
        this.cancelResponse();
      }
      return;
    }
    this.streamingStatus = true;
    this.cancelingStatus = false;
    this.activeMsgID = msgID;
    this.generatorWS.send(AzureLlmMessages.buildResponseCreate(msgID));
  }

  cancelResponse() {
    this.generatorWS.send(AzureLlmMessages.buildResponseCancel());
  }

  stopStreaming() {
    this.generatorWS.close();
    this.generatorWS.socket.off('open', this.handleSocketOpen);
    this.generatorWS.socket.off('error', this.handleError);
    this.generatorWS.socket.off('close', this.handleSocketClose);
    this.generatorWS.off(AzureLlmOnEvents.ResponseTextDelta, this.handleResponseTextDelta);
    this.generatorWS.off(AzureLlmOnEvents.ERROR, this.handleError);
    this.generatorWS.off(AzureLlmOnEvents.ResponseDone, this.handleResponseDone);
  }
}
