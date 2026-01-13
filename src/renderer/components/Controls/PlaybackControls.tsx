// Playback controls component
import React from 'react';
import { usePlaybackStore } from '../../store/playbackStore';

export function PlaybackControls() {
  const { isPlaying, currentTime, duration, play, pause, seek } = usePlaybackStore();

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '16px', borderTop: '1px solid #ccc' }}>
      <button onClick={handlePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <span style={{ marginLeft: '16px' }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      {/* TODO: Add seek slider and other controls */}
    </div>
  );
}
