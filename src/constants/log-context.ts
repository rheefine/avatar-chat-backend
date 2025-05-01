export const CHATTING_LOG_CONTEXT = {
  SERVICE: 'chatting',
  SPEECH_PIPELINE: 'speech',
  PREPROCESS_STAGE: 'audio-preprocess',
  STT_STAGE: 'stt',
} as const;

export const ADAPTER_LOG_CONTEXT = {
  STT: {
    AZURE: 'azure-stt',
  },
} as const;
