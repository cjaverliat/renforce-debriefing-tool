# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron-based video debriefing application built with React, TypeScript, and Vite. The application allows users to annotate training videos with timestamped markers and export debriefing reports. It's designed to load PLM (protobuf-based) files containing session data and synchronized video.

## Build and Development Commands

```bash
# Start development server with hot reload
npm start

# Build application packages for distribution
npm run package

# Create distributable installers (deb, rpm, zip, squirrel)
npm run make

# Publish application
npm run publish

# Run ESLint
npm run lint
```

## Architecture

### Electron Multi-Process Architecture

The application follows Electron's standard three-process model:

**Main Process** (`src/main/`):
- Entry point: `src/main/main.ts`
- Creates BrowserWindow, handles app lifecycle
- Registers IPC handlers via `src/main/ipc/index.ts`
- File operations in `src/main/ipc/fileHandlers.ts` (open dialogs, load PLM files)
- PLM file parsing in `src/main/parsers/plmParser.ts` (currently placeholder)

**Preload Script** (`src/preload/`):
- Bridges main and renderer processes securely
- Exposes IPC API via contextBridge in `src/preload/preload.ts`
- API definition in `src/preload/api.ts`

**Renderer Process** (`src/renderer/`):
- React application entry: `src/renderer/main.tsx`
- Main component: `src/renderer/app.tsx`
- UI components in `src/renderer/components/`

### Shared Types

Common types defined in `src/shared/types/*.ts`:
- Type definitions shared between main and renderer

### Key Components

**Video Player** (`video-player.tsx`):
- Renders video with playback controls
- Syncs with timeline

**Timeline** (`timeline.tsx`):
- Visual timeline with ruler (`timeline-ruler.tsx`)
- Annotation tracks (`timeline-track.tsx`)
- Playback controls (`timeline-controls.tsx`)

**Annotations** (`annotations-panel.tsx`, `annotation-dialog.tsx`):
- Sidebar panel showing all annotations
- Dialog for creating/editing annotations with categories and colors

**Export** (`export-controls.tsx`):
- Export annotations to various formats

### State Management

Currently using React useState hooks in app.tsx. Key state:
- `isPlaying`, `currentTime`, `duration`: Playback state
- `annotations`: Array of annotation objects
- Video and timeline sync via callbacks

### Styling

- TailwindCSS v4 with Vite plugin
- Custom theme in `src/renderer/styles/theme.css`
- UI components library (Radix UI + shadcn/ui pattern) in `src/renderer/components/ui/`

### IPC Communication Pattern

```typescript
// Main process handler registration
ipcMain.handle('channel:name', async (event, arg) => { ... });

// Preload API exposure
contextBridge.exposeInMainWorld('electronAPI', {
  methodName: () => ipcRenderer.invoke('channel:name')
});

// Renderer usage
window.electronAPI.methodName();
```

### Path Aliases

TypeScript/Vite configured with `@/*` alias pointing to `src/*`:
```typescript
import { Component } from '@/renderer/components/component';
```

## Important Implementation Details

### PLM File Format

The application is designed to parse `.plm` files (protobuf format) containing:
- Metadata (version, duration, sample rate, recording date)
- Multiple data tracks (waveforms, events)
- Media references (video/audio files)

**Current Status**: Parser stub in `src/main/parsers/plmParser.ts` needs implementation with protobufjs library (already installed).

### Keyboard Shortcuts

- **Space**: Play/pause video
- **M**: Add annotation at current time

### Electron Forge Configuration

Built with `@electron-forge/plugin-vite`:
- Main process config: `vite.main.config.ts`
- Preload config: `vite.preload.config.ts`
- Renderer config: `vite.renderer.config.ts`
- Forge config: `forge.config.ts`

Makers configured for: Windows (ZIP), macOS (DMG), Linux (DEB, RPM)

### Security

- Context isolation enabled (preload script uses contextBridge)
- Node integration disabled in renderer
- Electron Fuses configured for production security

## Development Notes

- Dev tools open automatically in development (`main.ts:30`)
- Main window size: 1400x900px
- Uses protobufjs for PLM file parsing (types: `@types/protobufjs`)
- TypeScript with strict mode (`noImplicitAny: true`)

## UI Component Conventions

- Prefer using existing primitive UI components from `src/renderer/components/ui` whenever possible.
- When implementing new UI elements, first check whether an appropriate primitive component already exists in `src/renderer/components/ui` and compose from it rather than creating ad-hoc markup.
- If a required primitive component does not exist, create it in `src/renderer/components/ui` following the existing Radix UI + shadcn/ui patterns (headless primitives, forwardRef, Tailwind-based styling).
- Higher-level, feature-specific components should only compose primitives and should not reimplement low-level UI behavior or styling directly.
