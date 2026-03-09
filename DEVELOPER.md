# DEVELOPER.md — RENFORCE Debriefing Tool

Developer reference for contributors and maintainers.

---

## 1. Project Overview

**RENFORCE Debriefing Tool** is a desktop application for reviewing training session recordings.
An instructor loads a `.plmd` session file that references a video recording and a `.plm` record file.
The tool synchronizes video playback with a multi-track timeline showing physiological signals, procedure phases, safety incident markers, and system events.
Instructors add timestamped annotations that can be exported as a text report.

**Tech stack**

| Layer | Technology |
|---|---|
| Desktop shell | Electron 34 |
| UI framework | React 19 + TypeScript |
| Build / bundle | Vite + Electron Forge |
| Styling | Tailwind CSS v4 (Vite plugin) |
| UI primitives | Radix UI + shadcn/ui pattern |
| Layout | react-resizable-panels |
| Protobuf parsing | @bufbuild/protobuf |
| LZ4 decompression | lz4js |
| Internationalisation | i18next + react-i18next |

**Key features**
- Load `.plmd` + `.plm` + video as a linked session
- Multi-track timeline (physiological signals, procedures, incidents, system markers, annotations)
- Two-level visibility filters: category toggle + individual item toggle
- Anchor-based playback synced between the video element and all timeline components
- Manual annotation CRUD with color picker
- Text report export
- Mock session mode for development without real data files

---

## 2. Architecture

### 2.1 Electron three-process model

```
┌─────────────────────────────────────────────────────────────────┐
│  Main Process  (src/main/)                                      │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   main.ts    │  │  ipc/index.ts    │  │  parsers/        │  │
│  │ BrowserWindow│  │  session-handlers│  │  plm-parser.ts   │  │
│  │ media:// prot│  │  resource-handler│  │                  │  │
│  │ app lifecycle│  │  app-handlers    │  │  utils/          │  │
│  └──────────────┘  └──────────────────┘  │  resource-path.ts│  │
│                                          └──────────────────┘  │
│                    IPC (contextBridge)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Preload Script  (src/preload/)                            │ │
│  │  preload.ts → api.ts → exposeInMainWorld('electronAPI')    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                    window.electronAPI                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Renderer Process  (src/renderer/)                         │ │
│  │  main.tsx → ThemeProvider → App → LoadingPanel|SessionPanel│ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Module dependency table

| Module | Depends on | Depended on by |
|---|---|---|
| `shared/types/` | — | Everything |
| `shared/data/mock-session.ts` | shared/types | app.tsx |
| `main/parsers/plm-parser.ts` | @proto, shared/types | session-handlers |
| `main/ipc/session-handlers.ts` | plm-parser, shared/types | ipc/index |
| `main/ipc/resource-handlers.ts` | utils/resource-path | ipc/index |
| `main/ipc/app-handlers.ts` | — | main.ts |
| `main/main.ts` | ipc/index, app-handlers | Electron entry |
| `preload/api.ts` | shared/types | preload.ts |
| `preload/preload.ts` | api.ts | Electron preload |
| `renderer/hooks/` | shared/types/playback | Components |
| `renderer/components/ui/` | Radix UI, hooks | Feature components |
| `renderer/components/timeline-track-*.tsx` | ui/, shared/types | timeline.tsx |
| `renderer/components/timeline.tsx` | timeline-track-*, hooks, shared/types | session-panel |
| `renderer/session-panel.tsx` | All components, hooks, shared/types | app.tsx |
| `renderer/app.tsx` | session-panel, loading-panel | main.tsx |

### 2.3 Security model

- **Context isolation** is enabled; the renderer has no direct Node.js access.
- The preload script uses `contextBridge.exposeInMainWorld` to expose a typed `electronAPI` surface.
- **Electron Fuses** applied at package time: `RunAsNode=false`, cookie encryption, ASAR integrity validation, `OnlyLoadAppFromAsar=true`.
- The custom `media://` protocol is registered as privileged (stream, corsEnabled, bypassCSP) so the `<video>` element can make HTTP Range requests to local files.

---

## 3. Data Flow

### 3.1 Session load lifecycle

```
User clicks "Load existing"
  └─ window.electronAPI.openSessionDialog()          IPC: session:open-dialog
       └─ main: dialog.showOpenDialog()              → plmdPath
  └─ window.electronAPI.loadPlmd(plmdPath)           IPC: session:load-plmd
       └─ main: readFile(plmdPath) → JSON.parse()    → SessionData
       └─ main: path.resolve() relative paths        → absolute recordPath, videoPath
       └─ main: LZ4 check + decompress if needed     → .plm.uncompressed cache file
       └─ main: parsePLMFile(stream)                 → RecordData
       └─ main: return { sessionData, recordData }   → Session
  └─ renderer: setSession(session)                   → renders SessionPanel
```

### 3.2 Anchor-based playback pattern

Instead of a continuously ticking `currentTime` state, the app stores an *anchor*:

