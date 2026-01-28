/**
 * Utility for resolving paths to external data files.
 * Files are expected to be located next to the application executable.
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * Checks if the app is running in development mode.
 */
export function isDev(): boolean {
    return !app.isPackaged;
}

/**
 * Gets the directory where external data files should be located.
 * In development: project root
 * In production: directory containing the executable
 */
export function getDataDirectory(): string {
    if (isDev()) {
        // In development, use project root
        return app.getAppPath();
    } else {
        // In production, use the directory containing the executable
        return path.dirname(app.getPath('exe'));
    }
}

/**
 * Resolves the path to an external data file.
 * Files are expected to be next to the executable (or project root in dev).
 *
 * @param relativePath - Path relative to the data directory (e.g., 'data/video.mp4')
 * @returns Absolute path to the file
 */
export function getResourcePath(relativePath: string): string {
    return path.join(getDataDirectory(), relativePath);
}

/**
 * Checks if a resource file exists.
 */
export function resourceExists(resourcePath: string): boolean {
    const fullPath = getResourcePath(resourcePath);
    return fs.existsSync(fullPath);
}
