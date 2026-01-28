import {useState} from 'react';
import {ChevronRight, ChevronDown, ChevronUp, Activity, Flag, ListChecks} from 'lucide-react';
import {Button} from '@/renderer/components/ui/button';
import {Checkbox} from '@/renderer/components/ui/checkbox';
import {PhysiologicalTrack, Procedure, SystemMarker} from '@/shared/types/record';
import {VisibilityState} from '@/shared/types/visibility';

interface TreeNodeProps {
    label: string;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    defaultExpanded?: boolean;
    isRoot?: boolean;
    checked?: boolean;
    indeterminate?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

function TreeNode({
    label,
    icon,
    children,
    defaultExpanded = false,
    isRoot = false,
    checked,
    indeterminate,
    onCheckedChange
}: TreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const hasChildren = !!children;
    const hasCheckbox = onCheckedChange !== undefined;

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

                {hasCheckbox && (
                    <Checkbox
                        checked={indeterminate ? 'indeterminate' : checked}
                        onCheckedChange={(value) => onCheckedChange(value === true)}
                        className="size-3.5"
                    />
                )}

                {icon && <span className="shrink-0">{icon}</span>}
                <span className={`truncate ${isRoot ? 'text-sm text-zinc-100' : 'text-sm text-zinc-300'}`}>
                    {label}
                </span>
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
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

function LeafNode({label, sublabel, checked, onCheckedChange}: LeafNodeProps) {
    const hasCheckbox = onCheckedChange !== undefined;

    return (
        <div className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-700 rounded">
            {hasCheckbox && (
                <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => onCheckedChange(value === true)}
                    className="size-3"
                />
            )}
            <span className="text-sm text-zinc-400 truncate">{label}</span>
            {sublabel && <span className="text-zinc-500 text-xs font-mono ml-auto shrink-0">{sublabel}</span>}
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
    onTogglePhysioTracks: (checked: boolean) => void;
    onToggleSystemMarkers: (checked: boolean) => void;
    onToggleProcedures: (checked: boolean) => void;
    onToggleTrack: (trackId: string, checked: boolean) => void;
    onToggleSystemMarker: (markerId: string, checked: boolean) => void;
    onToggleProcedure: (procedureId: string, checked: boolean) => void;
    onToggleActionMarker: (actionMarkerId: string, checked: boolean) => void;
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

    // Calculate indeterminate states for category checkboxes
    const visibleTrackCount = tracks.filter(t => visibility.visibleTrackIds.has(t.id)).length;
    const physioIndeterminate = visibility.physioTracksVisible &&
        visibleTrackCount > 0 &&
        visibleTrackCount < tracks.length;

    const visibleMarkerCount = systemMarkers.filter((m, i) =>
        visibility.visibleSystemMarkerIds.has(`${m.time}:${m.label}:${i}`)
    ).length;
    const markersIndeterminate = visibility.systemMarkersVisible &&
        visibleMarkerCount > 0 &&
        visibleMarkerCount < systemMarkers.length;

    const visibleProcedureCount = procedures.filter(p => visibility.visibleProcedureIds.has(p.id)).length;
    const proceduresIndeterminate = visibility.proceduresVisible &&
        visibleProcedureCount > 0 &&
        visibleProcedureCount < procedures.length;

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
                        checked={visibility.physioTracksVisible && visibleTrackCount === tracks.length}
                        indeterminate={physioIndeterminate}
                        onCheckedChange={onTogglePhysioTracks}
                    >
                        {tracks.map((track) => (
                            <LeafNode
                                key={track.id}
                                label={track.name}
                                sublabel={track.unit}
                                checked={visibility.visibleTrackIds.has(track.id)}
                                onCheckedChange={(checked) => onToggleTrack(track.id, checked)}
                            />
                        ))}
                    </TreeNode>

                    <TreeNode
                        label="System Markers"
                        icon={<Flag className="size-4 text-amber-500"/>}
                        defaultExpanded
                        isRoot
                        checked={visibility.systemMarkersVisible && visibleMarkerCount === systemMarkers.length}
                        indeterminate={markersIndeterminate}
                        onCheckedChange={onToggleSystemMarkers}
                    >
                        {systemMarkers.map((marker, index) => {
                            const markerId = `${marker.time}:${marker.label}:${index}`;
                            return (
                                <LeafNode
                                    key={markerId}
                                    label={marker.label}
                                    sublabel={formatTime(marker.time)}
                                    checked={visibility.visibleSystemMarkerIds.has(markerId)}
                                    onCheckedChange={(checked) => onToggleSystemMarker(markerId, checked)}
                                />
                            );
                        })}
                    </TreeNode>

                    <TreeNode
                        label="Procedures"
                        icon={<ListChecks className="size-4 text-blue-500"/>}
                        defaultExpanded
                        isRoot
                        checked={visibility.proceduresVisible && visibleProcedureCount === procedures.length}
                        indeterminate={proceduresIndeterminate}
                        onCheckedChange={onToggleProcedures}
                    >
                        {procedures.map((procedure) => {
                            const visibleActionCount = procedure.actionMarkers.filter(
                                (_, i) => visibility.visibleActionMarkerIds.has(`${procedure.id}:${i}`)
                            ).length;
                            const procIndeterminate = visibility.visibleProcedureIds.has(procedure.id) &&
                                visibleActionCount > 0 &&
                                visibleActionCount < procedure.actionMarkers.length;

                            return (
                                <TreeNode
                                    key={procedure.id}
                                    label={procedure.name}
                                    defaultExpanded
                                    checked={visibility.visibleProcedureIds.has(procedure.id) &&
                                        visibleActionCount === procedure.actionMarkers.length}
                                    indeterminate={procIndeterminate}
                                    onCheckedChange={(checked) => onToggleProcedure(procedure.id, checked)}
                                >
                                    {procedure.actionMarkers.map((marker, index) => {
                                        const actionMarkerId = `${procedure.id}:${index}`;
                                        return (
                                            <LeafNode
                                                key={actionMarkerId}
                                                label={marker.label}
                                                sublabel={formatTime(marker.time)}
                                                checked={visibility.visibleActionMarkerIds.has(actionMarkerId)}
                                                onCheckedChange={(checked) => onToggleActionMarker(actionMarkerId, checked)}
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
