interface ProcedureLabelProps {
    name: string;
}

export function ProcedureLabel({
                                   name
                               }: ProcedureLabelProps) {
    return (
        <div className="w-full h-full flex flex-col justify-center px-4 py-1">
            <span className="text-xs font-medium text-zinc-300 truncate">
                {name}
            </span>
        </div>
    );
}
