// IPC handlers for resource path resolution
import { ipcMain } from 'electron';
import { getResourcePath, resourceExists } from '@/main/utils/resource-path';

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
