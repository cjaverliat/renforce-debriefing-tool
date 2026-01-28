// IPC handlers for session management operations
import {dialog, ipcMain} from 'electron';
import path from 'path';

export function registerSessionHandlers() {
    // Open .plmd file dialog
    ipcMain.handle('session:open-dialog', async (): Promise<string | null> => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                {name: 'Debriefing Sessions', extensions: ['plmd']},
                {name: 'All Files', extensions: ['*']},
            ],
        });

        return result.canceled ? null : result.filePaths[0];
    });

    // Select PLM file (for new session)
    ipcMain.handle('session:select-plm', async (): Promise<string | null> => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                {name: 'PLM Files', extensions: ['plm']},
                {name: 'All Files', extensions: ['*']},
            ],
        });

        return result.canceled ? null : result.filePaths[0];
    });

    // Select video file (for new session)
    ipcMain.handle('session:select-video', async (): Promise<string | null> => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                {
                    name: 'Video Files',
                    extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
                },
                {name: 'All Files', extensions: ['*']},
            ],
        });

        return result.canceled ? null : result.filePaths[0];
    });

    // Convert absolute to relative path
    ipcMain.handle(
        'path:make-relative',
        (_event, basePath: string, targetPath: string): string => {
            const baseDir = path.dirname(basePath);
            const relative = path.relative(baseDir, targetPath);
            // Normalize to forward slashes for cross-platform
            return relative.replace(/\\/g, '/');
        }
    );

    // Convert relative to absolute path
    ipcMain.handle(
        'path:resolve',
        (_event, basePath: string, relativePath: string): string => {
            const baseDir = path.dirname(basePath);
            return path.resolve(baseDir, relativePath);
        }
    );
}
