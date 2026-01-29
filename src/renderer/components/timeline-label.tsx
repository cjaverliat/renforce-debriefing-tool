import {ReactNode} from "react";

interface TimelineLabelProps {
    children: ReactNode;
    /** Optional height in pixels. If not provided, defaults to 64px (h-16) */
    height?: number;
}

export function TimelineLabel({children, height}: TimelineLabelProps) {
    return (
        <div
            className="border-b border-zinc-800"
            style={{height: height ? `${height}px` : '64px'}}
        >
            {children}
        </div>
    );
}
