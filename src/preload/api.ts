// Preload API exposed to renderer via contextBridge
import { ipcRenderer } from 'electron';
import type { PLMData } from '../shared/types/ipc';
import type {
  PLMDData,
  LoadedSession,
  CreateSessionParams,
} from '../shared/types/session';

export const electronAPI = {
  openFileDialog: (): Promise<string | null> => {
    return ipcRenderer.invoke('file:open-dialog');
  },

  loadPLMFile: (filePath: string): Promise<PLMData> => {
    return ipcRenderer.invoke('file:load-plm', filePath);
  },

  onError: (callback: (error: string) => void) => {
    ipcRenderer.on('error:notify', (_event, error) => callback(error));
  },

  // Session management methods
  openSessionDialog: (): Promise<string | null> => {
    return ipcRenderer.invoke('session:open-dialog');
  },

  loadPlmd: (plmdPath: string): Promise<LoadedSession> => {
    return ipcRenderer.invoke('session:load-plmd', plmdPath);
  },

  savePlmd: (plmdPath: string, data: PLMDData): Promise<void> => {
    return ipcRenderer.invoke('session:save-plmd', plmdPath, data);
  },

  savePlmdAs: (params: CreateSessionParams): Promise<string | null> => {
    return ipcRenderer.invoke('session:save-plmd-as', params);
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
};

export type ElectronAPI = typeof electronAPI;