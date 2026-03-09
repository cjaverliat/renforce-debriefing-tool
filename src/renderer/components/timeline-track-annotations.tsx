import {Annotation} from "@/shared/types/session.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";

interface AnnotationsContentProps {
    annotations: Annotation[];
    duration: number;
    pixelsPerSecond: number;
    onSeek?: (time: number) => void;
    selectedAnnotationId?: string;
    onSelectAnnotation?: (annotation: Annotation) => void;
}

export function AnnotationsContent({annotations, pixelsPerSecond, onSeek, selectedAnnotationId, onSelectAnnotation}: AnnotationsContentProps) {
    return (
        <div className="relative w-full h-full">
            {annotations.map((annotation, index) => (
                <TimelineMarker
                    key={index}
                    position={annotation.time * pixelsPerSecond}
                    tooltip={annotation.label}
                    color={annotation.color}
                    isSelected={annotation.id === selectedAnnotationId}
                    onClick={() => {
                        onSeek?.(annotation.time);
                        onSelectAnnotation?.(annotation);
                    }}
                />
            ))}
        </div>
    );
}
