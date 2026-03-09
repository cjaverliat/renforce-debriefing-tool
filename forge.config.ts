/**
 * Electron Forge build and packaging configuration.
 *
 * Controls how the application is bundled, packaged, and distributed.
 * Uses Vite for bundling (main + preload + renderer) and applies Electron
 * Fuses for production security hardening before code-signing.
 *
 * Makers:   ZIP archive for Windows, macOS, and Linux.
 *
 * Fuses applied at package time:
 *   - RunAsNode: false                       — prevents binary from acting as a Node.js runtime
 *   - EnableCookieEncryption: true           — encrypts Electron session cookies at rest
 *   - EnableNodeOptionsEnvironmentVariable: false — blocks NODE_OPTIONS injection
 *   - EnableNodeCliInspectArguments: false   — disables --inspect in production
 *   - EnableEmbeddedAsarIntegrityValidation  — validates ASAR archive integrity on load
 *   - OnlyLoadAppFromAsar                    — prevents loading code from outside the ASAR
 */
import type {ForgeConfig} from '@electron-forge/shared-types';
import {MakerZIP} from '@electron-forge/maker-zip';
import {VitePlugin} from '@electron-forge/plugin-vite';
import {FusesPlugin} from '@electron-forge/plugin-fuses';
import {FuseV1Options, FuseVersion} from '@electron/fuses';

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        appBundleId: 'com.liris.renforce-debriefing',
    },
    hooks: {},
    rebuildConfig: {},
    makers: [
        new MakerZIP({}, ['win32', 'darwin', 'linux']),
    ],
    plugins: [
        new VitePlugin({
            // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
            // If you are familiar with Vite configuration, it will look really familiar.
            build: [
                {
                    // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
                    entry: 'src/main/main.ts',
                    config: 'vite.main.config.ts',
                    target: 'main',
                },
                {
                    entry: 'src/preload/preload.ts',
                    config: 'vite.preload.config.ts',
                    target: 'preload',
                },
            ],
            renderer: [
                {
                    name: 'main_window',
                    config: 'vite.renderer.config.ts',
                },
            ],
        }),
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
};

export default config;
