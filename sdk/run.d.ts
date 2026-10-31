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
export type RunEventBody = {
    type: 'run.started';
    automationId: string;
} | {
    type: 'node.started';
    nodeId: string;
} | {
    type: 'node.waiting';
    nodeId: string;
    reason: string;
    until?: number;
} | {
    type: 'node.finished';
    nodeId: string;
    outputs: string[];
    error?: string;
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
