import { useState } from 'react';
import { FileVideo, FolderOpen, AlertCircle } from 'lucide-react';
import type { LoadedSession } from '@/shared/types/session';

interface LoadingPanelProps {
  onSessionLoaded: (session: LoadedSession) => void;
}

export function LoadingPanel({ onSessionLoaded }: LoadingPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNew = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Select PLM file
      const plmPath = await window.electronAPI.selectPlm();
      if (!plmPath) {
        setIsLoading(false);
        return; // User cancelled
      }

      // Step 2: Select video file
      const videoPath = await window.electronAPI.selectVideo();
      if (!videoPath) {
        setIsLoading(false);
        return; // User cancelled
      }

      // Step 3: Parse PLM file to get duration and metadata
      const plmData = await window.electronAPI.loadPLMFile(plmPath);

      // Step 4: Generate session name
      const sessionDate = new Date();
      const sessionName = `Training Session - ${sessionDate.toLocaleDateString()}`;

      // Extract video filename for display
      const videoName = videoPath.split(/[\\/]/).pop() || 'Video';

      // Step 5: Save new .plmd file
      const plmdPath = await window.electronAPI.savePlmdAs({
        plmPath,
        videoPath,
        sessionName,
        duration: plmData.metadata.duration / 1000, // Convert ms to seconds
        videoName,
      });

      if (!plmdPath) {
        setIsLoading(false);
        return; // User cancelled save dialog
      }

      // Step 6: Load the newly created session
      const loadedSession = await window.electronAPI.loadPlmd(plmdPath);
      onSessionLoaded(loadedSession);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      setIsLoading(false);
    }
  };

  const handleLoadExisting = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Open .plmd file dialog
      const plmdPath = await window.electronAPI.openSessionDialog();
      if (!plmdPath) {
        setIsLoading(false);
        return; // User cancelled
      }

      // Step 2: Load and validate session
      const loadedSession = await window.electronAPI.loadPlmd(plmdPath);
      onSessionLoaded(loadedSession);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';

      // Parse error message for user-friendly display
      let displayMessage = message;
      if (message.includes('version')) {
        displayMessage = 'Incompatible session file version';
      } else if (message.includes('not found')) {
        displayMessage = message; // Already has file path
      } else if (message.includes('corrupted')) {
        displayMessage = 'Session file is corrupted or invalid';
      } else {
        displayMessage = `Failed to load session: ${message}`;
      }

      setError(displayMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md space-y-8 p-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-zinc-100">
            Renforce Debriefing
          </h1>
          <p className="text-zinc-400">
            Video Annotation & Analysis Tool
          </p>
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          {/* Create New Session Button */}
          <button
            onClick={handleCreateNew}
            disabled={isLoading}
            className="w-full p-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600/10 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                <FileVideo className="size-6 text-blue-500" />
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-lg font-semibold text-zinc-100 mb-1">
                  Create New Session
                </h2>
                <p className="text-sm text-zinc-400">
                  Start a new debriefing session with PLM and video files
                </p>
              </div>
            </div>
          </button>

          {/* Load Existing Session Button */}
          <button
            onClick={handleLoadExisting}
            disabled={isLoading}
            className="w-full p-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-600/10 rounded-lg group-hover:bg-green-600/20 transition-colors">
                <FolderOpen className="size-6 text-green-500" />
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-lg font-semibold text-zinc-100 mb-1">
                  Load Existing Session
                </h2>
                <p className="text-sm text-zinc-400">
                  Open a saved .plmd session file
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-400 mb-1">
                  Error
                </h3>
                <p className="text-sm text-red-300/90">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500"></div>
            <p className="mt-2 text-sm text-zinc-400">Loading session...</p>
          </div>
        )}
      </div>
    </div>
  );
}
