import React from 'react';
import { createRoot } from 'react-dom/client';
import { useDataStore } from './store/dataStore';
import { usePlaybackStore } from './store/playbackStore';
import { Timeline } from './components/Timeline/Timeline';
import { PlaybackControls } from './components/Controls/PlaybackControls';
import { VideoPlayer } from './components/MediaPlayer/VideoPlayer';

function App() {
  const { plmData, isLoading, error, loadFile } = useDataStore();
  const setDuration = usePlaybackStore((state) => state.setDuration);

  const handleOpenFile = async () => {
    const filePath = await window.electronAPI.openFileDialog();
    if (filePath) {
      await loadFile(filePath);
      if (useDataStore.getState().plmData) {
        setDuration(useDataStore.getState().plmData!.metadata.duration);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '16px', borderBottom: '1px solid #ccc' }}>
        <button onClick={handleOpenFile}>Open PLM File</button>
        <span style={{ marginLeft: '16px', fontWeight: 'bold' }}>
          PLM Timeline Viewer
        </span>
      </header>

      <main style={{ flex: 1, overflow: 'hidden' }}>
        {isLoading && <div style={{ padding: '16px' }}>Loading...</div>}
        {error && <div style={{ padding: '16px', color: 'red' }}>Error: {error}</div>}
        {plmData && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Timeline tracks={plmData.tracks} duration={plmData.metadata.duration} />
            <VideoPlayer media={plmData.media} />
            <PlaybackControls />
          </div>
        )}
        {!plmData && !isLoading && !error && (
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <p>Open a .plm file to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}

const root = createRoot(document.body);
root.render(<App />);