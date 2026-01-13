// Playback controller service
import { usePlaybackStore } from '../store/playbackStore';

class PlaybackController {
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private videoElement: HTMLVideoElement | null = null;

  registerVideo(element: HTMLVideoElement) {
    this.videoElement = element;
    // TODO: Add event listeners for sync
  }

  play() {
    if (this.animationFrameId) return;

    usePlaybackStore.getState().play();
    this.videoElement?.play();

    this.lastTimestamp = performance.now();
    this.tick();
  }

  pause() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    usePlaybackStore.getState().pause();
    this.videoElement?.pause();
  }

  seek(timeMs: number) {
    usePlaybackStore.getState().seek(timeMs);

    if (this.videoElement) {
      this.videoElement.currentTime = timeMs / 1000;
    }
  }

  private tick = () => {
    const now = performance.now();
    const deltaMs = now - this.lastTimestamp;
    this.lastTimestamp = now;

    const state = usePlaybackStore.getState();
    if (state.isPlaying) {
      const newTime = state.currentTime + deltaMs * state.playbackRate;

      // TODO: Add sync check with video

      state.updateCurrentTime(newTime);

      if (newTime < state.duration) {
        this.animationFrameId = requestAnimationFrame(this.tick);
      } else {
        this.pause();
      }
    }
  };
}

export const playbackController = new PlaybackController();
