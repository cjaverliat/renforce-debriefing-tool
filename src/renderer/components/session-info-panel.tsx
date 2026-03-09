import React, {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {ChevronDown, ChevronUp, Activity, Flag, ListChecks, Eye, EyeOff, AlertTriangle} from 'lucide-react';
import {Toggle} from '@/renderer/components/ui/toggle';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/renderer/components/ui/tabs';
import {IncidentMarker, PhysiologicalSignal, Procedure, ProcedureActionMarker, SystemMarker} from '@/shared/types/record';
import {VisibilityState} from '@/shared/types/visibility';
import {SelectedItem} from '@/shared/types/session';

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
                <Eye className={`${iconClasses} text-muted-foreground`}/>
            ) : (
                <EyeOff className={`${iconClasses} text-muted-foreground/50`}/>
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
    onSelectItem: (item: SelectedItem) => void;
    selectedItem?: SelectedItem;
    selectionVersion?: number;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
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
    onSelectItem,
    selectedItem,
    selectionVersion,
    activeTab,
    onTabChange,
}: SessionInfoPanelProps) {
    const {t} = useTranslation();
    const itemRefs = useRef<Record<string, Element | null>>({});

    useEffect(() => {
        if (!selectedItem) return;
        let key: string | undefined;
        if (selectedItem.type === 'systemMarker') {
            const idx = systemMarkers.indexOf(selectedItem.marker);
            if (idx >= 0) key = `systemMarker:${idx}`;
        } else if (selectedItem.type === 'incidentMarker') {
            const idx = incidentMarkers.indexOf(selectedItem.marker);
            if (idx >= 0) key = `incidentMarker:${idx}`;
        } else if (selectedItem.type === 'procedure') {
            key = `procedure:${selectedItem.id}`;
        } else if (selectedItem.type === 'actionMarker') {
            const proc = procedures.find(p => p.id === selectedItem.procedureId);
            if (proc) {
                const idx = proc.actionMarkers.indexOf(selectedItem.marker);
                if (idx >= 0) key = `actionMarker:${selectedItem.procedureId}:${idx}`;
            }
        }
        if (key) {
            itemRefs.current[key]?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        }
    }, [selectedItem, selectionVersion]);

    return (
        <div className="flex flex-col h-full bg-card border-r border-border">
            <Tabs value={activeTab ?? 'physio'} onValueChange={onTabChange} className="flex flex-col h-full">
                <TabsList className="w-full shrink-0 bg-accent rounded-none border-b border-border">
                    <TabsTrigger value="physio" className="flex-1 gap-1 data-[state=active]:bg-card!">
                        <Activity className="size-4 text-emerald-500"/>
                        <span className="text-xs text-muted-foreground">({tracks.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="procedures" className="flex-1 gap-1 data-[state=active]:bg-card!">
                        <ListChecks className="size-4 text-blue-500"/>
                        <span className="text-xs text-muted-foreground">({procedures.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="incidents" className="flex-1 gap-1 data-[state=active]:bg-card!">
                        <AlertTriangle className="size-4 text-red-500"/>
                        <span className="text-xs text-muted-foreground">({incidentMarkers.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="markers" className="flex-1 gap-1 data-[state=active]:bg-card!">
                        <Flag className="size-4 text-amber-500"/>
                        <span className="text-xs text-muted-foreground">({systemMarkers.length})</span>
                    </TabsTrigger>
                </TabsList>

                {/* Physio Tracks Tab */}
                <TabsContent value="physio" className="flex-1 overflow-y-auto custom-scrollbar m-0">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                        <span className="text-sm text-foreground">{t('sessionInfo.physioSignals')}</span>
                        <VisibilityToggle
                            visible={visibility.physioTracksVisible}
                            onVisibilityChange={onTogglePhysioTracks}
                        />
                    </div>
                    <div className="p-2 space-y-2">
                        {tracks.map((track) => (
                            <div
                                key={track.id}
                                className="bg-accent rounded p-2 hover:bg-accent/80 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-foreground truncate">
                                            {track.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                        <span className="text-sm text-foreground">{t('sessionInfo.procedures')}</span>
                        <VisibilityToggle
                            visible={visibility.proceduresVisible}
                            onVisibilityChange={onToggleProcedures}
                        />
                    </div>
                    <div className="p-2 space-y-2">
                        {procedures.map((procedure) => {
                            const isProcedureSelected = selectedItem?.type === 'procedure' && selectedItem.id === procedure.id;
                            const hasSelectedActionMarker = selectedItem?.type === 'actionMarker' && selectedItem.procedureId === procedure.id;
                            return (
                                <ProcedureCard
                                    key={procedure.id}
                                    procedure={procedure}
                                    visibility={visibility}
                                    onToggleProcedure={onToggleProcedure}
                                    onToggleActionMarker={onToggleActionMarker}
                                    onSeek={onSeek}
                                    onSelectItem={onSelectItem}
                                    isSelected={isProcedureSelected}
                                    forceExpand={hasSelectedActionMarker}
                                    selectedItem={selectedItem}
                                    selectionVersion={selectionVersion}
                                    itemRefs={itemRefs}
                                />
                            );
                        })}
                    </div>
                </TabsContent>

                {/* Incident Markers Tab */}
                <TabsContent value="incidents" className="flex-1 overflow-y-auto custom-scrollbar m-0">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                        <span className="text-sm text-foreground">{t('sessionInfo.incidentMarkers')}</span>
                        <VisibilityToggle
                            visible={visibility.incidentMarkersVisible}
                            onVisibilityChange={onToggleIncidentMarkers}
                        />
                    </div>
                    <div className="p-2 space-y-2">
                        {incidentMarkers.map((marker, index) => {
                            const markerId = `${marker.time}:${marker.label}:${index}`;
                            const severityColor = marker.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500';
                            const refKey = `incidentMarker:${index}`;
                            const isSelected = selectedItem?.type === 'incidentMarker' && selectedItem.marker === marker;
                            return (
                                <div
                                    key={isSelected ? `${markerId}-${selectionVersion}` : markerId}
                                    ref={el => { itemRefs.current[refKey] = el; }}
                                    className={`bg-accent rounded p-2 hover:bg-accent/80 transition-colors cursor-pointer ${isSelected ? 'animate-select-pulse' : ''}`}
                                    onClick={() => { onSeek(marker.time); onSelectItem({type: 'incidentMarker', marker}); }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`size-2 rounded-full ${severityColor} shrink-0`}/>
                                                <span className="text-xs font-mono text-muted-foreground">
                                                    {formatTime(marker.time)}
                                                </span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${marker.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                    {t(`severity.${marker.severity}`)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-foreground">
                                                {marker.label}
                                            </div>
                                            {marker.description && (
                                                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
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
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                        <span className="text-sm text-foreground">{t('sessionInfo.systemMarkers')}</span>
                        <VisibilityToggle
                            visible={visibility.systemMarkersVisible}
                            onVisibilityChange={onToggleSystemMarkers}
                        />
                    </div>
                    <div className="p-2 space-y-2">
                        {systemMarkers.map((marker, index) => {
                            const markerId = `${marker.time}:${marker.label}:${index}`;
                            const refKey = `systemMarker:${index}`;
                            const isSelected = selectedItem?.type === 'systemMarker' && selectedItem.marker === marker;
                            return (
                                <div
                                    key={isSelected ? `${markerId}-${selectionVersion}` : markerId}
                                    ref={el => { itemRefs.current[refKey] = el; }}
                                    className={`bg-accent rounded p-2 hover:bg-accent/80 transition-colors cursor-pointer ${isSelected ? 'animate-select-pulse' : ''}`}
                                    onClick={() => { onSeek(marker.time); onSelectItem({type: 'systemMarker', marker}); }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="size-2 rounded-full bg-amber-500 shrink-0"/>
                                                <span className="text-xs font-mono text-muted-foreground">
                                                    {formatTime(marker.time)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-foreground">
                                                {marker.label}
                                            </div>
                                            {marker.description && (
                                                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {marker.description}
                                                </div>
                                            )}
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
    onSelectItem: (item: SelectedItem) => void;
    isSelected?: boolean;
    forceExpand?: boolean;
    selectedItem?: SelectedItem;
    selectionVersion?: number;
    itemRefs?: React.MutableRefObject<Record<string, Element | null>>;
}

function ProcedureCard({
    procedure,
    visibility,
    onToggleProcedure,
    onToggleActionMarker,
    onSeek,
    onSelectItem,
    isSelected,
    forceExpand,
    selectedItem,
    selectionVersion,
    itemRefs,
}: ProcedureCardProps) {
    const {t} = useTranslation();
    const [localExpanded, setLocalExpanded] = useState(false);
    const [animating, setAnimating] = useState(false);
    const isExpanded = forceExpand || localExpanded;
    const procedureVisible = visibility.visibleProcedureIds.has(procedure.id) && visibility.proceduresVisible;

    useEffect(() => {
        if (!isSelected) return;
        setAnimating(false);
        const raf = requestAnimationFrame(() => {
            setAnimating(true);
            const timer = setTimeout(() => setAnimating(false), 900);
            return () => clearTimeout(timer);
        });
        return () => cancelAnimationFrame(raf);
    }, [isSelected, selectionVersion]);

    return (
        <div
            ref={el => { if (itemRefs) itemRefs.current[`procedure:${procedure.id}`] = el; }}
            className={`flex flex-col bg-accent rounded ${animating ? 'animate-select-pulse' : ''}`}
        >
            {/* Procedure Header - Accordion style matching annotations */}
            <div className="flex items-center justify-between p-2 border-b border-border">
                <button
                    className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                    onClick={() => { setLocalExpanded(!localExpanded); onSeek(procedure.startTime); onSelectItem({type: 'procedure', id: procedure.id}); }}
                >
                    {isExpanded
                        ? <ChevronUp className="size-4 text-muted-foreground shrink-0"/>
                        : <ChevronDown className="size-4 text-muted-foreground shrink-0"/>
                    }
                    <span className="text-sm text-foreground">
                        {procedure.name} ({procedure.actionMarkers.length})
                    </span>
                </button>
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
                        <div className="p-2 text-center text-xs text-muted-foreground">
                            {t('sessionInfo.noActionMarkers')}
                        </div>
                    ) : (
                        procedure.actionMarkers.map((marker, index) => {
                            const actionMarkerId = `${procedure.id}:${index}`;
                            const amRefKey = `actionMarker:${procedure.id}:${index}`;
                            const isAmSelected = selectedItem?.type === 'actionMarker' && selectedItem.procedureId === procedure.id && selectedItem.marker === marker;
                            return (
                                <div
                                    key={isAmSelected ? `${actionMarkerId}-${selectionVersion}` : actionMarkerId}
                                    ref={el => { if (itemRefs) itemRefs.current[amRefKey] = el; }}
                                    className={`bg-card rounded p-2 hover:bg-card/80 transition-colors cursor-pointer group ${isAmSelected ? 'animate-select-pulse' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <button
                                            onClick={() => { onSeek(marker.time); onSelectItem({type: 'actionMarker', procedureId: procedure.id, marker}); }}
                                            className="flex-1 text-left cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div
                                                    className="size-2 rounded-full flex-shrink-0"
                                                    style={{backgroundColor: ACTION_MARKER_COLORS[marker.category]}}
                                                />
                                                <span className="text-xs font-mono text-muted-foreground">
                                                    {formatTime(marker.time)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-foreground mb-1">
                                                {marker.label}
                                            </div>
                                            {marker.description && (
                                                <div className="text-xs text-muted-foreground line-clamp-2">
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
