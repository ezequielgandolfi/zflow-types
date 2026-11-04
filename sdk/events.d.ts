export declare const EVENT_TYPES: readonly ["info", "warning", "error"];
export type EventType = (typeof EVENT_TYPES)[number];
/** What an event is about, such as a device, so its page can list the events about it. */
export interface EventObject {
    /** `device`, `project`, `runner`, `plugin`… */
    kind: string;
    id: string;
    /** Shown instead of the id. */
    name?: string;
}
export interface EventInput {
    /** `info` without it. */
    type?: EventType;
    /** A short machine-readable cause, such as `Rejoined` or `Offline`; the Studio filters by it. */
    reason: string;
    /** Keep it the same for the same thing happening, and put what changes in `data`, so repeats are counted. */
    message: string;
    object?: EventObject;
    data?: Record<string, unknown>;
}
/** Something that happened, kept in memory for a while for the Admin page and the diagnostics file. */
export interface ZflowEvent extends EventInput {
    id: string;
    type: EventType;
    /** `engine`, `studio` or the plugin's id. */
    source: string;
    /** How many times it happened since `firstAt`; repeats update `lastAt` and `data` instead of adding events. */
    count: number;
    firstAt: number;
    lastAt: number;
}
/** Records events for the Admin page and the diagnostics file, not for every message: those go to the logger. */
export interface EventRecorder {
    record(event: EventInput): void;
}
export interface EventQuery {
    type?: EventType;
    source?: string;
    kind?: string;
    objectId?: string;
    /** Only events that happened at or after this time. */
    since?: number;
    limit?: number;
}
