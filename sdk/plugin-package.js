/** Version of the plugin contract in this SDK; a plugin package's `sdk` range must accept it. */
export const SDK_VERSION = '0.1.5';
/** File at the root of a plugin package describing it. */
export const PLUGIN_PACKAGE_MANIFEST = 'zflow-plugin.json';
/** Name of the release asset holding a plugin package (a gzipped tarball). */
export const PLUGIN_PACKAGE_ASSET = 'zflow-plugin.tgz';
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
    for (const field of ['dependencies', 'sources']) {
        const map = manifest[field];
        if (map === undefined)
            continue;
        if (!map || typeof map !== 'object' || Object.values(map).some((entry) => typeof entry !== 'string')) {
            throw new Error(`"${field}" in ${PLUGIN_PACKAGE_MANIFEST} must map plugin ids to texts`);
        }
    }
    for (const [id, source] of Object.entries((manifest.sources ?? {}))) {
        if (!githubRepoOf(source)) {
            throw new Error(`The source of "${id}" in ${PLUGIN_PACKAGE_MANIFEST} must look like "github:owner/repo"`);
        }
    }
    return manifest;
}
