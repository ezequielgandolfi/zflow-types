export type RunStatus = 'completed' | 'stopped' | 'failed' | 'timeout';
export interface RunError {
    message: string;
    nodeId?: string;
}
export interface RunResult {
    runId: string;
    status: RunStatus;
    result?: unknown;
    error?: RunError;
}
/**
 * `execution` numbers each time a step runs, pairing its start and end. `trigger`, `props` and `values` are only
 * set on runs started with details (captured or test runs), as JSON-safe copies with secrets hidden.
 */
export type RunEventBody = {
    type: 'run.started';
    automationId: string;
    trigger?: unknown;
} | {
    type: 'node.started';
    nodeId: string;
    execution: number;
    props?: Record<string, unknown>;
} | {
    type: 'node.waiting';
    nodeId: string;
    reason: string;
    until?: number;
} | {
    type: 'node.finished';
    nodeId: string;
    execution: number;
    outputs: string[];
    error?: string;
    values?: Record<string, unknown>;
} | {
    type: 'output.fired';
    nodeId: string;
    output: string;
} | {
    type: 'output.closed';
    nodeId: string;
    output: string;
} | {
    type: 'var.changed';
    scope: 'local' | 'global';
    name: string;
    value: unknown;
} | {
    type: 'run.finished';
    result: RunResult;
};
export type RunEvent = RunEventBody & {
    runId: string;
    at: number;
};
