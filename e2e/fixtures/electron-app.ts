import {test as base, _electron, ElectronApplication, Page} from '@playwright/test';
import path from 'path';

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
        // CI mode: ELECTRON_EXECUTABLE_PATH points directly to the executable binary
        return {
            executablePath: path.resolve(envPath),
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
