import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import {PlaybackState} from "@/shared/types/playback.ts";
import {usePlaybackTime} from "@/renderer/hooks/use-playback-time.ts";

interface TimelineControlsProps {
  isPlaying: boolean;
  playbackState: PlaybackState;
  duration: number;
  zoom: number;
  zoomIndex: number;
  zoomLevelsCount: number;
  onPlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomChange: (index: number) => void;
}

export function TimelineControls({
  isPlaying,
  playbackState,
  duration,
  zoom,
  zoomIndex,
  zoomLevelsCount,
  onPlayPause,
  onSkipBackward,
  onSkipForward,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomChange,
}: TimelineControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playbackTime = usePlaybackTime(playbackState, { maxTime: duration });

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-card border-b border-border">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipBackward}
          className="size-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <SkipBack className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onPlayPause}
          className="size-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipForward}
          className="size-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <SkipForward className="size-4" />
        </Button>
      </div>

      <div className="text-sm text-muted-foreground font-mono">
        {formatTime(playbackTime)} / {formatTime(duration)}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          disabled={zoomIndex === 0}
          className="size-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ZoomOut className="size-4" />
        </Button>

        <input
          type="range"
          min={0}
          max={zoomLevelsCount - 1}
          step={1}
          value={zoomIndex}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-24 cursor-pointer appearance-none
            [&::-webkit-slider-runnable-track]:h-[2px]
            [&::-webkit-slider-runnable-track]:rounded-full
            [&::-webkit-slider-runnable-track]:bg-border
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:size-2.5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-foreground
            [&::-webkit-slider-thumb]:mt-[-4px]"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          disabled={zoomIndex === zoomLevelsCount - 1}
          className="size-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ZoomIn className="size-4" />
        </Button>

        <button
          onClick={onZoomReset}
          className="text-xs text-muted-foreground hover:text-foreground font-mono w-12 text-center"
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>
    </div>
  );
}
