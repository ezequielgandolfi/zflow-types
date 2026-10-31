import { toText } from "./text.js";
export const CONDITION_OPTIONS = [
    { value: 'equal', label: 'Is equal to' },
    { value: 'not-equal', label: 'Is not equal to' },
    { value: 'greater', label: 'Is greater than' },
    { value: 'greater-or-equal', label: 'Is greater than or equal to' },
    { value: 'less', label: 'Is less than' },
    { value: 'less-or-equal', label: 'Is less than or equal to' },
    { value: 'between', label: 'Is between' },
];
/** The settings of a `Condition`, to spread into a widget's properties or a list's items. */
export const conditionProperties = {
    when: { type: 'enum', label: 'When the value', default: 'equal', options: CONDITION_OPTIONS },
    value: { type: 'string', label: 'Compare with' },
    to: { type: 'string', label: 'And', description: 'Only for "Is between"' },
};
/** A widget's "Colors" setting; widgets with `appearance` get it under that name. */
export const colorRulesProperty = {
    type: 'list',
    label: 'Colors',
    description: 'The first rule that matches the value picks its color',
    group: 'Appearance',
    items: { ...conditionProperties, color: { type: 'string', format: 'color', label: 'Color', required: true } },
};
/** The ref a widget's "Display as" transform reads the value through. */
export const WIDGET_VALUE = { nodeId: 'widget', property: 'value' };
/** A widget's "Display as" setting; widgets with `appearance` get it under the name `display`. */
export const displayProperty = {
    type: 'any',
    format: 'transform',
    label: 'Display as',
    description: 'Changes how the value reads, like rounding it or adding text. Colors still use the original value',
    group: 'Appearance',
};
const asNumber = (value) => {
    if (typeof value === 'number')
        return value;
    if (typeof value !== 'string' || value.trim() === '')
        return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
};
function order(left, right) {
    const [a, b] = [asNumber(left), asNumber(right)];
    if (a !== undefined && b !== undefined)
        return a - b;
    return toText(left).localeCompare(toText(right));
}
export function matches(condition, value) {
    if (value === undefined || value === null)
        return false;
    const against = condition.value ?? '';
    switch (condition.when) {
        case 'equal':
            return order(value, against) === 0;
        case 'not-equal':
            return order(value, against) !== 0;
        case 'greater':
            return order(value, against) > 0;
        case 'greater-or-equal':
            return order(value, against) >= 0;
        case 'less':
            return order(value, against) < 0;
        case 'less-or-equal':
            return order(value, against) <= 0;
        case 'between':
            return order(value, against) >= 0 && order(value, condition.to ?? '') <= 0;
    }
}
export const matchColor = (rules, value) => rules?.find((rule) => matches(rule, value))?.color;
/** The colors rules give across a numeric range, as bands, for gauges and scales. */
export function colorBands(rules, min, max, steps = 100) {
    const bands = [];
    if (!rules?.length || !(max > min))
        return bands;
    const step = (max - min) / steps;
    let previous;
    for (let index = 0; index <= steps; index++) {
        const color = matchColor(rules, min + index * step);
        // Each sample covers half a step on each side, so bands meet halfway between samples.
        const from = Math.max(min, min + (index - 0.5) * step);
        const to = Math.min(max, min + (index + 0.5) * step);
        if (color && color === previous)
            bands.at(-1).to = to;
        else if (color)
            bands.push({ from, to, color });
        previous = color;
    }
    return bands;
}
/** Colors the `value` of a widget's data with its "Colors" setting, unless the widget picked a color itself. */
export function applyAppearance(data, config) {
    if (data === null || typeof data !== 'object' || Array.isArray(data) || !('value' in data))
        return data;
    if ('color' in data && data.color !== undefined)
        return data;
    const color = matchColor(config.colors, data.value);
    return color ? { ...data, color } : data;
}
export const CSS_COLORS = [
    'aliceblue',
    'antiquewhite',
    'aqua',
    'aquamarine',
    'azure',
    'beige',
    'bisque',
    'black',
    'blanchedalmond',
    'blue',
    'blueviolet',
    'brown',
    'burlywood',
    'cadetblue',
    'chartreuse',
    'chocolate',
    'coral',
    'cornflowerblue',
    'cornsilk',
    'crimson',
    'cyan',
    'darkblue',
    'darkcyan',
    'darkgoldenrod',
    'darkgray',
    'darkgreen',
    'darkgrey',
    'darkkhaki',
    'darkmagenta',
    'darkolivegreen',
    'darkorange',
    'darkorchid',
    'darkred',
    'darksalmon',
    'darkseagreen',
    'darkslateblue',
    'darkslategray',
    'darkslategrey',
    'darkturquoise',
    'darkviolet',
    'deeppink',
    'deepskyblue',
    'dimgray',
    'dimgrey',
    'dodgerblue',
    'firebrick',
    'floralwhite',
    'forestgreen',
    'fuchsia',
    'gainsboro',
    'ghostwhite',
    'gold',
    'goldenrod',
    'gray',
    'green',
    'greenyellow',
    'grey',
    'honeydew',
    'hotpink',
    'indianred',
    'indigo',
    'ivory',
    'khaki',
    'lavender',
    'lavenderblush',
    'lawngreen',
    'lemonchiffon',
    'lightblue',
    'lightcoral',
    'lightcyan',
    'lightgoldenrodyellow',
    'lightgray',
    'lightgreen',
    'lightgrey',
    'lightpink',
    'lightsalmon',
    'lightseagreen',
    'lightskyblue',
    'lightslategray',
    'lightslategrey',
    'lightsteelblue',
    'lightyellow',
    'lime',
    'limegreen',
    'linen',
    'magenta',
    'maroon',
    'mediumaquamarine',
    'mediumblue',
    'mediumorchid',
    'mediumpurple',
    'mediumseagreen',
    'mediumslateblue',
    'mediumspringgreen',
    'mediumturquoise',
    'mediumvioletred',
    'midnightblue',
    'mintcream',
    'mistyrose',
    'moccasin',
    'navajowhite',
    'navy',
    'oldlace',
    'olive',
    'olivedrab',
    'orange',
    'orangered',
    'orchid',
    'palegoldenrod',
    'palegreen',
    'paleturquoise',
    'palevioletred',
    'papayawhip',
    'peachpuff',
    'peru',
    'pink',
    'plum',
    'powderblue',
    'purple',
    'rebeccapurple',
    'red',
    'rosybrown',
    'royalblue',
    'saddlebrown',
    'salmon',
    'sandybrown',
    'seagreen',
    'seashell',
    'sienna',
    'silver',
    'skyblue',
    'slateblue',
    'slategray',
    'slategrey',
    'snow',
    'springgreen',
    'steelblue',
    'tan',
    'teal',
    'thistle',
    'tomato',
    'turquoise',
    'violet',
    'wheat',
    'white',
    'whitesmoke',
    'yellow',
    'yellowgreen',
];
