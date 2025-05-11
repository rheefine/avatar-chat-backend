import { ChattingService } from '#@/services/chatting/chatting.service';
import { Orchestrator } from '#@/services/chatting/speech-pipeline/orchestrator';
import { AzureSttAdapter } from '#@/adapters/stt/azure/azure-stt.adapter';
import { AzureLlmAdapter } from '#@/adapters/llm/azure/azure-llm.adapter';
import { AzureEmbeddingAdapter } from '#@/adapters/embedding/azure/azure-embedding.adapter';
import { AwsTtsAdapter } from '#@/adapters/tts/aws/aws-tts.adapter';
import { CHATTING_LOG_CONTEXT } from '#@/constants/log-context';

import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import type { MessageRepository } from '#@/repositories/message.repository';

type AppConfig = FastifyInstance['config'];

export class ChattingFactory {
  static create(
    parentLogger: FastifyBaseLogger,
    sessionID: string,
    socket: WebSocket,
    config: AppConfig,
    messageRepo: MessageRepository,
  ): ChattingService {
    const sttAdapter = this.createSttAdapter(parentLogger, config);
    const LlmAdapter = this.createLlmAdatper(parentLogger, config);
    const EmbeddingAdapter = this.createEmbeddingAdatper(parentLogger, config);
    const ttsAdapter = this.createTtsAdapter(parentLogger, config);

    const log = parentLogger.child({ service: CHATTING_LOG_CONTEXT.SERVICE });
    const orchestrator = new Orchestrator(log, sessionID, {
      sttPort: sttAdapter,
      llmPort: LlmAdapter,
      embeddingPort: EmbeddingAdapter,
      ttsPort: ttsAdapter,
      messageRepo,
    });

    return new ChattingService(log, sessionID, socket, orchestrator);
  }

  private static createSttAdapter(parentLogger: FastifyBaseLogger, config: AppConfig) {
    return new AzureSttAdapter(parentLogger, {
      subscriptionKey: config.AZURE_SPEECH_KEY,
      region: config.AZURE_SPEECH_REGION,
      language: 'ko-kr',
      endSilenceTimeoutMs: 1500,
    });
  }

  private static createLlmAdatper(parentLogger: FastifyBaseLogger, config: AppConfig) {
    return new AzureLlmAdapter(parentLogger, {
      client: {
        endpoint: config.AZURE_OPENAI_LLM_ENDPOINT,
        apiKey: config.AZURE_OPENAI_KEY,
        deployment: 'gpt-4o-mini-realtime-preview',
        apiVersion: '2024-10-01-preview',
      },
      session: {
        model: 'gpt-4o-mini-realtime-preview',
        modalities: ['text'],
      },
    });
  }

  private static createEmbeddingAdatper(parentLogger: FastifyBaseLogger, config: AppConfig) {
    return new AzureEmbeddingAdapter(parentLogger, {
      client: {
        endpoint: config.AZURE_OPENAI_EMBEDDING_ENDPOINT,
        apiKey: config.AZURE_OPENAI_KEY,
        deployment: 'text-embedding-3-small',
        apiVersion: '2024-04-01-preview',
      },
      request: {
        model: 'text-embedding-3-small',
      },
    });
  }

  private static createTtsAdapter(parentLogger: FastifyBaseLogger, config: AppConfig) {
    return new AwsTtsAdapter(parentLogger, {
      client: {
        region: config.AWS_POLLY_REGION,
        credentials: {
          accessKeyId: config.AWS_POLLY_KEY,
          secretAccessKey: config.AWS_POLLY_SECRET,
        },
      },
      audio: {
        OutputFormat: 'pcm',
        VoiceId: 'Seoyeon',
        Engine: 'neural',
      },
      viseme: {
        OutputFormat: 'json',
        VoiceId: 'Seoyeon',
        Engine: 'neural',
        SpeechMarkTypes: ['viseme'],
      },
    });
  }
}
