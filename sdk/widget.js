import { colorRulesProperty, displayProperty } from "./appearance.js";
export const defineWidget = (definition) => definition.appearance
    ? { ...definition, properties: { ...definition.properties, colors: colorRulesProperty, display: displayProperty } }
    : definition;
export const defineWidgetTemplate = (definition) => definition;
export function rangeBounds(range, now = Date.now()) {
    return 'minutes' in range
        ? { since: now - range.minutes * 60_000, until: now }
        : { since: range.from, until: range.to };
}
