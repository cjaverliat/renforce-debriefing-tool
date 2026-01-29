import * as React from "react";
import {cva, type VariantProps} from "class-variance-authority";
import {cn} from "./utils";

const procedureBarVariants = cva(
    "absolute rounded-md",
    {
        variants: {
            variant: {
                default: "bg-primary",
                blue: "bg-[#3a51cd]",
            },
            size: {
                default: "h-[30%]",
                sm: "h-[20%]",
                lg: "h-[40%]",
            },
        },
        defaultVariants: {
            variant: "blue",
            size: "default",
        },
    }
);

interface ProcedureBarProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof procedureBarVariants> {
    /** Start position in pixels from the left edge */
    startPosition: number;
    /** Width of the bar in pixels */
    width: number;
    /** Vertical offset from top in pixels */
    top?: number;
}

const ProcedureBar = React.forwardRef<HTMLDivElement, ProcedureBarProps>(
    ({className, variant, size, startPosition, width, top = 3, ...props}, ref) => {
        return (
            <div
                ref={ref}
                className={cn(procedureBarVariants({variant, size}), className)}
                style={{left: startPosition, width, top}}
                {...props}
            />
        );
    }
);

ProcedureBar.displayName = "ProcedureBar";

export {ProcedureBar, procedureBarVariants};
