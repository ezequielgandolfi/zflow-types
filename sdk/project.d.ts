import type { DashboardDefinition } from './dashboard.js';
import type { AutomationDefinition } from './graph.js';
export interface RunnerBinding {
    id: string;
    automationId: string;
    config: Record<string, unknown>;
}
export interface RunnerConfig {
    id: string;
    type: string;
    name: string;
    enabled: boolean;
    config: Record<string, unknown>;
    bindings: RunnerBinding[];
}
/** Bumped whenever the project file shape changes; older files are migrated when opened. */
export declare const PROJECT_FORMAT_VERSION = 6;
/** Everything the engine needs to run a project; also the shape of a published version and of exported files. */
export interface ProjectSnapshot {
    formatVersion: number;
    id: string;
    name: string;
    /** Plugin id → version the project was built with; checked for compatibility before running. */
    plugins: Record<string, string>;
    automations: AutomationDefinition[];
    runners: RunnerConfig[];
    dashboards: DashboardDefinition[];
}
