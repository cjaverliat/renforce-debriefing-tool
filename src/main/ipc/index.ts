/**
 * Central IPC handler registration.
 *
 * Imports all domain-specific handler registrars and calls them so that
 * `main.ts` only needs a single `registerIPCHandlers()` call to expose
 * the full IPC surface to the renderer.
 *
 * IPC domains:
 *   - session    → session:open-dialog, session:load-plmd, session:save-plmd, etc.
 *   - resource   → resource:get-path, resource:exists
 *   - path       → path:make-relative, path:resolve
 */
import {registerSessionHandlers} from './session-handlers';
import {registerResourceHandlers} from './resource-handlers';

/**
 * Registers all IPC handlers for the application.
 * Must be called once inside `app.whenReady()` before the BrowserWindow is created.
 */
export function registerIPCHandlers() {
    registerSessionHandlers();
    registerResourceHandlers();
}