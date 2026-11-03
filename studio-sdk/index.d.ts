import type { DashboardSize, PluginManifest, PropertySchema, PropertyValue, TimeRange, TransformValue } from '@zflow/sdk';
import type { AnchorHTMLAttributes, ComponentType, ReactNode } from 'react';
/** A page in the left navigation; the Plugins page lists them under the plugin with their label and description. */
export interface NavEntry {
    id: string;
    label: string;
    /** One plain sentence on what the page is for. */
    description: string;
    /** Lucide icon name in kebab-case, e.g. "folder-tree". */
    icon: string;
    path: string;
    /** Lower comes first; entries without an order go last. */
    order?: number;
}
export interface StudioRoute {
    /** Absolute path, with `:name` parameters read by `useRoute`; prefix it with the plugin id, e.g. "/hello/:id". */
    path: string;
    Component: ComponentType;
}
export interface WidgetProps<Data = unknown> {
    config: Record<string, unknown>;
    /** What the widget's `data()` returned in studio-server; undefined while it loads. */
    data: Data | undefined;
    size: {
        width: DashboardSize;
        rows: number;
    };
    onAction?: WidgetAction;
}
/**
 * Runs one of the widget's `actions` on a published dashboard, then loads its data again. Undefined in the dashboard
 * editor, where controls show disabled. Failures are shown to the viewer and resolve with `ok: false`.
 */
export type WidgetAction = (name: string, input?: unknown) => Promise<{
    ok: boolean;
    result?: unknown;
}>;
/** What a widget template renders: a widget's `data()`, whichever widget it comes from. */
export interface TemplateProps<Data = unknown> {
    data: Data | undefined;
    size: {
        width: DashboardSize;
        rows: number;
    };
    /** Loads the widget's data again for another range; it's the viewer's own choice and isn't saved. */
    onRangeChange: (range: TimeRange) => void;
    onAction?: WidgetAction;
}
/** The pages plugins can add sections to, with the props each page passes its sections. */
export interface SectionSlots {
    /** After the automations and runners. */
    project: {
        projectId: string;
    };
    /** After the engine settings. */
    admin: Record<string, never>;
}
export type SectionSlot = keyof SectionSlots;
/** A collapsible card on one of the Studio's pages; the Studio renders its header and remembers if it's open. */
export interface StudioSection<Props = Record<string, never>> {
    /** Unique within the page. */
    id: string;
    title: string;
    /** One plain sentence on what the section is for, shown on the Plugins page. */
    description: string;
    /** Lucide icon name in kebab-case, shown beside the title; a puzzle piece without it. */
    icon?: string;
    /** Lower comes first. */
    order?: number;
    Component: ComponentType<Props>;
}
/**
 * A card on the Overview page, the Studio's start page: a short summary of what's going on, linking to where it's
 * handled. The Studio renders its header; viewers can move and hide cards in the page's edit mode.
 */
