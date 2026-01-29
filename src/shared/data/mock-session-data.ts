/**
 * Mock session data provider.
 * This module generates mock PLM session data for development and testing.
 * It will be replaced by actual PLM file parsing when implemented.
 */
import {PhysiologicalDataPoint, PhysiologicalSignal, Procedure, SystemMarker, IncidentMarker} from "@/shared/types/record.ts";
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
function createMockTracks(duration: number, sampleRate: number): PhysiologicalSignal[] {
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
        {time: 28, label: 'Point de sauvegarde', category: 'automatic'},
        {time: 65, label: 'Observation formateur', description: "Hésitation sur le choix de la verrerie", category: 'manual'},
        {time: 95, label: 'Point de sauvegarde', category: 'automatic'},
    ];
}

/**
 * Creates mock procedures with action markers.
 */
function createMockProcedures(_duration: number): Procedure[] {
    return [
        {
            id: 'preparation',
            name: 'Préparation & EPI',
            startTime: 0,
            endTime: 30,
            actionMarkers: [
                {time: 5, label: 'Blouse enfilée', category: 'correct_action'},
                {time: 12, label: 'Lunettes de protection manquantes', category: 'incorrect_action'},
                {time: 18, label: 'Gants nitrile enfilés', category: 'correct_action'},
                {time: 25, label: 'Lunettes mises après rappel', category: 'correct_action'},
            ],
        },
        {
            id: 'dilution-acide',
            name: 'Dilution acide',
            startTime: 30,
            endTime: 75,
            actionMarkers: [
                {time: 33, label: 'Eau versée en premier', category: 'correct_action'},
                {time: 42, label: 'Ajout acide lent et progressif', category: 'correct_action'},
                {time: 50, label: 'Temps de mélange dépassé', category: 'timeout_exceeded'},
                {time: 58, label: 'Mauvaise verrerie utilisée', category: 'incorrect_action'},
                {time: 68, label: 'Bouchon refermé', category: 'correct_action'},
            ],
        },
        {
            id: 'etiquetage',
            name: 'Étiquetage & stockage',
            startTime: 75,
            endTime: 100,
            actionMarkers: [
                {time: 78, label: 'Étiquette rédigée correctement', category: 'correct_action'},
                {time: 85, label: 'Pictogrammes de danger apposés', category: 'correct_action'},
                {time: 92, label: 'Rangement dans armoire ventilée', category: 'correct_action'},
            ],
        },
        {
            id: 'nettoyage',
            name: 'Nettoyage & fin',
            startTime: 100,
            endTime: -1,
            actionMarkers: [
                {time: 103, label: 'Rinçage verrerie', category: 'correct_action'},
                {time: 108, label: 'Oubli de neutralisation des résidus', category: 'incorrect_action'},
                {time: 115, label: 'Plan de travail nettoyé', category: 'correct_action'},
            ],
        },
    ];
}

/**
 * Creates mock incident markers.
 */
function createMockIncidentMarkers(): IncidentMarker[] {
    return [
        {time: 12, label: 'Erreur EPI: lunettes manquantes', severity: 'moderate', description: 'Manipulation commencée sans protection oculaire'},
        {time: 58, label: 'Mauvaise verrerie pour acide concentré', severity: 'moderate', description: 'Utilisation d\'un bécher au lieu d\'une fiole jaugée'},
        {time: 63, label: 'Projection acide sur paillasse', severity: 'critical', description: 'Éclaboussure lors du mélange, risque de contamination'},
        {time: 108, label: 'Résidus non neutralisés dans évier', severity: 'critical', description: 'Rejet direct sans neutralisation préalable'},
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
            incidentMarkers: createMockIncidentMarkers(),
        }
    };
}