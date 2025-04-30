import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

import type { AzureSttOptions } from '#@/adapters/stt/azure/azure-stt-options.type';

export class AzureSttConfig {
  static create(opts: AzureSttOptions): sdk.SpeechConfig {
    const speechConfig = sdk.SpeechConfig.fromSubscription(opts.subscriptionKey, opts.region);
    speechConfig.speechRecognitionLanguage = opts.language;

    return speechConfig;
  }
}