export interface OverviewCard {
    /** Unique across plugins; prefix it with the plugin id, e.g. "zigbee.network". */
    id: string;
    title: string;
    /** One plain sentence on what the card shows, on the Plugins page and for hidden cards in edit mode. */
    description: string;
    /** Lucide icon name in kebab-case, shown beside the title; a puzzle piece without it. */
    icon?: string;
    /** A third, half or the whole width of the page; small without it. */
    width?: DashboardSize;
    /** Where it goes until the viewer moves it; lower comes first. */
    order?: number;
    /**
     * The body's height in pixels, enough for its fullest content (every row of a list it caps), so the layout doesn't
     * shift as data comes and goes; it scrolls past that. Without it, the body is as tall as its content.
     */
    height?: number;
    /** The card's body; header buttons and links go inside `SectionActions`. */
    Component: ComponentType;
}
/** A step that runs before the one being edited, with the values it offers to later steps. */
export interface ValueSource {
    nodeId: string;
    label: string;
    properties: {
        name: string;
        label: string;
    }[];
}
export interface ValueEditorProps {
    schema: PropertySchema;
    value: PropertyValue | undefined;
    sources: ValueSource[];
    onChange: (value: PropertyValue | undefined) => void;
}
/** Edits a transformed value instead of the Studio's form of its settings, for transforms that need their own. */
export interface TransformEditorProps {
    /** Goes on the main input, which the setting's label points to. */
    id: string;
    value: TransformValue;
    sources: ValueSource[];
    onChange: (value: TransformValue) => void;
    /** The Studio's editor for one setting, for the values inside the transform. */
    ValueEditor: ComponentType<ValueEditorProps>;
}
/** What a plugin adds to the Studio: navigation entries and pages, page sections, Overview cards, widgets and templates. */
export interface StudioPlugin {
    id: string;
    navEntries?: NavEntry[];
    routes?: StudioRoute[];
    sections?: {
        [Slot in SectionSlot]?: StudioSection<SectionSlots[Slot]>[];
    };
    overview?: {
        cards?: OverviewCard[];
    };
    automations?: {
        /** Editors of the plugin's transforms, keyed by transform id; the others get a form of their settings. */
        transformEditors?: Record<string, ComponentType<TransformEditorProps>>;
    };
    dashboards?: {
        /** Components of the plugin's widgets, keyed by the widget id declared in its `definePlugin`. */
        widgets?: Record<string, ComponentType<WidgetProps<never>>>;
        /** Components of the plugin's widget templates, keyed by the template id declared in its `definePlugin`. */
        templates?: Record<string, ComponentType<TemplateProps<never>>>;
    };
    /** Components for other plugins' pages to render, like the Devices plugin's device page; see `studioPart`. */
    parts?: Record<string, ComponentType<never>>;
}
export declare const defineStudioPlugin: (plugin: StudioPlugin) => StudioPlugin;
export interface SettingsFormProps {
    schema: Record<string, PropertySchema>;
    values: Record<string, unknown>;
    onChange: (values: Record<string, unknown>) => void;
    /** What `format: 'automation'` settings pick from; without it, they're plain text fields. */
    automations?: AutomationChoice[];
    /** The project being edited, for `optionsFrom` sources computed from it (such as a runner's values). */
    projectId?: string;
}
export interface AutomationChoice {
    value: string;
    label: string;
    triggerType: string;
}
/** The bar at the top of every page, with its title, an optional back button and the page's actions. */
export interface PageHeaderProps {
    /** A string becomes the page's heading; pass an element for an editable name. */
    title: ReactNode;
    subtitle?: ReactNode;
    /** Pages below another one go back to it; top-level pages have none. */
    back?: {
        to: string;
        label: string;
    };
    /** Buttons and chips on the right of the bar; on phones they're listed in a "…" menu, `Menu`s inside included. */
    actions?: ReactNode;
}
export interface PageProps extends PageHeaderProps {
    /** Up to 1400px instead of 960px, for dashboards. */
    wide?: boolean;
    children?: ReactNode;
}
/** A link to a Studio page, drawn as an `<a>`; it changes pages without reloading the Studio. */
export interface StudioLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    /** An absolute Studio path, e.g. "/zigbee/devices/0x00124b". */
    to: string;
    /** Takes the current page's place in the history instead of adding one. */
    replace?: boolean;
}
/** Goes to another Studio page, as a `StudioLink` would. */
export type StudioNavigate = (to: string, options?: {
    replace?: boolean;
}) => void;
/** The page being shown: its path parameters (a route's `:projectId`) and query (`?fullscreen`). */
export interface StudioRouteInfo {
    params: Readonly<Record<string, string | undefined>>;
    query: URLSearchParams;
}
/** Who is using the Studio: the admin, or a viewer that opened a share link, who only reaches that dashboard. */
export type StudioSession = {
    kind: 'admin';
} | {
    kind: 'share';
    projectId: string;
    dashboardId: string;
    allowActions: boolean;
};
export interface DataTableColumn<Row> {
    label: string;
    /** Right-aligned, for numbers. */
    numeric?: boolean;
    render: (row: Row) => ReactNode;
}
/** A table on wide screens and a card per row on phones, with the first column as the card's title. */
export interface DataTableProps<Row> {
    columns: DataTableColumn<Row>[];
    rows: Row[];
    rowKey: (row: Row) => string;
}
export interface FieldProps {
    label: string;
    /** Help shown as a tooltip on an info icon beside the label. */
    hint?: string | undefined;
    required?: boolean;
    /** A short line under the control, for a state such as "Connected"; `error` replaces it. */
    help?: ReactNode;
    error?: string | undefined;
    /** Takes a whole row of a `settings-form` (a list, a long text). */
    wide?: boolean;
    /** The control; as a function, it gets the id that links it to the label. */
    children: ReactNode | ((id: string) => ReactNode);
}
export interface SwitchProps {
    id?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    /** Names it for screen readers when no label is beside it, as in a row of devices. */
    label?: string;
    /** Why it's disabled, or what it does, as a tooltip. */
    title?: string | undefined;
    /** The text beside it when on and off ("On" and "Off" by default); `false` shows none. */
    labels?: [on: string, off: string] | false;
    /** Text beside it that doesn't change with the state ("Show a border"), instead of `labels`. */
    children?: ReactNode;
}
export interface MenuItemProps {
    icon: string;
    children: ReactNode;
    /** For actions that delete or can't be undone. */
    danger?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    /** Makes the item a link, such as a download. */
    href?: string;
    download?: boolean;
}
export interface SearchOption {
    value: string;
    label: string;
    description?: string;
    /** Options with a group are listed under its name. */
    group?: string;
    icon?: string;
    /** A CSS color shown as a swatch instead of the icon. */
    swatch?: string;
}
export interface SearchSelectProps {
    id?: string;
    value: string;
    options: SearchOption[];
    /** Names the control for screen readers. */
    label: string;
    /** Shown when `value` isn't among the options. */
    missingLabel?: string;
    onChange: (value: string) => void;
}
export interface DialogProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
}
export interface ShareDialogProps {
    projectId: string;
    dashboardId: string;
    onClose: () => void;
}
/** Parts of the Studio that plugin pages reuse, so they look and behave like the core pages. */
export interface StudioHost {
    session: StudioSession;
    /** Every Studio module that loaded, core included. */
    plugins: StudioPlugin[];
    /** Manifests of the installed plugins; empty when the server couldn't be reached. */
    catalog: PluginManifest[];
    /** A page with the Studio's header bar; full-screen editors use `PageHeader` above their own layout. */
    Page: ComponentType<PageProps>;
    PageHeader: ComponentType<PageHeaderProps>;
    SettingsForm: ComponentType<SettingsFormProps>;
    /** A collapsible section of settings, like the ones `group` creates in `SettingsForm`. */
    SettingsGroup: ComponentType<{
        title: string;
        children: ReactNode;
    }>;
    /**
     * A card the viewer can collapse, remembered under `storageKey`; the body unmounts while collapsed. Header buttons go
     * inside `SectionActions`.
     */
    CollapsibleCard: ComponentType<{
        storageKey: string;
        title: string;
        icon: string;
        collapsed?: boolean | undefined;
        children: ReactNode;
    }>;
    Icon: ComponentType<{
        name: string | undefined;
        size?: number;
    }>;
    /** A field's help text, as a tooltip on an info icon; put it inside the field's label. */
    FieldHint: ComponentType<{
        text: string | undefined;
    }>;
    EmptyState: ComponentType<{
        icon: string;
        title: string;
        children?: ReactNode;
        action?: ReactNode;
    }>;
    useToast: () => (tone: 'success' | 'warning' | 'error', message: string) => void;
    /** Renders its children in the header of the section it's used in, such as a "New dashboard" button. */
    SectionActions: ComponentType<{
        children: ReactNode;
    }>;
    /** Creates a link that opens a published dashboard without logging in. Mount it to open it. */
    ShareDialog: ComponentType<ShareDialogProps>;
    /** A row's buttons, in a line on wide screens and in a "…" menu on phones. */
    RowActions: ComponentType<{
        label?: string;
        children: ReactNode;
    }>;
    DataTable: <Row>(props: DataTableProps<Row>) => ReactNode;
    /** A labelled field for forms `SettingsForm` can't describe; place it inside a `settings-form`. */
    Field: ComponentType<FieldProps>;
    Switch: ComponentType<SwitchProps>;
    /** A "…" button listing less common actions (`MenuItem`s); on phones, inside the header's menu, it lists them there. */
    Menu: ComponentType<{
        label: string;
        children: ReactNode;
    }>;
    MenuItem: ComponentType<MenuItemProps>;
    /** A modal over the page with a title and a close button; Esc and a click outside close it. Mount it to open it. */
    Dialog: ComponentType<DialogProps>;
    /** A dropdown with a filter and keyboard navigation, for lists too long for a plain `<select>`. */
    SearchSelect: ComponentType<SearchSelectProps>;
    /** Whether the window is phone-sized (720px or less), for layouts the shared styles can't adapt on their own. */
    useNarrowScreen: () => boolean;
    /** Navigation goes through these, so plugins don't depend on the Studio's router. */
    Link: ComponentType<StudioLinkProps>;
    useNavigate: () => StudioNavigate;
    useRoute: () => StudioRouteInfo;
    /** While `dirty`, asks with `message` before leaving for another page, and the browser asks before closing it. */
    useLeaveGuard: (dirty: boolean, message: string) => void;
}
/** Set once by the Studio before it renders, after every plugin module has loaded. */
export declare function publishStudioHost(host: StudioHost): void;
export declare function studioHost(): StudioHost;
/** A part another plugin shares (`parts` in its Studio module), or undefined when that plugin's module isn't loaded. */
export declare function studioPart<Props>(pluginId: string, name: string): ComponentType<Props> | undefined;
/** Query keys of the Studio's project data; invalidate `draftQueryKeys` after changing a project's draft. */
export declare const queryKeys: {
    catalog: readonly ["catalog"];
    projects: readonly ["projects"];
    project: (id: string) => readonly ["project", string];
    issues: (id: string) => readonly ["issues", string];
    changes: (id: string) => readonly ["changes", string];
    /** Choices of `optionsFrom` sources; plugin pages that change their settings invalidate `['options']`. */
    options: (projectId: string | undefined, source: string, values?: Record<string, unknown>) => readonly ["options", string, string, Record<string, unknown>];
};
export declare const draftQueryKeys: (projectId: string) => (readonly ["projects"] | readonly ["project", string] | readonly ["issues", string] | readonly ["changes", string] | string[])[];
/**
 * Modules a plugin's Studio code shares with the Studio instead of bundling its own copy, so hooks, routing and
 * queries use the same React tree. The Studio publishes them on `globalThis[SHARED_MODULES_GLOBAL]`.
 */
export declare const SHARED_MODULES: readonly ["react", "react/jsx-runtime", "react-dom", "react-router", "@tanstack/react-query", "@zflow/studio-sdk"];
export type SharedModule = (typeof SHARED_MODULES)[number];
export declare const SHARED_MODULES_GLOBAL = "__zflowShared";
