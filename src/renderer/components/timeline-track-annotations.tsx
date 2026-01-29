import {Annotation} from "@/shared/types/session.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";

interface AnnotationsContentProps {
    annotations: Annotation[];
    duration: number;
    pixelsPerSecond: number;
}

export function AnnotationsContent({annotations, pixelsPerSecond}: AnnotationsContentProps) {
    return (
        <div className="relative w-full h-full">
            {annotations.map((annotation, index) => (
                <TimelineMarker
                    key={index}
                    position={annotation.time * pixelsPerSecond}
                    tooltip={annotation.label}
                    color={annotation.color}
                />
            ))}
        </div>
    );
}
