export type ColumnType = 'text' | 'number' | 'json';
export interface TableSchema {
    columns: Record<string, ColumnType>;
    /** Columns to index, besides the timestamp. */
    indexes?: string[];
    /** Columns that identify a row, so `put` replaces the row with the same values instead of adding one. */
    key?: string[];
}
/** Every table has an `id` and an `at` timestamp (ms since epoch) besides its own columns. */
export interface StoredRow {
    id: number;
    at: number;
    [column: string]: unknown;
}
export interface RowFilter {
    since?: number;
    until?: number;
    /** Exact matches on columns. */
    where?: Record<string, string | number>;
}
export interface RowQuery extends RowFilter {
    limit?: number;
    order?: 'asc' | 'desc';
}
export type AggregateFunction = 'min' | 'max' | 'avg' | 'sum' | 'count';
export interface AggregateQuery extends RowFilter {
    fn: AggregateFunction;
    column: string;
    /** Dot path inside a json column, e.g. "sensors.temperature". */
    path?: string;
}
export interface SeriesQuery extends Omit<AggregateQuery, 'fn' | 'since' | 'until'> {
    since: number;
    until: number;
    /** The window is split into this many equal buckets; empty buckets are left out. */
    buckets: number;
    /** How each bucket's rows are combined; avg without it. */
    fn?: Exclude<AggregateFunction, 'count'>;
}
export interface SeriesPoint {
    /** The middle of the bucket. */
    at: number;
    value: number;
}
export interface StorageTable {
    insert(row: Record<string, unknown>, at?: number): void;
    /** Inserts the row, or replaces the one with the same `key` columns; the table needs a `key`. */
    put(row: Record<string, unknown>, at?: number): void;
    rows(query?: RowQuery): StoredRow[];
    /** `count` counts the rows with a value; the others return null when there's nothing to aggregate. */
    aggregate(query: AggregateQuery): number | null;
    /** An aggregate per bucket of time, for charts. Values that aren't numbers are left out. */
    series(query: SeriesQuery): SeriesPoint[];
    deleteBefore(at: number): number;
    /** Deletes the rows that match; returns how many. */
    delete(filter: RowFilter): number;
}
/** Tables namespaced by the host, so plugins can't clash. */
export interface TableStorage {
    /** Creates the table when missing; without a schema, the table must already exist. */
    table(name: string, schema?: TableSchema): StorageTable;
    tables(): string[];
    /** Deletes the table with all its rows; nothing happens when it doesn't exist. */
    drop(name: string): void;
}
/** Tables owned by one plugin. */
export interface PluginStorage extends TableStorage {
    /** The plugin's tables for one project; the host drops them when the project is deleted. */
    project(projectId: string): TableStorage;
    /** The tables of a plugin this one depends on, such as a registry it builds on. */
    of(pluginId: string): PluginStorage;
}
