import { AzureClientOptions } from 'openai';
import { SessionUpdateEvent } from 'openai/resources/beta/realtime/realtime';

export interface AzureLlmClientOptions
  extends Pick<Required<AzureClientOptions>, 'apiKey' | 'apiVersion' | 'endpoint' | 'deployment'> {}

export interface AzureLlmSessionOptions {
  model: SessionUpdateEvent.Session['model'];
  modalities: SessionUpdateEvent.Session['modalities'];
}

export interface AzureLlmOptions {
  client: AzureLlmClientOptions;
  session: AzureLlmSessionOptions;
}
