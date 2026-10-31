export const definePlugin = (definition) => definition;
/** Serializable description of a plugin, safe to send to the Studio; `provided` comes from `fromSettings`. */
export function toPluginManifest(plugin, provided = {}) {
    const { automations = {}, dashboards = {} } = plugin;
    return {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        dependencies: plugin.dependencies ?? {},
        automations: {
            components: [...(automations.components ?? []), ...(provided.components ?? [])].map((component) => omit(component, ['execute', 'onSignal'])),
            runners: (automations.runners ?? []).map((runner) => omit(runner, ['create', 'validateBinding'])),
            transforms: [...(automations.transforms ?? []), ...(provided.transforms ?? [])].map((transform) => omit(transform, ['apply'])),
        },
        dashboards: {
            widgets: (dashboards.widgets ?? []).map((widget) => ({
                ...omit(widget, ['data', 'actions']),
                hasData: widget.data !== undefined,
            })),
            templates: dashboards.templates ?? [],
        },
    };
}
function omit(value, keys) {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
}
