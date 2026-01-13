// Preload API exposed to renderer via contextBridge
import { ipcRenderer } from 'electron';
import type { PLMData } from '../shared/types/ipc';

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
};

export type ElectronAPI = typeof electronAPI;