import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Trash2, Pencil, ChevronDown, ChevronUp, MessageSquare} from 'lucide-react';
import {Button} from '@/renderer/components/ui/button';
import {Annotation} from "@/shared/types/session.ts";

interface ManualAnnotationsPanelProps {
    annotations: Annotation[];
    onDeleteAnnotation: (id: string) => void;
    onEditAnnotation: (id: string) => void;
    onSeekToAnnotation: (time: number) => void;
    selectedAnnotationId?: string;
    selectionVersion?: number;
}

export function AnnotationsPanel({
                                     annotations,
                                     onDeleteAnnotation,
                                     onEditAnnotation,
                                     onSeekToAnnotation,
                                     selectedAnnotationId,
                                     selectionVersion,
                                 }: ManualAnnotationsPanelProps) {
    const {t} = useTranslation();
    const [isExpanded, setIsExpanded] = useState(true);
    const itemRefs = useRef<Record<string, Element | null>>({});

    useEffect(() => {
        if (!selectedAnnotationId) return;
        itemRefs.current[selectedAnnotationId]?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }, [selectedAnnotationId, selectionVersion]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const sortedAnnotations = annotations.sort((a, b) => a.time - b.time);

    return (
        <div className="flex flex-col h-full bg-card border-l border-border">
            <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="size-6 text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                        {isExpanded ? <ChevronUp className="size-4"/> : <ChevronDown className="size-4"/>}
                    </Button>
                    <MessageSquare className="size-4 text-muted-foreground"/>
                    <h3 className="text-sm text-foreground">
                        {t('annotations.count', {count: sortedAnnotations.length})}
                    </h3>
                </div>
            </div>

            {isExpanded && (

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {sortedAnnotations.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {t('annotations.noAnnotations')}
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                            {sortedAnnotations.map((annotation) => {
                                const isSelected = annotation.id === selectedAnnotationId;
                                return (
                                <div
                                    key={isSelected ? `${annotation.id}-${selectionVersion}` : annotation.id}
                                    ref={el => { itemRefs.current[annotation.id] = el; }}
                                    className={`bg-accent rounded p-2 hover:bg-accent/80 transition-colors group ${isSelected ? 'animate-select-pulse' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <button
                                            onClick={() => onSeekToAnnotation(annotation.time)}
                                            className="flex-1 text-left cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div
                                                    className="size-2 rounded-full flex-shrink-0"
                                                    style={{backgroundColor: annotation.color}}
                                                />
                                                <span className="text-xs font-mono text-muted-foreground">
                            {formatTime(annotation.time)}
                          </span>
                                            </div>
                                            <div className="text-sm text-foreground mb-1">
                                                {annotation.label}
                                            </div>
                                            {annotation.description && (
                                                <div className="text-xs text-muted-foreground line-clamp-2">
                                                    {annotation.description}
                                                </div>
                                            )}
                                        </button>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEditAnnotation(annotation.id)}
                                                className="size-6 text-muted-foreground hover:text-foreground hover:bg-accent"
                                            >
                                                <Pencil className="size-3"/>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDeleteAnnotation(annotation.id)}
                                                className="size-6 text-muted-foreground hover:text-red-400 hover:bg-accent"
                                            >
                                                <Trash2 className="size-3"/>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
