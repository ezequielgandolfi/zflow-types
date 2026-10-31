import type { ColorBand } from './appearance.js';
import type { SeriesPoint } from './storage.js';
import type { TimeRange } from './widget.js';
/** What a widget returns to be rendered by the core "templates.stat" template. */
export interface StatData {
    label: string;
    /** Lucide icon name in kebab-case. */
    icon?: string;
    /** Null when there's nothing to show yet. */
    value: number | string | boolean | null;
    unit?: string;
    /** Where the value came from, such as a device; shown under it. */
    source?: string;
    /** When the value arrived, in ms since epoch. */
    at?: number;
    /** The value is too old to trust, so it's shown dimmed. */
    stale?: boolean;
    /** A CSS named color for the value, usually picked by the widget's "Colors" rules. */
    color?: string;
}
/** What a widget returns to be rendered by the core "templates.series" template. */
export interface SeriesData extends StatData {
    points: SeriesPoint[];
    min: number | null;
    max: number | null;
    /** The range the points cover. */
    range: TimeRange;
    /** Lets viewers pick another range, which reaches `data()` as `ctx.range`. */
    rangePicker?: boolean;
}
/** What a widget returns to be rendered by the core "templates.timeline" template: the latest entries first. */
export interface TimelineData {
    label: string;
    icon?: string;
    unit?: string;
    /** Shown when there are no entries; "Nothing yet" without it. */
    empty?: string;
    /** The latest first. */
    entries: TimelineEntry[];
}
export interface TimelineEntry {
    at: number;
    /** What happened, like an automation's name; the value follows it. */
    title?: string;
    value: StatData['value'];
    /** Shown on the entry's dot, in its color. */
    icon?: string;
    /** Details under it, like who sent it or how long it took. */
    source?: string;
    color?: string;
}
/** What a widget returns to be rendered by the core "templates.toggle" template, which calls its "set" action. */
export interface ToggleData {
    label: string;
    icon?: string;
    /** Null when the state isn't known yet. */
    on: boolean | null;
    /** What the state reads as, like "On" or "Open"; "On" and "Off" without it. */
    text?: string;
    source?: string;
    at?: number;
    stale?: boolean;
}
/** The input of the "set" action that widgets rendered by "templates.toggle" implement. */
export interface ToggleInput {
    on: boolean;
}
/** What a widget returns to be rendered by the core "templates.state" template. */
export interface StateData {
    label: string;
    icon?: string;
    /** Null when there's nothing to compare yet. */
    matched: boolean | null;
    /** What the state reads as, such as "Open". */
    text: string;
    stateIcon?: string;
    color?: string;
    source?: string;
    at?: number;
    stale?: boolean;
}
/** What a widget returns to be rendered by the core "templates.gauge" template. */
export interface GaugeData extends StatData {
    min: number;
    max: number;
    /** Colored sections of the arc, from `colorBands`. */
    bands: ColorBand[];
}
/** What a widget returns to be rendered by the core "templates.values" template. */
export interface ValuesData {
    label: string;
    icon?: string;
    entries: {
        label: string;
        icon?: string;
        value: StatData['value'];
        unit?: string;
        color?: string;
    }[];
    source?: string;
    at?: number;
    stale?: boolean;
}
/** What a widget returns to be rendered by the core "templates.forecast" template. */
export interface ForecastData {
    label: string;
    /** Like "°C". */
    unit: string;
    current: {
        temperature: number;
        icon: string;
        text: string;
        color?: string;
    };
    days: {
        date: string;
        icon: string;
        text: string;
        high: number;
        low: number;
    }[];
}
