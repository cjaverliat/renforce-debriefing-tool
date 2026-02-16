import {test as base, _electron, ElectronApplication, Page} from '@playwright/test';
import path from 'path';
import fs from 'fs';

import electron from "electron";

const electronBinary = electron as unknown as string;
const projectRoot = path.resolve(__dirname, '../..');

type ElectronFixtures = {
    electronApp: ElectronApplication;
    page: Page;
};

function getExecutablePath(): { executablePath: string; args: string[] } {
    const envPath = process.env.ELECTRON_EXECUTABLE_PATH;

    if (envPath) {
        // Using packaged app from CI
        const platform = process.platform;
        let executablePath: string;

        if (platform === 'darwin') {
            // macOS: Find .app bundle
            const outDir = path.resolve(envPath);
            const apps = fs.readdirSync(outDir).filter(f => f.endsWith('.app'));
            if (apps.length === 0) {
                throw new Error(`No .app bundle found in ${outDir}`);
            }
            const appName = apps[0];
            const appNameWithoutExt = appName.replace('.app', '');
            executablePath = path.join(outDir, appName, 'Contents', 'MacOS', appNameWithoutExt);
        } else if (platform === 'win32') {
            // Windows: Find .exe
            const outDir = path.resolve(envPath);
            const exes = fs.readdirSync(outDir).filter(f => f.endsWith('.exe'));
            if (exes.length === 0) {
                throw new Error(`No .exe found in ${outDir}`);
            }
            executablePath = path.join(outDir, exes[0]);
        } else {
            throw new Error(`Unsupported platform: ${platform}`);
        }

        // Packaged apps don't need the main.js arg
        return {
            executablePath,
            args: ['--mock-session'],
        };
    }

    // Development mode
    return {
        executablePath: electronBinary,
        args: [
            path.join(projectRoot, '.vite/build/main.js'),
            '--mock-session',
        ],
    };
}

export const test = base.extend<ElectronFixtures>({
    // eslint-disable-next-line no-empty-pattern
    electronApp: async ({}, use) => {
        const {executablePath, args} = getExecutablePath();

        const app = await _electron.launch({
            executablePath,
            args,
        });

        await use(app);

        // Use a more graceful close for CI
        await app.close();
    },

    page: async ({electronApp}, use) => {
        // CI fix: Wait for the window if it's not immediately available
        let page = electronApp.windows()[0];
        if (!page) {
            page = await electronApp.waitForEvent('window');
        }

        await page.waitForLoadState('domcontentloaded');
        // Increase timeout for slow CI runners
        await page.waitForSelector('h1', {timeout: 30_000});
        await use(page);
    },
});

export {expect} from '@playwright/test';
