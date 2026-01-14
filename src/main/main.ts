import { app, BrowserWindow, protocol, net } from 'electron';
import started from 'electron-squirrel-startup';
import path from 'node:path';
import { access, constants } from 'node:fs';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// Register IPC handlers
import { registerIPCHandlers } from './ipc';

// Register protocol as privileged before app ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: false,
      bypassCSP: false,
    },
  },
]);

// Register protocol before app is ready
app.whenReady().then(() => {
  // Register custom protocol for loading local video files
  protocol.handle('media', async (request) => {
    try {
      const url = request.url;
      // Remove 'media://' prefix - handle both media:// and media:/// forms
      let filePath = url.replace(/^media:\/\//, '');
      filePath = decodeURIComponent(filePath);

      // Ensure absolute path starts with /
      if (!filePath.startsWith('/') && !filePath.match(/^[A-Za-z]:/)) {
        filePath = '/' + filePath;
      }

      console.log('Protocol handler called with URL:', url);
      console.log('Resolved file path:', filePath);

      // Verify file exists and is readable
      await new Promise<void>((resolve, reject) => {
        access(filePath, constants.R_OK, (err) => {
          if (err) reject(new Error(`File not accessible: ${filePath}`));
          else resolve();
        });
      });

      console.log('File is accessible, loading via net.fetch');

      // Use net.fetch with proper file:// URL format
      // Ensure the path starts with / for absolute paths
      const fileUrl = `file://${filePath.startsWith('/') ? '' : '/'}${filePath}`;
      console.log('Loading from file URL:', fileUrl);

      const response = await net.fetch(fileUrl);

      console.log('Video loaded successfully:', {
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
      });

      return response;
    } catch (error) {
      console.error('Error in media protocol handler:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to load video',
          message: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  });

  registerIPCHandlers();
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
