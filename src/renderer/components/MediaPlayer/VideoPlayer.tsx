// Video player component (synced with timeline)
import React, { useRef, useEffect } from 'react';
import type { MediaInfo } from '../../../shared/types/ipc';

interface VideoPlayerProps {
  media: MediaInfo[];
}

export function VideoPlayer({ media }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // TODO: Implement video sync with playback controller

  if (media.length === 0) {
    return null;
  }

  const videoMedia = media.find((m) => m.type === 'video');
  if (!videoMedia) {
    return null;
  }

  return (
    <div style={{ padding: '16px' }}>
      <video ref={videoRef} src={videoMedia.url} controls style={{ width: '100%' }} />
    </div>
  );
}
