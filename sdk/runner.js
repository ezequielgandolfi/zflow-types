import { AUTOMATION_TRIGGER } from "./graph.js";
export const defineRunner = (definition) => definition;
/** Whether a runner can start automations of `triggerType`; those it doesn't own get its trigger data as input. */
export const runnerAccepts = (runner, triggerType) => triggerType === runner.triggerType || triggerType === AUTOMATION_TRIGGER;
