import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';

interface TimelineControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  zoom: number;
  onPlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function TimelineControls({
  isPlaying,
  currentTime,
  duration,
  zoom,
  onPlayPause,
  onSkipBackward,
  onSkipForward,
  onZoomIn,
  onZoomOut,
}: TimelineControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipBackward}
          className="size-8 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <SkipBack className="size-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onPlayPause}
          className="size-8 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipForward}
          className="size-8 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <SkipForward className="size-4" />
        </Button>
      </div>

      <div className="text-sm text-zinc-400 font-mono">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="size-8 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <ZoomOut className="size-4" />
        </Button>
        
        <div className="text-xs text-zinc-400 font-mono w-12 text-center">
          {Math.round(zoom * 100)}%
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="size-8 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <ZoomIn className="size-4" />
        </Button>
      </div>
    </div>
  );
}
