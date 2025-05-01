export const CHATTING_LOG_CONTEXT = {
  SERVICE: 'chatting',
  AUDIO_PIPELINE: 'audio',
  PREPROCESS_STAGE: 'preprocess',
} as const;

export const ADAPTER_LOG_CONTEXT = {
  STT: {
    AZURE: 'Azure STT',
  },
} as const;
