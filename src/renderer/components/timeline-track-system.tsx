import {SystemMarker} from "@/shared/types/record.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";

interface SystemContentProps {
    markers: SystemMarker[];
    duration: number;
    pixelsPerSecond: number;
}

export function SystemContent({markers, pixelsPerSecond}: SystemContentProps) {
    return (
        <div className="relative w-full h-full">
            {markers.map((marker, index) => (
                <TimelineMarker
                    key={index}
                    position={marker.time * pixelsPerSecond}
                    tooltip={marker.label}
                />
            ))}
        </div>
    );
}
