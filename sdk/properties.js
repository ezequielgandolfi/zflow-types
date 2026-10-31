export const literal = (value) => ({ kind: 'literal', value });
export const ref = (nodeId, property, path) => path === undefined ? { kind: 'ref', nodeId, property } : { kind: 'ref', nodeId, property, path };
export const transformed = (transform, properties = {}) => ({
    kind: 'transform',
    transform,
    properties,
});
export const isTransformValue = (value) => value !== null &&
    typeof value === 'object' &&
    value.kind === 'transform' &&
    typeof value.transform === 'string' &&
    typeof value.properties === 'object';
