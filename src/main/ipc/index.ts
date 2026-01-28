// Register all IPC handlers
import { registerFileHandlers } from './file-handlers';
import { registerSessionHandlers } from './session-handlers';
import { registerResourceHandlers } from './resource-handlers';
import {registerVideoHandlers} from "@/main/ipc/video-handlers.ts";

export function registerIPCHandlers() {
  registerFileHandlers();
  registerVideoHandlers();
  registerSessionHandlers();
  registerResourceHandlers();
}