// Register all IPC handlers
import {registerSessionHandlers} from './session-handlers';
import {registerResourceHandlers} from './resource-handlers';

export function registerIPCHandlers() {
    registerSessionHandlers();
    registerResourceHandlers();
}