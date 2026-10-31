/** The schemas of a transform's settings as set up in `values`, extra settings included. */
export function transformSettings(transform, values) {
    const { properties, extraProperties } = transform;
    if (!extraProperties)
        return properties;
    const extra = Object.keys(values).filter((name) => !Object.hasOwn(properties, name));
    return { ...Object.fromEntries(extra.map((name) => [name, extraProperties])), ...properties };
}
export const defineTransform = (definition) => definition;
