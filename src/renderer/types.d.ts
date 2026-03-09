/**
 * Global TypeScript declarations for the renderer process.
 *
 * Augments the browser `Window` interface with `electronAPI`, which is injected
 * by the preload script via `contextBridge.exposeInMainWorld('electronAPI', ...)`.
 * This allows renderer code to call `window.electronAPI.method()` with full type safety.
 *
 * @see src/preload/api.ts    — ElectronAPI implementation
 * @see src/preload/preload.ts — contextBridge registration
 */
import type { ElectronAPI } from '../preload/api';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
