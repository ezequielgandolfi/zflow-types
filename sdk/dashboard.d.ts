/** Small, medium or large: a third, half or all of the dashboard for a group, 3, 6 or 12 of its columns for a widget. */
export type DashboardSize = 'small' | 'medium' | 'large';
export interface WidgetInstance {
    id: string;
    type: string;
    config: Record<string, unknown>;
    width: DashboardSize;
    rows: number;
}
export interface DashboardGroup {
    id: string;
    title?: string;
    /** Its width on wide screens; on narrow ones groups take more room. Defaults to small. */
    size?: DashboardSize;
    bordered?: boolean;
    widgets: WidgetInstance[];
}
export interface DashboardDefinition {
    id: string;
    name: string;
    groups: DashboardGroup[];
}
export declare const DASHBOARD_SIZES: DashboardSize[];
/** Every group is a 12-column grid. */
export declare const DASHBOARD_COLUMNS = 12;
/** Widgets are 1 to this many rows tall. */
export declare const WIDGET_MAX_ROWS = 10;
export declare const WIDGET_COLUMNS: Record<DashboardSize, number>;
