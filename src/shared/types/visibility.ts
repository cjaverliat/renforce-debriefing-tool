/**
 * Visibility state for controlling what items are displayed in the Timeline.
 */
export interface VisibilityState {
    /** Whether the physio tracks category is visible */
    physioTracksVisible: boolean;
    /** Whether the system markers category is visible */
    systemMarkersVisible: boolean;
    /** Whether the procedures category is visible */
    proceduresVisible: boolean;

    /** Set of visible track IDs */
    visibleTrackIds: Set<string>;
    /** Set of visible system marker IDs (format: `${time}:${label}:${index}`) */
    visibleSystemMarkerIds: Set<string>;
    /** Set of visible procedure IDs */
    visibleProcedureIds: Set<string>;
    /** Set of visible action marker IDs (format: `${procedureId}:${index}`) */
    visibleActionMarkerIds: Set<string>;
}
