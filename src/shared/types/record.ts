/**
 * Data types for data loaded from PLM files.
 */

/**
 * A single data point in a physiological signal time series.
 */
export interface PhysiologicalDataPoint {
    time: number;  // Time in seconds
    value: number;
}

/**
 * A physiological signal track as loaded from a PLM file.
 * Contains only the raw data and metadata from the file.
 */
export interface PhysiologicalTrack {
    /** Unique identifier for the track */
    id: string;
    /** Display name for the track (e.g., "Heart Rate") */
    name: string;
    /** Unit of measurement (e.g., "bpm", "μS") */
    unit: string;
    /** Sampling rate in Hz */
    sampleRate: number;
    /** The actual time-series data points */
    data: PhysiologicalDataPoint[];
}

export interface ActionMarker {
    time: number;  // Time in seconds
    label: string;
}

export interface SystemMarker {
    time: number;  // Time in seconds
    label: string;
}

/**
 * Record data as loaded from a PLM file.
 * Includes video reference, physiological tracks, and markers.
 */
export interface RecordData {
    /** Path to the .plm file (relative or absolute) **/
    recordPath: string;
    /** Duration of the session in seconds */
    duration: number;
    /** Path to the video file (relative or absolute) */
    videoPath: string;
    /** Physiological signal tracks */
    tracks: PhysiologicalTrack[];
    /** System markers (manual press during experiment) */
    systemMarkers: SystemMarker[];
    actionMarkers: ActionMarker[];
}