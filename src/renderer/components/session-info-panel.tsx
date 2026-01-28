import {useState} from 'react';
import {ChevronRight, ChevronDown, Activity, Flag, ListChecks, Circle} from 'lucide-react';
import {PhysiologicalTrack, Procedure, SystemMarker} from '@/shared/types/record';

interface TreeNodeProps {
    label: string;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    defaultExpanded?: boolean;
}

function TreeNode({label, icon, children, defaultExpanded = false}: TreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const hasChildren = !!children;

    return (
        <div>
            <button
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
                className={`flex items-center gap-1 w-full px-2 py-1 text-left text-sm hover:bg-zinc-800 rounded ${
                    hasChildren ? 'cursor-pointer' : 'cursor-default'
                }`}
            >
                {hasChildren ? (
                    isExpanded ? (
                        <ChevronDown className="size-4 text-zinc-500 shrink-0"/>
                    ) : (
                        <ChevronRight className="size-4 text-zinc-500 shrink-0"/>
                    )
                ) : (
                    <span className="w-4 shrink-0"/>
                )}
                {icon && <span className="shrink-0">{icon}</span>}
                <span className="text-zinc-300 truncate">{label}</span>
            </button>
            {hasChildren && isExpanded && (
                <div className="ml-4">
                    {children}
                </div>
            )}
        </div>
    );
}

interface LeafNodeProps {
    label: string;
    sublabel?: string;
}

function LeafNode({label, sublabel}: LeafNodeProps) {
    return (
        <div className="flex items-center gap-1 px-2 py-1 text-sm">
            <span className="w-4 shrink-0"/>
            <Circle className="size-2 text-zinc-600 shrink-0"/>
            <span className="text-zinc-400 truncate">{label}</span>
            {sublabel && <span className="text-zinc-600 text-xs ml-auto shrink-0">{sublabel}</span>}
        </div>
    );
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface SessionInfoPanelProps {
    tracks: PhysiologicalTrack[];
    systemMarkers: SystemMarker[];
    procedures: Procedure[];
}

export function SessionInfoPanel({tracks, systemMarkers, procedures}: SessionInfoPanelProps) {
    return (
        <div className="h-full overflow-y-auto p-2 custom-scrollbar">
            <TreeNode
                label="Physio Tracks"
                icon={<Activity className="size-4 text-emerald-500"/>}
                defaultExpanded
            >
                {tracks.map((track) => (
                    <LeafNode
                        key={track.id}
                        label={track.name}
                        sublabel={track.unit}
                    />
                ))}
            </TreeNode>

            <TreeNode
                label="System Markers"
                icon={<Flag className="size-4 text-amber-500"/>}
                defaultExpanded
            >
                {systemMarkers.map((marker, index) => (
                    <LeafNode
                        key={index}
                        label={marker.label}
                        sublabel={formatTime(marker.time)}
                    />
                ))}
            </TreeNode>

            <TreeNode
                label="Procedures"
                icon={<ListChecks className="size-4 text-blue-500"/>}
                defaultExpanded
            >
                {procedures.map((procedure) => (
                    <TreeNode
                        key={procedure.id}
                        label={procedure.name}
                        defaultExpanded
                    >
                        {procedure.actionMarkers.map((marker, index) => (
                            <LeafNode
                                key={index}
                                label={marker.label}
                                sublabel={formatTime(marker.time)}
                            />
                        ))}
                    </TreeNode>
                ))}
            </TreeNode>
        </div>
    );
}
