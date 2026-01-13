// Track list panel component (left side)
import React from 'react';
import type { Track } from '../../../shared/types/ipc';

interface TrackListPanelProps {
  tracks: Track[];
}

export function TrackListPanel({ tracks }: TrackListPanelProps) {
  // TODO: Implement track list with track info
  return (
    <div style={{ width: '200px', borderRight: '1px solid #ccc' }}>
      <h3>Tracks</h3>
      {tracks.map((track) => (
        <div key={track.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
          <div>{track.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{track.type}</div>
        </div>
      ))}
    </div>
  );
}