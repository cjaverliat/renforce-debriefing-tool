import * as React from "react";
import {cva, type VariantProps} from "class-variance-authority";
import {cn} from "./utils";
import {Tooltip, TooltipContent, TooltipTrigger} from "./tooltip";

const timelineMarkerVariants = cva(
    "absolute h-full w-0.5",
    {
        variants: {
            variant: {
                default: "bg-primary",
                procedure: "bg-[#3a51cd]",
                system: "bg-[#f8ba33]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const timelineMarkerLabelVariants = cva(
    "absolute text-[10px] pointer-events-none whitespace-nowrap",
    {
        variants: {
            variant: {
                default: "text-primary",
                procedure: "text-[#3a51cd]",
                system: "text-[#f8ba33]",
            },
            position: {
                top: "top-1",
                bottom: "bottom-2",
            },
        },
        defaultVariants: {
            variant: "default",
            position: "bottom",
        },
    }
);

interface TimelineMarkerProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof timelineMarkerVariants> {
    /** Position in pixels from the left edge */
    position: number;
    /** Optional label to display next to the marker */
    label?: string;
    /** Position of the label */
    labelPosition?: "top" | "bottom";
    /** Optional tooltip content (shown on hover) */
    tooltip?: React.ReactNode;
}

const TimelineMarker = React.forwardRef<HTMLDivElement, TimelineMarkerProps>(
    ({className, variant, position, label, labelPosition = "bottom", tooltip, ...props}, ref) => {
        const markerContent = (
            <div
                ref={ref}
                className={cn("absolute h-full", tooltip && "cursor-pointer")}
                style={{left: position}}
                {...props}
            >
                <div className={cn(timelineMarkerVariants({variant}), className)}/>
                {label && (
                    <span
                        className={cn(timelineMarkerLabelVariants({variant, position: labelPosition}))}
                        style={{left: 4}}
                    >
                        {label}
                    </span>
                )}
            </div>
        );

        if (tooltip) {
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        {markerContent}
                    </TooltipTrigger>
                    <TooltipContent>{tooltip}</TooltipContent>
                </Tooltip>
            );
        }

        return markerContent;
    }
);

TimelineMarker.displayName = "TimelineMarker";

export {TimelineMarker, timelineMarkerVariants};
