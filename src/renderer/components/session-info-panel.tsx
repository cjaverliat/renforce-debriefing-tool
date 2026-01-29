import {useState} from 'react';
import {ChevronDown, ChevronUp, Activity, Flag, ListChecks, Eye, EyeOff, AlertTriangle} from 'lucide-react';
import {Toggle} from '@/renderer/components/ui/toggle';
import {Button} from '@/renderer/components/ui/button';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/renderer/components/ui/tabs';
import {IncidentMarker, PhysiologicalSignal, Procedure, ProcedureActionMarker, SystemMarker} from '@/shared/types/record';
import {VisibilityState} from '@/shared/types/visibility';

const ACTION_MARKER_COLORS: Record<ProcedureActionMarker['category'], string> = {
    correct_action: '#22c55e',     // Green
    incorrect_action: '#ef4444',   // Red
    timeout_exceeded: '#f97316',   // Orange
};

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
    incidentMarkers: IncidentMarker[];
    procedures: Procedure[];
    visibility: VisibilityState;
    onTogglePhysioTracks: (visible: boolean) => void;
    onToggleSystemMarkers: (visible: boolean) => void;
    onToggleIncidentMarkers: (visible: boolean) => void;
    onToggleProcedures: (visible: boolean) => void;
    onToggleTrack: (trackId: string, visible: boolean) => void;
    onToggleSystemMarker: (markerId: string, visible: boolean) => void;
    onToggleIncidentMarker: (markerId: string, visible: boolean) => void;
    onToggleProcedure: (procedureId: string, visible: boolean) => void;
    onToggleActionMarker: (actionMarkerId: string, visible: boolean) => void;
    onSeek: (time: number) => void;
}

export function SessionInfoPanel({
    tracks,
    systemMarkers,
    incidentMarkers,
    procedures,
    visibility,
    onTogglePhysioTracks,
    onToggleSystemMarkers,
    onToggleIncidentMarkers,
    onToggleProcedures,
    onToggleTrack,
    onToggleSystemMarker,
    onToggleIncidentMarker,
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
                    <TabsTrigger value="incidents" className="flex-1 gap-1 data-[state=active]:bg-zinc-900!">
                        <AlertTriangle className="size-4 text-red-500"/>
                        <span className="text-xs text-zinc-400">({incidentMarkers.length})</span>
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

                {/* Incident Markers Tab */}
                <TabsContent value="incidents" className="flex-1 overflow-y-auto custom-scrollbar m-0">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                        <span className="text-sm text-zinc-100">Incident Markers</span>
                        <VisibilityToggle
                            visible={visibility.incidentMarkersVisible}
                            onVisibilityChange={onToggleIncidentMarkers}
                        />
                    </div>
                    <div className="p-2 space-y-2">
                        {incidentMarkers.map((marker, index) => {
                            const markerId = `${marker.time}:${marker.label}:${index}`;
                            const severityColor = marker.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500';
                            return (
                                <div
                                    key={markerId}
                                    className="bg-zinc-800 rounded p-2 hover:bg-zinc-750 transition-colors cursor-pointer"
                                    onClick={() => onSeek(marker.time)}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`size-2 rounded-full ${severityColor} shrink-0`}/>
                                                <span className="text-xs font-mono text-zinc-400">
                                                    {formatTime(marker.time)}
                                                </span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${marker.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                    {marker.severity}
                                                </span>
                                            </div>
                                            <div className="text-sm text-zinc-100">
                                                {marker.label}
                                            </div>
                                            {marker.description && (
                                                <div className="text-xs text-zinc-400 line-clamp-2 mt-1">
                                                    {marker.description}
                                                </div>
                                            )}
                                        </div>
                                        <VisibilityToggle
                                            visible={visibility.visibleIncidentMarkerIds.has(markerId) && visibility.incidentMarkersVisible}
                                            onVisibilityChange={(visible) => onToggleIncidentMarker(markerId, visible)}
                                            size="sm"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            );
                        })}
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
    const [isExpanded, setIsExpanded] = useState(false);
    const procedureVisible = visibility.visibleProcedureIds.has(procedure.id) && visibility.proceduresVisible;

    return (
        <div className="flex flex-col bg-zinc-800 rounded">
            {/* Procedure Header - Accordion style matching annotations */}
            <div className="flex items-center justify-between p-2 border-b border-zinc-700">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="size-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
                    >
                        {isExpanded ? <ChevronUp className="size-4"/> : <ChevronDown className="size-4"/>}
                    </Button>
                    <span className="text-sm text-zinc-100">
                        {procedure.name} ({procedure.actionMarkers.length})
                    </span>
                </div>
                <VisibilityToggle
                    visible={procedureVisible}
                    onVisibilityChange={(visible) => onToggleProcedure(procedure.id, visible)}
                    size="sm"
                />
            </div>

            {/* Action Markers - styled like annotation items */}
            {isExpanded && (
                <div className="p-2 space-y-2">
                    {procedure.actionMarkers.length === 0 ? (
                        <div className="p-2 text-center text-xs text-zinc-500">
                            No action markers
                        </div>
                    ) : (
                        procedure.actionMarkers.map((marker, index) => {
                            const actionMarkerId = `${procedure.id}:${index}`;
                            return (
                                <div
                                    key={actionMarkerId}
                                    className="bg-zinc-750 rounded p-2 hover:bg-zinc-700 transition-colors group"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <button
                                            onClick={() => onSeek(marker.time)}
                                            className="flex-1 text-left"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div
                                                    className="size-2 rounded-full flex-shrink-0"
                                                    style={{backgroundColor: ACTION_MARKER_COLORS[marker.category]}}
                                                />
                                                <span className="text-xs font-mono text-zinc-400">
                                                    {formatTime(marker.time)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-zinc-100 mb-1">
                                                {marker.label}
                                            </div>
                                            {marker.description && (
                                                <div className="text-xs text-zinc-400 line-clamp-2">
                                                    {marker.description}
                                                </div>
                                            )}
                                        </button>
                                        <VisibilityToggle
                                            visible={visibility.visibleActionMarkerIds.has(actionMarkerId) && procedureVisible}
                                            onVisibilityChange={(visible) => onToggleActionMarker(actionMarkerId, visible)}
                                            size="sm"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
