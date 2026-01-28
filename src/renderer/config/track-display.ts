/**
 * Display configuration for track rendering.
 * This is separate from the raw track data and controls how tracks appear in the UI.
 */

/**
 * Display configuration for a single track.
 */
export interface TrackDisplayConfig {
    /** Color used for rendering the waveform (CSS color string) */
    color: string;
    /** Number of decimal places for value display */
    valueDecimals: number;
}

/**
 * Display configuration for markers.
 */
export interface MarkerDisplayConfig {
    /** Default color for markers without specific colors */
    defaultColor: string;
    /** Color map for specific marker labels */
    colorMap: Record<string, string>;
}

/**
 * Default color palette for physiological tracks.
 */
const DEFAULT_TRACK_COLORS = [
    '#ef4444', // red - Heart Rate
    '#3b82f6', // blue - Respiration
    '#22c55e', // green - Skin Conductance
    '#a855f7', // purple
    '#f59e0b', // amber
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
];

/**
 * Default display configurations for known track types.
 */
const DEFAULT_TRACK_CONFIGS: Record<string, Partial<TrackDisplayConfig>> = {
    'heart-rate': {color: '#ef4444', valueDecimals: 0},
    'respiration': {color: '#3b82f6', valueDecimals: 1},
    'skin-conductance': {color: '#22c55e', valueDecimals: 2},
};

/**
 * Gets the display configuration for a track.
 * Uses predefined configs for known track IDs, or assigns from color palette.
 */
export function getTrackDisplayConfig(trackId: string, index: number): TrackDisplayConfig {
    const predefined = DEFAULT_TRACK_CONFIGS[trackId];
    if (predefined) {
        return {
            color: predefined.color ?? DEFAULT_TRACK_COLORS[index % DEFAULT_TRACK_COLORS.length],
            valueDecimals: predefined.valueDecimals ?? 2,
        };
    }

    return {
        color: DEFAULT_TRACK_COLORS[index % DEFAULT_TRACK_COLORS.length],
        valueDecimals: 2,
    };
}

/**
 * Default marker color map for system markers.
 */
export const DEFAULT_MARKER_COLORS: Record<string, string> = {
    'Start': '#22c55e',
    'Phase 2': '#eab308',
    'Phase 3': '#f59e0b',
    'End': '#a855f7',
};

/**
 * Gets the color for a marker based on its label.
 */
export function getMarkerColor(label: string): string {
    return DEFAULT_MARKER_COLORS[label] ?? '#6b7280';
}
