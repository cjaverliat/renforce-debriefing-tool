// Preload API exposed to renderer via contextBridge
import {ipcRenderer} from 'electron';
import {Session, SessionData} from "@/shared/types/session.ts";

export const electronAPI = {
    openFileDialog: (): Promise<string | null> => {
        return ipcRenderer.invoke('file:open-dialog');
    },

    onError: (callback: (error: string) => void) => {
        ipcRenderer.on('error:notify', (_event, error) => callback(error));
    },

    // Session management methods
    openSessionDialog: (): Promise<string | null> => {
        return ipcRenderer.invoke('session:open-dialog');
    },

    loadPlmd: (plmdPath: string): Promise<Session> => {
        return ipcRenderer.invoke('session:load-plmd', plmdPath);
    },

    savePlmdAs: (data: SessionData): Promise<string | null> => {
        return ipcRenderer.invoke('session:save-plmd-as', data);
    },

    selectPlm: (): Promise<string | null> => {
        return ipcRenderer.invoke('session:select-plm');
    },

    selectVideo: (): Promise<string | null> => {
        return ipcRenderer.invoke('session:select-video');
    },

    makeRelativePath: (basePath: string, targetPath: string): Promise<string> => {
        return ipcRenderer.invoke('path:make-relative', basePath, targetPath);
    },

    resolvePath: (basePath: string, relativePath: string): Promise<string> => {
        return ipcRenderer.invoke('path:resolve', basePath, relativePath);
    },

    // Resource path methods (for bundled assets)
    getResourcePath: (resourcePath: string): Promise<string> => {
        return ipcRenderer.invoke('resource:get-path', resourcePath);
    },

    resourceExists: (resourcePath: string): Promise<boolean> => {
        return ipcRenderer.invoke('resource:exists', resourcePath);
    }
};

export type ElectronAPI = typeof electronAPI;