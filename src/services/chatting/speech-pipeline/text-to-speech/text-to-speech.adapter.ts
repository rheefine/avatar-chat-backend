import { EventEmitter } from 'events';

import type { FastifyBaseLogger } from 'fastify';
import type { TtsAdapter, TtsAudio, TtsViseme } from '#@/adapters/tts/tts.adapter.type';
import type { End, UtteranceStart, Viseme, AudioToClient } from '#@/schemas/ws/index';
import type { Sequence } from '#@/services/chatting/speech-pipeline/stage.dto';

export class TextToSpeechStage extends EventEmitter {
  private log: FastifyBaseLogger;

  private sentenceQueue: Array<{ text: string; idx: number }> = [];

  private currentPromises: { audio: Promise<any>; viseme: Promise<any> } | null = null;

  private nextPromises: { audio: Promise<any>; viseme: Promise<any> } | null = null;

  private isProcessing = false;

  private handleTtsAudio = (ttsAudio: TtsAudio) => {
    this.emit('audio', ttsAudio as AudioToClient);
  };

  private handleTtsViseme = (ttsVisme: TtsViseme) => {
    this.emit('message', ttsVisme as Viseme);
  };

  private handlePortError = (): void => {
    this.emit('error');
  };

  constructor(
    parentLogger: FastifyBaseLogger,
    private readonly ttsPort: TtsAdapter,
  ) {
    super();
    this.log = parentLogger.child({ stage: 'tts' });
    this.ttsPort.on('audio', this.handleTtsAudio);
    this.ttsPort.on('viseme', this.handleTtsViseme);
    this.ttsPort.on('error', this.handlePortError);
  }

  process(data: Sequence) {
    if (data.idx === 1) {
      const utteranceStart: UtteranceStart = { type: 'utterance_start' };
      this.emit('message', utteranceStart);
    }
    this.sentenceQueue.push(data);
    this.processQueue().catch((err: Error) => {
      this.log.error('TTS processing error', err.message);
      this.emit('error');
    });
  }

  async stop(): Promise<void> {
    this.ttsPort.off('audio', this.handleTtsAudio);
    this.ttsPort.off('viseme', this.handleTtsViseme);
    this.ttsPort.off('error', this.handlePortError);
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.sentenceQueue.length > 0) {
      const { text, idx } = this.sentenceQueue.shift()!;

      if (this.sentenceQueue.length > 0 && !this.nextPromises) {
        const next = this.sentenceQueue[0];
        this.nextPromises = {
          audio: this.ttsPort.processAudio(next.text, next.idx),
          viseme: this.ttsPort.processViseme(next.text, next.idx),
        };
      }

      if (!this.currentPromises) {
        this.currentPromises = {
          audio: this.ttsPort.processAudio(text, idx),
          viseme: this.ttsPort.processViseme(text, idx),
        };
      }

      const [audioRes, visemeRes] = await Promise.all([
        this.currentPromises.audio,
        this.currentPromises.viseme,
      ]);
      this.currentPromises = null;

      await Promise.all([
        this.ttsPort.handleAudio(audioRes),
        this.ttsPort.handleViseme(visemeRes, idx),
      ]);

      const end: End = { type: 'end', id: idx };
      this.emit('message', end);

      this.currentPromises = this.nextPromises;
      this.nextPromises = null;
    }

    this.isProcessing = false;
  }
}
