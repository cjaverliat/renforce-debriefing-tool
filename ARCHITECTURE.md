# PLM Timeline Viewer - Architecture

This document describes the skeleton architecture of the PLM Timeline Viewer application.

## Project Structure

```
src/
├── shared/types/          # Shared TypeScript definitions
│   └── ipc.ts             # IPC message types and data structures
│
├── main/                  # Electron main process
│   ├── main.ts            # Entry point, window creation
│   ├── ipc/               # IPC handlers
│   │   ├── index.ts       # Register all handlers
│   │   └── fileHandlers.ts # File dialog and PLM loading
│   └── parsers/           # Data parsers
│       └── plmParser.ts   # PLM protobuf parser (TODO: implement)
│
├── preload/               # Electron preload script
│   ├── preload.ts         # Expose API to renderer
│   └── api.ts             # contextBridge API definition
│
└── renderer/              # React frontend
    ├── App.tsx            # Main application component
    ├── renderer.ts        # Renderer entry point
    ├── types.d.ts         # Global type declarations
    │
    ├── store/             # Zustand state management
    │   ├── dataStore.ts   # PLM data state
    │   ├── playbackStore.ts # Playback state
    │   └── timelineStore.ts # Timeline viewport state
    │
    ├── components/
    │   ├── Timeline/      # Timeline components
    │   │   ├── Timeline.tsx        # Main container
    │   │   ├── TimeRuler.tsx       # Time axis (TODO)
    │   │   ├── TrackListPanel.tsx  # Track info panel
    │   │   ├── TimelineCanvas.tsx  # Canvas renderer (TODO)
    │   │   └── TimeCursor.tsx      # Playback cursor
    │   ├── Controls/      # Playback controls
    │   │   └── PlaybackControls.tsx
    │   └── MediaPlayer/   # Media player
    │       └── VideoPlayer.tsx     # Video sync (TODO)
    │
    ├── services/          # Business logic
    │   └── playbackController.ts  # Playback coordination (TODO)
    │
    └── utils/             # Utilities
        ├── waveformRenderer.ts    # Canvas drawing (TODO)
        └── timeConversion.ts      # Time formatting
```

## Data Flow

1. **User clicks "Open PLM File"**
   - App.tsx → window.electronAPI.openFileDialog()
   - IPC: 'file:open-dialog' → Main process shows file dialog
   - Returns file path

2. **Load PLM file**
   - dataStore.loadFile(filePath)
   - IPC: 'file:load-plm' → Main process reads and parses file
   - Returns PLMData → Stored in dataStore
   - Updates playback duration

3. **Render timeline**
   - Timeline component subscribes to stores
   - Reads tracks, viewport, playback state
   - Renders canvas and UI components

## State Management (Zustand)

### dataStore
- `plmData`: Loaded PLM data (null initially)
- `isLoading`: Loading state
- `error`: Error message
- Actions: `loadFile()`, `clearData()`

### playbackStore
- `isPlaying`, `currentTime`, `playbackRate`, `duration`
- Actions: `play()`, `pause()`, `seek()`, `updateCurrentTime()`

### timelineStore
- `viewportStart`, `viewportEnd`, `pixelsPerMs`
- `selectedTrackIds`
- Actions: `setViewport()`, `zoom()`, `pan()`, `selectTrack()`

## IPC Channels

- `file:open-dialog` → Opens file picker
- `file:load-plm` → Loads and parses PLM file
- `error:notify` → Error notifications (not yet used)

## Key Components

### Timeline (Timeline.tsx)
- Container for timeline UI
- Handles zoom (Ctrl+wheel) and pan interactions
- Manages viewport state

### TrackListPanel (TrackListPanel.tsx)
- Displays track names and types
- Left panel with fixed width

### TimelineCanvas (TimelineCanvas.tsx)
- Canvas-based rendering for performance
- TODO: Implement waveform/event rendering

### PlaybackControls (PlaybackControls.tsx)
- Play/pause button
- Time display
- TODO: Seek slider

### VideoPlayer (VideoPlayer.tsx)
- HTML5 video player
- TODO: Sync with playback controller

## Implementation TODO

The following features are stubbed and need implementation:

1. **PLM Parser** (src/main/parsers/plmParser.ts)
   - Parse protobuf messages based on .proto definitions
   - Convert to PLMData structure with TypedArrays

2. **Waveform Rendering** (src/renderer/utils/waveformRenderer.ts)
   - Implement `renderWaveform()` for time-series data
   - Implement `renderEvents()` for event markers
   - Binary search for visible data range
   - Value normalization and canvas drawing

3. **Canvas Rendering** (src/renderer/components/Timeline/TimelineCanvas.tsx)
   - Full implementation of canvas rendering
   - Call waveform/event renderers
   - Handle multiple tracks

4. **Time Ruler** (src/renderer/components/Timeline/TimeRuler.tsx)
   - Draw time axis with tick marks
   - Format time labels

5. **Playback Controller** (src/renderer/services/playbackController.ts)
   - Complete RAF loop implementation
   - Video sync logic
   - Drift correction

6. **Video Sync** (src/renderer/components/MediaPlayer/VideoPlayer.tsx)
   - Register with playback controller
   - Handle play/pause/seek events
   - Maintain sync < 100ms

## Development

Install dependencies:
```bash
npm install
```

Run development server:
```bash
npm start
```

Build:
```bash
npm run package
```

## Next Steps

1. Implement protobuf parser with your .proto definitions
2. Test file loading with sample .plm file
3. Implement canvas waveform rendering
4. Add playback controller logic
5. Implement video synchronization
6. Add styling and polish
