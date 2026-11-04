import type { DashboardSize } from './dashboard.js';
import type { AutomationGraph } from './graph.js';
import type { PropertySchema } from './properties.js';
import type { FeatureRequirements } from './requirements.js';
/**
 * Where a blueprint value comes from when it's filled in:
 * - `$input`: the answer to `"<page>.<field>"`, as it is (or the label of the picked option, with `$label`).
 * - `$text`: text where `{{<page>.<field>}}`, `{{item.value}}` and `{{item.label}}` are replaced.
 * - `$item`: the option of the innermost `$each`.
 */
export type BlueprintPlaceholder = {
    $input: string;
    $label?: boolean;
} | {
    $text: string;
} | {
    $item: 'value' | 'label';
};
/** Choices of an option source, as an `optionsFrom` setting would get them. */
export interface BlueprintOptions {
    options: string;
    /** What the source's `optionsDependOn` settings would hold. */
    values?: Record<string, Templated<unknown>>;
}
/** Keeps a list entry only while it holds: an answer is truthy (or one of `is`), or an option source has a value. */
export type BlueprintCondition = {
    input: string;
    is?: unknown[];
} | (BlueprintOptions & {
    has: string;
}) | {
    not: BlueprintCondition;
};
/** What a list entry may add: repeated once per option of a source, or kept only on a condition. */
export interface BlueprintRepeat {
    $each?: BlueprintOptions;
    $when?: BlueprintCondition;
}
/** A value of type `T` where any part may be a placeholder, and list entries may repeat or be conditional. */
export type Templated<T> = unknown extends T ? unknown : BlueprintPlaceholder | TemplatedShape<T>;
type TemplatedShape<T> = T extends readonly (infer U)[] ? TemplatedEntry<U>[] : T extends object ? {
    [K in keyof T]: Templated<T[K]>;
} : T;
type TemplatedEntry<U> = U extends object ? Templated<U> & BlueprintRepeat : Templated<U>;
/** One page of questions; its fields render like any other settings. */
export interface BlueprintPage {
    id: string;
    title: string;
    description?: string;
    properties: Record<string, PropertySchema>;
}
/** An automation to add; `id` is only for bindings in the blueprint and gets replaced. */
export interface BlueprintAutomation {
    id: string;
    name: Templated<string>;
    triggerType: string;
    graph: Templated<AutomationGraph>;
}
export interface BlueprintBinding {
    /** The `id` of one of the blueprint's automations. */
    automationId: string;
    config?: Templated<Record<string, unknown>>;
}
/**
 * An integration to add. For types a project only has one of, the existing one gets the bindings, and the config's
 * lists get the new entries.
 */
export interface BlueprintRunner {
    type: string;
    /** Defaults to the integration's own name. */
    name?: Templated<string>;
    config?: Templated<Record<string, unknown>>;
    bindings?: (Templated<BlueprintBinding> & BlueprintRepeat)[];
}
export interface BlueprintWidget {
    type: string;
    config: Templated<Record<string, unknown>>;
    /** Default to the widget's own size. */
    width?: DashboardSize;
    rows?: number;
}
export interface BlueprintGroup {
    title?: Templated<string>;
    size?: DashboardSize;
    bordered?: boolean;
    widgets: (Templated<BlueprintWidget> & BlueprintRepeat)[];
}
export interface BlueprintDashboard {
    /** A dashboard of the project to add the groups to; when none has this id, a new one is created. */
    target?: Templated<string>;
    name: Templated<string>;
    groups: (Templated<BlueprintGroup> & BlueprintRepeat)[];
}
/**
 * Asks a few questions over pages, then adds automations, integrations and dashboards to the project, filled in with
 * the answers. Everything is data, so the Studio renders it.
 */
export interface BlueprintDefinition {
    /** Namespaced by the plugin, like steps (`iot.mirror-device`). */
    id: string;
    name: string;
    description: string;
    icon?: string;
    /** Groups the list of blueprints. */
    category?: string;
    requires?: FeatureRequirements;
    pages: BlueprintPage[];
    automations?: (BlueprintAutomation & BlueprintRepeat)[];
    runners?: (BlueprintRunner & BlueprintRepeat)[];
    dashboards?: (BlueprintDashboard & BlueprintRepeat)[];
}
export type BlueprintManifest = Pick<BlueprintDefinition, 'id' | 'name' | 'description' | 'icon' | 'category' | 'pages'>;
export declare const defineBlueprint: (definition: BlueprintDefinition) => BlueprintDefinition;
/** The answers, by page id and field. */
export type BlueprintAnswers = Record<string, Record<string, unknown>>;
export {};
