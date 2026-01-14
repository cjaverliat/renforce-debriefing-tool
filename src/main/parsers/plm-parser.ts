// PLM file parser using protobuf
import type { PLMData } from '../../shared/types/ipc';

/**
 * Parse a .plm file buffer into PLMData structure
 * Currently returns mock data until protobuf implementation is added
 * TODO: Implement protobuf parsing based on your .proto definitions
 */
export function parsePLMFile(_buffer: Buffer): PLMData {
  // Mock data generation
  const duration = 600000; // 10 minutes in milliseconds
  const sampleRate = 100; // 100 Hz

  // Generate timestamps
  const timestamps: number[] = [];
  const heartRateValues: number[] = [];
  const respirationValues: number[] = [];
  const skinConductanceValues: number[] = [];

  for (let t = 0; t < duration; t += 1000 / sampleRate) {
    timestamps.push(t);

    // Heart rate: 60-120 bpm with sine wave variation
    heartRateValues.push(90 + 30 * Math.sin(t / 10000));

    // Respiration: 12-20 breaths/min with slower variation
    respirationValues.push(16 + 4 * Math.sin(t / 20000));

    // Skin conductance: Varies between 2-8 microsiemens
    skinConductanceValues.push(5 + 3 * Math.sin(t / 15000));
  }

  return {
    metadata: {
      version: '1.0',
      duration,
      sampleRate,
      recordingDate: new Date(),
    },
    tracks: [
      {
        id: 'heart-rate',
        type: 'waveform',
        name: 'Heart Rate',
        unit: 'bpm',
        data: {
          type: 'timeseries',
          timestamps,
          values: heartRateValues,
          sampleRate,
        },
      },
      {
        id: 'respiration',
        type: 'waveform',
        name: 'Respiration',
        unit: 'breaths/min',
        data: {
          type: 'timeseries',
          timestamps,
          values: respirationValues,
          sampleRate,
        },
      },
      {
        id: 'skin-conductance',
        type: 'waveform',
        name: 'Skin Conductance',
        unit: 'μS',
        data: {
          type: 'timeseries',
          timestamps,
          values: skinConductanceValues,
          sampleRate,
        },
      },
      {
        id: 'stress-markers',
        type: 'event',
        name: 'Stress Markers',
        data: {
          type: 'event',
          events: [
            { timestamp: 45000, value: 'high', label: 'Elevated stress detected' },
            { timestamp: 180000, value: 'critical', label: 'Peak stress level' },
            { timestamp: 420000, value: 'medium', label: 'Moderate stress response' },
          ],
        },
      },
    ],
    media: [],
  };
}