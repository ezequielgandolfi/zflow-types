#!/usr/bin/env node
var __rewriteRelativeImportExtension = (this && this.__rewriteRelativeImportExtension) || function (path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
        });
    }
    return path;
};
// Builds a plugin folder into the zflow-plugin.tgz asset that GitHub releases carry (see plugin-kit/README.md).
// Published in the plugin kit as zflow-pack-plugin.
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { parsePluginPackageManifest, PLUGIN_PACKAGE_ASSET, PLUGIN_PACKAGE_MANIFEST, SDK_VERSION, } from '@zflow/sdk';
import { SHARED_MODULES } from '@zflow/studio-sdk';
import { build } from 'esbuild';
export async function packPlugin(folder) {
    const root = resolve(folder);
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    const entry = join(root, pkg.main ?? 'index.js');
    const out = join(root, 'dist', 'zflow-plugin');
    await rm(out, { recursive: true, force: true });
    await build({
        entryPoints: [entry],
        outfile: join(out, 'index.js'),
        bundle: true,
        platform: 'node',
        format: 'esm',
        target: 'node24',
        external: ['@zflow/sdk'],
        // Bundled CommonJS dependencies still call require for Node's own modules.
        banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
        logLevel: 'warning',
    });
    const module = (await import(__rewriteRelativeImportExtension(pathToFileURL(join(out, 'index.js')).href)));
    const plugin = module.default;
    if (!plugin?.id || !plugin.name || !plugin.version) {
        throw new Error(`"${entry}" must default-export a definePlugin(...) with an id, a name and a version`);
    }
    if (plugin.studio) {
        await build({
            entryPoints: [resolve(dirname(entry), plugin.studio)],
            outfile: join(out, 'studio.js'),
            bundle: true,
            platform: 'browser',
            format: 'esm',
            target: 'es2022',
            jsx: 'automatic',
            external: [...SHARED_MODULES],
            logLevel: 'warning',
        });
    }
    const manifest = parsePluginPackageManifest({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        ...(plugin.description && { description: plugin.description }),
        sdk: pkg.zflow?.sdk ?? `^${SDK_VERSION}`,
        main: 'index.js',
        ...(plugin.studio && { studio: 'studio.js' }),
        ...(plugin.dependencies && { dependencies: plugin.dependencies }),
        ...(pkg.zflow?.sources && { sources: pkg.zflow.sources }),
    });
    await writeFile(join(out, PLUGIN_PACKAGE_MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
    const asset = join(root, 'dist', PLUGIN_PACKAGE_ASSET);
    await mkdir(dirname(asset), { recursive: true });
    // COPYFILE_DISABLE keeps macOS's tar from adding "._" metadata files.
    await promisify(execFile)('tar', ['-czf', asset, '-C', out, '.'], { env: { ...process.env, COPYFILE_DISABLE: '1' } });
    return asset;
}
if (import.meta.main) {
    const [folder] = process.argv.slice(2);
    if (!folder) {
        console.error('Usage: pack-plugin <plugin folder>');
        process.exit(1);
    }
    console.log(`Packed ${await packPlugin(folder)}`);
}
