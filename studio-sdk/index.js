export const defineStudioPlugin = (plugin) => plugin;
const STUDIO_HOST_GLOBAL = '__zflowHost';
/** Set once by the Studio before it renders, after every plugin module has loaded. */
export function publishStudioHost(host) {
    Object.assign(globalThis, { [STUDIO_HOST_GLOBAL]: host });
}
export function studioHost() {
    const host = globalThis[STUDIO_HOST_GLOBAL];
    if (!host)
        throw new Error('The Studio host is only available while the Studio renders');
    return host;
}
/** A part another plugin shares (`parts` in its Studio module), or undefined when that plugin's module isn't loaded. */
export function studioPart(pluginId, name) {
    return studioHost().plugins.find((plugin) => plugin.id === pluginId)?.parts?.[name];
}
/** Query keys of the Studio's project data; invalidate `draftQueryKeys` after changing a project's draft. */
export const queryKeys = {
    catalog: ['catalog'],
    projects: ['projects'],
    project: (id) => ['project', id],
    issues: (id) => ['issues', id],
    changes: (id) => ['changes', id],
    /** Choices of `optionsFrom` sources; plugin pages that change their settings invalidate `['options']`. */
    options: (projectId, source, values = {}) => ['options', projectId ?? '', source, values],
};
export const draftQueryKeys = (projectId) => [
    queryKeys.project(projectId),
    queryKeys.issues(projectId),
    queryKeys.changes(projectId),
    queryKeys.projects,
    ['options', projectId],
];
/**
 * Modules a plugin's Studio code shares with the Studio instead of bundling its own copy, so hooks, routing and
 * queries use the same React tree. The Studio publishes them on `globalThis[SHARED_MODULES_GLOBAL]`.
 */
export const SHARED_MODULES = [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-router',
    '@tanstack/react-query',
    '@zflow/studio-sdk',
];
export const SHARED_MODULES_GLOBAL = '__zflowShared';
