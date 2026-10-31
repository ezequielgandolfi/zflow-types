import type { PropertyOption, PropertySchema } from './properties.js';
export type ConditionOperator = 'equal' | 'not-equal' | 'greater' | 'greater-or-equal' | 'less' | 'less-or-equal' | 'between';
/** A check on a value, as set up in a widget's settings. Numbers compare as numbers, anything else as text. */
export interface Condition {
    when: ConditionOperator;
    value?: string;
    /** The upper bound of `between`, included. */
    to?: string;
}
export interface ColorRule extends Condition {
    /** A CSS named color. */
    color: string;
}
export interface ColorBand {
    from: number;
    to: number;
    color: string;
}
export declare const CONDITION_OPTIONS: PropertyOption[];
/** The settings of a `Condition`, to spread into a widget's properties or a list's items. */
export declare const conditionProperties: Record<string, PropertySchema>;
/** A widget's "Colors" setting; widgets with `appearance` get it under that name. */
export declare const colorRulesProperty: PropertySchema;
/** The ref a widget's "Display as" transform reads the value through. */
export declare const WIDGET_VALUE: {
    readonly nodeId: "widget";
    readonly property: "value";
};
/** A widget's "Display as" setting; widgets with `appearance` get it under the name `display`. */
export declare const displayProperty: PropertySchema;
export declare function matches(condition: Condition, value: unknown): boolean;
export declare const matchColor: (rules: readonly ColorRule[] | undefined, value: unknown) => string | undefined;
/** The colors rules give across a numeric range, as bands, for gauges and scales. */
export declare function colorBands(rules: readonly ColorRule[] | undefined, min: number, max: number, steps?: number): ColorBand[];
/** Colors the `value` of a widget's data with its "Colors" setting, unless the widget picked a color itself. */
export declare function applyAppearance(data: unknown, config: Record<string, unknown>): unknown;
export declare const CSS_COLORS: string[];
