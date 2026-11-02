# Building on zflow's built-in plugins

Some built-in plugins offer things meant for other plugins: services to call, tables to read, choices for settings
and widget templates. This guide lists them and shows how to use them. Every other built-in (Core, Math, Text, Date &
time, HTTP, Scheduler, API server, Core widgets, Weather, Zigbee, Google Home, Twilio, Custom actions) only adds steps,
runners, widgets and pages for people building automations, so plugins have nothing to call there.

| Plugin id    | Use it to                                                                      | Version |
| ------------ | ------------------------------------------------------------------------------ | ------- |
| `templates`  | Render widget data without writing a Studio component                          | 0.1.0   |
| `mqtt`       | Host MQTT brokers, subscribe, publish and record topics into tables            | 0.1.0   |
| `iot`        | Bring devices from any ecosystem, or read and control the devices others bring | 0.1.0   |
| `dashboards` | Run a project's widget actions and change its dashboard values                 | 0.1.0   |
| `notify`     | Add a channel notifications are sent through, like SMS or a chat app           | 0.1.0   |

## Using another plugin

1. **Declare it** in `definePlugin({ dependencies: { mqtt: '0.1.0' } })`, with the minimum version. Built-ins need no
   `sources` entry. zflow refuses to reach plugins you don't depend on, and won't load yours without them.
2. **Reach it** through the context:
   - `ctx.service<T>('<id>')` in steps, runners and services, for the plugin's running service.
   - `ctx.storage.of('<id>')` for its tables, read-only by convention. Widgets on dashboards also have
     `ctx.project.storage('<id>')` for its tables of that project.
   - `ctx.command(name, input, '<id>')` in widget actions and plugin actions, for its service's commands. Those run in
     studio-server, while services live in the engine.
   - `optionsFrom: '<id>.<source>'` (or `projectOptions` sources) on an `enum` setting, for its lists of choices.
   - `template: 'templates.<name>'` on a widget.
3. **Type it yourself.** Only the SDK is published, not the plugins, so copy the interfaces below into your plugin
   (for example `src/zflow-plugins.ts`) and pass them to `ctx.service<T>()`. They describe what each plugin's version
   in the table offers. Import nothing from the plugins themselves: they aren't in your package at runtime.

## Widget templates (`templates`)

A widget that names a template returns that template's data from `data()`, and needs no Studio code of its own. The
data types are in the SDK ([`sdk/templates.d.ts`](sdk/templates.d.ts)), so nothing needs copying here.

| Template             | Data           | Shows                                                 |
| -------------------- | -------------- | ----------------------------------------------------- |
| `templates.stat`     | `StatData`     | One value                                             |
| `templates.series`   | `SeriesData`   | A value over a chart, with a range picker             |
| `templates.timeline` | `TimelineData` | The latest entries as a logbook                       |
| `templates.state`    | `StateData`    | A state with its text, icon and color                 |
| `templates.gauge`    | `GaugeData`    | A value on a dial                                     |
| `templates.values`   | `ValuesData`   | Several values                                        |
| `templates.forecast` | `ForecastData` | The weather                                           |
| `templates.toggle`   | `ToggleData`   | An on/off switch that calls the widget's `set` action |

```ts
import { defineWidget, type StatData } from '@zflow/sdk';

export const temperature = defineWidget({
  id: 'weather.temperature',
  name: 'Temperature',
  description: 'Shows the temperature in a city',
  icon: 'thermometer',
  template: 'templates.stat',
  appearance: true, // adds the Colors and Display as settings, applied to `value`
  properties: { city: { type: 'string', label: 'City', required: true } },
  async data(ctx): Promise<StatData> {
    return { label: ctx.config.city as string, value: await currentTemperature(ctx.config.city as string), unit: '°C' };
  },
});
```

A `templates.toggle` widget declares a `set` action, which receives a `ToggleInput`. A template with a range picker
passes the viewer's range to `data()` as `ctx.range`; turn it into timestamps with `rangeBounds(ctx.range)`.

## MQTT (`mqtt`)

The MQTT plugin hosts brokers inside the engine. People configure theirs on the MQTT page, and your plugin can host
its own (the Zigbee plugin hosts one for its readings). From your service, steps or runner:

