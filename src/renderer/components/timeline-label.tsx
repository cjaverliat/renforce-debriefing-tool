import {ReactNode} from "react";

interface TimelineLabelProps {
    children: ReactNode;
}

export function TimelineLabel({children}: TimelineLabelProps) {
    return (
        <div className="h-16 border-b border-zinc-800">
            {children}
        </div>
    );
}
