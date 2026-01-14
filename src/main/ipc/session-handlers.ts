// IPC handlers for session management operations
import {dialog, ipcMain} from 'electron';
import {readFile, writeFile, access} from 'fs/promises';
import path from 'path';
import type {
    PLMDData,
    LoadedSession,
    CreateSessionParams,
} from '@/shared/types/session.ts';

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
        async (_event, plmdPath: string): Promise<LoadedSession> => {
            try {
                // Read and parse .plmd file
                const fileContent = await readFile(plmdPath, 'utf-8');
                const plmdData: PLMDData = JSON.parse(fileContent);

                // Validate version
                if (plmdData.version !== '1.0') {
                    throw new Error(`Unsupported .plmd version: ${plmdData.version}`);
                }

                // Resolve relative paths
                const plmdDir = path.dirname(plmdPath);
                const plmPath = path.resolve(plmdDir, plmdData.files.plm);
                const videoPath = path.resolve(plmdDir, plmdData.files.video);

                // Validate files exist
                try {
                    await access(plmPath);
                } catch {
                    throw new Error(`PLM file not found: ${plmPath}`);
                }

                try {
                    await access(videoPath);
                } catch {
                    throw new Error(`Video file not found: ${videoPath}`);
                }

                return {
                    plmdPath,
                    plmPath,
                    videoPath,
                    plmdData,
                };
            } catch (error) {
                if (error instanceof SyntaxError) {
                    throw new Error('Session file is corrupted or invalid');
                }
                throw new Error(
                    `Failed to load session: ${(error as Error).message}`
                );
            }
        }
    );

    // Save .plmd file (auto-save)
    ipcMain.handle(
        'session:save-plmd',
        async (_event, plmdPath: string, data: PLMDData): Promise<void> => {
            try {
                // Update lastModified timestamp
                data.metadata.lastModified = new Date().toISOString();

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
            params: CreateSessionParams
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
                const relativePlmPath = path.relative(plmdDir, params.plmPath);
                const relativeVideoPath = path.relative(plmdDir, params.videoPath);

                // Normalize to forward slashes for cross-platform compatibility
                const normalizedPlmPath = relativePlmPath.replace(/\\/g, '/');
                const normalizedVideoPath = relativeVideoPath.replace(/\\/g, '/');

                // Create .plmd data structure
                const now = new Date().toISOString();
                const plmdData: PLMDData = {
                    version: '1.0',
                    metadata: {
                        sessionName: params.sessionName,
                        createdAt: now,
                        lastModified: now,
                    },
                    files: {
                        plm: normalizedPlmPath,
                        video: normalizedVideoPath,
                    },
                    annotations: [],
                    sessionData: {
                        duration: params.duration,
                        videoName: params.videoName,
                        sessionDate: now,
                    },
                };

                const jsonContent = JSON.stringify(plmdData, null, 2);
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
