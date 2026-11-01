# Writing a zflow plugin

<!-- Generated from zflow's AGENTS.md: edit it there. -->

> This is the guide zflow's own developers follow. Paths such as `packages/…`, `apps/…` and `examples/…` are in
> zflow's repo, which isn't public, and only say where things live. The contracts are in `sdk/` and `studio-sdk/`
> here, and `template/` is the example to start from.

Start by copying `template/`. To write one in its own repo and publish it so others install it from the
Plugins page, see [the plugin kit](README.md). A plugin is a folder whose `package.json` `main` points at a
module whose default export is a `definePlugin(...)`:

```ts
import { defineComponent, definePlugin } from '@zflow/sdk';

export default definePlugin({
  id: 'weather', // unique, also the key in project files' "plugins"
  name: 'Weather',
  version: '1.0.0', // semver; projects require ^this version
  description: 'Adds steps that look up the weather', // one plain sentence, shown on the Plugins page
  dependencies: { templates: '0.1.0' }, // optional: plugin ids with the minimum version of each
  automations: { components: [/* steps */], runners: [/* runners */], transforms: [/* transforms */] },
  dashboards: { widgets: [/* widgets */], templates: [/* widget templates */] },
  settings: { defaults: {} /* validate, redact, prepare, options */ },
  studio: './studio.tsx', // optional, relative to this file
});
```

- **Scopes:** fields are grouped by area (`automations`, `dashboards`, `settings`) so new areas can't clash; the
  Studio side mirrors it (`dashboards: { widgets, templates }`).
- **Dependencies:** declare the plugins whose steps, widgets, templates, services or tables yours relies on. Loading
  fails when one is missing, older than the minimum or when dependencies go round in a circle, and the Plugins page
  lists them. Only dependencies can be reached: `ctx.service(id)`, `storage.of(id)` and `ctx.command(name, input, id)`
  refuse any other plugin.
- **Ids:** component ids are namespaced by the plugin (`weather.forecast`). Duplicate component ids or runner types
  across plugins are rejected at load time.
- **Imports:** `@zflow/sdk` resolves to the host's copy, so a plugin folder needs no `node_modules` for it. Any other
  runtime dependency must be installed inside the plugin folder.
- **Try it:** `PLUGINS_DIR=/abs/path/to/plugins pnpm dev`. Both the engine and studio-server load the plugin, so
  restart both after changing server-side code.
- **Testing:** test steps with `testAutomation`/`testHarness` from `@zflow/engine/testing`. See
  `examples/plugins/hello/test/greet.test.ts`.
- **Workspace types:** inside this repo, `examples/plugins/*` are workspace packages, so they get types from
  `devDependencies`.

## A step (component)

```ts
export const forecast = defineComponent({
  id: 'weather.forecast',
  name: 'Get forecast', // shown in the list of steps
  description: 'Looks up tomorrow’s forecast for a city', // one plain sentence
  category: 'Weather', // groups the list of steps; core uses Start, State, Logic, Flow control, Log, End
  icon: 'cloud-sun', // lucide icon name (kebab-case)
  inputMode: 'single', // 'none' = start step, 'single' = runs per token, 'multi' = stateful onSignal
  outputs: [{ name: 'ok' }], // add { name, label, color } for custom branches
  properties: {
    city: { type: 'string', label: 'City', required: true },
    unit: {
      type: 'enum',
      label: 'Unit',
      default: 'c',
      options: [
        { value: 'c', label: 'Celsius' },
        { value: 'f', label: 'Fahrenheit' },
      ],
    },
    temperature: { type: 'number', label: 'Temperature', readOnly: true }, // output value for later steps
  },
  async execute(ctx) {
    const data = await fetchForecast(ctx.props.city as string, { signal: ctx.signal });
    ctx.set('temperature', data.temp);
    // return an output name (or names) to pick a branch; nothing means "ok". Throwing fires "error" if it's linked.
  },
});
```

