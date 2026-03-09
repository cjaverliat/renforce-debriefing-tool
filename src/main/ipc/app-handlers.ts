/**
 * Registers application-level IPC handlers.
 *
 * Channels exposed:
 *   app:get-mock-session → boolean
 *     Returns true when the process was started with the `--mock-session` CLI flag.
 *     The renderer uses this to skip file loading and render mock data instead,
 *     which is useful for UI development without a real PLM file.
 */
import {ipcMain} from 'electron';

/**
 * Registers app-level IPC handlers.
 * Called once from `main.ts` inside `app.whenReady()`.
 */
export function registerAppHandlers() {
    // Read the flag once at startup; it doesn't change during the session.
    const mockSession = process.argv.includes('--mock-session');

    ipcMain.handle('app:get-mock-session', () => mockSession);
}
