export const CHATTING_LOG_MESSAGES = {
  SESSION: {
    START: 'session start',
    CLOSE: 'session close',
  },
  AUDIO_BUFFER: {
    INITIALIZED: 'AudioBuffer initialized',
    PROCESSING: (bytes: number) => `Processing audio buffer... (${bytes} Bytes)`,
  },
  ERROR: {
    UNEXPECTED_DATA_TYPE: (type: string) => `Unexpected data type: ${type}`,
  },
} as const;