```typescript
interface PlaybackState {
  anchorTime:      number;   // media time at the anchor point (seconds)
  anchorTimestamp: number;   // wall-clock time when anchor was set (performance.now())
  speed:           number;   // playback rate multiplier
  isPlaying:       boolean;
}
// Derived: currentTime = anchorTime + (isPlaying ? (now - anchorTimestamp) * speed / 1000 : 0)
```

This means:
- Seeking = update `anchorTime` + `anchorTimestamp`, no animation frame needed.
- Play/pause = toggle `isPlaying`, anchor keeps the current position.
- Components that need a live-updating time subscribe via `usePlaybackTime()`, which drives a `requestAnimationFrame` loop only while `isPlaying`.
- All other components receive only the stable `PlaybackState` object and re-render only when the anchor changes.

### 3.3 IPC channel reference

| Channel | Direction | Arguments | Return | Description |
|---|---|---|---|---|
| `app:get-mock-session` | R→M | — | boolean | Is `--mock-session` flag set? |
| `session:open-dialog` | R→M | — | string\|null | Open .plmd picker |
| `session:load-plmd` | R→M | plmdPath | Session | Load+parse session |
| `session:save-plmd` | R→M | plmdPath, SessionData | void | Auto-save |
| `session:save-plmd-as` | R→M | SessionData | string\|null | Save new .plmd |
| `session:select-plm` | R→M | — | string\|null | Pick .plm file |
| `session:select-video` | R→M | — | string\|null | Pick video file |
| `path:make-relative` | R→M | basePath, targetPath | string | Relative path (fwd slashes) |
| `path:resolve` | R→M | basePath, relativePath | string | Absolute path |
| `resource:get-path` | R→M | resourcePath | string | Absolute bundled resource path |
| `resource:exists` | R→M | resourcePath | boolean | Check resource exists |

### 3.4 Visibility filter pipeline

```
RecordData (all items)
  └─ VisibilityState (category booleans + per-item ID Sets)
       └─ useMemo filters in Timeline.tsx
            ├─ filteredTracks            → SignalContent (one per track)
            ├─ filteredSystemMarkers     → SystemContent
            ├─ filteredProcedures        → ProceduresContent (action markers also filtered)
            └─ filteredIncidentMarkers   → IncidentsContent
```

Item ID format used as Set keys:
- System / incident markers: `` `${time}:${label}:${index}` ``
- Procedure action markers: `` `${procedureId}:${index}` ``
- Procedures: `procedure.id`
- Tracks: `track.id`

---

## 4. Key Components

### SessionPanel (`src/renderer/session-panel.tsx`)
The main debriefing workspace. Owns all mutable session state: `playbackState`, `annotations`, `visibility`, `selectedItem`. All child components are fully controlled — they receive state via props and communicate back via callbacks. The `selectionVersion` counter is incremented on every selection to let children re-trigger `scrollIntoView` even when the same item is re-selected.

### Timeline (`src/renderer/components/timeline.tsx`)
The bottom panel. Manages zoom levels, scroll synchronization between the label column / ruler / track area (three separate scrollable DOM containers), and the per-track visibility filtering. Each track is a `TimelineTrack` container (which draws the playhead overlay canvas) containing a track-specific content component.

### VideoPlayer (`src/renderer/components/video-player.tsx`)
A controlled `<video>` element that is kept in sync with `PlaybackState` via three separate `useEffect` hooks (speed, play/pause, seek). A fourth effect runs a 1 Hz drift-correction interval during playback to re-align `video.currentTime` if it drifts more than 200 ms from the anchor-computed expected time.

### PLM Parser (`src/main/parsers/plm-parser.ts`)
Streaming protobuf parser. Reads a Node.js `Readable` stream of length-prefixed `PackedSample` messages, accumulating incomplete frames across chunk boundaries in a `leftover` buffer. After the stream ends, leftover bytes are flushed through a generator. Currently computes duration from the maximum timestamp and returns empty track/marker arrays — full physiological signal extraction is work in progress.

### Mock Session (`src/shared/data/mock-session.ts`)
Generates a realistic 150-second French laboratory session (acid dilution scenario) with heart rate, respiration, and skin conductance signals, four procedures, several action markers, system markers, incident markers, and manual annotations. Used when `--mock-session` is passed or during `handleSessionLoaded` (currently the record data is overridden with mock data — see TODO in `app.tsx`).

---

## 5. Configuration & Setup

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10

### Install and run

```bash
npm install
npm start                  # starts Electron with hot reload via Vite dev server
npm start -- --mock-session  # skip file loading, render mock data
```

### Build and package

```bash
npm run lint       # ESLint check
npm run package    # build and package the Electron app (no installer)
npm run make       # build distributable installers (ZIP for all platforms)
npm run publish    # publish via configured Forge publisher
```

### Path aliases

Configured in all three Vite configs and reflected in `tsconfig.json`:

