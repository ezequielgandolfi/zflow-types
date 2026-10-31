/** From most to least detailed; the engine shows a message when its level is at or after the configured one. */
export declare const LOG_LEVELS: readonly ["debug", "info", "warn", "error"];
export type LogLevel = (typeof LOG_LEVELS)[number];
export declare const DEFAULT_LOG_LEVEL: LogLevel;
/** Plugins log through the engine, which writes the messages that pass its log level, tagged with where they came from. */
export interface Logger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
/** Engine-wide settings, changed on the Studio's Admin page. */
export interface EngineSettings {
    logLevel: LogLevel;
    /** How many days the run history keeps finished runs. */
    historyDays: number;
}
export declare const DEFAULT_ENGINE_SETTINGS: EngineSettings;
