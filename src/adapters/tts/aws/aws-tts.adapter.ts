import { EventEmitter } from 'events';
import { Readable } from 'stream';
import {
  PollyClient,
  SynthesizeSpeechCommand,
  SynthesizeSpeechCommandOutput,
} from '@aws-sdk/client-polly';

import type { FastifyBaseLogger } from 'fastify';
import type { TtsAdapter } from '#@/adapters/tts/tts.adapter.type';
import type { AwsTtsOptions } from '#@/adapters/tts/aws/aws-tts.options.type';

export class AwsTtsAdapter extends EventEmitter implements TtsAdapter {
  private log: FastifyBaseLogger;

  private client: PollyClient;

  constructor(
    parentLogger: FastifyBaseLogger,
    private readonly opts: AwsTtsOptions,
  ) {
    super();
    this.log = parentLogger.child({ adapter: 'aws-tts' });
    this.client = new PollyClient(this.opts.client);
  }

  public processAudio(text: string): Promise<SynthesizeSpeechCommandOutput> {
    return this.client.send(
      new SynthesizeSpeechCommand({
        Text: text,
        OutputFormat: this.opts.audio.OutputFormat,
        VoiceId: this.opts.audio.VoiceId,
        Engine: this.opts.audio.Engine,
      }),
    );
  }

  public processViseme(text: string): Promise<SynthesizeSpeechCommandOutput> {
    return this.client.send(
      new SynthesizeSpeechCommand({
        Text: text,
        OutputFormat: this.opts.viseme.OutputFormat,
        SpeechMarkTypes: this.opts.viseme.SpeechMarkTypes,
        VoiceId: this.opts.viseme.VoiceId,
        Engine: this.opts.viseme.Engine,
      }),
    );
  }

  public handleAudio(audioRes: SynthesizeSpeechCommandOutput): Promise<void> {
    return new Promise((resolve, reject) => {
      const pcmStream = Readable.from(audioRes.AudioStream as AsyncIterable<Uint8Array>);
      pcmStream.on('data', (chunk: Uint8Array) => {
        this.emit('audio', chunk);
      });
      pcmStream.on('end', resolve);
      pcmStream.on('error', (err) => {
        this.log.error('Audio stream error', err);
        this.emit('error');
        reject(err);
      });
    });
  }

  public handleViseme(visemeRes: SynthesizeSpeechCommandOutput, idx: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const visemeStream = Readable.from(visemeRes.AudioStream as AsyncIterable<Uint8Array>);
      const dec = new TextDecoder('utf-8');
      let buf = '';
      visemeStream.on('data', (chunk: Uint8Array) => {
        buf += dec.decode(chunk, { stream: true });
        const lines = buf.split(/\r?\n/);
        buf = lines.pop()!;
        lines.forEach((ln) => {
          if (!ln.trim()) return;
          try {
            const m = JSON.parse(ln);
            this.emit('viseme', {
              type: 'viseme',
              id: idx,
              time: m.time,
              value: m.value,
            });
          } catch (err) {
            this.log.error('Viseme JSON parse error', err);
            this.emit('error');
          }
        });
      });
      visemeStream.on('end', resolve);
      visemeStream.on('error', (err: Error) => {
        this.log.error('Viseme stream error', err);
        this.emit('error');
        reject(err);
      });
    });
  }
}
