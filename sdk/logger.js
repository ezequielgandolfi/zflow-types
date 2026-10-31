/** From most to least detailed; the engine shows a message when its level is at or after the configured one. */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'];
export const DEFAULT_LOG_LEVEL = 'info';
export const DEFAULT_ENGINE_SETTINGS = { logLevel: DEFAULT_LOG_LEVEL, historyDays: 7 };
