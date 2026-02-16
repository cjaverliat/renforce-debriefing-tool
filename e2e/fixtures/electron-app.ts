import {test as base, _electron, ElectronApplication, Page} from '@playwright/test';
import path from 'path';

import electron from "electron";

const electronBinary = electron as unknown as string;
const projectRoot = path.resolve(__dirname, '../..');

type ElectronFixtures = {
    electronApp: ElectronApplication;
    page: Page;
};

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const test = base.extend<ElectronFixtures>({
    // eslint-disable-next-line no-empty-pattern
    electronApp: async ({}, use) => {
        const app = await _electron.launch({
            executablePath: electronBinary,
            args: [
                path.join(projectRoot, '.vite/build/main.js'),
                '--mock-session',
            ],
        });

        await use(app);
        await app.close();
        // Allow Windows to fully release the process before next test
        await delay(500);
    },

    page: async ({electronApp}, use) => {
        const page = await electronApp.firstWindow();
        await page.waitForLoadState('domcontentloaded');
        // Wait for React to render the session panel
        await page.waitForSelector('h1', {timeout: 15_000});
        await use(page);
    },
});

export {expect} from '@playwright/test';
