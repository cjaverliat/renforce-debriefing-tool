// Register all IPC handlers
import {registerFileHandlers} from './file-handlers';
import {registerSessionHandlers} from './session-handlers';
import {registerResourceHandlers} from './resource-handlers';

export function registerIPCHandlers() {
    registerFileHandlers();
    registerSessionHandlers();
    registerResourceHandlers();
}