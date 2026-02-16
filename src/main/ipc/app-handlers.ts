import {ipcMain} from 'electron';

export function registerAppHandlers() {
    const mockSession = process.argv.includes('--mock-session');

    ipcMain.handle('app:get-mock-session', () => mockSession);
}
