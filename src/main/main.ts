/**
 * Electron main process entry point.
 *
 * Responsibilities:
 *   - Creates the BrowserWindow and loads the renderer
 *   - Registers the custom `media://` protocol for serving local video files
 *   - Registers all IPC handlers (session management, resource paths, app flags)
 *   - Manages the application lifecycle (quit on all windows closed, re-create on activate)
 *
 * Security:
 *   - Node integration is disabled in the renderer; the preload script bridges APIs
 *   - The `media://` protocol is registered as privileged so it can serve streaming
 *     video with Range request support, which the HTML <video> element requires
 */
import {app, BrowserWindow, Menu, protocol} from 'electron';
import path from 'node:path';
import {registerIPCHandlers} from './ipc';
import {registerAppHandlers} from './ipc/app-handlers';
import * as fs from "node:fs";
import mime from 'mime-types';

/**
 * Creates and configures the main BrowserWindow.
 *
 * In development the Vite dev server URL is loaded; in production the built
 * renderer HTML file is loaded from the ASAR archive.
 * DevTools can be toggled with Ctrl+Shift+I (or Cmd+Shift+I) and F12.
 */
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

    mainWindow.webContents.on("before-input-event", (event, input) => {
        const isDevToolsShortcut =
            input.key.toLowerCase() === "i" &&
            input.shift &&
            (input.control || input.meta); // Ctrl (Win/Linux) or Cmd (macOS)

        if (isDevToolsShortcut) {
            mainWindow.webContents.toggleDevTools();
            event.preventDefault();
        }

        // Optional: F12 support
        if (input.key === "F12") {
            mainWindow.webContents.toggleDevTools();
            event.preventDefault();
        }
    });

    // Open the DevTools.
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(
            path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
        );
    }
};

/**
 * Custom protocol name used for serving local media files to the renderer.
 * The renderer constructs URLs like `media:///C:/path/to/video.mp4` (Windows)
 * or `media:///home/user/video.mp4` (Unix) to load videos via the <video> element.
 */
export const MediaFileProtocolName = 'media';

/**
 * The base URL prefix for the media protocol, adjusted for platform path conventions.
 * Windows uses three slashes (media:///) so the drive letter becomes the hostname;
 * Unix uses two slashes (media://) for an absolute path.
 */
export const MediaFileProtocol = process.platform === 'win32' ? `${MediaFileProtocolName}:///` : `${MediaFileProtocolName}:/`

// Register the media:// scheme as privileged before app.whenReady so that the
// HTML <video> element can fetch content from it and use HTTP Range requests for seeking.
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

    // Handle media:// requests — resolve URL to a local file path and stream it.
    // Supports HTTP Range requests so the <video> element can seek efficiently.
    protocol.handle(MediaFileProtocolName, function (request) {
            try {
                const urlObj = new URL(request.url)
                const hostname = urlObj.hostname
                const pathname = decodeURIComponent(urlObj.pathname)

                // Chromium normalizes Windows drive letters differently depending on slash count:
                //   media://C:/path  → hostname='c', pathname='/path'  (two-slash form)
                //   media:///C:/path → hostname='',  pathname='/C:/path' (three-slash form)
                let filePath: string
                if (process.platform === 'win32' && /^[a-z]$/i.test(hostname)) {
                    // Chromium normalizes 'media://C:/path' → hostname='c', pathname='/path'
                    // Reconstruct the Windows path: 'c:/path'
                    filePath = path.normalize(`${hostname}:${pathname}`)
                } else if (process.platform === 'win32' && /^\/[A-Za-z]:\//.test(pathname)) {
                    // Three-slash form 'media:///C:/path' → hostname='', pathname='/C:/path'
                    filePath = path.normalize(pathname.slice(1))
                } else {
                    // Unix absolute path: 'media:///home/user/file' → pathname='/home/user/file'
                    filePath = path.normalize(pathname)
                }

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
    registerAppHandlers();
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