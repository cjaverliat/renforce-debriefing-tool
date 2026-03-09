/**
 * Preload API definition — the full set of methods exposed to the renderer via `contextBridge`.
 *
 * Every method wraps an `ipcRenderer.invoke` call to the corresponding main-process
 * IPC handler. The renderer accesses these as `window.electronAPI.<method>(...)`.
 *
 * Method groups:
 *   File/dialog helpers  — openFileDialog, openSessionDialog
 *   Session lifecycle    — loadPlmd, savePlmdAs (create new), savePlmd (auto-save via session-handlers)
 *   File pickers         — selectPlm, selectVideo
 *   Path utilities       — makeRelativePath, resolvePath
 *   Resource lookup      — getResourcePath, resourceExists
 *   App flags            — getMockSession
 *   Events               — onError
 */
import {ipcRenderer} from 'electron';
import {Session, SessionData} from "@/shared/types/session.ts";

export const electronAPI = {
    /** @deprecated Use openSessionDialog instead. Opens a generic file picker dialog. */
    openFileDialog: (): Promise<string | null> => {
        return ipcRenderer.invoke('file:open-dialog');
    },

    /**
     * Registers a listener for error notifications pushed from the main process.
     * @param callback - Called with the error message string when an error occurs.
     */
    onError: (callback: (error: string) => void) => {
        ipcRenderer.on('error:notify', (_event, error) => callback(error));
    },

    // --- Session management ---

    /** Opens the native file-picker dialog for selecting an existing .plmd session file. */
    openSessionDialog: (): Promise<string | null> => {
        return ipcRenderer.invoke('session:open-dialog');
    },

    /**
     * Loads a .plmd session file and its associated .plm record.
     * Resolves relative paths inside the .plmd, decompresses LZ4 if needed,
     * and parses the protobuf stream.
     * @param plmdPath - Absolute path to the .plmd file.
     */
    loadPlmd: (plmdPath: string): Promise<Session> => {
        return ipcRenderer.invoke('session:load-plmd', plmdPath);
    },

    /**
     * Opens a save dialog and writes a new .plmd file with normalized relative paths.
     * @param data - Session metadata including record/video paths and annotations.
     * @returns The absolute path of the saved file, or null if the dialog was cancelled.
     */
    savePlmdAs: (data: SessionData): Promise<string | null> => {
        return ipcRenderer.invoke('session:save-plmd-as', data);
    },

    /** Opens the native file-picker for selecting a .plm physiological record file. */
    selectPlm: (): Promise<string | null> => {
        return ipcRenderer.invoke('session:select-plm');
    },

    /** Opens the native file-picker for selecting a video file (mp4, mov, avi, mkv, webm). */
    selectVideo: (): Promise<string | null> => {
        return ipcRenderer.invoke('session:select-video');
    },

    /**
     * Computes a relative path from `basePath`'s directory to `targetPath`.
     * The result uses forward slashes for cross-platform portability.
     */
    makeRelativePath: (basePath: string, targetPath: string): Promise<string> => {
        return ipcRenderer.invoke('path:make-relative', basePath, targetPath);
    },

    /**
     * Resolves `relativePath` against `basePath`'s directory to produce an absolute path.
     */
    resolvePath: (basePath: string, relativePath: string): Promise<string> => {
        return ipcRenderer.invoke('path:resolve', basePath, relativePath);
    },

    // --- Bundled resource helpers ---

    /**
     * Returns the absolute path for a resource relative to the data directory
     * (project root in dev, executable directory in production).
     */
    getResourcePath: (resourcePath: string): Promise<string> => {
        return ipcRenderer.invoke('resource:get-path', resourcePath);
    },

    /** Returns true if the given resource file exists on disk. */
    resourceExists: (resourcePath: string): Promise<boolean> => {
        return ipcRenderer.invoke('resource:exists', resourcePath);
    },

    /**
     * Returns true if the app was launched with the `--mock-session` CLI flag,
     * in which case the renderer should skip file loading and use mock data.
     */
    getMockSession: (): Promise<boolean> => {
        return ipcRenderer.invoke('app:get-mock-session');
    }
};

export type ElectronAPI = typeof electronAPI;