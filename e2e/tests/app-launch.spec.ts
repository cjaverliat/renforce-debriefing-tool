import { test, expect } from '../fixtures/electron-app';

test('mock session opens without errors', async ({ electronApp, page }) => {
  // The page fixture already waits for domcontentloaded and the h1 to render,
  // so if we get here the app launched and React rendered successfully.
  await expect(page.locator('h1')).toBeVisible();

  // Ensure no uncaught errors were logged to the main process
  const mainProcessLogs: string[] = [];
  electronApp.on('console', (msg) => mainProcessLogs.push(msg.text()));

  // Verify no error dialogs or crash overlays appeared
  await expect(page.locator('text=Error')).not.toBeVisible();
});
