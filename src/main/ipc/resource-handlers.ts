/**
 * IPC handlers for bundled resource path resolution.
 *
 * In development, resources are resolved relative to the project root.
 * In production (packaged), resources are resolved relative to the
 * directory containing the executable, since they are not inside the ASAR.
 *
 * Channels exposed:
 *   resource:get-path (resourcePath: string) → string
 *     Returns the absolute path for a resource relative to the data directory.
 *
 *   resource:exists (resourcePath: string) → boolean
 *     Returns true if the resolved resource file exists on disk.
 */
import { ipcMain } from 'electron';
import { getResourcePath, resourceExists } from '@/main/utils/resource-path';

/**
 * Registers resource path IPC handlers.
 * Called once from `ipc/index.ts` during handler registration.
 */
export function registerResourceHandlers() {
    // Get the absolute path to a bundled resource
    ipcMain.handle(
        'resource:get-path',
        (_event, resourcePath: string): string => {
            return getResourcePath(resourcePath);
        }
    );

    // Check if a resource exists
    ipcMain.handle(
        'resource:exists',
        (_event, resourcePath: string): boolean => {
            return resourceExists(resourcePath);
        }
    );
}
