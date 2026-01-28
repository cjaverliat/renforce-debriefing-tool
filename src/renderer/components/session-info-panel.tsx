import {useState} from 'react';
import {ChevronUp, ChevronDown, Activity, Flag, ListChecks, Eye, EyeOff} from 'lucide-react';
import {Button} from '@/renderer/components/ui/button';
import {Toggle} from '@/renderer/components/ui/toggle';
import {Collapsible, CollapsibleTrigger, CollapsibleContent} from '@/renderer/components/ui/collapsible';
import {
    TreeView,
    TreeViewItem,
    TreeViewItemTrigger,
    TreeViewItemContent,
    TreeViewLeaf,
} from '@/renderer/components/ui/tree-view';
import {PhysiologicalTrack, Procedure, SystemMarker} from '@/shared/types/record';
import {VisibilityState} from '@/shared/types/visibility';

interface VisibilityToggleProps {
    visible: boolean;
    onVisibilityChange: (visible: boolean) => void;
    size?: 'sm' | 'md';
}

function VisibilityToggle({visible, onVisibilityChange, size = 'md'}: VisibilityToggleProps) {
    const sizeClasses = size === 'sm' ? 'size-5' : 'size-6';
    const iconClasses = size === 'sm' ? 'size-3' : 'size-3.5';

    return (
        <Toggle
            pressed={visible}
            onPressedChange={onVisibilityChange}
            size="sm"
            className={`${sizeClasses} p-0 ml-auto bg-transparent hover:bg-transparent data-[state=on]:bg-transparent data-[state=off]:bg-transparent`}
        >
            {visible ? (
                <Eye className={`${iconClasses} text-zinc-300`}/>
            ) : (
                <EyeOff className={`${iconClasses} text-zinc-500`}/>
            )}
        </Toggle>
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
        <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 overflow-y-auto custom-scrollbar">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <div className="flex items-center justify-between p-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                            >
                                {isExpanded ? <ChevronUp className="size-4"/> : <ChevronDown className="size-4"/>}
                            </Button>
                        </CollapsibleTrigger>
                        <h3 className="text-sm text-zinc-100">
                            Session Info ({totalItems})
                        </h3>
                    </div>
                </div>

                <CollapsibleContent className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <TreeView>
                        {/* Physio Tracks */}
                        <TreeViewItem defaultExpanded className="bg-zinc-800 rounded p-2 mb-2">
                            <TreeViewItemTrigger className="mb-1">
                                <Activity className="size-4 text-emerald-500 shrink-0"/>
                                <span className="text-sm text-zinc-100 truncate">Physio Tracks</span>
                                <VisibilityToggle
                                    visible={visibility.physioTracksVisible}
                                    onVisibilityChange={onTogglePhysioTracks}
                                />
                            </TreeViewItemTrigger>
                            <TreeViewItemContent className="ml-2">
                                {tracks.map((track) => (
                                    <TreeViewLeaf
                                        key={track.id}
                                        className="px-2 hover:bg-zinc-700 rounded"
                                    >
                                        <span className="text-sm text-zinc-400 truncate">{track.name}</span>
                                        <span className="text-zinc-500 text-xs font-mono ml-auto shrink-0">
                                            {track.unit}
                                        </span>
                                        <VisibilityToggle
                                            visible={visibility.visibleTrackIds.has(track.id) && visibility.physioTracksVisible}
                                            onVisibilityChange={(visible) => onToggleTrack(track.id, visible)}
                                            size="sm"
                                        />
                                    </TreeViewLeaf>
                                ))}
                            </TreeViewItemContent>
                        </TreeViewItem>

                        {/* System Markers */}
                        <TreeViewItem defaultExpanded className="bg-zinc-800 rounded p-2 mb-2">
                            <TreeViewItemTrigger className="mb-1">
                                <Flag className="size-4 text-amber-500 shrink-0"/>
                                <span className="text-sm text-zinc-100 truncate">System Markers</span>
                                <VisibilityToggle
                                    visible={visibility.systemMarkersVisible}
                                    onVisibilityChange={onToggleSystemMarkers}
                                />
                            </TreeViewItemTrigger>
                            <TreeViewItemContent className="ml-2">
                                {systemMarkers.map((marker, index) => {
                                    const markerId = `${marker.time}:${marker.label}:${index}`;
                                    return (
                                        <TreeViewLeaf
                                            key={markerId}
                                            className="px-2 hover:bg-zinc-700 rounded"
                                        >
                                            <span className="text-sm text-zinc-400 truncate">{marker.label}</span>
                                            <span className="text-zinc-500 text-xs font-mono ml-auto shrink-0">
                                                {formatTime(marker.time)}
                                            </span>
                                            <VisibilityToggle
                                                visible={visibility.visibleSystemMarkerIds.has(markerId) && visibility.systemMarkersVisible}
                                                onVisibilityChange={(visible) => onToggleSystemMarker(markerId, visible)}
                                                size="sm"
                                            />
                                        </TreeViewLeaf>
                                    );
                                })}
                            </TreeViewItemContent>
                        </TreeViewItem>

                        {/* Procedures */}
                        <TreeViewItem defaultExpanded className="bg-zinc-800 rounded p-2 mb-2">
                            <TreeViewItemTrigger className="mb-1">
                                <ListChecks className="size-4 text-blue-500 shrink-0"/>
                                <span className="text-sm text-zinc-100 truncate">Procedures</span>
                                <VisibilityToggle
                                    visible={visibility.proceduresVisible}
                                    onVisibilityChange={onToggleProcedures}
                                />
                            </TreeViewItemTrigger>
                            <TreeViewItemContent className="ml-2">
                                {procedures.map((procedure) => {
                                    const procedureVisible = visibility.visibleProcedureIds.has(procedure.id) && visibility.proceduresVisible;

                                    return (
                                        <TreeViewItem key={procedure.id} defaultExpanded>
                                            <TreeViewItemTrigger className="px-2 py-1 hover:bg-zinc-700 rounded">
                                                <span className="text-sm text-zinc-300 truncate">{procedure.name}</span>
                                                <VisibilityToggle
                                                    visible={procedureVisible}
                                                    onVisibilityChange={(visible) => onToggleProcedure(procedure.id, visible)}
                                                />
                                            </TreeViewItemTrigger>
                                            <TreeViewItemContent>
                                                {procedure.actionMarkers.map((marker, index) => {
                                                    const actionMarkerId = `${procedure.id}:${index}`;
                                                    return (
                                                        <TreeViewLeaf
                                                            key={actionMarkerId}
                                                            className="px-2 hover:bg-zinc-700 rounded"
                                                        >
                                                            <span className="text-sm text-zinc-400 truncate">
                                                                {marker.label}
                                                            </span>
                                                            <span className="text-zinc-500 text-xs font-mono ml-auto shrink-0">
                                                                {formatTime(marker.time)}
                                                            </span>
                                                            <VisibilityToggle
                                                                visible={visibility.visibleActionMarkerIds.has(actionMarkerId) && procedureVisible}
                                                                onVisibilityChange={(visible) => onToggleActionMarker(actionMarkerId, visible)}
                                                                size="sm"
                                                            />
                                                        </TreeViewLeaf>
                                                    );
                                                })}
                                            </TreeViewItemContent>
                                        </TreeViewItem>
                                    );
                                })}
                            </TreeViewItemContent>
                        </TreeViewItem>
                    </TreeView>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
