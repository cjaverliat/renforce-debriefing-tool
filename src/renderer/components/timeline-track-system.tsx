import {SystemMarker} from "@/shared/types/record.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";

interface SystemContentProps {
    markers: SystemMarker[];
    duration: number;
    pixelsPerSecond: number;
    onSeek?: (time: number) => void;
}

export function SystemContent({markers, pixelsPerSecond, onSeek}: SystemContentProps) {
    return (
        <div className="relative w-full h-full">
            {markers.map((marker, index) => (
                <TimelineMarker
                    key={index}
                    position={marker.time * pixelsPerSecond}
                    tooltip={marker.label}
                    onClick={() => onSeek?.(marker.time)}
                />
            ))}
        </div>
    );
}
