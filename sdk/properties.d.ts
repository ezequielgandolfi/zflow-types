export type PropertyType = 'string' | 'number' | 'boolean' | 'object' | 'any' | 'enum' | 'list';
export interface PropertyOption {
    value: string;
    label: string;
}
export interface PropertySchema {
    type: PropertyType;
    label: string;
    description?: string;
    default?: unknown;
    options?: PropertyOption[];
    /** Loads the options at runtime from a plugin's option source, written as "<plugin id>.<source>". */
    optionsFrom?: string;
    /** Sibling settings the `optionsFrom` choices depend on: the source gets their values, and the Studio reloads them. */
    optionsDependOn?: string[];
    readOnly?: boolean;
    required?: boolean;
    /** The settings of each row of a `list`, whose value is an array of objects. */
    items?: Record<string, PropertySchema>;
    /** Shows the setting in the Studio only while each named sibling setting holds one of the listed values. */
    visibleWhen?: Record<string, unknown[]>;
    /** Settings sharing a group are shown together in a section that starts collapsed. */
    group?: string;
    /** Asks the Studio for a specialised editor; the value is still a plain `type` value. */
    /**
     * `automation` is a string holding the id of an automation that other automations can start, and `icon` a string
     * holding a Lucide icon name (kebab-case), `color` a string holding a CSS named color, and `transform` an `any`
     * holding a `TransformValue` that widgets apply to their data's value.
     */
    format?: 'cron' | 'automation' | 'icon' | 'color' | 'transform';
    /** Lets a `format: 'automation'` setting pick any automation, not only those other automations can start. */
    anyAutomation?: boolean;
}
export type PropertyValue = {
    kind: 'literal';
    value: unknown;
} | {
    kind: 'ref';
    nodeId: string;
    property: string;
    path?: string;
} | {
    kind: 'transform';
    transform: string;
    properties: Record<string, PropertyValue>;
};
export type TransformValue = Extract<PropertyValue, {
    kind: 'transform';
}>;
export declare const literal: (value: unknown) => PropertyValue;
export declare const ref: (nodeId: string, property: string, path?: string) => PropertyValue;
export declare const transformed: (transform: string, properties?: Record<string, PropertyValue>) => TransformValue;
export declare const isTransformValue: (value: unknown) => value is TransformValue;