- **`ctx` reference:**
  - `ctx.props` holds the resolved settings, already coerced to their declared types.
  - `ctx.vars` and `ctx.globals` are the local and runner-wide variables.
  - `ctx.memory` is the step's own store, kept between runs (per runner, like globals). Steps that compare with
    earlier runs, like "Only when changed", use it.
  - `ctx.signal` aborts when the run stops or times out. Pass it to anything that can be slow.
  - `ctx.logger` writes to the engine's log, tagged with the automation, the step and the run.
  - `ctx.project` is the project running the automation (`id`, `name`); undefined when it runs on its own, as in tests.
  - `ctx.complete(result)` ends the run as completed with a result (`terminal: true` steps such as HTTP response).
  - `ctx.waiting(reason, until?)` marks the step as waiting (a delay, an event) so the Admin runs page lists the run as
    waiting, with when it resumes if known. Call it from steps that pause for a while, like Wait.
  - `ctx.runAutomation(automationId, input, { signal })` starts another automation of the project and resolves to its
    `RunResult`. Pass `ctx.signal` to stop it along with the current run.
- **Start steps:** use `inputMode: 'none'` and `triggerTypes: ['<type>']`, and copy `ctx.trigger` into read-only
  properties. When a trigger type has exactly one start step, new automations of that type begin with it.
- **Restricting steps:** `triggerTypes` also limits ordinary steps to automations of those types (HTTP response only exists
  in `http` automations).
- **Stateful steps:** use `inputMode: 'multi'` with `onSignal(ctx, signal)`, `ctx.state` and
  `ctx.emit`/`ctx.emitAndWait`. Model them on `flow-control.ts` in `packages/plugins/core`.
