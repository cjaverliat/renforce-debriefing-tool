/**
 * Physiological data types for data loaded from PLM files.
 * These types represent raw data only - display configuration is separate.
 */
import {RecordData} from "@/shared/types/record.ts";

export interface Annotation {
    id: string;
    time: number;
    label: string;
    description?: string;
    color: string;
    category: string;
}

export interface SessionData {
    plmdPath: string;
    sessionDate: Date;
    manualAnnotations: Annotation[];
    recordData: RecordData;
}