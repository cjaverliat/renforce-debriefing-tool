import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import {Annotation} from "@/shared/types/session.ts";

interface ManualAnnotationsPanelProps {
  annotations: Annotation[];
  onDeleteAnnotation: (id: string) => void;
  onSeekToAnnotation: (time: number) => void;
}

export function AnnotationsPanel({
  annotations,
  onDeleteAnnotation,
  onSeekToAnnotation,
}: ManualAnnotationsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const categories = ['All', ...Array.from(new Set(annotations.map(a => a.category)))];
  
  const filteredAnnotations = selectedCategory === 'All'
    ? annotations
    : annotations.filter(a => a.category === selectedCategory);

  const sortedAnnotations = [...filteredAnnotations].sort((a, b) => a.time - b.time);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="size-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          <h3 className="text-sm text-zinc-100">
            Annotations ({sortedAnnotations.length})
          </h3>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="p-3 border-b border-zinc-800">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {sortedAnnotations.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">
                No annotations yet
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {sortedAnnotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="bg-zinc-800 rounded p-2 hover:bg-zinc-750 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => onSeekToAnnotation(annotation.time)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="size-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: annotation.color }}
                          />
                          <span className="text-xs font-mono text-zinc-400">
                            {formatTime(annotation.time)}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-100 mb-1">
                          {annotation.label}
                        </div>
                        <div className="text-xs text-zinc-500 mb-1">
                          {annotation.category}
                        </div>
                        {annotation.description && (
                          <div className="text-xs text-zinc-400 line-clamp-2">
                            {annotation.description}
                          </div>
                        )}
                      </button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteAnnotation(annotation.id)}
                        className="size-6 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 hover:bg-zinc-700"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