| Alias | Resolves to |
|---|---|
| `@/` | `src/` |
| `@proto/` | `generated/typescript/` (protobuf TypeScript bindings) |

---

## 6. Usage Examples

### Adding a new IPC channel

1. **Main process** — add a handler in the appropriate `src/main/ipc/*-handlers.ts` file:
   ```typescript
   ipcMain.handle('myfeature:do-thing', async (_event, arg: string): Promise<Result> => {
       return doThing(arg);
   });
   ```
2. **Preload API** — expose it in `src/preload/api.ts`:
   ```typescript
   doThing: (arg: string): Promise<Result> =>
       ipcRenderer.invoke('myfeature:do-thing', arg),
   ```
3. **Renderer usage** — call from any component:
   ```typescript
   const result = await window.electronAPI.doThing('hello');
   ```

### Adding a new timeline track type

1. Create `src/renderer/components/timeline-track-mytype.tsx` exporting a `MyTypeContent` component with props `{ items, pixelsPerSecond, onSeek, ... }`.
2. Add the corresponding label in `timeline.tsx` inside the labels `<div>` (wrap in `<TimelineLabel>`).
3. Add the track in the tracks scrollable `<div>` (wrap in `<TimelineTrack>`), conditionally rendered from `visibility`.
4. Add filtering logic in the `useMemo` blocks.
5. Add visibility fields to `VisibilityState` in `src/shared/types/visibility.ts` and initialise them in `createInitialVisibilityState` in `session-panel.tsx`.

### Adding a new export format

1. In `src/renderer/components/export-controls.tsx`, add a new generator function (e.g. `generateCsvReport()`).
2. Add a new `<Button>` calling `downloadFile(content, filename, mimeType)`.
3. No IPC is required — the renderer uses the browser Blob/URL download API directly.

---

## 7. Design Decisions

### Anchor-based playback (why)
Passing a continuously-updated `currentTime` prop at 60fps to every component that needs it would cause the entire component tree to re-render on every frame. The anchor pattern separates *when the anchor changed* (a React state update, triggers one synchronous re-render) from *what the derived time is now* (computed inside `usePlaybackTime` via `requestAnimationFrame`, local to each subscriber component). Components that only need the playhead position update themselves without causing sibling re-renders.

### Custom `media://` protocol (why)
Electron's `file://` protocol does not support HTTP Range requests. Without Range support, the HTML `<video>` element cannot seek in the video — it must download the entire file before playback can start. The custom `media://` protocol handler implements Range responses (`Content-Range`, HTTP 206 Partial Content) using Node.js `fs.createReadStream`, enabling instant seeking in large video files.

### Two-level visibility (why)
A single category toggle (show/hide all physio tracks) is insufficient for detailed review — instructors may want to compare only two of five signals. The two-level design (category boolean + per-item ID Set) lets the UI show a "partially visible" state: the category toggle controls the outer visibility, the per-item toggle controls individual visibility within a visible category.

### PLM streaming parser (why)
PLM files can be large (hundreds of MB for long sessions). Loading the entire file into memory before parsing would increase startup latency and peak memory usage. The streaming parser processes the file in chunks as they arrive, allowing the OS to page in data lazily and keeping memory usage proportional to the chunk size plus the accumulated `PackedSample` array.

---

## 8. Limitations & Considerations

### PLM parser stub
`src/main/parsers/plm-parser.ts` correctly reads and deserialises `PackedSample` protobuf messages and computes session duration from timestamps, but does not yet extract physiological signal data or map tracking events to `Procedure`/`SystemMarker`/`IncidentMarker` records. Until this is implemented, `session.recordData` always contains empty arrays for tracks and markers when loading a real `.plm` file. As a workaround, `app.tsx` currently replaces `session.recordData` with mock data after loading (marked with a TODO comment).

### Mock session purpose
`createMockSession()` in `src/shared/data/mock-session.ts` generates a French chemistry lab scenario. It exists solely for UI development without a real PLM file. It is not representative of real PLM output and should be removed once the parser is complete.

### Windows path normalization
Windows path separators (`\`) are normalized to forward slashes (`/`) when storing paths in `.plmd` JSON files so that sessions created on Windows can be opened on other platforms. This normalization happens in `session-handlers.ts` before writing the JSON. The `media://` protocol handler has special-case logic to reconstruct Windows drive letter paths from Chromium's URL normalization.

### LZ4 cache file
If a `.plm` file is LZ4-compressed, `session-handlers.ts` decompresses it on first load and writes the result to `<file>.plm.uncompressed` next to the original. Subsequent loads skip decompression if this file exists. This file is not cleaned up automatically — if the original `.plm` changes, the cache must be deleted manually.

### Protobuf schema versioning
The protobuf schemas in `generated/typescript/` are code-generated from `.proto` definitions (not included in this repository). If the PLUME application changes its protobuf schema, the generated TypeScript bindings must be regenerated and the parser updated accordingly. There is currently no schema version check at parse time.
