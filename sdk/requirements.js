export function dependencySpec(dependency) {
    return typeof dependency === 'string'
        ? { version: dependency, optional: false }
        : { version: dependency.version, optional: dependency.optional ?? false };
}
/** Ids of the dependencies the plugin can't load without. */
export const requiredDependencies = (dependencies = {}) => Object.entries(dependencies)
    .filter(([, dependency]) => !dependencySpec(dependency).optional)
    .map(([id]) => id);
/** The required plugins with their own minimum version, if the feature gives one. */
export const requirementEntries = (requires = []) => Array.isArray(requires)
    ? requires.map((id) => [id, undefined])
    : Object.entries(requires).map(([id, version]) => [id, version === true ? undefined : version]);
