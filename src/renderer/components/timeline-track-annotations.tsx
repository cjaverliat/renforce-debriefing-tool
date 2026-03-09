/**
 * Annotations track content component.
 *
 * Renders all manual user annotations as `TimelineMarker` pins positioned
 * at their respective timestamps. Clicking a marker seeks to that time and
 * updates the selection state, which scrolls the `AnnotationsPanel` sidebar
 * to the corresponding item.
 */
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

/**
 * Renders annotation marker pins for the annotations timeline track.
 *
 * @param props.annotations         - All user annotations to display.
 * @param props.pixelsPerSecond     - Spatial resolution for computing pin positions.
 * @param props.onSeek              - Called with the annotation's time when clicked.
 * @param props.selectedAnnotationId - ID of the currently selected annotation (highlighted).
 * @param props.onSelectAnnotation  - Called with the annotation object when clicked.
 */
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
