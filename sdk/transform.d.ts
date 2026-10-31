import type { Props, VarStore } from './component.js';
import type { Logger } from './logger.js';
import type { PropertySchema, PropertyType } from './properties.js';
export interface TransformContext {
    /** The transform's own settings, resolved and coerced to their declared types. */
    readonly props: Props;
    readonly vars: VarStore;
    readonly globals: VarStore;
    readonly signal: AbortSignal;
    readonly logger: Logger;
}
/** Turns values into the value of a step setting; the Studio offers it as "Transformed value". */
export interface TransformDefinition {
    /** Namespaced by the plugin, e.g. "custom.c-to-f". */
    id: string;
    name: string;
    /** One plain sentence, shown when picking a transform. */
    description: string;
    /** Groups the transforms in the picker. */
    category?: string;
    icon?: string;
    properties: Record<string, PropertySchema>;
    /** Accepts settings besides `properties`, named by whoever sets the transform up, all of this schema. */
    extraProperties?: PropertySchema;
    /** The type it produces; the Studio only offers it for settings of that type (or `any`). Any type without it. */
    returns?: PropertyType;
    apply(ctx: TransformContext): unknown;
}
export type TransformManifest = Omit<TransformDefinition, 'apply'>;
/** The schemas of a transform's settings as set up in `values`, extra settings included. */
export declare function transformSettings(transform: Pick<TransformDefinition, 'properties' | 'extraProperties'>, values: Record<string, unknown>): Record<string, PropertySchema>;
export declare const defineTransform: (definition: TransformDefinition) => TransformDefinition;
