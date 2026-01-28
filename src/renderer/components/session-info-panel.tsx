import {useState} from 'react';
import {ChevronRight, ChevronDown, ChevronUp, Activity, Flag, ListChecks, Eye, EyeOff} from 'lucide-react';
import {Button} from '@/renderer/components/ui/button';
import {Toggle} from '@/renderer/components/ui/toggle';
import {PhysiologicalTrack, Procedure, SystemMarker} from '@/shared/types/record';
import {VisibilityState} from '@/shared/types/visibility';

interface TreeNodeProps {
    label: string;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    defaultExpanded?: boolean;
    isRoot?: boolean;
    visible?: boolean;
    onVisibilityChange?: (visible: boolean) => void;
}

function TreeNode({
    label,
    icon,
    children,
    defaultExpanded = false,
    isRoot = false,
    visible,
    onVisibilityChange
}: TreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const hasChildren = !!children;
    const hasToggle = onVisibilityChange !== undefined;

    return (
        <div className={isRoot ? 'bg-zinc-800 rounded p-2 mb-2' : ''}>
            <div className={`flex items-center gap-2 w-full ${
                isRoot ? 'mb-1' : 'px-2 py-1 hover:bg-zinc-700 rounded'
            }`}>
                <button
                    onClick={() => hasChildren && setIsExpanded(!isExpanded)}
                    className={hasChildren ? 'cursor-pointer' : 'cursor-default'}
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
                </button>

                {icon && <span className="shrink-0">{icon}</span>}
                <span className={`truncate ${isRoot ? 'text-sm text-zinc-100' : 'text-sm text-zinc-300'}`}>
                    {label}
                </span>

                {hasToggle && (
                    <Toggle
                        pressed={visible}
                        onPressedChange={onVisibilityChange}
                        size="sm"
                        className="size-6 p-0 ml-auto bg-transparent hover:bg-transparent data-[state=on]:bg-transparent data-[state=off]:bg-transparent"
                    >
                        {visible ? (
                            <Eye className="size-3.5 text-zinc-300"/>
                        ) : (
                            <EyeOff className="size-3.5 text-zinc-500"/>
                        )}
                    </Toggle>
                )}
            </div>
            {hasChildren && isExpanded && (
                <div className={isRoot ? 'ml-2' : 'ml-4'}>
                    {children}
                </div>
            )}
        </div>
    );
}

interface LeafNodeProps {
    label: string;
    sublabel?: string;
    visible?: boolean;
    onVisibilityChange?: (visible: boolean) => void;
}

function LeafNode({label, sublabel, visible, onVisibilityChange}: LeafNodeProps) {
    const hasToggle = onVisibilityChange !== undefined;

    return (
        <div className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-700 rounded">
            <span className="text-sm text-zinc-400 truncate">{label}</span>
            {sublabel && <span className="text-zinc-500 text-xs font-mono ml-auto shrink-0">{sublabel}</span>}
            {hasToggle && (
                <Toggle
                    pressed={visible}
                    onPressedChange={onVisibilityChange}
                    size="sm"
                    className={`size-5 p-0 bg-transparent hover:bg-transparent data-[state=on]:bg-transparent data-[state=off]:bg-transparent ${sublabel ? '' : 'ml-auto'}`}
                >
                    {visible ? (
                        <Eye className="size-3 text-zinc-300"/>
                    ) : (
                        <EyeOff className="size-3 text-zinc-500"/>
                    )}
                </Toggle>
            )}
        </div>
    );
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface SessionInfoPanelProps {
    tracks: PhysiologicalTrack[];
    systemMarkers: SystemMarker[];
    procedures: Procedure[];
    visibility: VisibilityState;
    onTogglePhysioTracks: (visible: boolean) => void;
    onToggleSystemMarkers: (visible: boolean) => void;
    onToggleProcedures: (visible: boolean) => void;
    onToggleTrack: (trackId: string, visible: boolean) => void;
    onToggleSystemMarker: (markerId: string, visible: boolean) => void;
    onToggleProcedure: (procedureId: string, visible: boolean) => void;
    onToggleActionMarker: (actionMarkerId: string, visible: boolean) => void;
}

export function SessionInfoPanel({
    tracks,
    systemMarkers,
    procedures,
    visibility,
    onTogglePhysioTracks,
    onToggleSystemMarkers,
    onToggleProcedures,
    onToggleTrack,
    onToggleSystemMarker,
    onToggleProcedure,
    onToggleActionMarker,
}: SessionInfoPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const totalItems = tracks.length + systemMarkers.length + procedures.length;

    return (
        <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
            <div className="flex items-center justify-between p-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="size-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    >
                        {isExpanded ? <ChevronUp className="size-4"/> : <ChevronDown className="size-4"/>}
                    </Button>
                    <h3 className="text-sm text-zinc-100">
                        Session Info ({totalItems})
                    </h3>
                </div>
            </div>

            {isExpanded && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <TreeNode
                        label="Physio Tracks"
                        icon={<Activity className="size-4 text-emerald-500"/>}
                        defaultExpanded
                        isRoot
                        visible={visibility.physioTracksVisible}
                        onVisibilityChange={onTogglePhysioTracks}
                    >
                        {tracks.map((track) => (
                            <LeafNode
                                key={track.id}
                                label={track.name}
                                sublabel={track.unit}
                                visible={visibility.visibleTrackIds.has(track.id) && visibility.physioTracksVisible}
                                onVisibilityChange={(visible) => onToggleTrack(track.id, visible)}
                            />
                        ))}
                    </TreeNode>

                    <TreeNode
                        label="System Markers"
                        icon={<Flag className="size-4 text-amber-500"/>}
                        defaultExpanded
                        isRoot
                        visible={visibility.systemMarkersVisible}
                        onVisibilityChange={onToggleSystemMarkers}
                    >
                        {systemMarkers.map((marker, index) => {
                            const markerId = `${marker.time}:${marker.label}:${index}`;
                            return (
                                <LeafNode
                                    key={markerId}
                                    label={marker.label}
                                    sublabel={formatTime(marker.time)}
                                    visible={visibility.visibleSystemMarkerIds.has(markerId) && visibility.systemMarkersVisible}
                                    onVisibilityChange={(visible) => onToggleSystemMarker(markerId, visible)}
                                />
                            );
                        })}
                    </TreeNode>

                    <TreeNode
                        label="Procedures"
                        icon={<ListChecks className="size-4 text-blue-500"/>}
                        defaultExpanded
                        isRoot
                        visible={visibility.proceduresVisible}
                        onVisibilityChange={onToggleProcedures}
                    >
                        {procedures.map((procedure) => {
                            const procedureVisible = visibility.visibleProcedureIds.has(procedure.id) && visibility.proceduresVisible;

                            return (
                                <TreeNode
                                    key={procedure.id}
                                    label={procedure.name}
                                    defaultExpanded
                                    visible={procedureVisible}
                                    onVisibilityChange={(visible) => onToggleProcedure(procedure.id, visible)}
                                >
                                    {procedure.actionMarkers.map((marker, index) => {
                                        const actionMarkerId = `${procedure.id}:${index}`;
                                        return (
                                            <LeafNode
                                                key={actionMarkerId}
                                                label={marker.label}
                                                sublabel={formatTime(marker.time)}
                                                visible={visibility.visibleActionMarkerIds.has(actionMarkerId) && procedureVisible}
                                                onVisibilityChange={(visible) => onToggleActionMarker(actionMarkerId, visible)}
                                            />
                                        );
                                    })}
                                </TreeNode>
                            );
                        })}
                    </TreeNode>
                </div>
            )}
        </div>
    );
}
