import { ChattingService } from '#@/services/chatting/chatting.service';
import { Orchestrator } from '#@/services/chatting/speech-pipeline/orchestrator';
import { AzureSttAdapter } from '#@/adapters/stt/azure/azure-stt.adapter';
import { CHATTING_LOG_CONTEXT } from '#@/constants/log-context';

import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';

type AppConfig = FastifyInstance['config'];

export class ChattingFactory {
  static create(
    parentLogger: FastifyBaseLogger,
    socket: WebSocket,
    config: AppConfig,
  ): ChattingService {
    const sttAdapter = this.createSttAdapter(parentLogger, config);

    const log = parentLogger.child({ service: CHATTING_LOG_CONTEXT.SERVICE });
    const orchestrator = new Orchestrator(log, {
      sttPort: sttAdapter,
    });

    return new ChattingService(log, socket, orchestrator);
  }

  private static createSttAdapter(parentLogger: FastifyBaseLogger, config: AppConfig) {
    return new AzureSttAdapter(parentLogger, {
      subscriptionKey: config.AZURE_SPEECH_KEY,
      region: config.AZURE_SPEECH_REGION,
      language: 'ko-kr',
      endSilenceTimeoutMs: 1500,
    });
  }
}
