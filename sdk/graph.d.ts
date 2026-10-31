import type { PropertyValue } from './properties.js';
/** Trigger type of automations that other automations can start, and that every runner accepts. */
export declare const AUTOMATION_TRIGGER = "automation";
export interface AutomationNode {
    id: string;
    type: string;
    label: string;
    position: {
        x: number;
        y: number;
    };
    properties: Record<string, PropertyValue>;
}
export interface AutomationEdge {
    id: string;
    source: string;
    sourceOutput: string;
    target: string;
}
/** What happens when a step fails and its error output isn't linked. */
export type ErrorBehavior = 'stop' | 'continue';
export interface AutomationSettings {
    /** `stop` ends the run as failed and cancels every other path; `continue` lets the other paths finish. */
    onError?: ErrorBehavior;
}
export interface AutomationGraph {
    nodes: AutomationNode[];
    edges: AutomationEdge[];
    settings?: AutomationSettings;
}
export interface AutomationDefinition {
    id: string;
    name: string;
    triggerType: string;
    graph: AutomationGraph;
}
