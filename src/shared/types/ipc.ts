// Shared type definitions for IPC communication

export interface PLMData {
  metadata: PLMMetadata;
  tracks: Track[];
  media: MediaInfo[];
}

export interface PLMMetadata {
  version: string;
  duration: number;  // milliseconds
  sampleRate: number;
  recordingDate: Date;
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  unit?: string;
  data: TimeSeriesData | EventData;
}

export type TrackType = 'waveform' | 'event' | 'video' | 'audio';

export interface TimeSeriesData {
  type: 'timeseries';
  timestamps: number[];
  values: number[];
  sampleRate: number;
}

export interface EventData {
  type: 'event';
  events: Array<{
    timestamp: number;
    value: number | string;
    label?: string;
  }>;
}

export interface MediaInfo {
  id: string;
  type: 'video' | 'audio';
  url: string;
  startTime: number;
  duration: number;
}