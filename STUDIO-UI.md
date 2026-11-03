# Studio pages that look like zflow

A plugin's Studio pages render inside the Studio, next to its own pages. Build them from the parts `studioHost()` gives
and the Studio's CSS classes, and they look like the rest of the Studio, follow its theme and work on phones without
code of your own. Don't ship your own stylesheet for things these already cover.

```tsx
import { studioHost } from '@zflow/studio-sdk';

function WeatherPage() {
  const { Page, Field, Switch } = studioHost(); // call it inside components, not at the module's top level
  // ...
}
```

## Ground rules

- **Copy:** sentence case, no all-caps labels, plain verbs ("Save", "Add station", "Delete"). Error messages say
  what's wrong and how to fix it.
- **Icons:** [Lucide](https://lucide.dev/icons) names in kebab-case (`cloud-sun`), through `Icon`. Use 16px in
  buttons and 18px in a `tile`.
- **Navigation:** use the host's `Link`, `useNavigate` and `useRoute`, never `window.location` or your own router.
- **Phones:** below 720px the shared parts and classes adapt on their own (rows wrap, forms become one column, header
  actions go in a "…" menu). Check `useNarrowScreen()` only for layouts of your own that can't.
- **Colors:** use the CSS variables below instead of hex values, so pages follow the Studio's theme.

## A page

```tsx
<Page
  title="Weather"
  subtitle="Sets up the forecast provider the Forecast steps use" // one sentence; hidden on phones
  back={{ to: '/weather', label: 'Back to weather' }} // only for pages below another one
  actions={<button className="button button-primary">Save</button>} // the bar's right side; a "…" menu on phones
>
  <section className="section">
    <div className="section-header">
      <h2>Stations</h2>
      <button className="button">Add station</button>
    </div>
    <p className="section-intro">Each station reports the weather where it is.</p>
    {/* cards, a list or a table */}
  </section>
</Page>
```

- **`Page`** wraps an ordinary page. Editors with a layout of their own put **`PageHeader`** above it.
- **Header actions:** the page's main action is `button-primary`; less common ones (export, delete) go in a `Menu`.
- **Page width:** pages are centered with a readable width; add `wide` to `Page` for tables and grids that need room.
- **Sections:** `section` stacks its children; `section-header` holds an `h2` and the section's buttons on the right;
  `section-intro` is a muted sentence under it.
- **Create actions:** a button in the section header opens the form at the top of the section. Keep the form hidden
  otherwise, except when the list is empty and the form is the only thing to do.

## Cards

```tsx
<div className="card">
  <div className="card-header">
    <span className="tile">
      <Icon name="cloud-sun" size={18} />
    </span>
    <span className="card-title">
      <strong>Rooftop</strong>
      <span className="list-row-meta">Reports every 10 minutes</span>
    </span>
    <span className="chip chip-success">Online</span>
  </div>
  <div className="settings-form">{/* fields */}</div>
  <div className="card-footer">
    <button className="button">Discard</button>
    <button className="button button-primary">Save</button>
  </div>
</div>
```

| Class          | Use                                                                                    |
| -------------- | -------------------------------------------------------------------------------------- |
| `card`         | A box for one thing: a connection, a device, a settings group                          |
| `card-compact` | Less padding, for cards in a long column                                               |
| `card-header`  | A row: an optional `tile`, the `card-title`, then chips or buttons; it wraps on phones |
| `tile`         | The icon square at the start of a header or row                                        |
| `card-title`   | The name (`strong`) with a `list-row-meta` line under it; it takes the room left       |
| `card-actions` | Buttons grouped in a header                                                            |
| `card-footer`  | The card's Save, Discard or Delete, right-aligned under a line                         |

- **`CollapsibleCard`** is a card the viewer opens and closes, remembered for them. Its body unmounts while collapsed,
  so queries inside stop polling: use it for sections that load data the viewer may not want. Its header buttons go
  inside `SectionActions`.
- **Long lists of editable items** start collapsed with a summary row (`card-header card-toggle` on a button, with a
  chevron); expanding shows the full form. Keep which ones are open in the parent, so a save that re-mounts them
  doesn't close them.

## Lists and tables

```tsx
<div className="list">
  {stations.map((station) => (
    <div key={station.id} className="list-row">
      <div className="list-row-main">
        <strong>{station.name}</strong>
        <span className="list-row-meta">{station.city}</span>
      </div>
      <RowActions>
        <button className="button button-small">Rename</button>
        <button className="button button-small button-danger">Delete</button>
      </RowActions>
    </div>
  ))}
</div>
```

- **`list`** is a bordered column of **`list-row`**s. `list-row-main` takes the room; `list-row-meta` is muted small
  text (a date, a count, a state).
- **`RowActions`** holds a row's buttons: in a line on wide screens, in a "…" menu on phones. Use it instead of laying
  the buttons out yourself.
- **`DataTable`** is for tabular data (history, messages). Give it `columns` (`label`, `render`, `numeric` to align
  numbers right), `rows` and a `rowKey`. On phones each row becomes a card, with the first column as its title, so put
  the most telling column first. Don't write a `<table>` yourself.
- Order lists people scan by name alphabetically; order history newest first.

## Forms

```tsx
<div className="settings-form">
  <Field label="City" hint="Where the station is" required error={errors.city}>
    {(id) => <input id={id} className="input" value={city} onChange={(event) => setCity(event.target.value)} />}
  </Field>
  <Field label="Units">
    {(id) => (
      <select id={id} className="input" value={units} onChange={(event) => setUnits(event.target.value)}>
        <option value="c">Celsius</option>
        <option value="f">Fahrenheit</option>
      </select>
    )}
  </Field>
  <Field label="Alerts">{(id) => <Switch id={id} checked={alerts} onChange={setAlerts} />}</Field>
</div>
```

- **`SettingsForm`** renders a whole form from property schemas (the same ones steps use), with every field type the
  editor has (cron, duration, icon, color, options from settings…), groups and conditional fields. Prefer it whenever
  the settings fit a schema.
- **`Field`** is one labelled field for anything else. Its children are the control, or a function given the id that
  links it to the label. `hint` is a tooltip on an info icon beside the label, not text under the input, so fields in
  a row line up. `error` (or else `help`, for a state such as "Connected") goes under the control. `wide` makes it take
  a whole row.
- **`settings-form`** lays fields out in a grid that wraps; it's one column on phones. `inline-form` puts a few fields
  and their button on one line (a quick add form).
- **Controls:** `input` styles inputs, selects and textareas; `input-code` is monospaced, for code and JSON;
  `input-with-action` puts a button beside an input. Mark invalid inputs with `aria-invalid`.
- **`Switch`** is the on/off toggle; never a bare checkbox. It shows "On"/"Off" beside it (`labels` changes them),
  or fixed text as its children ("Show a border"). In a row with nothing beside it, pass `labels={false}` and a
  `label` for screen readers ("Share Kitchen light"), plus a `title` saying why when it's disabled.
- **`SearchSelect`** replaces a `<select>` whose list grows (one entry per device, per plugin): it has a filter and
  keyboard navigation, with optional groups, icons and color swatches.
- **`SettingsGroup`** is a collapsible group of fields, closed until opened, for advanced settings.

## Buttons and chips

| Class                                            | Use                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `button`                                         | Any action                                                            |
| `button button-primary`                          | The one main action of a page, card or dialog (Save, Create, Publish) |
| `button button-danger`                           | Deleting or something that can't be undone; confirm before doing it   |
| `button button-quiet`                            | Secondary actions that shouldn't draw the eye (Cancel beside a form)  |
| `button-small`                                   | Buttons inside rows                                                   |
| `icon-button`                                    | A button that's only an icon; give it `aria-label` and `title`        |
| `chip`                                           | A short state or label (Not published, 3 devices)                     |
| `chip-success`, `-warning`, `-danger`, `-accent` | States: online/working, needs attention, failed/offline, highlighted  |

Put a `title` on a chip whose state has more to say (the error behind "Failed").

## Feedback

- **Loading and query errors:** `<p className="loading">Loading stations…</p>`, and the error's message the same way
  while a whole section can't load.
- **Empty lists:** `EmptyState` with an icon, a title, a sentence on what goes there and, when there's one, the action
  that fills it.
- **After an action:** `useToast()` for its outcome ("Saved", or the error's message). Don't use `alert()`.
- **Problems to fix:** `issues` is the warning box for a list of problems (`<div className="issues"><ul>…</ul></div>`).
- **Confirming:** `confirm()` with a question that names the thing and what happens ("Delete "Rooftop"? Its readings
  are kept."), for deletes and anything that can't be undone.
- **Unsaved changes:** `useLeaveGuard(dirty, message)` asks before the viewer leaves a page with changes.

## Menus and dialogs

- **`Menu`** is a "…" button listing `MenuItem`s, for less common actions (export, reset, delete). `MenuItem` takes an
  `icon`, `onClick` or `href` (with `download` for files) and `danger` for deletes. Inside the page header's actions it
  lists its items straight in the header's "…" menu on phones.
- **`Dialog`** is a modal with a title and a close button; Esc and a click outside close it. Mount it to open it and
  unmount it to close it. Put its buttons in `dialog-actions` at the end.
- **`ShareDialog`** creates a share link for a published dashboard.

## Widgets and templates

- A widget fills its grid cell. Keep its content in the cell's size (`size` tells the widget's width) and let text
  cut with an ellipsis rather than overflow. On phones every widget takes the full width.
- Data that fits a template (`templates.stat`, `templates.series`, `templates.state`…) needs no component: return the
  template's data from `data()`, and it looks like every other widget.
- Name a widget's own classes after the plugin (`weather-map-…`) so they never clash with the Studio's or another
  plugin's.

## Parts of other plugins

- A plugin's Studio module can share components in `parts`; render them with `studioPart<Props>(pluginId, name)`
  and depend on that plugin. Check for undefined, since its module may fail to load, and say which plugin is missing.
- The Devices plugin shares `DevicePage`, a device's whole page (see `BUILT-IN-PLUGINS.md`), so plugins that bring
  devices don't build their own.

## CSS variables

| Variable                                              | For                                                      |
| ----------------------------------------------------- | -------------------------------------------------------- |
| `--ink`, `--muted`                                    | Text, and secondary text                                 |
| `--canvas`, `--surface`, `--surface-sunken`, `--line` | The page's background, cards, insets, borders            |
| `--accent`, `--accent-soft`                           | Links, selection, primary actions; their soft background |
| `--success`, `--warning`, `--danger` and `-soft`      | States, and their soft backgrounds                       |
| `--radius-node`, `--radius-control`                   | Corners of cards, and of buttons and inputs              |
| `--text-sm`, `--text-md`, `--text-lg`, `--text-xl`    | Font sizes                                               |

Styles of your own are fine for what's specific to the plugin (a map, a chart), as inline styles or classes prefixed
with the plugin id; build them on these variables.
