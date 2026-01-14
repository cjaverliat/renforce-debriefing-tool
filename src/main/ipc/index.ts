// Register all IPC handlers
import { registerFileHandlers } from './file-handlers';
import { registerSessionHandlers } from './session-handlers';

export function registerIPCHandlers() {
  registerFileHandlers();
  registerSessionHandlers();
}