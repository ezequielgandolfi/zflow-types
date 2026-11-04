import type { EventRecorder } from './events.js';
import type { Logger } from './logger.js';
import type { PluginStorage } from './storage.js';
export interface ServiceContext {
    readonly pluginId: string;
    /** The plugin's settings, as saved in the Studio (or its `settings.defaults`). */
    readonly settings: unknown;
    readonly logger: Logger;
    /** Records what happened to the plugin's devices or connections for the Admin page; also logged. */
    readonly events: EventRecorder;
    readonly storage: PluginStorage;
    /** A folder of the plugin's own for files, such as a library's database; created on first use. */
    readonly dataDir: string;
    /** The running service of a plugin this one depends on; dependencies start before it and stop after it. */
    service<T extends ServiceInstance = ServiceInstance>(pluginId: string): T;
}
export interface ServiceInstance {
    start(): void | Promise<void>;
    stop(): void | Promise<void>;
    /** Applies new settings in place. Without it, the service is recreated and every project reloads. */
    update?(settings: unknown): void | Promise<void>;
    /** Live state served to the Studio, e.g. connected devices. */
    status?(): unknown;
    /**
     * Details for the Admin page's diagnostics file, for finding out why something fails on someone else's install:
     * what the service knows about its connections and devices. Never include secrets.
     */
    diagnose?(): unknown;
    /** Operations studio-server asks the engine to run, such as a widget's action publishing a message. */
    commands?: Record<string, (input: unknown) => unknown>;
    /** Called after a project is deleted; its project tables are already gone. */
    projectDeleted?(projectId: string): void | Promise<void>;
}
/** Long-lived part of a plugin, started once by the engine and shared by every project's steps and runners. */
export interface ServiceDefinition<T extends ServiceInstance = ServiceInstance> {
    create(ctx: ServiceContext): T;
}
export declare const defineService: <T extends ServiceInstance>(definition: ServiceDefinition<T>) => ServiceDefinition<T>;
/** Finds the running service of a plugin by the plugin id. */
export type ServiceLookup = (pluginId: string) => ServiceInstance | undefined;
