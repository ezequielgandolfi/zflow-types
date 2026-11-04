import type { Props } from './component.js';
import type { DashboardSize } from './dashboard.js';
import type { PropertySchema } from './properties.js';
import type { FeatureRequirements } from './requirements.js';
import type { RunStatus } from './run.js';
import type { PluginStorage, TableStorage } from './storage.js';
/** A window of time: the last `minutes` up to now, or between two timestamps (ms since epoch). */
export type TimeRange = {
    minutes: number;
} | {
    from: number;
    to: number;
};
export interface WidgetDataContext {
    /** The widget's settings, with defaults applied and coerced to their declared types. */
    readonly config: Props;
    /** The range the viewer picked in a template's range picker; undefined until they pick one. */
    readonly range?: TimeRange;
    /** The plugin's settings, as saved in the Studio (or its `settings.defaults`). */
    readonly settings: unknown;
    readonly storage: PluginStorage;
    readonly signal: AbortSignal;
    /** The project of the dashboard showing the widget; undefined when the Studio doesn't say. */
    readonly project?: WidgetProject;
}
export interface WidgetProject {
    readonly id: string;
    /** The project's run history, latest first, including runs still in progress. */
    runs(query: {
        automationId?: string;
        limit: number;
    }): WidgetRun[];
    /** The project's tables of the widget's plugin, or of a plugin it depends on. */
    storage(pluginId?: string): TableStorage;
}
export interface WidgetRun {
    id: string;
    automationId: string;
    automationName: string;
    runnerName: string;
    status: RunStatus | 'running' | 'interrupted';
    startedAt: number;
    finishedAt?: number;
    error?: string;
}
/** What a widget's action gets; actions run in studio-server, on the published dashboard's widget config. */
export interface WidgetActionContext {
    readonly config: Props;
    /** What the widget's component sent, like `{ on: true }`. */
    readonly input: unknown;
    readonly settings: unknown;
    readonly storage: PluginStorage;
    readonly signal: AbortSignal;
    /** The project of the dashboard. */
    readonly project: WidgetProject;
    readonly dashboard: {
        readonly id: string;
        readonly name: string;
    };
    /**
     * Runs a command of a plugin's service, which lives in the engine (`ServiceInstance.commands`): the widget's own
     * plugin, or one it depends on.
     */
    command(name: string, input?: unknown, pluginId?: string): Promise<unknown>;
}
/**
 * A dashboard widget. The Studio renders it with the template it names, or else with the component its plugin
 * registers under the same id.
 */
export interface WidgetDefinition {
    /** Namespaced by the plugin, e.g. "widgets.time". */
    id: string;
    name: string;
    /** One plain sentence, shown when picking a widget. */
    description: string;
    /** Lucide icon name in kebab-case. */
    icon: string;
    /** The width it's added with; small without it. */
    width?: DashboardSize;
    /** The height it's added with, in rows (1–10); 1 without it. */
    rows?: number;
    properties: Record<string, PropertySchema>;
    /** Id of the widget template that renders `data()`, e.g. "templates.stat"; the plugin then needs no component. */
    template?: string;
    /**
     * Adds a "Colors" setting (named `colors`) whose rules color the `value` of the widget's data, unless `data()` sets
     * its own `color`, and a "Display as" transform (named `display`) applied to `value` and to each `entries[].value`.
     * Templates and components paint `color` on the value.
     */
    appearance?: boolean;
    /** Drops the card around the widget (border, background and padding), so its component fills the cell itself. */
    frameless?: boolean;
    /** How often the Studio asks for fresh data, in milliseconds. Without it, data is loaded once. */
    refreshMs?: number;
    /** Besides these, a widget always needs the dashboards plugin and its template. */
    requires?: FeatureRequirements;
    /** Runs in studio-server; whatever it returns is passed to the widget's component as `data`. */
    data?(ctx: WidgetDataContext): unknown;
    /**
     * What the widget can do on a published dashboard, called by its component with `onAction(name, input)`. A thrown
     * error is shown to the viewer; the data is loaded again afterwards.
     */
    actions?: Record<string, (ctx: WidgetActionContext) => unknown>;
}
export declare const defineWidget: (definition: WidgetDefinition) => WidgetDefinition;
export type WidgetManifest = Omit<WidgetDefinition, 'data' | 'actions'> & {
    hasData: boolean;
};
/** A reusable way to render widget data. The Studio component comes from the plugin's `studio` module. */
export interface WidgetTemplateDefinition {
    /** Namespaced by the plugin, e.g. "templates.stat". */
    id: string;
    name: string;
    /** One plain sentence, shown on the Plugins page. */
    description: string;
    requires?: FeatureRequirements;
}
export declare const defineWidgetTemplate: (definition: WidgetTemplateDefinition) => WidgetTemplateDefinition;
export declare function rangeBounds(range: TimeRange, now?: number): {
    since: number;
    until: number;
};