```ts
export type MqttEvent =
  | {
      event: 'message';
      connectionId: string;
      clientId: string | null; // null for messages the engine published
      topic: string;
      payload: unknown; // parsed as JSON when it is JSON, otherwise text
      qos: number;
      retain: boolean;
    }
  | { event: 'connected' | 'disconnected'; connectionId: string; clientId: string };

export interface MqttService {
  /** Hosts a broker of your own and resolves to its connection id. Without a port, only the engine can reach it. */
  hostBroker(broker: {
    owner: string; // your plugin id
    id: string;
    name: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
  }): Promise<string>;
  releaseBroker(owner: string, id: string): Promise<void>;
  /** Listens to a connection: one from the `mqtt.connections` choices, or one you host. Returns what stops it. */
  subscribe(connectionId: string, listener: (event: MqttEvent) => void): () => void;
  /** Objects are sent as JSON. */
  publish(
    connectionId: string,
    message: { topic: string; payload: unknown; qos?: 0 | 1 | 2; retain?: boolean },
  ): Promise<void>;
  /** Records a topic filter's messages into the MQTT plugin's table `<owner>__<table>`, and returns that name. */
  record(recording: {
    owner: string;
    connectionId: string;
    topic: string;
    table: string;
    retentionDays?: number;
  }): string;
  /** Stops recording; the rows stay. */
  unrecord(owner: string, table: string): void;
  /** Deletes a topic's rows from a recorded table and returns how many. */
  purge(table: string, topic: string): number;
}
```

- **Lifecycle:** call `hostBroker` and `record` again each time your service starts, since the MQTT plugin doesn't
  keep them. Call `releaseBroker` and `unrecord` when it stops. Subscribe in a runner's `start()` and call the returned
  function in `stop()`; listeners survive broker restarts.
- **Recorded rows** look like `{ at, clientId, topic, payload }` (`at` in milliseconds). Read them with
  `ctx.storage.of('mqtt').table('<owner>__<table>')`, filtered by `topic` and a time range; `series(...)` aggregates
  them into buckets for charts. Your brokers and recordings show read-only on the MQTT page, under your plugin's name.
- **Settings choices:** `optionsFrom: 'mqtt.connections'` lists the configured brokers (the value is the connection
  id), and `optionsFrom: 'mqtt.tables'` the topics they record (the value is the table name).
- **Command:** widget actions publish with `ctx.command('publish', { connection, topic, payload }, 'mqtt')`.

## Devices (`iot`)

The Devices plugin keeps one registry of devices in a standard format, whatever ecosystem they come from. A plugin
either **brings devices** (it's a provider, like Zigbee) or **uses them** (steps, widgets, a bridge like Google Home).
Steps and widgets read the registry and never reach the provider; writes are checked against the device's
capabilities, then handed to the provider.

```ts
export interface Capability {
  property: string; // the key in the device's state, like "state" or "temperature"
  label: string;
  kind: 'binary' | 'numeric' | 'enum' | 'text' | 'event'; // `event`: every report counts, even a repeated value
  access: 'read' | 'write' | 'both';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  values?: string[]; // the choices of `enum` and `event` properties
  on?: unknown; // what a `binary` property holds when on and off, like "ON" and "OFF"; true and false without them
  off?: unknown;
  health?: 'battery' | 'signal'; // also copied to the device's `battery` or `signal`
}

export interface Device {
  id: string; // "<provider>:<externalId>"
  provider: string; // the providing plugin's id
  externalId: string; // the provider's own id, like a Zigbee IEEE address
  projectId?: string; // set when the device belongs to one project only
  name: string;
  type:
    'light' | 'switch' | 'plug' | 'sensor' | 'contact' | 'motion' | 'button' | 'cover' | 'lock' | 'climate' | 'other';
  model?: string;
  manufacturer?: string;
  capabilities: Capability[];
  state: Record<string, unknown>; // the latest value of each property
  online: boolean | null; // null when the provider doesn't know
  lastSeen?: number;
  battery?: number; // percent
  signal?: number;
  addedAt: number;
}

export interface DeviceEvent {
  event: 'changed' | 'online' | 'offline' | 'added' | 'removed';
  device: Device;
  property?: string; // for `changed`, one event per property
  value?: unknown;
  previous?: unknown;
}

export interface IotService {
  // Bringing devices
  /** Call it when your service starts; it returns what unregisters you, for when it stops. */
  registerProvider(
    pluginId: string,
    provider: {
      write(device: Device, values: Record<string, unknown>): Promise<void> | void; // values already checked
      refresh?(device: Device): Promise<void> | void;
    },
  ): () => void;
  /** Adds the device, or updates what you know about it; its name and state are kept. */
  upsert(
    provider: string,
    input: Pick<Device, 'externalId' | 'name' | 'type' | 'capabilities'> &
      Partial<Pick<Device, 'model' | 'manufacturer' | 'online'>>,
    projectId?: string,
  ): Device;
  /** Merges what the device sent into its state. A report with a state means it's online unless `online` says not. */
  report(
    provider: string,
    externalId: string,
    report: { state?: Record<string, unknown>; online?: boolean; at?: number },
    projectId?: string,
  ): Device | undefined;
  remove(provider: string, externalId: string, projectId?: string): void;

  // Using devices
  /** A project sees its own devices first, then the global ones. */
  devices(projectId?: string, filter?: { provider?: string; type?: string }): Device[];
  /** Throws when there's no such device. */
  device(id: string, projectId?: string): Device;
  /** Returns what stops listening. */
  listen(listener: (event: DeviceEvent) => void): () => void;
  /** Checks the values against the capabilities and sends them through the provider. */
  write(id: string, values: Record<string, unknown>, projectId?: string): Promise<void>;
  refresh(id: string, projectId?: string): Promise<void>;
  rename(id: string, name: string, projectId?: string): Device;
}
```

- **Providers:** register in your service's `start()`, then `upsert` each device you know and `report` what devices
  send. Devices are global unless you pass a project id, which keeps them in that project's tables (and they go when
  the project is deleted). Map your ecosystem's values to capabilities once, as Zigbee does with its exposes.
