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
}

/**
 * Finds the value in the signal data at the given time using linear interpolation.
 */
function getValueAtTime(
    data: Array<{ time: number; value: number }>,
    time: number
): number | null {
    if (data.length === 0) return null;
    if (time <= data[0].time) return data[0].value;
    if (time >= data[data.length - 1].time) return data[data.length - 1].value;

    // Binary search to find the surrounding samples
    let low = 0;
    let high = data.length - 1;

    while (high - low > 1) {
        const mid = Math.floor((low + high) / 2);
        if (data[mid].time <= time) {
            low = mid;
        } else {
            high = mid;
        }
    }

    // Linear interpolation between low and high
    const t0 = data[low].time;
    const t1 = data[high].time;
    const v0 = data[low].value;
    const v1 = data[high].value;

    const ratio = (time - t0) / (t1 - t0);
    return v0 + ratio * (v1 - v0);
}

export function PhysiologicalSignalLabel({
    name,
    unit,
    samplingRate,
    data,
    playbackState,
    duration,
}: PhysiologicalSignalLabelProps) {
    const playbackTime = usePlaybackTime(playbackState, {maxTime: duration});

    const currentValue = useMemo(() => {
        return getValueAtTime(data, playbackTime);
    }, [data, playbackTime]);

    const formattedValue = currentValue !== null
        ? currentValue.toFixed(2)
        : '--';

    const formattedSamplingRate = samplingRate >= 1000
        ? `${(samplingRate / 1000).toFixed(1)} kHz`
        : `${samplingRate} Hz`;

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
