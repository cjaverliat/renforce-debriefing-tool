// Session-related type definitions for .plmd file format and IPC
import type { Annotation } from '@/renderer/components/annotations-panel';

export interface PLMDMetadata {
  sessionName: string;
  createdAt: string; // ISO 8601 timestamp
  lastModified: string; // ISO 8601 timestamp
}

export interface SessionData {
  duration: number; // Duration in seconds
  videoName: string;
  sessionDate: string; // ISO 8601 timestamp
}

export interface PLMDFiles {
  plm: string; // Relative path to PLM file
  video: string; // Relative path to video file
}

export interface PLMDData {
  version: string;
  metadata: PLMDMetadata;
  files: PLMDFiles;
  annotations: Annotation[];
  sessionData: SessionData;
}

export interface LoadedSession {
  plmdPath: string; // Absolute path to .plmd file
  plmPath: string; // Absolute path to PLM file (resolved from relative)
  videoPath: string; // Absolute path to video file (resolved from relative)
  plmdData: PLMDData;
}

export interface CreateSessionParams {
  plmPath: string; // Absolute path
  videoPath: string; // Absolute path
  sessionName: string;
  duration: number;
  videoName: string;
}
