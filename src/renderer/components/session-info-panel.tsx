import {useState} from 'react';
import {ChevronDown, ChevronRight, Activity, Flag, ListChecks, Eye, EyeOff} from 'lucide-react';
import {Toggle} from '@/renderer/components/ui/toggle';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/renderer/components/ui/tabs';
import {Collapsible, CollapsibleTrigger, CollapsibleContent} from '@/renderer/components/ui/collapsible';
import {PhysiologicalSignal, Procedure, SystemMarker} from '@/shared/types/record';
import {VisibilityState} from '@/shared/types/visibility';

interface VisibilityToggleProps {
    visible: boolean;
    onVisibilityChange: (visible: boolean) => void;
    size?: 'sm' | 'md';
    onClick?: (e: React.MouseEvent) => void;
}

function VisibilityToggle({visible, onVisibilityChange, size = 'md', onClick}: VisibilityToggleProps) {
    const sizeClasses = size === 'sm' ? 'size-5' : 'size-6';
    const iconClasses = size === 'sm' ? 'size-3' : 'size-3.5';

    return (
        <Toggle
            pressed={visible}
            onPressedChange={onVisibilityChange}
            onClick={onClick}
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
    tracks: PhysiologicalSignal[];
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
    onSeek: (time: number) => void;
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
    onSeek,
}: SessionInfoPanelProps) {
    return (
        <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
            <Tabs defaultValue="physio" className="flex flex-col h-full">
                <TabsList className="w-full shrink-0 bg-zinc-800 rounded-none border-b border-zinc-700">
                    <TabsTrigger value="physio" className="flex-1 gap-1 data-[state=active]:bg-zinc-900!">
                        <Activity className="size-4 text-emerald-500"/>
                        <span className="text-xs text-zinc-400">({tracks.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="procedures" className="flex-1 gap-1 data-[state=active]:bg-zinc-900!">
                        <ListChecks className="size-4 text-blue-500"/>
                        <span className="text-xs text-zinc-400">({procedures.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="markers" className="flex-1 gap-1 data-[state=active]:bg-zinc-900!">
                        <Flag className="size-4 text-amber-500"/>
                        <span className="text-xs text-zinc-400">({systemMarkers.length})</span>
                    </TabsTrigger>
                </TabsList>

                {/* Physio Tracks Tab */}
                <TabsContent value="physio" className="flex-1 overflow-y-auto custom-scrollbar m-0">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                        <span className="text-sm text-zinc-100">Physiological Signals</span>
                        <VisibilityToggle
                            visible={visibility.physioTracksVisible}
                            onVisibilityChange={onTogglePhysioTracks}
                        />
                    </div>
                    <div className="p-2 space-y-2">
                        {tracks.map((track) => (
                            <div
                                key={track.id}
                                className="bg-zinc-800 rounded p-2 hover:bg-zinc-750 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-zinc-100 truncate">
                                            {track.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <span className="font-mono">{track.unit}</span>
                                            <span>|</span>
                                            <span>{track.sampleRate} Hz</span>
                                        </div>
                                    </div>
                                    <VisibilityToggle
                                        visible={visibility.visibleTrackIds.has(track.id) && visibility.physioTracksVisible}
                                        onVisibilityChange={(visible) => onToggleTrack(track.id, visible)}
                                        size="sm"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* Procedures Tab */}
                <TabsContent value="procedures" className="flex-1 overflow-y-auto custom-scrollbar m-0">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                        <span className="text-sm text-zinc-100">Procedures</span>
                        <VisibilityToggle
                            visible={visibility.proceduresVisible}
                            onVisibilityChange={onToggleProcedures}
                        />
                    </div>
                    <div className="p-2 space-y-2">
                        {procedures.map((procedure) => (
                            <ProcedureCard
                                key={procedure.id}
                                procedure={procedure}
                                visibility={visibility}
                                onToggleProcedure={onToggleProcedure}
                                onToggleActionMarker={onToggleActionMarker}
                                onSeek={onSeek}
                            />
                        ))}
                    </div>
                </TabsContent>

                {/* System Markers Tab */}
                <TabsContent value="markers" className="flex-1 overflow-y-auto custom-scrollbar m-0">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                        <span className="text-sm text-zinc-100">System Markers</span>
                        <VisibilityToggle
                            visible={visibility.systemMarkersVisible}
                            onVisibilityChange={onToggleSystemMarkers}
                        />
                    </div>
                    <div className="p-2 space-y-2">
                        {systemMarkers.map((marker, index) => {
                            const markerId = `${marker.time}:${marker.label}:${index}`;
                            return (
                                <div
                                    key={markerId}
                                    className="bg-zinc-800 rounded p-2 hover:bg-zinc-750 transition-colors cursor-pointer"
                                    onClick={() => onSeek(marker.time)}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="size-2 rounded-full bg-amber-500 shrink-0"/>
                                                <span className="text-xs font-mono text-zinc-400">
                                                    {formatTime(marker.time)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-zinc-100">
                                                {marker.label}
                                            </div>
                                        </div>
                                        <VisibilityToggle
                                            visible={visibility.visibleSystemMarkerIds.has(markerId) && visibility.systemMarkersVisible}
                                            onVisibilityChange={(visible) => onToggleSystemMarker(markerId, visible)}
                                            size="sm"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

interface ProcedureCardProps {
    procedure: Procedure;
    visibility: VisibilityState;
    onToggleProcedure: (procedureId: string, visible: boolean) => void;
    onToggleActionMarker: (actionMarkerId: string, visible: boolean) => void;
    onSeek: (time: number) => void;
}

function ProcedureCard({
    procedure,
    visibility,
    onToggleProcedure,
    onToggleActionMarker,
    onSeek,
}: ProcedureCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const procedureVisible = visibility.visibleProcedureIds.has(procedure.id) && visibility.proceduresVisible;

    return (
        <div className="bg-zinc-800 rounded p-2">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <div className="flex items-center gap-2">
                    <CollapsibleTrigger className="shrink-0 p-0.5 hover:bg-zinc-700 rounded">
                        {isExpanded ? (
                            <ChevronDown className="size-4 text-zinc-500"/>
                        ) : (
                            <ChevronRight className="size-4 text-zinc-500"/>
                        )}
                    </CollapsibleTrigger>
                    <span className="text-sm text-zinc-100 truncate flex-1">
                        {procedure.name}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                        {formatTime(procedure.startTime)}
                    </span>
                    <VisibilityToggle
                        visible={procedureVisible}
                        onVisibilityChange={(visible) => onToggleProcedure(procedure.id, visible)}
                        size="sm"
                    />
                </div>

                <CollapsibleContent>
                    <div className="ml-4 mt-2 space-y-1">
                        {procedure.actionMarkers.map((marker, index) => {
                            const actionMarkerId = `${procedure.id}:${index}`;
                            return (
                                <div
                                    key={actionMarkerId}
                                    className="flex items-center gap-2 py-1 px-2 hover:bg-zinc-700 rounded cursor-pointer"
                                    onClick={() => onSeek(marker.time)}
                                >
                                    <div className="size-1.5 rounded-full bg-blue-500 shrink-0"/>
                                    <span className="text-sm text-zinc-400 truncate flex-1">
                                        {marker.label}
                                    </span>
                                    <span className="text-xs text-zinc-500 font-mono">
                                        {formatTime(marker.time)}
                                    </span>
                                    <VisibilityToggle
                                        visible={visibility.visibleActionMarkerIds.has(actionMarkerId) && procedureVisible}
                                        onVisibilityChange={(visible) => onToggleActionMarker(actionMarkerId, visible)}
                                        size="sm"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
