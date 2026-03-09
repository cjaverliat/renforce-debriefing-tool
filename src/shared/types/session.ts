/**
 * Physiological data types for data loaded from PLM files.
 * These types represent raw data only - display configuration is separate.
 */
import {RecordData, IncidentMarker, ProcedureActionMarker, SystemMarker} from "@/shared/types/record.ts";

export interface Annotation {
    id: string;
    time: number;
    label: string;
    description?: string;
    color: string;
}

export interface SessionData {
    sessionDate: Date;
    manualAnnotations: Annotation[];
    /** Path to the record file (relative or absolute) */
    recordPath: string;
    /** Path to the video file (relative or absolute) */
    videoPath: string;
}

export interface Session {
    sessionData: SessionData;
    recordData: RecordData;
}

export type SelectedItem =
    | { type: 'annotation'; id: string }
    | { type: 'systemMarker'; marker: SystemMarker }
    | { type: 'incidentMarker'; marker: IncidentMarker }
    | { type: 'procedure'; id: string }
    | { type: 'actionMarker'; procedureId: string; marker: ProcedureActionMarker };