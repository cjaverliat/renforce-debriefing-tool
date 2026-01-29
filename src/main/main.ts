import {app, BrowserWindow, Menu, protocol} from 'electron';
import started from 'electron-squirrel-startup';
import path from 'node:path';
import {registerIPCHandlers} from './ipc';
import * as fs from "node:fs";
import mime from 'mime-types';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        title: 'RENFORCE - Debriefing tool',
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
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
};

export const MediaFileProtocolName = 'media';
export const MediaFileProtocol = process.platform === 'win32' ? `${MediaFileProtocolName}:///` : `${MediaFileProtocolName}:/`

protocol.registerSchemesAsPrivileged([
    {
        scheme: MediaFileProtocolName,
        privileges: {
            standard: true,
            secure: true,
            bypassCSP: true,
            allowServiceWorkers: true,
            supportFetchAPI: true,
            stream: true,
            corsEnabled: true
        }
    }
])

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    protocol.handle(MediaFileProtocolName, function (request) {
            try {
                const url = request.url.slice(MediaFileProtocol.length)
                const filePath = path.normalize(decodeURIComponent(url))

                if (!fs.existsSync(filePath)) {
                    return new Response('File not found', {status: 404})
                }

                const mimeType = mime.lookup(filePath) || 'application/octet-stream'

                const stat = fs.statSync(filePath)
                const fileSize = stat.size
                const range = request.headers.get('range')

                const headers: Record<string, string> = {
                    'Content-Type': mimeType,
                    'Accept-Ranges': 'bytes'
                }

                if (range) {
                    const parts = range.replace(/bytes=/, '').split('-')
                    const start = parseInt(parts[0], 10)
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

                    if (start >= fileSize || end >= fileSize) {
                        return new Response(null, {status: 416, headers})
                    }

                    const chunksize = end - start + 1

                    const stream = fs.createReadStream(filePath, {start, end})

                    headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`
                    headers['Content-Length'] = chunksize.toString()

                    return new Response(stream as unknown as BodyInit, {
                        status: 206,
                        headers
                    });
                } else {
                    const stream = fs.createReadStream(filePath)
                    headers['Content-Length'] = fileSize.toString()

                    return new Response(stream as unknown as BodyInit, {
                        status: 200,
                        headers
                    })
                }
            } catch (error) {
                return new Response('Internal Server Error: ' + (error as Error).message, {status: 500})
            }
        }
    )

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