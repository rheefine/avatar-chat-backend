export const WEBSOCKET_EVENT = {
  MESSAGE: 'message',
  ERROR: 'error',
  CLOSE: 'close',
} as const;

export const STAGE_EVENT = {
  DATA: 'data',
  ERROR: 'error',
  DETECTED: 'detected',
} as const;

export const STT_EVENT = {
  TRANSCRIPTION: 'transcription',
  SPEECH_STARTED: 'speechStarted',
  ERROR: 'error',
} as const;
