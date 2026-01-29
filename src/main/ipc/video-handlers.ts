// IPC handlers for file operations
import {ipcMain} from 'electron';

import ffmpeg from 'fluent-ffmpeg';

export function registerVideoHandlers() {
    ipcMain.handle('video:get-duration', async (_, videoPath: string) => {
        return new Promise<number>((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) return reject(err);
                if (!metadata || !metadata.format || !metadata.format.duration) {
                    return reject(new Error('Could not read video duration'));
                }
                resolve(metadata.format.duration);
            });
        });
    });

}