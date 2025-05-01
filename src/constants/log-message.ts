export const CHATTING_LOG_MESSAGES = {
  SESSION: {
    START: '✔ Client session started',
    CLOSE: '✔ Client session closed',
  },
  PREPROCESS: {
    CHUNK_READY: (bytes: number) => `✔ Preprocessed audio chunk ready (${bytes} Bytes)`,
    BUFFER_CLASS_INITIALIZED: '* AudioBuffer Class initialized',
  },
  STT: {
    TRANSCRIPTION: (text: string) => `${text}`,
    DETECTED: '* Speech Detected',
  },
  ERROR: {
    UNEXPECTED_DATA_TYPE: (type: string) => `✖ Unexpected data type: ${type}`,
  },
} as const;

export const STT_ADAPTER_LOG_MESSAGES = {
  SESSION: {
    START: '✔ STT session started',
    STOP: '✔ STT session stopped',
  },
  CLEANUP: '✔ resources cleaned up',
  ERROR: {
    WRITE: '✖ STT write error',
    SESSION_START: '✖ session start failed',
    SESSION_STOP: '✖ session stop failed',
    PUSH_STREAM_CLOSE: '✖ pushStream close failed',
    RECOGNIZER_CLOSE: '✖ recognizer close failed',
  },
};
