/**
 * Label cell for a single timeline track row in the label column.
 *
 * Mirrors the height of the corresponding `TimelineTrack` row so that
 * labels and track content remain vertically aligned.
 * The label column and track column are in separate scrollable containers
 * whose scroll positions are synchronized by the parent `Timeline` component.
 */
import {ReactNode} from "react";

interface TimelineLabelProps {
    /** Label content — typically a `DefaultTextLabelContent` or `PhysiologicalSignalLabel`. */
    children: ReactNode;
    /** Optional height in pixels. If not provided, defaults to 64px (h-16) */
    height?: number;
}

/**
 * Label cell for a timeline track row.
 *
 * @param props.children - Content rendered inside the label cell.
 * @param props.height   - Row height in pixels (must match the paired TimelineTrack height).
 */
export function TimelineLabel({children, height}: TimelineLabelProps) {
    return (
        <div
            className="border-b border-border"
            style={{height: height ? `${height}px` : '64px'}}
        >
            {children}
        </div>
    );
}
