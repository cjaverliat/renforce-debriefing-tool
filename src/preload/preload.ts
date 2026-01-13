// Preload script - exposes IPC API to renderer process
import { contextBridge } from 'electron';
import { electronAPI } from './api';

// Expose electronAPI to renderer via contextBridge
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
