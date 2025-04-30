import { EventEmitter } from 'events';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { AzureSttConfig } from '#@/adapters/stt/azure/azure-stt.config';

import type { FastifyBaseLogger } from 'fastify';
import type { AzureSttOptions } from '#@/adapters/stt/azure/azure-stt-options.type';

export class AzureSttRecognizer extends EventEmitter {
  private log: FastifyBaseLogger;

  private pushStream: sdk.PushAudioInputStream;

  private recognizer: sdk.SpeechRecognizer;

  constructor(parentLogger: FastifyBaseLogger, opts: AzureSttOptions) {
    super();
    this.log = parentLogger;

    const speechConfig = AzureSttConfig.create(opts);
    this.pushStream = sdk.AudioInputStream.createPushStream();
    const audioConfig = sdk.AudioConfig.fromStreamInput(this.pushStream);

    this.recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    this.attachEventHandlers();
  }

  private attachEventHandlers(): void {
    this.recognizer.recognized = (_s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        this.emit('transcription', { text: e.result.text, timestamp: new Date() });
      }
    };
    this.recognizer.speechStartDetected = () => {
      this.emit('speechStarted');
    };
    this.recognizer.canceled = async (_s, e) => {
      await this.cleanup();
      this.emit('error', new Error(e.errorDetails));
    };

    this.recognizer.sessionStarted = () => {
      this.log.info('✔ STT session started');
    };
    this.recognizer.sessionStopped = () => {
      this.log.info('✔ STT session stopped');
    };
  }

  writeAudio(buffer: Buffer): void {
    try {
      this.pushStream.write(new Uint8Array(buffer).buffer);
    } catch (err) {
      this.log.error('✖ STT write error', err);
      this.emit('error', err as Error);
    }
  }

  async startRecognition(): Promise<void> {
    try {
      await new Promise<void>((res, rej) => {
        this.recognizer.startContinuousRecognitionAsync(res, rej);
      });
    } catch (err) {
      this.log.warn('✖ session start failed', err);
      this.emit('error', err as Error);
    }
  }

  async stopRecognition(): Promise<void> {
    await this.cleanup();
  }

  private cleanup = async (): Promise<void> => {
    try {
      await new Promise<void>((resolve, reject) => {
        this.recognizer.stopContinuousRecognitionAsync(resolve, reject);
      });
    } catch (err) {
      this.log.warn('✖ session stop failed', err);
    }
    try {
      this.pushStream.close();
    } catch (err) {
      this.log.warn('✖ pushStream close failed', err);
    }
    try {
      this.recognizer.close();
    } catch (err) {
      this.log.warn('✖ recognizer close failed', err);
    }

    this.log.info('✔ resources cleaned up');
  };
}
