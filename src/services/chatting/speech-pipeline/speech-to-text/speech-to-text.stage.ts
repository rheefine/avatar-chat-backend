import { EventEmitter } from 'events';
import { STAGE_EVENT, STT_EVENT } from '#@/constants/event';
import { CHATTING_LOG_CONTEXT } from '#@/constants/log-context';

import type { FastifyBaseLogger } from 'fastify';
import type { Stage } from '#@/services/chatting/speech-pipeline/stage.type';
import type { Transcription, SttAdapter } from '#@/adapters/stt/stt.adapter.type';
import type { SpeechDetected } from '#@/schemas/ws/index';
import type { AudioChunk, Transcript } from '#@/services/chatting/speech-pipeline/stage.dto';

export class SpeechToTextStage extends EventEmitter implements Stage<Buffer, string> {
  private log: FastifyBaseLogger;

  private handleTranscription = (transcription: Transcription): void => {
    const transcript: Transcript = transcription.text;
    this.emit(STAGE_EVENT.DATA, transcript);
  };

  private handleSpeechDetected = (): void => {
    const speechDetected: SpeechDetected = { type: 'speech_detected' };
    this.emit(STAGE_EVENT.DETECTED, speechDetected);
  };

  private handlePortError = (): void => {
    this.emit(STAGE_EVENT.ERROR);
  };

  constructor(
    parentLogger: FastifyBaseLogger,
    private readonly sttPort: SttAdapter,
  ) {
    super();
    this.log = parentLogger.child({ stage: CHATTING_LOG_CONTEXT.STT_STAGE });

    this.sttPort.on(STT_EVENT.TRANSCRIPTION, this.handleTranscription);
    this.sttPort.on(STT_EVENT.SPEECH_STARTED, this.handleSpeechDetected);
    this.sttPort.on(STT_EVENT.ERROR, this.handlePortError);
    this.log.silent('');
  }

  async process(buffer: AudioChunk): Promise<void> {
    await this.sttPort.processAudioChunk(buffer);
  }

  async start(): Promise<void> {
    await this.sttPort.startContinuousRecognition();
  }

  async stop(): Promise<void> {
    await this.sttPort.stopContinuousRecognition();
    this.sttPort.off(STT_EVENT.TRANSCRIPTION, this.handleTranscription);
    this.sttPort.off(STT_EVENT.SPEECH_STARTED, this.handleSpeechDetected);
    this.sttPort.off(STT_EVENT.ERROR, this.handlePortError);
  }
}
