import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import {PlaybackState} from "@/shared/types/playback.ts";
import {usePlaybackTime} from "@/renderer/hooks/use-playback-time.ts";

interface TimelineControlsProps {
  isPlaying: boolean;
  playbackState: PlaybackState;
  duration: number;
  zoom: number;
  onPlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function TimelineControls({
  isPlaying,
  playbackState,
  duration,
  zoom,
  onPlayPause,
  onSkipBackward,
  onSkipForward,
  onZoomIn,
  onZoomOut,
  onZoomReset,
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
          className="size-8 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <SkipBack className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onPlayPause}
          className="size-8 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipForward}
          className="size-8 text-muted-foreground hover:bg-accent hover:text-foreground"
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
          className="size-8 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ZoomOut className="size-4" />
        </Button>

        <button
          onClick={onZoomReset}
          className="text-xs text-muted-foreground hover:text-foreground font-mono w-12 text-center"
        >
          {Math.round(zoom * 100)}%
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="size-8 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ZoomIn className="size-4" />
        </Button>
      </div>
    </div>
  );
}
