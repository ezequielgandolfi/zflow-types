/** How values read as text: in templates, text settings and comparisons. Objects become JSON. */
export function toText(value) {
    if (value === undefined || value === null)
        return '';
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
        return value.toString();
    return JSON.stringify(value) ?? '';
}
