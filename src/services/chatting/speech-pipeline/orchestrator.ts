import { EventEmitter } from 'events';
import { AudioPreprocessStage } from '#@/services/chatting/speech-pipeline/audio-preprocess/audio-preprocess.stage';
import { SpeechToTextStage } from '#@/services/chatting/speech-pipeline/speech-to-text/speech-to-text.stage';
import { ContextRagStage } from '#@/services/chatting/speech-pipeline/context-rag/context-rag.stage';
import { CHATTING_LOG_CONTEXT } from '#@/constants/log-context';
import { STAGE_EVENT } from '#@/constants/event';
import { CHATTING_LOG_MESSAGES } from '#@/constants/log-message';
import { TextToSpeechStage } from '#@/services/chatting/speech-pipeline/text-to-speech/text-to-speech.adapter';

import type { FastifyBaseLogger } from 'fastify';
import type { SttAdapter } from '#@/adapters/stt/stt.adapter.type';
import type { LlmAdapter } from '#@/adapters/llm/llm.adapter.type';
import type { EmbeddingAdapter } from '#@/adapters/embedding/embedding.adapter.type';
import type { TtsAdapter } from '#@/adapters/tts/tts.adapter.type';
import type { MessageRepository } from '#@/repositories/message.repository';
import type { AudioFromClient, AudioToClient, WsMessage, ServiceError } from '#@/schemas/ws/index';
import type {
  AudioChunk,
  Transcript,
  Sequence,
} from '#@/services/chatting/speech-pipeline/stage.dto';

export class Orchestrator extends EventEmitter {
  private log: FastifyBaseLogger;

  private preprocessStage: AudioPreprocessStage;

  private speechToTextStage: SpeechToTextStage;

  private contextRagStage: ContextRagStage;

  private textToSpeechStage: TextToSpeechStage;

  private isClientSpeeching: boolean = false;

  private onAudioReady = async (data: AudioChunk): Promise<void> => {
    this.log.trace(CHATTING_LOG_MESSAGES.PREPROCESS.CHUNK_READY(data.length));
    await this.speechToTextStage.process(data);
  };

  private onSttTranscribed = async (data: Transcript): Promise<void> => {
    this.isClientSpeeching = false;
    this.log.debug(CHATTING_LOG_MESSAGES.STT.TRANSCRIPTION(data));
    await this.contextRagStage.process(data);
  };

  private onResponseGenerated = async (data: Sequence): Promise<void> => {
    if (this.isClientSpeeching === false) {
      this.log.debug(`Assitant Sequence: ${data.idx} ${data.text}`);
      await this.textToSpeechStage.process(data);
    }
  };

  private onSpeechDetected = async (data: WsMessage): Promise<void> => {
    this.isClientSpeeching = true;
    this.log.debug(CHATTING_LOG_MESSAGES.STT.DETECTED);
    this.emit('message', JSON.stringify(data));
  };

  private onSpeechSynthesized = async (data: AudioToClient): Promise<void> => {
    this.log.debug(`Audio BUffer Send: ${data.length}B`);
    if (this.isClientSpeeching === false) {
      this.emit('audio', data);
    }
  };

  private onMessagePrepared = async (data: WsMessage): Promise<void> => {
    if (data.type === 'viseme' && data.id === 1) {
      this.log.debug(`First Viseme Data Send: {type : viseme} ${data.value}`);
    }
    this.emit('message', JSON.stringify(data));
  };

  private onStageError = () => {
    const serviceError: ServiceError = { type: 'service_error' };
    this.emit('error', JSON.stringify(serviceError));
  };

  constructor(
    parentLogger: FastifyBaseLogger,
    sessionID: string,
    ports: {
      sttPort: SttAdapter;
      llmPort: LlmAdapter;
      embeddingPort: EmbeddingAdapter;
      ttsPort: TtsAdapter;
      messageRepo: MessageRepository;
    },
  ) {
    super();
    this.log = parentLogger.child({ pipeline: CHATTING_LOG_CONTEXT.SPEECH_PIPELINE });
    this.preprocessStage = new AudioPreprocessStage(this.log);
    this.speechToTextStage = new SpeechToTextStage(this.log, ports.sttPort);
    this.contextRagStage = new ContextRagStage(
      this.log,
      ports.llmPort,
      ports.embeddingPort,
      ports.messageRepo,
      1,
      sessionID,
    );
    this.textToSpeechStage = new TextToSpeechStage(this.log, ports.ttsPort);
    this.preprocessStage.on(STAGE_EVENT.DATA, this.onAudioReady);
    this.speechToTextStage.on(STAGE_EVENT.DATA, this.onSttTranscribed);
    this.speechToTextStage.on(STAGE_EVENT.DETECTED, this.onSpeechDetected);
    this.speechToTextStage.on(STAGE_EVENT.ERROR, this.onStageError);
    this.contextRagStage.on(STAGE_EVENT.DATA, this.onResponseGenerated);
    this.contextRagStage.on(STAGE_EVENT.ERROR, this.onResponseGenerated);
    this.textToSpeechStage.on('message', this.onMessagePrepared);
    this.textToSpeechStage.on('audio', this.onSpeechSynthesized);
    this.textToSpeechStage.on(STAGE_EVENT.ERROR, this.onStageError);
  }

  async start(): Promise<void> {
    await this.speechToTextStage.start();
    await this.contextRagStage.start();
  }

  async handleAudioBuffer(buffer: AudioFromClient): Promise<void> {
    await this.preprocessStage.process(buffer);
  }

  async stop() {
    await this.speechToTextStage.stop();
    await this.contextRagStage.stop();
    this.preprocessStage.off(STAGE_EVENT.DATA, this.onAudioReady);
    this.speechToTextStage.off(STAGE_EVENT.DATA, this.onSttTranscribed);
    this.speechToTextStage.off(STAGE_EVENT.DETECTED, this.onSpeechDetected);
    this.speechToTextStage.off(STAGE_EVENT.ERROR, this.onStageError);
    this.contextRagStage.off(STAGE_EVENT.DATA, this.onResponseGenerated);
    this.contextRagStage.off(STAGE_EVENT.ERROR, this.onResponseGenerated);
    this.textToSpeechStage.off('message', this.onMessagePrepared);
    this.textToSpeechStage.off('audio', this.onSpeechSynthesized);
    this.textToSpeechStage.on(STAGE_EVENT.ERROR, this.onStageError);
  }
}
