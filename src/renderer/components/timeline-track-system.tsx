/**
 * System markers track content component.
 *
 * Renders system-generated event markers (automatic save points, manual instructor
 * annotations emitted during the experiment) as `TimelineMarker` pins using the
 * default amber color. Clicking a marker seeks to its time and updates selection.
 */
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

/**
 * Renders system marker pins for the system markers timeline track.
 *
 * @param props.markers         - Filtered system markers to display.
 * @param props.pixelsPerSecond - Spatial resolution.
 * @param props.onSeek          - Called with the marker's time when clicked.
 * @param props.selectedMarker  - Currently selected marker (highlighted).
 * @param props.onSelectMarker  - Called with the marker object when clicked.
 */
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
