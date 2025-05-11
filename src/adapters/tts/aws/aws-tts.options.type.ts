import type { PollyClientConfig, SynthesizeSpeechInput } from '@aws-sdk/client-polly';

export interface AwsTtsClientOptions
  extends Pick<Required<PollyClientConfig>, 'region' | 'credentials'> {}

export interface AwsTtsAudioOptions
  extends Pick<Required<SynthesizeSpeechInput>, 'OutputFormat' | 'VoiceId' | 'Engine'> {}

export interface AwsTtsVisemeOptions
  extends AwsTtsAudioOptions,
    Pick<Required<SynthesizeSpeechInput>, 'SpeechMarkTypes'> {}

export interface AwsTtsOptions {
  client: AwsTtsClientOptions;
  audio: AwsTtsAudioOptions;
  viseme: AwsTtsVisemeOptions;
}
