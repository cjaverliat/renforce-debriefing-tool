import {useMemo} from 'react';
import type {PlaybackState} from '@/shared/types/playback';
import {usePlaybackTime} from '@/renderer/hooks/use-playback-time';

interface PhysiologicalSignalLabelProps {
    name: string;
    unit: string;
    samplingRate: number;
    data: Array<{ time: number; value: number }>;
    playbackState: PlaybackState;
    duration: number;
    /** Time threshold in seconds for finding the closest value (default: 0.001 = 1ms) */
    valueThreshold?: number;
    /** Number of decimal places for the value display (default: 2) */
    valueDecimals?: number;
    /** Number of decimal places for the sampling rate display (default: 1) */
    samplingRateDecimals?: number;
}

/**
 * Finds the closest value in the signal data at the given time.
 * Returns the value if a sample exists within the threshold, otherwise null.
 */
function getValueAtTime(
    data: Array<{ time: number; value: number }>,
    time: number,
    threshold: number
): number | null {
    if (data.length === 0) return null;

    // Binary search to find the closest sample
    let low = 0;
    let high = data.length - 1;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (data[mid].time < time) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }

    // Check the closest candidates (low and low-1)
    let closestIndex = low;
    let closestDiff = Math.abs(data[low].time - time);

    if (low > 0) {
        const prevDiff = Math.abs(data[low - 1].time - time);
        if (prevDiff < closestDiff) {
            closestIndex = low - 1;
            closestDiff = prevDiff;
        }
    }

    // Return value only if within threshold
    if (closestDiff <= threshold) {
        return data[closestIndex].value;
    }

    return null;
}

export function PhysiologicalSignalLabel({
    name,
    unit,
    samplingRate,
    data,
    playbackState,
    duration,
    valueThreshold = .5,
    valueDecimals = 2,
    samplingRateDecimals = 1,
}: PhysiologicalSignalLabelProps) {
    const playbackTime = usePlaybackTime(playbackState, {maxTime: duration});

    const currentValue = useMemo(() => {
        return getValueAtTime(data, playbackTime, valueThreshold);
    }, [data, playbackTime, valueThreshold]);

    const formattedValue = currentValue !== null
        ? currentValue.toFixed(valueDecimals)
        : 'N/A';

    const formattedSamplingRate = samplingRate >= 1000
        ? `${(samplingRate / 1000).toFixed(samplingRateDecimals)} kHz`
        : `${samplingRate.toFixed(samplingRateDecimals)} Hz`;

    return (
        <div className="w-full h-full flex flex-col justify-center px-4 py-1">
            <span className="text-xs font-medium text-zinc-300 truncate">
                {name}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span>{formattedSamplingRate}</span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400 font-mono">
                    {formattedValue} {unit}
                </span>
            </div>
        </div>
    );
}