- **Reading outside the engine:** studio-server code (widget `data()`, plugin actions) has no services; read the
  registry's `devices` table with `ctx.storage.of('iot').table('devices')` (one row per device, keyed by `provider` and
  `externalId`, with `state` and `capabilities` as JSON). A project's own devices are in
  `ctx.storage.of('iot').project(projectId)`.
- **Settings choices:** `optionsFrom: 'iot.devices'` lists the devices (the value is the device id). For the property
  of a picked device, add `optionsDependOn: ['device']`, with your device setting named `device`, and pick a source:
  `iot.properties` (readable), `iot.numeric` (readable numbers), `iot.writable` and `iot.switches` (writable on/off).
- **Commands:** widget actions change devices with `ctx.command('set', { device, values, project? }, 'iot')`, and
  also have `rename` (`{ device, name, project? }`) and `refresh` (`{ device, project? }`).

## Dashboards (`dashboards`)

Each project has at most one dashboard runner. It holds the project's dashboard values (on/off, number or text) and
runs the automations bound to widget actions or to value changes. Your widgets and actions reach it through the
dashboards service's commands, by project id:

```ts
// Runs an automation bound to the runner as a widget action; resolves to its RunResult (from the SDK).
await ctx.command('run', { project: ctx.project.id, automation, input, dashboard: ctx.dashboard.name }, 'dashboards');
// Changes a value, which starts the automations bound to its changes.
await ctx.command('set', { project: ctx.project.id, name, value }, 'dashboards');
```

- **Reading values:** each value is a row of the project's `values` table, `{ name, value, at }`. On a dashboard, read
  it with `ctx.project.storage('dashboards').table('values').rows({ where: { name }, limit: 1 })`. No row means the
  runner hasn't started with that value yet.
- **Settings choices**, from the project (`projectOptions`): `optionsFrom: 'dashboards.values'` lists the values,
  `'dashboards.switches'` only the on/off ones, and `'dashboards.actions'` the automations bound as widget actions.
  Forms in your own pages pass `projectId` to `SettingsForm` so these can load.
- The commands fail with "The project's dashboard runner isn't running" until the project has one and is published;
  show that error to the viewer.

## Notifications (`notify`)

A project declares its notifications on its Notifications runner (who gets each one, and through which channel), and
automations send them with the "Send notification" step. A channel is how they're delivered; add one from your
service:

```ts
interface NotifyChannel {
  /** Shown in the notification's channel picker, like "SMS (Twilio)". */
  label: string;
  /** Sends to one recipient; throws with a message saying what's wrong and how to fix it. */
  send(message: { to: string; text: string }, signal: AbortSignal): Promise<void>;
}

interface NotifyService {
  /** Returns the call that removes the channel. */
  registerChannel(id: string, channel: NotifyChannel): () => void;
}

// In your service's start(), with stop() calling what it returned:
this.unregister = ctx.service<NotifyService>('notify').registerChannel('chat.message', { label: 'Chat', send });
```

- **Ids:** prefix the channel id with your plugin id. Projects store it, so keep it stable.
- **Recipients** are what the notification's "To" lists, separated by commas, so check their format in `send`.
- The notify service applies the hourly cap and the notification's own limit, and records every delivery in the
  project's `deliveries` table (`{ notification, channel, to, message, status, error, at }`, `status` being `sent`,
  `failed` or `limited`). Your channel only delivers.
- **Settings choices:** `optionsFrom: 'notify.notifications'` lists the project's notifications (`projectOptions`), and
  `'notify.channels'` the channels.
