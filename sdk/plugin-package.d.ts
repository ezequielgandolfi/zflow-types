/** Version of the plugin contract in this SDK; a plugin package's `sdk` range must accept it. */
export declare const SDK_VERSION = "0.1.11";
/** File at the root of a plugin package describing it. */
export declare const PLUGIN_PACKAGE_MANIFEST = "zflow-plugin.json";
/** Name of the release asset holding a plugin package (a gzipped tarball). */
export declare const PLUGIN_PACKAGE_ASSET = "zflow-plugin.tgz";
/** Describes a built plugin package, so it can be checked and its dependencies found before running any of its code. */
export interface PluginPackageManifest {
    id: string;
    name: string;
    version: string;
    description?: string;
    /** Semver range of `SDK_VERSION` the plugin was built for. */
    sdk?: string;
    /** Server module, relative to the package root. */
    main: string;
    /** Pre-bundled Studio module, relative to the package root; replaces the definition's `studio`. */
    studio?: string;
    /** Same as the definition's `dependencies`: plugin ids with the minimum version of each. */
    dependencies?: Record<string, string>;
    /** Where to install dependencies that aren't built in: `github:owner/repo`. */
    sources?: Record<string, string>;
}
/** The `owner/repo` of a `github:owner/repo` source, or undefined for any other kind. */
export declare const githubRepoOf: (source: string) => string | undefined;
/** Checks a parsed `zflow-plugin.json`; throws saying what's wrong. */
export declare function parsePluginPackageManifest(value: unknown): PluginPackageManifest;
