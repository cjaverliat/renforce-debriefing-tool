// IPC handlers for session management operations
import {dialog, ipcMain} from 'electron';
import {readFile, writeFile, access} from 'fs/promises';
import path from 'path';
import {Session, SessionData} from "@/shared/types/session.ts";

import * as fs from "fs";
import lz4js from "lz4js";

import {parsePLMFile} from "@/main/parsers/plm-parser.ts";

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


    // Load .plmd file and resolve paths
    ipcMain.handle(
        'session:load-plmd',
        async (_event, plmdPath: string): Promise<Session> => {

            // Read and parse .plmd file
            const fileContent = await readFile(plmdPath, 'utf-8');
            const plmdData: SessionData = JSON.parse(fileContent);

            // Resolve relative paths
            const plmdDir = path.dirname(plmdPath);
            const recordPath = path.resolve(plmdDir, plmdData.recordPath);
            const videoPath = path.resolve(plmdDir, plmdData.videoPath);

            // Validate files exist
            try {
                await access(recordPath);
            } catch {
                throw new Error(`PLM file not found: ${recordPath}`);
            }

            try {
                await access(videoPath);
            } catch {
                throw new Error(`Video file not found: ${videoPath}`);
            }

            try {

                const rawStream = await fs.promises.readFile(recordPath);

                const LZ4_FRAME_MAGIC = 0x184D2204;

                let uncompressedStream = recordPath;

                if (rawStream.readUInt32LE(0) === LZ4_FRAME_MAGIC) {
                    console.log("LZ4 compression detected");
                    const uncompressed = lz4js.decompress(rawStream);
                    fs.writeFileSync(uncompressedStream, uncompressed);
                    uncompressedStream = recordPath + ".uncompressed";
                }

                const stream = fs.createReadStream(uncompressedStream);

                const recordData = await parsePLMFile(stream);

                return {
                    sessionData: plmdData,
                    recordData: recordData,
                };

            } catch (error) {
                throw new Error(`Failed to parse PLM file: ${(error as Error).message}`);
            }
        }
    );

    // Save .plmd file (auto-save)
    ipcMain.handle(
        'session:save-plmd',
        async (_event, plmdPath: string, data: SessionData): Promise<void> => {
            try {
                const plmdDir = path.dirname(plmdPath);

                // Calculate relative paths
                const relativePlmPath = path.relative(plmdDir, data.recordPath);
                const relativeVideoPath = path.relative(plmdDir, data.videoPath);

                // Normalize to forward slashes for cross-platform compatibility
                const normalizedPlmPath = relativePlmPath.replace(/\\/g, '/');
                const normalizedVideoPath = relativeVideoPath.replace(/\\/g, '/');

                data.recordPath = normalizedPlmPath;
                data.videoPath = normalizedVideoPath;

                // Pretty print JSON for readability
                const jsonContent = JSON.stringify(data, null, 2);
                await writeFile(plmdPath, jsonContent, 'utf-8');
            } catch (error) {
                throw new Error(`Failed to save session: ${(error as Error).message}`);
            }
        }
    );

    // Save .plmd file as (new session creation)
    ipcMain.handle(
        'session:save-plmd-as',
        async (
            _event,
            data: SessionData
        ): Promise<string | null> => {
            const result = await dialog.showSaveDialog({
                defaultPath: `session_${Date.now()}.plmd`,
                filters: [
                    {name: 'Debriefing Sessions', extensions: ['plmd']},
                    {name: 'All Files', extensions: ['*']},
                ],
            });

            if (result.canceled || !result.filePath) {
                return null;
            }

            try {
                const plmdPath = result.filePath;
                const plmdDir = path.dirname(plmdPath);

                // Calculate relative paths
                const relativePlmPath = path.relative(plmdDir, data.recordPath);
                const relativeVideoPath = path.relative(plmdDir, data.videoPath);

                // Normalize to forward slashes for cross-platform compatibility
                const normalizedPlmPath = relativePlmPath.replace(/\\/g, '/');
                const normalizedVideoPath = relativeVideoPath.replace(/\\/g, '/');

                data.recordPath = normalizedPlmPath;
                data.videoPath = normalizedVideoPath;

                const jsonContent = JSON.stringify(data, null, 2);
                await writeFile(plmdPath, jsonContent, 'utf-8');

                return plmdPath;
            } catch (error) {
                throw new Error(
                    `Failed to create session: ${(error as Error).message}`
                );
            }
        }
    );

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
