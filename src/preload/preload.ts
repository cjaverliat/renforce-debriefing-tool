/**
 * Preload script — executed in a sandboxed renderer context before web content loads.
 *
 * This script bridges the main process IPC surface into the renderer via Electron's
 * `contextBridge`, which allows safe, isolated exposure of Node.js / Electron APIs
 * without enabling full Node.js access in the renderer.
 *
 * The exposed object is accessible in the renderer as `window.electronAPI`.
 *
 * @see src/preload/api.ts            — defines the electronAPI object
 * @see src/renderer/types.d.ts       — TypeScript declaration for window.electronAPI
 */
import { contextBridge } from 'electron';
import { electronAPI } from './api';

// Expose electronAPI to renderer via contextBridge
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
