import {SystemMarker} from "@/shared/types/record.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";

interface SystemContentProps {
    markers: SystemMarker[];
    duration: number;
    pixelsPerSecond: number;
    onSeek?: (time: number) => void;
    selectedMarker?: SystemMarker;
    onSelectMarker?: (marker: SystemMarker) => void;
}

export function SystemContent({markers, pixelsPerSecond, onSeek, selectedMarker, onSelectMarker}: SystemContentProps) {
    return (
        <div className="relative w-full h-full">
            {markers.map((marker, index) => (
                <TimelineMarker
                    key={index}
                    position={marker.time * pixelsPerSecond}
                    tooltip={marker.label}
                    isSelected={marker === selectedMarker}
                    onClick={() => {
                        onSeek?.(marker.time);
                        onSelectMarker?.(marker);
                    }}
                />
            ))}
        </div>
    );
}
