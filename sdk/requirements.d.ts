/** A plugin dependency in its long form; a plain version text is the same as `{ version }`. */
export interface PluginDependency {
    /** The minimum version. */
    version: string;
    /** The plugin still loads without it; only its features that require it are disabled. */
    optional?: boolean;
}
/** Plugins a plugin depends on, by id: the minimum version, or a `PluginDependency`. */
export type PluginDependencies = Record<string, string | PluginDependency>;
/**
 * Plugins a feature (a step, transform, runner, widget or template) needs, which must be in the plugin's
 * `dependencies`. Without one of them, or with an older version than the one given here, only the feature is disabled.
 * A list of ids, or ids with a minimum version above the plugin's own (`true` keeps the plugin's).
 */
export type FeatureRequirements = readonly string[] | Readonly<Record<string, string | true>>;
export interface Requirable {
    requires?: FeatureRequirements;
}
/** Why a feature is disabled: a plugin that isn't loaded or is too old, or a widget template that isn't loaded. */
export type MissingRequirement = {
    plugin: string;
    version?: string;
    installed?: string;
} | {
    template: string;
};
export declare function dependencySpec(dependency: string | PluginDependency): Required<PluginDependency>;
/** Ids of the dependencies the plugin can't load without. */
export declare const requiredDependencies: (dependencies?: PluginDependencies) => string[];
/** The required plugins with their own minimum version, if the feature gives one. */
export declare const requirementEntries: (requires?: FeatureRequirements) => [string, string | undefined][];
