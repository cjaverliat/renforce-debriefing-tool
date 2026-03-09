/**
 * Controlled video player component.
 *
 * Synchronizes an HTML `<video>` element to the anchor-based `PlaybackState`
 * without storing its own currentTime in React state (which would cause
 * excessive re-renders at 60fps).
 *
 * Sync strategy:
 *   - Play/pause changes → `video.play()` / `video.pause()` via effect on `isPlaying`
 *   - Seek events        → `video.currentTime = anchorTime` when `anchorTimestamp` changes
 *   - Speed changes      → `video.playbackRate = speed` via effect on `speed`
 *   - Drift correction   → every 1 s during playback, compare `video.currentTime`
 *                          to the anchor-computed expected time and re-seek if drift > 200 ms
 *
 * The video is served via the `media://` custom protocol so local files can be
 * streamed with HTTP Range request support.
 */
import {useRef, useEffect} from 'react';
import type {PlaybackState} from '@/shared/types/playback';
import {computeCurrentTime} from '@/shared/types/playback';

interface VideoPlayerProps {
    /** media:// URL or HTTP(S) URL for the video source. Undefined renders a blank player. */
    videoSrc?: string;
    /** Current anchor-based playback state. */
    playbackState: PlaybackState;
    /** Duration of the record in seconds, used to clamp the drift-correction target. */
    duration: number;
}

/**
 * Renders a controlled `<video>` element that stays in sync with `playbackState`.
 *
 * @param props.videoSrc      - Source URL for the video element.
 * @param props.playbackState - Anchor-based playback state shared with the timeline.
 * @param props.duration      - Record duration for drift-correction clamping.
 */
export function VideoPlayer({
                                videoSrc,
                                playbackState,
                                duration,
                            }: VideoPlayerProps) {

    const videoRef = useRef<HTMLVideoElement>(null);
    const lastAnchorTimestampRef = useRef<number>(0);

    // Sync playback rate to video element
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.playbackRate = playbackState.speed;
    }, [playbackState.speed]);

    // Sync play/pause state to video element
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (playbackState.isPlaying) {
            video.play().catch((err) => {
                console.error('Play failed:', err);
            });
        } else {
            video.pause();
        }
    }, [playbackState.isPlaying]);

    // Seek when anchor changes (user-initiated seek)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (playbackState.anchorTimestamp !== lastAnchorTimestampRef.current) {
            lastAnchorTimestampRef.current = playbackState.anchorTimestamp;
            video.currentTime = playbackState.anchorTime;
        }
    }, [playbackState.anchorTime, playbackState.anchorTimestamp]);

    // Periodic drift correction (no React state updates)
    useEffect(() => {
        if (!playbackState.isPlaying) return;

        const checkSync = () => {
            const video = videoRef.current;
            if (!video) return;

            const expectedTime = Math.min(computeCurrentTime(playbackState), duration);
            const drift = Math.abs(video.currentTime - expectedTime);

            if (drift > 0.2) {
                video.currentTime = expectedTime;
            }
        };

        const intervalId = setInterval(checkSync, 1000);
        return () => clearInterval(intervalId);
    }, [playbackState, duration]);

    const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const video = e.currentTarget;
        console.error('Video error:', video.error);
    };

    return (
        <div className="flex w-full h-full overflow-hidden">
            <video
                ref={videoRef}
                onError={handleError}
                src={videoSrc}
                className="rounded-lg object-contain bg-black mx-auto my-auto"
                style={{ touchAction: 'none', maxWidth: '100%', maxHeight: '100%' }}
            />
        </div>
    );
}
