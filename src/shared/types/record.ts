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
 * A physiological signal as loaded from a PLM file.
 * Contains only the raw data and metadata from the file.
 */
export interface PhysiologicalSignal {
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
    description?: string;
}

/**
 * A procedure represents a distinct phase or activity within a session.
 */
export interface Procedure {
    /** Unique identifier for the procedure */
    id: string;
    /** Display name for the procedure */
    name: string;
    /** Start time in seconds */
    startTime: number;
    /** End time in seconds, or -1 if the procedure lasts for the entire record duration */
    endTime: number;
    /** Action markers within this procedure */
    actionMarkers: ProcedureActionMarker[];
    description?: string;
}

export interface ProcedureActionMarker {
    time: number;  // Time in seconds
    label: string;
    category: 'correct_action' | 'incorrect_action' | 'timeout_exceeded';
    description?: string;
}

/**
 * Represents a system-generated marker, such as save points or manual annotations, emitted by the application during an experiment.
 */
export interface SystemMarker {
    time: number;  // Time in seconds
    label: string;
    category: 'automatic' | 'manual';
    description?: string;
}

/**
 * Incident markers emitted by the application to classify events based on severity.
 *
 * - Critical Incident: Dangerous situation, such as overflow, contamination, or improper dilution.
 * - Moderate Incident: Non-critical anomaly, e.g., handling error without major risk.
 */
export interface IncidentMarker {
    time: number;  // Time in seconds
    label: string;
    severity: 'critical' | 'moderate';
    description?: string;
}

/**
 * Record data as loaded from a PLM file.
 * Includes video reference, physiological tracks, and markers.
 */
export interface RecordData {
    /** Path to the .plm file (relative or absolute) **/
    recordPath: string;
    /** Duration of the record in seconds */
    duration: number;
    /** Path to the video file (relative or absolute) */
    videoPath: string;
    /** Physiological signal tracks */
    tracks: PhysiologicalSignal[];
    /** Procedures (phases/activities within the session) */
    procedures: Procedure[];
    /** System-generated markers such as save points or manual annotations */
    systemMarkers: SystemMarker[];
    /** Incident markers classifying events based on severity during the session */
    incidentMarkers: IncidentMarker[];
}