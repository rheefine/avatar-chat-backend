import { EventEmitter } from 'events';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { AzureSttConfig } from '#@/adapters/stt/azure/azure-stt.config';
import { STT_EVENT } from '#@/constants/event';
import { STT_ADAPTER_LOG_MESSAGES } from '#@/constants/log-message';

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
        this.emit(STT_EVENT.TRANSCRIPTION, { text: e.result.text, timestamp: new Date() });
      }
    };
    this.recognizer.speechStartDetected = () => {
      this.emit(STT_EVENT.SPEECH_STARTED);
    };
    this.recognizer.canceled = async (_s, e) => {
      await this.cleanup();
      this.log.error(e, 'Recognizer Canceled');
      this.emit(STT_EVENT.ERROR);
    };

    this.recognizer.sessionStarted = () => {
      this.log.info(STT_ADAPTER_LOG_MESSAGES.SESSION.START);
    };
    this.recognizer.sessionStopped = () => {
      this.log.info(STT_ADAPTER_LOG_MESSAGES.SESSION.STOP);
    };
  }

  writeAudio(buffer: Buffer): void {
    try {
      this.pushStream.write(new Uint8Array(buffer).buffer);
    } catch (err) {
      this.log.error(STT_ADAPTER_LOG_MESSAGES.ERROR.WRITE, err);
      this.emit(STT_EVENT.ERROR);
    }
  }

  async startRecognition(): Promise<void> {
    try {
      await new Promise<void>((res, rej) => {
        this.recognizer.startContinuousRecognitionAsync(res, rej);
      });
    } catch (err) {
      this.log.error(STT_ADAPTER_LOG_MESSAGES.ERROR.SESSION_START, err);
      this.emit(STT_EVENT.ERROR);
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
      this.log.warn(STT_ADAPTER_LOG_MESSAGES.ERROR.SESSION_STOP, err);
    }
    try {
      this.pushStream.close();
    } catch (err) {
      this.log.warn(STT_ADAPTER_LOG_MESSAGES.ERROR.PUSH_STREAM_CLOSE, err);
    }
    try {
      this.recognizer.close();
    } catch (err) {
      this.log.warn(STT_ADAPTER_LOG_MESSAGES.ERROR.RECOGNIZER_CLOSE, err);
    }

    this.log.info(STT_ADAPTER_LOG_MESSAGES.CLEANUP);
  };
}
