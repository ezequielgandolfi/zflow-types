/** Version of the plugin contract in this SDK; a plugin package's `sdk` range must accept it. */
export const SDK_VERSION = '0.1.15';
/** File at the root of a plugin package describing it. */
export const PLUGIN_PACKAGE_MANIFEST = 'zflow-plugin.json';
/** Name of the release asset holding a plugin package (a gzipped tarball). */
export const PLUGIN_PACKAGE_ASSET = 'zflow-plugin.tgz';
const isMapOf = (value, valid) => !!value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(valid);
const isDependency = (entry) => typeof entry === 'string' ||
    (!!entry &&
        typeof entry === 'object' &&
        typeof entry.version === 'string' &&
        ['undefined', 'boolean'].includes(typeof entry.optional));
const GITHUB_SOURCE = /^github:([\w.-]+\/[\w.-]+)$/;
/** The `owner/repo` of a `github:owner/repo` source, or undefined for any other kind. */
export const githubRepoOf = (source) => GITHUB_SOURCE.exec(source)?.[1];
/** Checks a parsed `zflow-plugin.json`; throws saying what's wrong. */
export function parsePluginPackageManifest(value) {
    if (!value || typeof value !== 'object')
        throw new Error(`${PLUGIN_PACKAGE_MANIFEST} must hold an object`);
    const manifest = value;
    for (const field of ['id', 'name', 'version', 'main']) {
        if (typeof manifest[field] !== 'string' || !manifest[field]) {
            throw new Error(`${PLUGIN_PACKAGE_MANIFEST} needs a "${field}" text`);
        }
    }
    for (const field of ['description', 'sdk', 'studio']) {
        if (manifest[field] !== undefined && typeof manifest[field] !== 'string') {
            throw new Error(`"${field}" in ${PLUGIN_PACKAGE_MANIFEST} must be a text`);
        }
    }
    const sources = manifest.sources;
    if (sources !== undefined && !isMapOf(sources, (entry) => typeof entry === 'string')) {
        throw new Error(`"sources" in ${PLUGIN_PACKAGE_MANIFEST} must map plugin ids to texts`);
    }
    if (manifest.dependencies !== undefined && !isMapOf(manifest.dependencies, isDependency)) {
        throw new Error(`"dependencies" in ${PLUGIN_PACKAGE_MANIFEST} must map plugin ids to versions or to { "version", "optional" }`);
    }
    for (const [id, source] of Object.entries((manifest.sources ?? {}))) {
        if (!githubRepoOf(source)) {
            throw new Error(`The source of "${id}" in ${PLUGIN_PACKAGE_MANIFEST} must look like "github:owner/repo"`);
        }
    }
    return manifest;
}
