# zflow plugin kit

Everything needed to write a zflow plugin in **its own GitHub repo** and publish it, so anyone can install it from the
Studio's Plugins page ("Install from GitHub"). It's written for AI agents as much as for people: follow it step by step.

This repo is generated from zflow whenever the plugin contract changes. Don't edit it by hand.

| Path                                     | What it holds                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| [`sdk/`](sdk)                            | `@zflow/sdk`: the plugin contract (`definePlugin`, steps, runners, services, widgets…) |
| [`studio-sdk/`](studio-sdk)              | `@zflow/studio-sdk`: the contract for a plugin's Studio pages, widgets and templates   |
| [`plugin-tools/`](plugin-tools)          | `@zflow/plugin-tools`: `zflow-pack-plugin`, which builds the release asset             |
| [`template/`](template)                  | A starter plugin: a step, a Studio page and the release workflow                       |
| [WRITING-PLUGINS.md](WRITING-PLUGINS.md) | How to write steps, transforms, runners, services, widgets and Studio pages            |

The packages hold type definitions with their doc comments, plus the small helpers they export (`definePlugin` and the
other `define*` functions return what they're given). zflow's engine isn't in them. Once installed, a plugin runs
against zflow's own copy of `@zflow/sdk`, so the copy here is only for writing, checking and packing it.

## Start a plugin

1. Copy [`template/`](template) into a new, **public** repo. zflow doesn't sign in to GitHub, so it can't install from
   private repos.
2. Rename it: `name` and `description` in `package.json`; the plugin's `id`, `name` and `description` in
   `src/index.ts`; the step ids (`hello.greet`) and the Studio page's id and paths in `src/studio.tsx`.
3. Run `npm install` (pnpm works too). The `@zflow/*` packages come from this repo's release `v0.1.0`:
   ```json
   "@zflow/sdk": "https://github.com/ezequielgandolfi/zflow-types/releases/download/v0.1.0/zflow-sdk-0.1.0.tgz"
   ```
4. Write the plugin, following [WRITING-PLUGINS.md](WRITING-PLUGINS.md), and check it with `npm run typecheck`.

## The contracts

Read these before writing code. They're the type definitions, with doc comments.

| What                                        | Where                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Plugin definition (`definePlugin`)          | [`sdk/plugin.d.ts`](sdk/plugin.d.ts)                                                                               |
| Package manifest, `SDK_VERSION`, asset name | [`sdk/plugin-package.d.ts`](sdk/plugin-package.d.ts)                                                               |
| Steps (`defineComponent`, `ctx`)            | [`sdk/component.d.ts`](sdk/component.d.ts)                                                                         |
| Setting types (`properties`)                | [`sdk/properties.d.ts`](sdk/properties.d.ts)                                                                       |
| Transforms                                  | [`sdk/transform.d.ts`](sdk/transform.d.ts)                                                                         |
| Runners                                     | [`sdk/runner.d.ts`](sdk/runner.d.ts)                                                                               |
| Services, commands                          | [`sdk/service.d.ts`](sdk/service.d.ts)                                                                             |
| Storage (tables)                            | [`sdk/storage.d.ts`](sdk/storage.d.ts)                                                                             |
| Widgets, templates, colors                  | [`widget.d.ts`](sdk/widget.d.ts), [`templates.d.ts`](sdk/templates.d.ts), [`appearance.d.ts`](sdk/appearance.d.ts) |
| Studio module (`defineStudioPlugin`)        | [`studio-sdk/index.d.ts`](studio-sdk/index.d.ts)                                                                   |
| A complete example                          | [`template/`](template)                                                                                            |

## How installing works

1. The Studio asks GitHub for the repo's **latest release** (drafts and pre-releases are skipped).
2. It downloads the release asset **`zflow-plugin.tgz`**, checks it against GitHub's checksum and reads its
   `zflow-plugin.json`.
3. It does the same for each dependency listed in `sources` that isn't installed yet, or is older than needed.
4. It unpacks every package into zflow's installed plugins folder and saves it in zflow's database. zflow loads it the
   next time it starts.

Nothing is built or installed on the host: no `npm install`, no install scripts. **The package has to be
self-contained**, with every runtime dependency bundled in. Packing takes care of that.

Updates work the same way. The Plugins page compares the installed version with the latest release and offers
"Update to x.y.z".

## Imports

At runtime, `@zflow/sdk` is never bundled: zflow points the import at its own copy. Studio modules share the Studio's
`react`, `react/jsx-runtime`, `react-dom`, `react-router`, `@tanstack/react-query` and `@zflow/studio-sdk`
(`SHARED_MODULES` in the studio-sdk). Import those normally; packing leaves them out of the bundle. Any other runtime
dependency goes in the plugin's `dependencies` and gets bundled in.

## The `zflow` field in package.json

```json
{
  "zflow": {
    "sdk": "^0.1.0",
    "sources": { "geo": "github:someone/zflow-geo" }
  }
}
```

- `sdk`: the range of zflow's `SDK_VERSION` the plugin works with. When it's left out, it defaults to `^` the version
  of `@zflow/sdk` you pack with. A zflow whose SDK is outside the range refuses to install the plugin.
- `sources`: for each dependency in `definePlugin({ dependencies })` that **isn't built into zflow**, the repo it's
  installed from. Built-in plugins (`core`, `templates`, `mqtt`, `iot`…) need no source. Installing your plugin also
  installs these, after showing them to the user.

## Rules for installable plugins

- **Ids:** the plugin id is permanent. Projects, storage tables and `ctx.service(id)` all use it. Prefix component,
  transform, widget and runner ids with it. Clashing with an installed plugin stops yours from loading.
- **Versions:** follow semver. Projects require `^` the version they were published with, so breaking changes to steps
  or settings need a new major version.
- **Dependencies:** list every plugin whose steps, widgets, templates, services or tables you use in `dependencies`,
  with the minimum version, and give non-built-in ones a `sources` entry.
- **No native modules:** packages with compiled binaries (`.node` files) can't be bundled. Use pure JavaScript
  libraries.
- **Files:** don't write next to your code. The installed folder is replaced on update. Use `ctx.dataDir` in
  services, or storage tables.
- **Logging:** use `ctx.logger`, never the console.

## Testing

zflow's test helpers (`@zflow/engine/testing`, mentioned in WRITING-PLUGINS.md) come with its engine, so they aren't
published. Keep the plugin's logic in plain functions, as the template's `greeting.ts` does, and test them with a test
runner such as vitest (`npm test`, which the release workflow runs when it exists). A step's `execute` can also be
called with a hand-made `ctx`.

To try the plugin in zflow, release it and install it from the Plugins page, or start zflow with `PLUGINS_DIR` set to a
folder that holds the plugin's folder.

## Packing

`npm run package` runs `zflow-pack-plugin .`, which builds the asset:

1. It bundles `main` into `dist/zflow-plugin/index.js`, for Node, with `@zflow/sdk` left out.
2. It imports that bundle to read the definition.
3. It bundles the definition's `studio` module into `studio.js`, for the browser, with the shared modules left out.
4. It writes `zflow-plugin.json` and tars the folder into **`dist/zflow-plugin.tgz`**.

`zflow-plugin.json`, the package manifest, looks like this (`PluginPackageManifest`):

```json
{
  "id": "weather",
  "name": "Weather",
  "version": "1.2.0",
  "description": "Adds steps that look up the weather",
  "sdk": "^0.1.0",
  "main": "index.js",
  "studio": "studio.js",
  "dependencies": { "templates": "0.1.0", "geo": "1.0.0" },
  "sources": { "geo": "github:someone/zflow-geo" }
}
```

If you build the package another way, keep that shape. The archive holds the manifest at its root, next to `main`
and `studio`. Paths can't leave the folder, and links are ignored.

## Releasing

1. Bump `version` in `package.json` (the template's `definePlugin` reads it from there).
2. Commit, then tag the commit `v<version>`, matching it exactly (`v1.2.0` for `1.2.0`), and push the tag.
3. The template's `.github/workflows/release.yml` type-checks, tests and packs the plugin, then creates the release
   with `zflow-plugin.tgz` attached.

To release by hand instead, run `npm run package` and then `gh release create v1.2.0 dist/zflow-plugin.tgz`.

Before releasing, check that `dist/zflow-plugin/zflow-plugin.json` lists the right id, version, dependencies and
sources.

## Newer SDKs

When zflow's plugin contract changes, this repo gets a new release. To build against it, change the version in the
three `@zflow/*` URLs and run `npm install`. Keep the `sdk` range in step with the zflow versions you support.
