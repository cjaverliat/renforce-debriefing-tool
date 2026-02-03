/**
 * Converts a local file path to a media:// URL that Electron can serve.
 * HTTP/HTTPS URLs are passed through unchanged.
 */
function toMediaSrc(videoPath: string): string {
    if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
        return videoPath;
    }
    return `media://${videoPath}`;
}

/**
 * Gets the duration of a video file using a temporary <video> element.
 * The element is destroyed after the duration is retrieved.
 *
 * @param videoPath - The path or URL to the video file
 * @returns Promise resolving to the duration in seconds
 */
export function getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        const cleanup = () => {
            video.src = '';
            video.load();
            video.remove();
        };

        video.onloadedmetadata = () => {
            const duration = video.duration;
            cleanup();
            resolve(duration);
        };

        video.onerror = () => {
            const error = video.error;
            cleanup();
            reject(new Error(`Could not load video: ${error?.message ?? 'Unknown error'}`));
        };

        video.src = toMediaSrc(videoPath);
    });
}