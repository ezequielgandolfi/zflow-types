import type { Logger } from './logger.js';
import type { PropertySchema } from './properties.js';
import type { RunResult } from './run.js';
import type { RunAutomationOptions } from './runner.js';
import type { ServiceInstance } from './service.js';
import type { TableStorage } from './storage.js';
export declare const DEFAULT_OUTPUT = "ok";
export declare const ERROR_OUTPUT = "error";
export type InputMode = 'none' | 'single' | 'multi';
export interface OutputSchema {
    name: string;
    label?: string;
    color?: string;
}
export interface VarStore {
    get(name: string): unknown;
    has(name: string): boolean;
    set(name: string, value: unknown): void;
}
export type Props = Record<string, unknown>;
/** The project a run or runner belongs to. */
export interface ProjectInfo {
    readonly id: string;
    readonly name: string;
}
export interface ComponentContext {
    readonly nodeId: string;
    readonly props: Props;
    readonly vars: VarStore;
    readonly globals: VarStore;
    /** This step's own values, kept between runs (per runner) like globals; for steps that compare with earlier runs. */
    readonly memory: VarStore;
    /** The step's plugin's tables for the project; throws on use when the automation runs outside a project. */
    readonly storage: TableStorage;
    readonly signal: AbortSignal;
    /** Tagged with the automation, the step and the run. */
    readonly logger: Logger;
    /** Data injected by the runner, only available to the automation's start component. */
    readonly trigger: unknown;
    /** The project running the automation; undefined when it runs on its own, as in tests. */
    readonly project?: ProjectInfo;
    /** The running service of a plugin; throws when the plugin has none. */
    service<T extends ServiceInstance = ServiceInstance>(pluginId: string): T;
    set(property: string, value: unknown): void;
    emit(output: string): void;
    /** Emits and resolves once all the work spawned downstream of this emission has settled. */
    emitAndWait(output: string): Promise<void>;
    /**
     * Marks this step as waiting for something before it continues (a delay, an event), with when it resumes if that's
     * known (ms since the epoch). The engine lists waiting runs on the Admin page; it's cleared when the step ends.
     */
    waiting(reason: string, until?: number): void;
    /** Ends the whole run as completed with the given result, cancelling any other in-progress path. */
    complete(result?: unknown): void;
    /**
     * Starts an automation of the same project whose trigger type is `AUTOMATION_TRIGGER`, with `input` as its trigger
     * data. Resolves once it ends; pass `ctx.signal` to stop it along with this run.
     */
    runAutomation(automationId: string, input?: unknown, options?: RunAutomationOptions): Promise<RunResult>;
}
export interface SignalContext extends ComponentContext {
    readonly incomingEdges: readonly string[];
    /** Survives across signals for the same node within a run. */
    readonly state: Record<string, unknown>;
}
export interface Signal {
    kind: 'token' | 'closed';
    edgeId: string;
}
export type ExecuteResult = string | string[] | void;
interface ComponentBase {
    id: string;
    name: string;
    description: string;
    category: string;
    icon?: string;
    outputs: OutputSchema[];
    properties: Record<string, PropertySchema>;
    /** Restricts the component to automations of these trigger types. */
    triggerTypes?: string[];
    terminal?: boolean;
}
export interface ExecuteComponent extends ComponentBase {
    inputMode: 'none' | 'single';
    execute(ctx: ComponentContext): ExecuteResult | Promise<ExecuteResult>;
}
export interface SignalComponent extends ComponentBase {
    inputMode: 'multi';
    onSignal(ctx: SignalContext, signal: Signal): ExecuteResult | Promise<ExecuteResult>;
}
export type ComponentDefinition = ExecuteComponent | SignalComponent;
export declare const defineComponent: <T extends ComponentDefinition>(definition: T) => T;
export {};
