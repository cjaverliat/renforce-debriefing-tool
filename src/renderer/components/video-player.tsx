import {useRef, useEffect} from 'react';
import type {PlaybackState} from '@/shared/types/playback';
import {computeCurrentTime} from '@/shared/types/playback';

interface VideoPlayerProps {
    videoSrc?: string;
    playbackState: PlaybackState;
    duration: number;
}

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
        console.error('Video error:', {
            error: video.error,
            errorCode: video.error?.code,
            errorMessage: video.error?.message,
            src: videoSrc,
            readyState: video.readyState,
            networkState: video.networkState,
        });
    };

    return (
        <div className="flex w-full h-full bg-black overflow-hidden">
            <video
                ref={videoRef}
                onError={handleError}
                src={videoSrc}
                className="rounded-lg object-contain mx-auto my-auto"
                style={{ touchAction: 'none', maxWidth: '100%', maxHeight: '100%' }}
            />
        </div>
    );
}
