/**
 * Mock session data provider.
 * This module generates mock PLM session data for development and testing.
 * It will be replaced by actual PLM file parsing when implemented.
 */
import {PhysiologicalDataPoint, PhysiologicalTrack, Procedure, SystemMarker} from "@/shared/types/record.ts";
import {SessionData} from "@/shared/types/session.ts";

/**
 * Generate mock physiological data with realistic values.
 */
function generatePhysiologicalData(
    duration: number,
    frequency: number,
    baseline: number,
    amplitude: number,
    sampleRate: number
): PhysiologicalDataPoint[] {
    const samples = Math.floor(duration * sampleRate);
    return Array.from({length: samples}, (_, i) => {
        const time = i / sampleRate;
        const sineValue = Math.sin(time * frequency * 2 * Math.PI);
        const value = baseline + sineValue * amplitude;
        return {time, value};
    });
}

/**
 * Relative path to the mock video file.
 * In development: relative to project root
 * In production: relative to the directory containing the .exe
 */
export const MOCK_VIDEO_RESOURCE_PATH = 'data/renforce_demo.mp4';

const MOCK_SAMPLING_RATE = 50;

const MOCK_RECORD_PATH = "./record.plm"

const MOCK_PLMD_PATH = "./session.plmd"

/**
 * Creates mock physiological tracks.
 */
function createMockTracks(duration: number, sampleRate: number): PhysiologicalTrack[] {
    return [
        {
            id: 'heart-rate',
            name: 'Heart Rate',
            unit: 'bpm',
            sampleRate,
            data: generatePhysiologicalData(duration, 0.033, 75, 15, sampleRate),
        },
        {
            id: 'respiration',
            name: 'Respiration',
            unit: 'br/min',
            sampleRate,
            data: generatePhysiologicalData(duration, 0.0083, 16, 4, sampleRate),
        },
        {
            id: 'skin-conductance',
            name: 'Skin Conductance',
            unit: 'μS',
            sampleRate,
            data: generatePhysiologicalData(duration, 0.005, 5, 3, sampleRate),
        },
    ];
}

/**
 * Creates mock system markers.
 */
function createMockSystemMarkers(): SystemMarker[] {
    return [
        {time: 15, label: 'Start'},
        {time: 45, label: 'Phase 2'},
        {time: 90, label: 'Phase 3'},
        {time: 120, label: 'End'},
    ];
}

/**
 * Creates mock procedures with action markers.
 */
function createMockProcedures(duration: number): Procedure[] {
    return [
        {
            id: 'baseline',
            name: 'Baseline',
            startTime: 0,
            endTime: 30,
            actionMarkers: [
                {time: 5, label: 'Eyes closed'},
                {time: 20, label: 'Eyes open'},
            ],
        },
        {
            id: 'stress-test',
            name: 'Stress Test',
            startTime: 30,
            endTime: 90,
            actionMarkers: [
                {time: 35, label: 'Task started'},
                {time: 50, label: 'Difficulty increased'},
                {time: 70, label: 'Peak stress'},
                {time: 85, label: 'Task completed'},
            ],
        },
        {
            id: 'recovery',
            name: 'Recovery',
            startTime: 90,
            endTime: -1,
            actionMarkers: [
                {time: 95, label: 'Relaxation started'},
                {time: 110, label: 'Breathing exercise'},
            ],
        },
    ];
}

/**
 * Creates a complete mock PLM session data object.
 * This simulates what would be loaded from an actual PLM file.
 */
export async function createMockSessionData(): Promise<SessionData> {

    const videoPath = await window.electronAPI.getResourcePath(MOCK_VIDEO_RESOURCE_PATH);

    // Read the video duration
    const duration = await window.electronAPI.getVideoDuration(videoPath);

    return {
        sessionDate: new Date(),
        manualAnnotations: [],
        plmdPath: MOCK_PLMD_PATH,
        recordData: {
            recordPath: MOCK_RECORD_PATH,
            duration: duration,
            videoPath: videoPath,
            tracks: createMockTracks(duration, MOCK_SAMPLING_RATE),
            procedures: createMockProcedures(duration),
            systemMarkers: createMockSystemMarkers(),
        }
    };
}