- **Property types:** `string`, `number`, `boolean`, `enum` (with `options`), `object`, `any` and `list` (an array of
  objects whose fields are the `items` schemas; coerced row by row, edited as repeatable rows). The Studio renders
  each one as a form field. Use `description` for help text and `default` for a placeholder and the fallback value.
  `format: 'cron'` on a string swaps the text input for the schedule builder (`apps/studio/src/ui/CronField.tsx`),
  `format: 'automation'` for a list of the project's automations that other automations can start (any automation
  with `anyAutomation: true`; forms outside the editor pass the choices to `SettingsForm` as `automations`), and
  `format: 'icon'` for a picker of the Lucide icons the Studio ships with (`ui/IconField.tsx`, from `lucide-react`'s
  `iconNames`, so there's no list to maintain), `format: 'color'` for a picker of the CSS named colors
  (`CSS_COLORS` in the SDK), and `format: 'transform'` on an `any` setting for an optional transform over the widget's
  value (`TransformField` in `ValueEditor.tsx`; its settings can only read `WIDGET_VALUE`).
- **Setting groups:** `group: '<title>'` on a property puts it in a collapsible section of `SettingsForm`, after the
  ungrouped ones and closed until opened. Plugin pages build their own with `studioHost().SettingsGroup` (the
  dashboard editor's "Size").
- **Conditional settings:** `visibleWhen: { <setting>: [values] }` shows a setting only while those sibling settings
  hold one of the values (falling back to their `default`). It's Studio-only: the engine still checks hidden settings.
- **Options from settings:** an `enum` with `optionsFrom: '<plugin id>.<source>'` instead of `options` gets its choices
  from the plugin's `settings.options[source](ctx)`, computed from `ctx.settings` or the plugin's tables
  (`ctx.storage`). `optionsDependOn: ['<setting>']` passes those sibling settings as `ctx.values` (the Studio sends
  them as `?values=` and reloads the choices when they change); publishing skips the check while one of them comes
  from another step. The Studio loads them from `GET /api/options/:source`. Use it to
  pick something configured on a plugin page, such as an MQTT connection. Sources in `projectOptions[source](project)`
  are computed from the project instead (the dashboard runner's values): forms pass `projectId` to `SettingsForm` (the
  automation editor provides `OptionsProject`), the request adds `?projectId=`, and publishing checks them against the
  snapshot being published.

## A transform

A transform is a fourth way to fill a step setting ("Transformed value"): it converts values, and its own settings
are values too, so they can come from other steps or another transform.

```ts
export const toFahrenheit = defineTransform({
  id: 'weather.to-fahrenheit', // namespaced like steps
  name: 'Celsius to Fahrenheit',
  description: 'Converts a temperature to Fahrenheit',
  category: 'Weather', // groups the Studio's list
  properties: { celsius: { type: 'number', label: 'Celsius', required: true } },
  returns: 'number', // optional: the Studio only offers it for settings of this type (or string and any)
  apply: (ctx) => (ctx.props.celsius as number) * 1.8 + 32, // may be async; ctx.vars, ctx.globals, ctx.signal, ctx.logger
});
definePlugin({ /* ... */ automations: { transforms: [toFahrenheit] } });
```

- **Runs:** settings only go async when a transform is involved. A thrown error becomes `"<transform name>" failed: …` on the
  step's `error` output. Test them with `applyTransform(transforms, id, properties)` from `@zflow/engine/testing`,
  or inside an automation with `testHarness(components, transforms)` and `transformed(id, properties)`.
- **Extra settings:** `extraProperties: <schema>` lets the user add settings with names of their own, each of that
  schema (core's "Template text" names a value per `{{placeholder}}`). `transformSettings` merges them in.
- **Own editor:** the plugin's Studio module can replace the form of a transform's settings (below the picker) with
  `automations: { transformEditors: { '<transform id>': Editor } }` (`TransformEditorProps`). It gets the Studio's
  `ValueEditor` for the values inside, as core's `TemplateTextEditor.tsx` does.
- **From settings:** steps and transforms a plugin builds from its settings go in `automations.fromSettings`, as the
  custom actions plugin does. The registry rebuilds them when the settings are saved.

## A service, settings and storage

For things that must outlive project reloads (a broker, a client connection), give the plugin a `service`:

```ts
definePlugin({
  // ...
  service: defineService({ create: (ctx) => new BrokerService(ctx) }), // ctx.settings, ctx.logger, ctx.storage
  settings: {
    defaults: { connections: [] },
    validate: (settings) => [], // issue messages; saving fails with them
    options: { connections: ({ settings }) => [{ value: 'id', label: 'Name' }] },
  },
});
```

- **Lifecycle:** the engine creates one instance per plugin at boot, before projects start, each after the services of
  the plugins it depends on (and stops them in reverse). Implement `update(settings)` to apply saved settings in place;
  without it, the service is recreated, along with the services depending on it, and every project reloads.
- **Other services:** `ctx.service<MqttService>('mqtt')` returns a dependency's running service, for building on it
  (subscribing to a broker, registering devices).
- **Files:** `ctx.dataDir` is a folder of the plugin's own (`data/plugins/<id>`, next to the database), for libraries
  that keep their own files.
- **Deleted projects:** `projectDeleted(projectId)` is called after a project is deleted, when its project tables are
  already gone, so services can drop what they keep in memory for it.
- **Testing:** build the context with `testServiceContext(pluginId, { settings, storage, services })` from
  `@zflow/engine/testing`.
- **Commands:** `commands: { name: (input) => result }` on the service instance are what studio-server can ask of it
  (widget actions call them with `ctx.command`), through the engine's `POST /control/plugins/:id/commands/:name`.
  Validate `input` there, since it comes from the browser. A service that serves each project's runner keeps them by
  project id: runners attach in `start()` and detach in `stop()` (the dashboards service).
- **Access:** steps and runners call `ctx.service<BrokerService>('<plugin id>')`. Runners should subscribe in `start()`
  and unsubscribe in `stop()`, and the service should keep listeners across its own restarts.
- **Settings:** the plugin's Studio page reads and writes them with `GET`/`PUT /api/plugins/:id/settings`. After
  saving, invalidate the `['options']` and `['issues']` queries. Keep secrets write-only with `settings.redact` (applied
  to everything sent back) and `settings.prepare` (fills in what the Studio left out from the saved settings, and generated values such as ids). `status()` is served at `/api/plugins/:id/status`.
- **Storage:** `ctx.storage.table(name, { columns, indexes })` creates a table namespaced by the plugin (columns get
  added when the schema grows; an index can be a list of columns, like `['topic', 'at']`), with `insert`, `rows`, `aggregate` (also over JSON paths), `delete(filter)` and `deleteBefore`;
  `drop(name)` deletes a table. `ctx.storage.of(pluginId)` gives the tables of a plugin yours depends on. A `key` in the schema makes `put(row)` replace the row with the same key columns. The
  Studio reads rows with `GET /api/plugins/:id/tables/:table/rows`. See `packages/plugins/mqtt` for a full example.
- **Building on MQTT:** a plugin that depends on `mqtt` can get its service and host brokers of its own
  (`hostBroker`; without a port the broker only lives in the engine) and record topics into `<owner>__<table>` tables
  (`record`, `unrecord`, `purge`). They're kept out of the MQTT settings and pickers, and the MQTT page lists them
  read-only. The owner calls them again on each start, since the MQTT service doesn't keep them.
- **Building on IoT (devices):** a plugin that brings devices depends on `iot` and, from its service, calls
  `registerProvider(pluginId, { write, refresh? })`, then `upsert` for each device (in the standard `Device` format:
  type and `capabilities`) and `report` for what devices send. Reads come from the registry, so steps and widgets
  never reach the provider; writes are checked against the capabilities (`coerceWrite`) and proxied to `write`.
  Devices are global unless upserted with a project id, which keeps them in that project's tables. Studio-side code
  reads them with `listDevices`/`findDevice` over `storage.of('iot')`. Steps come in pairs: pickers ("Get device",
  "Set device") and "… by id" ones whose device and property can come from other steps. The project page doesn't
  list devices for now; `ProjectDevices` in its studio module is ready to become a `project` section again.
- **Zigbee:** the service never throws on start, so its commands (like listing serial ports) work without a
  coordinator; failures show in `status()`. Readings are published on `zigbee/<ieee>` to an in-process broker it hosts
  through mqtt, which records them into `zigbee__readings` for the history widgets and the device page. herdsman and
  serialport load lazily (serialport's native build is allowed in `pnpm-workspace.yaml`); `ZIGBEE_SIMULATOR=1 pnpm dev`
  swaps in a simulated network whose devices join while the network is open. Service tests inject a network. The
  coordinator decides which devices are paired and the registry keeps names and state: on start only listed devices
  are updated, and `status()` reports listed devices the network lacks (`missing`) and paired ones that aren't listed
  (`unlisted`), for the page to remove or add back. `forget` drops a device from the list even with the network off.
- **Project storage:** `ctx.storage.project(projectId)` gives the plugin's tables for one project (runners get theirs
  as `ctx.storage`). Deleting a project drops every plugin's tables for it (`dropProjectTables` in the store), without
  asking the plugins, so keep per-project data there rather than keyed by project id in a plugin table.
- **Actions:** `actions: { name: (ctx) => result }` are operations for the plugin's Studio code, such as cleaning up
  data. They run in studio-server with `ctx.input`, `ctx.settings`, `ctx.storage` and `ctx.signal`, called with
  `POST /api/plugins/:id/actions/:name` and `{ input }`; the response is `{ result }`, and a thrown error becomes an
  issue. The plugin's service lives in the engine: reach it with `ctx.command(name, input, pluginId?)`, like widget
  actions do.

## A runner

```ts
export const webhook = defineRunner({
  type: 'webhook-listener',
  name: 'Webhook listener',
  description: 'Starts automations when a webhook arrives',
  icon: 'webhook', // lucide icon name, shown on the runner card
  triggerType: 'webhook', // automations with this trigger type can be bound; add a matching start step too
  bindingLabel: 'Webhook', // the Studio shows "Add webhook"
  configSchema: { port: { type: 'number', label: 'Port', default: 3300 } },
  bindingSchema: { secret: { type: 'string', label: 'Secret', required: true } },
  single: false, // true when a project can only have one runner of this type
  create(ctx) {
    // ctx.config, ctx.bindings (each with automationId, automationName + config), ctx.logger, ctx.project,
    // ctx.storage (the plugin's tables for the project), ctx.runAutomation(automationId, trigger, { timeoutMs })
    return { async start() {}, async stop() {} };
  },
});
```

- **Instances:** one instance is created per runner configured in a project. `stop()` must release everything
  (ports, timers), because reloads call stop on the old instance and start on the new one.
- **Validation:** checks the schema can't express (a cron expression, a URL…) go in `validateBinding(config)`, which
  returns issue messages. Publishing fails with them instead of the runner failing to start.
- **Logs:** the engine logs every run at debug and failed runs as errors. Log what the runner receives with
  `ctx.logger.info` (the API server logs each request with its status); messages are tagged with the project and
  runner.
- **Results:** `runAutomation` resolves to a `RunResult` (`completed | stopped | failed | timeout`, plus the `result` from
  `ctx.complete`); `stopped` means the run was cancelled from outside. See `api-server.ts` for mapping results to responses and `scheduler.ts` for a simple trigger loop.

## Studio pages

The `studio` module default-exports a `defineStudioPlugin(...)` from `@zflow/studio-sdk`:

```tsx
import { defineStudioPlugin } from '@zflow/studio-sdk';

export default defineStudioPlugin({
  id: 'weather',
  navEntries: [
    {
      id: 'weather',
      label: 'Weather', // the page name
      description: 'Sets up the forecast provider', // one plain sentence, shown on the Plugins page
      icon: 'cloud-sun',
      path: '/weather',
      order: 50,
    },
  ],
  routes: [{ path: '/weather', Component: WeatherPage }], // prefix paths with the plugin id
});
```

- **Pages:** a plugin can add several. Each nav entry is one page, and the Plugins page lists them under the plugin
  with links, along with its page sections and a chip saying where each one lives. Routes without a nav entry (detail pages) aren't listed.

- **Bundling:** studio-server bundles the module with esbuild on request (`GET /api/plugins/:id/studio.js`), so TSX
  and relative imports work.
- **Shared modules:** `react`, `react/jsx-runtime`, `react-dom`, `react-router`, `@tanstack/react-query` and
  `@zflow/studio-sdk` are not bundled. They resolve to the Studio's own instances (`SHARED_MODULES` in studio-sdk), so
  hooks and `useQuery` work with the Studio's QueryClient. Other browser dependencies get bundled in. `react-router`
  stays shared for older plugins, but plugins navigate through the host instead.
- **Navigation:** `studioHost()` gives `Link`, `useNavigate`, `useRoute` (the route's `params` and the `query`) and
  `useLeaveGuard(dirty, message)` for editors with unsaved changes, so plugins don't depend on the Studio's router
  (`ui/navigation.tsx` wraps it).
- **Layout:** wrap a page in `studioHost().Page` (title, optional `back` and `actions`) so it gets the Studio's header bar.
- **Styling:** pages render inside the Studio layout and can use its classes (`card`, `field`,
  `field-label`, `input`, `button`, `button-primary`, `chip`, `list`, `list-row`…).
- **Data:** read it from the REST API under `/api`. After changing a project's draft, invalidate `draftQueryKeys(id)`
  from studio-sdk so the project page refreshes its changes and issues.
- **Studio host:** `studioHost()` gives the loaded plugins, the catalog manifests and Studio parts to reuse
  (`Page`, `PageHeader`, `SettingsForm`, `Icon`, `FieldHint`, `EmptyState`, `useToast`, `SectionActions`,
  `ShareDialog`) and its navigation. It's how the dashboards plugin finds every plugin's widgets.
- **Page sections:** `sections` adds collapsible cards to core pages, by slot: `project` (after Runners, the
  component gets the `projectId`) and `admin` (after the Engine card). A section gives its `title`, `description` (shown on the Plugins page) and `icon`; the
  Studio renders the header and toggle (`ui/PluginSections.tsx`) and remembers each viewer's choice. Admin sections
  start collapsed, so the page makes no requests until one is opened; project sections start open. The component renders only the body; header buttons go inside `studioHost().SectionActions`. To add a slot,
  add it to `SectionSlots` in studio-sdk and render `<PluginSections slot=… />` on the page. Routes under
  `/projects/:projectId/...` keep Projects highlighted in the nav.
- **Overview cards:** `overview: { cards }` adds cards to the Overview, the Studio's start page: a short summary
  linking to where things are handled, not a copy of a page. A card gives its `id` (prefixed with the plugin id),
  `title`, `description`, `icon`, `width` (`small` by default, a third of the page; `medium` half, `large` all) and
  `order`, plus a fixed body `height` in pixels that fits its fullest content (every row of a list it caps), so the
  layout doesn't shift as data changes; the Studio renders the header, and the component renders the body, fetching its own data, with links in
  `SectionActions`. Viewers move and hide cards in the page's edit mode; the layout is saved for the whole Studio and
  hidden cards don't mount, so they make no requests. A card that throws shows its error without breaking the page.
- **Failures:** if a module fails to load, the Studio shows a banner and the rest keeps working. A page that throws
  while rendering shows an error page inside the layout. The studio-server log has the bundling errors.
- **Adding to the shared list:** to share another module, add it to `SHARED_MODULES` and publish it in
  `apps/studio/src/shell/shared-modules.ts`. The `Record<SharedModule, unknown>` type there won't compile until both
  places match.

## A widget

A widget is split like a step: the server half declares it, and the plugin's `studio` module renders it.

```ts
// index.ts
export const forecastWidget = defineWidget({
  id: 'weather.today', // namespaced by the plugin, like steps
  name: 'Forecast',
  description: 'Shows tomorrow’s forecast for a city',
  icon: 'cloud-sun',
  width: 'medium', // optional width it's added with (small, medium, large); small without it
  rows: 2, // optional height it's added with (1–10); 1 without it
  frameless: false, // true drops the card around it, so the component fills the cell (the Button)
  refreshMs: 60_000, // how often the dashboard asks for data again
  properties: { city: { type: 'string', label: 'City', required: true } },
  async data(ctx) {
    // runs in studio-server; ctx.config, ctx.settings, ctx.storage, ctx.signal, ctx.project (on dashboards)
    return fetchForecast(ctx.config.city as string, { signal: ctx.signal });
  },
  actions: {
    // optional: what the widget's controls do; ctx.input, ctx.project, ctx.dashboard, ctx.command(name, input, pluginId?)
    refresh: (ctx) => ctx.command('refresh', { city: ctx.config.city }),
  },
});
definePlugin({ /* ... */ dashboards: { widgets: [forecastWidget] }, studio: './studio.tsx' });

// studio.tsx
function Forecast({ data, config, size }: WidgetProps<ForecastData>) {}
export default defineStudioPlugin({ id: 'weather', dashboards: { widgets: { 'weather.today': Forecast } } });
```

- **Data:** the dashboard calls `POST /api/widgets/:id/data` with the widget's config and passes the result as
  `data` (undefined while loading). A thrown error is shown inside the widget. Widgets that only need the browser (the clock) leave
  `data()` out and render from `config`. On a dashboard, `ctx.project.runs({ automationId, limit })` reads the
  project's run history (the Automation activity widget), and `ctx.project.storage(pluginId?)` the project's tables of
  the widget's plugin or of one it depends on (the value widgets read the dashboards plugin's).
- **Actions:** published dashboards pass `onAction(name, input)` to widgets and templates; it's undefined in the editor,
  so controls render disabled there. studio-server runs the action with the published widget's config
  (`POST /api/projects/:id/published-dashboards/:dashboardId/widgets/:widgetId/actions/:name`), then the dashboard
  refreshes every widget. The engine never sees dashboards: `ctx.command` calls a service command of the widget's
  plugin or of one it depends on. Widgets that start automations or change values go through the dashboard runner.
- **Colors:** `appearance: true` adds a "Colors" setting (`colors`, rules like "is greater than 25 → red") to the
  widget. studio-server colors the `value` of its data with them unless `data()` set a `color`; templates paint
  `color`. Widgets whose data has several values call `matchColor` themselves, and `colorBands` turns the rules into
  sections of a range (the gauge). Rules and `conditionProperties` come from `packages/sdk/src/appearance.ts`.
- **Display as:** `appearance: true` also adds `display`, a transform over the value ("Round", "Pad"…).
  studio-server applies it after the colors, to `value` and each `entries[].value` (`displayWidgetData` in the engine),
  so rules still compare the original value. Publishing checks the transform (`checkValue` in `compile.ts`, shared with
  steps) and the project requires its plugin.
- **Styles:** a widget fills its grid cell. Its classes go in the "Dashboards" section of `app.css`.
- **Sizes:** groups and widgets both use small, medium and large (`DashboardSize`), picked with a slider
  (`SizeSlider.tsx`). A group takes a third, half or all of the dashboard; every group is a 12-column grid, and a widget
  takes 3, 6 or 12 of those columns.
- **Sharing:** "Share" opens `studioHost().ShareDialog` (the Studio's `ui/ShareDialog.tsx`, on the generic
  `ui/Dialog.tsx`), which creates a share link (`?share=<token>`) that opens the dashboard without logging in, covering
  the Studio with it; browsers only enter real full screen after a click. Widgets on published dashboards load data
  through the published widget's config, so share links never send a config of their own.
- **Projects:** a dashboard that uses a widget makes the project require its plugin (and its template's plugin), like
  steps and runners do.

## A widget template

A template renders data for any plugin's widgets, so a widget that fits one needs no Studio component of its own. The
core ones, typed in `@zflow/sdk` (`templates.ts`), are `templates.stat` (`StatData`: one value), `templates.series`
(`SeriesData`: a value over a chart), `templates.timeline` (`TimelineData`: the latest entries as a logbook, each a `TimelineEntry`), `templates.state`
(`StateData`: a state with its text, icon and color), `templates.gauge` (`GaugeData`: a value on a dial),
`templates.values` (`ValuesData`: several values), `templates.forecast` (`ForecastData`: the weather) and
`templates.toggle` (`ToggleData`: an on/off switch that calls the widget's `set` action with a `ToggleInput`). See `packages/plugins/mqtt/src/widgets.ts`.

```ts
// a widget that uses one: data() returns the template's data type
defineWidget({ id: 'weather.now', template: 'templates.stat', /* ... */ data: (ctx): StatData => ({ label, value }) });

// a plugin that provides one
definePlugin({ /* ... */ dashboards: { templates: [defineWidgetTemplate({ id: 'weather.map', name, description })] } });
defineStudioPlugin({ id: 'weather', dashboards: { templates: { 'weather.map': MapTemplate } } }); // TemplateProps<MapData>
```

- **Loading:** a widget naming an unknown template stops the plugins from loading.
- **Ranges:** templates with a range picker call `onRangeChange`, and the range reaches `data()` as `ctx.range` (a
  `TimeRange`; `rangeBounds` turns it into timestamps). It's the viewer's own choice and isn't saved. Long ranges
  should use `table.series(...)`, which aggregates rows into buckets, instead of returning every row.
