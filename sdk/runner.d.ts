import type { ProjectInfo, Props } from './component.js';
import type { EventRecorder } from './events.js';
import type { Logger } from './logger.js';
import type { PropertySchema } from './properties.js';
import type { RunResult } from './run.js';
import type { ServiceInstance } from './service.js';
import type { TableStorage } from './storage.js';
export interface RunAutomationOptions {
    timeoutMs?: number;
    signal?: AbortSignal;
}
export interface ResolvedBinding {
    id: string;
    automationId: string;
    automationName: string;
    config: Props;
}
export interface RunnerContext {
    readonly id: string;
    readonly name: string;
    readonly config: Props;
    readonly bindings: readonly ResolvedBinding[];
    readonly logger: Logger;
    /** Records what happened to the runner for the Admin page; also logged. */
    readonly events: EventRecorder;
    readonly project: ProjectInfo;
    /** The runner's plugin's tables for this project, dropped with the project. */
    readonly storage: TableStorage;
    runAutomation(automationId: string, trigger: unknown, options?: RunAutomationOptions): Promise<RunResult>;
    /** The running service of a plugin; throws when the plugin has none. */
    service<T extends ServiceInstance = ServiceInstance>(pluginId: string): T;
}
export interface RunnerInstance {
    start(): void | Promise<void>;
    stop(): void | Promise<void>;
}
export interface RunnerDefinition {
    type: string;
    name: string;
    description: string;
    /** Lucide icon name (kebab-case). */
    icon?: string;
    /** Automations of this trigger type, besides `AUTOMATION_TRIGGER` ones, can be bound to the runner. */
    triggerType: string;
    /** What one binding is called in the Studio, e.g. "Route" or "Schedule". */
    bindingLabel?: string;
    /** Only one runner of this type can be added to a project. */
    single?: boolean;
    configSchema: Record<string, PropertySchema>;
    bindingSchema: Record<string, PropertySchema>;
    /** Checks a binding beyond its schema (e.g. a cron expression) so publishing fails instead of the runner. */
    validateBinding?(config: Props): string[];
    create(ctx: RunnerContext): RunnerInstance;
}
export declare const defineRunner: (definition: RunnerDefinition) => RunnerDefinition;
/** Whether a runner can start automations of `triggerType`; those it doesn't own get its trigger data as input. */
export declare const runnerAccepts: (runner: Pick<RunnerDefinition, "triggerType">, triggerType: string) => boolean;
