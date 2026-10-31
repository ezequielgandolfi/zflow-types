import type { ComponentDefinition } from './component.js';
import type { ProjectSnapshot } from './project.js';
import type { PropertyOption } from './properties.js';
import type { RunnerDefinition } from './runner.js';
import type { ServiceDefinition } from './service.js';
import type { PluginStorage } from './storage.js';
import type { TransformDefinition, TransformManifest } from './transform.js';
import type { WidgetDefinition, WidgetManifest, WidgetTemplateDefinition } from './widget.js';
export interface PluginActionContext {
    /** What the Studio sent as `input`; validate it before use. */
    readonly input: unknown;
    /** The plugin's settings, as saved in the Studio (or its `settings.defaults`). */
    readonly settings: unknown;
    readonly storage: PluginStorage;
    readonly signal: AbortSignal;
    /** Runs a command of the plugin's service in the engine, or of a plugin it depends on, and resolves to its result. */
    command(name: string, input?: unknown, pluginId?: string): Promise<unknown>;
}
/** What an option source computes its choices from. */
export interface OptionsContext {
    /** The plugin's settings, as saved in the Studio (or its `settings.defaults`). */
    readonly settings: unknown;
    readonly storage: PluginStorage;
    /** The project being edited or published, when there's one. */
    readonly projectId?: string;
    /** The sibling settings named in the property's `optionsDependOn`. */
    readonly values: Readonly<Record<string, unknown>>;
}
/** Plugin-wide settings, edited in the plugin's Studio pages and kept outside projects. */
export interface PluginSettings {
    defaults?: unknown;
    /** Returns issue messages; saving fails with them. */
    validate?(settings: unknown): string[];
    /** Strips secrets from settings before they're sent to the Studio, which makes them write-only. */
    redact?(settings: unknown): unknown;
    /**
     * Completes the settings the Studio saves before they're validated: secrets it left out (taken from the saved
     * settings) and generated values.
     */
    prepare?(incoming: unknown, saved: unknown): unknown;
    /** Options for `optionsFrom` properties, computed from the settings or the plugin's tables. */
    options?: Record<string, (ctx: OptionsContext) => PropertyOption[]>;
}
/** Automation pieces a plugin builds from its saved settings; they're rebuilt whenever the settings are saved. */
export interface ProvidedAutomations {
    components?: ComponentDefinition[];
    transforms?: TransformDefinition[];
}
export interface PluginAutomations {
    components?: ComponentDefinition[];
    runners?: RunnerDefinition[];
    transforms?: TransformDefinition[];
    fromSettings?(settings: unknown): ProvidedAutomations;
}
export interface PluginDashboards {
    widgets?: WidgetDefinition[];
    /** Templates any plugin's widgets can render their data with; their components come from the `studio` module. */
    templates?: WidgetTemplateDefinition[];
}
export interface PluginDefinition {
    id: string;
    name: string;
    version: string;
    /** One plain sentence on what the plugin adds, shown on the Plugins page. */
    description?: string;
    /** Plugins this one needs, by id, with the minimum version of each (`{ templates: '1.2.0' }`). */
    dependencies?: Record<string, string>;
    automations?: PluginAutomations;
    /** Dashboard widgets and templates; their components come from the plugin's `studio` module. */
    dashboards?: PluginDashboards;
    /** Browser module default-exporting a `defineStudioPlugin(...)`, relative to the plugin's main module. */
    studio?: string;
    service?: ServiceDefinition;
    settings?: PluginSettings;
    /**
     * Options for `optionsFrom` properties computed from the project being edited or published, like the variables a
     * runner declares. They share the "<plugin id>.<source>" names with `settings.options`.
     */
    projectOptions?: Record<string, (project: ProjectSnapshot) => PropertyOption[]>;
    /**
     * Operations for the plugin's Studio code, run in studio-server by `POST /api/plugins/:id/actions/:name`. What they
     * return is sent back as `result`; a thrown error becomes an issue.
     */
    actions?: Record<string, (ctx: PluginActionContext) => unknown>;
}
/** What a plugin can provide, for looking up which plugin a project depends on. */
export type ProvidedKind = 'component' | 'transform' | 'runner' | 'widget' | 'template';
export declare const definePlugin: (definition: PluginDefinition) => PluginDefinition;
export type ComponentManifest = Omit<ComponentDefinition, 'execute' | 'onSignal'>;
export type RunnerManifest = Omit<RunnerDefinition, 'create' | 'validateBinding'>;
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description?: string;
    dependencies: Record<string, string>;
    automations: {
        components: ComponentManifest[];
        runners: RunnerManifest[];
        transforms: TransformManifest[];
    };
    dashboards: {
        widgets: WidgetManifest[];
        templates: WidgetTemplateDefinition[];
    };
    /** URL the Studio imports the plugin's pages from, when it has any. */
    studio?: string;
}
/** Serializable description of a plugin, safe to send to the Studio; `provided` comes from `fromSettings`. */
export declare function toPluginManifest(plugin: PluginDefinition, provided?: ProvidedAutomations): PluginManifest;
