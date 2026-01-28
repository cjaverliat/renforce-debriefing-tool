// IPC handlers for file operations
import {dialog, ipcMain} from 'electron';
import {readFile} from 'fs/promises';
import {parsePLMFile} from '../parsers/plm-parser';
import {RecordData} from "@/shared/types/record.ts";

export function registerFileHandlers() {
    // Open file dialog
    ipcMain.handle('file:open-dialog', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                {name: 'PLM Files', extensions: ['plm']},
                {name: 'All Files', extensions: ['*']},
            ],
        });

        return result.canceled ? null : result.filePaths[0];
    });

    // Load and parse PLM file
    ipcMain.handle('file:load-plm', async (_event, filePath: string): Promise<RecordData> => {
        try {
            const buffer = await readFile(filePath);
            const plmData = parsePLMFile(buffer);
            return plmData;
        } catch (error) {
            throw new Error(`Failed to load PLM file: ${(error as Error).message}`);
        }
    });
}